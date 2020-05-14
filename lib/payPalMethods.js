const User = require("../models/user");
const axios = require("axios");
const qs = require("qs");

async function setAccessToken(userId) {

    const URL = "https://api.paypal.com/v1/oauth2/token"
    const body = qs.stringify({
        "grant_type": "client_credentials"
    })
    const config = {
        auth: {
            username: process.env.PAYPAL_GET_TOKEN_USERNAME,
            password: process.env.PAYPAL_GET_TOKEN_PASSWORD
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
    }

    try {
        const payPalResponse = await axios.post(URL, body, config);
        if (payPalResponse.data) {
            const data = payPalResponse.data
            if (data.access_token) {
                const token = data.access_token
                const updatedUser = await updateUserWithToken(userId, token)
                return { success: true, user: updatedUser }
            } else {
                throw "Missin Access Token"
            }
        } else {
            throw "Missing Data from Response"
        }
    } catch (e) {
        console.log(e)
        return { success: false }
    }
    
}
async function updateUserWithToken(userId, token) {
    const userObj = await User.findByIdAndUpdate(userId, { payPalToken: token, syncedWithPayPal: true }, { new: true });
    const user = userObj.withoutSensitiveInfo();
    return user;
}

async function getPayPalShippingCost(userId, trackingNumber) {
    const rawTransactions = await getPayPalTransactions(userId)
    //transaction_details is an array of transactions
    const transactions = rawTransactions.transaction_details;
    let shippingCost = 0;
    //need to use tracking number to sort through array and find matching shipping info;
    const shippingTransactions = transactions.map(x => {
        const payerInfo = x.payer_info;
        const payerName = payerInfo.payer_name;
        if (payerName.alternate_full_name) {
            if (payerName.alternate_full_name === "eBay Inc Shipping") {
                return x;
            }
        }
        return null;
    }).filter(x => x !== null)
    

    const transaction = shippingTransactions.find(x => {
        const info = x.cart_info;
        const details = info.item_details[0]
        const trackingNum = details.item_description.split(" ").pop();
        console.log(trackingNum)
        return trackingNum == trackingNumber;
    })
    console.log("Next set")

    //not finding trackingNumber within an hour after a sale.

    if (transaction) {
        const info = transaction.cart_info;
        const details = info.item_details[0]
        const itemUnitPrice = details.item_unit_price;
        const { value } = itemUnitPrice;
        shippingCost = value;
    }
    //if it cannot find a tracking number to match with, return 0
    return shippingCost;
}


async function getPayPalTransactions(userId) {
    const user = await User.findById(userId);
    const payPalToken = user.toObject().payPalToken;
    const numberOfTransactionDays = 7;
    const startDate = new Date();
    const today = new Date();
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    startDate.setDate(startDate.getDate() - numberOfTransactionDays);
    const url = "https://api.paypal.com/v1/reporting/transactions";
    const config = {
        params: {
            start_date: startDate.toISOString(),
            end_date: tomorrow.toISOString(),
            fields: "all"
        },
        headers: {
            Authorization: `Bearer ${payPalToken}`
        }
    }
    
    const transactions = await payPalGetRequest(url, config, userId)
    if (transactions.success){
        return transactions.data;
    } else {
        if (transactions.errorCode == ""){
            await setAccessToken(userId)
            return getPayPalTransactions(userId);
        }
    }

}

async function payPalGetRequest(url, config, userId) {
    try {
        const rawData = await axios.get(url, config)
        const data = rawData.data;
        return {success: true, data};
    } catch (e) {
        console.log(e);
        //When PayPal has an error, I assume its an access token error (need to fix this) and it will reset access token.
        //And recursively retry the call. If it fails to setAccessToken, there is no second call. 
        const didSetToken = await setAccessToken(userId);
        const payPalToken = didSetToken.user.payPalToken;
        config.headers = {
            Authorization: `Bearer ${payPalToken}`
        }
        if (didSetToken.success) {
            return payPalGetRequest(url, config, userId)
        }
        return {success: false, error: e};
    }
}

module.exports = {
    setAccessToken,
    getPayPalShippingCost
}