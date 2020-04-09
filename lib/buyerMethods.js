const Buyer = require("../models/buyer")

function saveBuyer(buyerObject){
const newBuyer = new Buyer(buyerObject);

newBuyer.save((err, result) => {
    if (err) console.log(err)

    if (result) {
        return true
    } else {
        return false
    }
})
}

module.exports = {
    saveBuyer
}