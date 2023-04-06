require("dotenv").config()

const clientId = process.env['EBAY_CLIENT'];
const clientSecret = process.env['OATUH_CLIENT_SECRET'];
const ruName = process.env['OAUTH_RU_NAME'];
const authEndpoint = 'https://auth.ebay.com/oauth2/authorize';
const scope = 'https://api.ebay.com/oauth/api_scope';

const generateAuthUrl = () => {
  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: ruName,
    scope: scope,
  });

  return `${authEndpoint}?${queryParams}`;
};

const getOAuthLink = () => {
let oAuthLink = generateAuthUrl()
return oAuthLink
}

module.exports = {getOAuthLink}