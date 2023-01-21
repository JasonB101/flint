require("dotenv").config()


const getOAuthLink = () => {
let oAuthLink = `https://auth.ebay.com/oauth2/authorize?client_id=${process.env['EBAY_CLIENT']}&response_type=code&redirect_uri=${process.env['OAUTH_RU_NAME']}&scope=https://api.ebay.com/oauth/api_scope`
return oAuthLink
}

module.exports = {getOAuthLink}