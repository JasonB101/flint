const axios = require("axios")
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

async function refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'https://api.ebay.com/oauth/api_scope'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
      });
  
      const newAccessToken = response.data.access_token;
  
      return {
        success: true,
        token: newAccessToken
      };
    } catch (error) {
      console.error(error);
      return {
        success: false
      };
    }
  }



const exchangeCodeForTokens = async (code) => {
    const clientId = process.env['EBAY_CLIENT'];
    const clientSecret = process.env['OAUTH_CLIENT_SECRET'];
    const redirectUri = process.env['OAUTH_RU_NAME'];
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://api.ebay.com/identity/v1/oauth2/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`
        });
        const { access_token: accessToken, refresh_token: refreshToken } = response.data;
        return { accessToken, refreshToken };
    } catch (error) {
        console.error(error);
    }
}

module.exports = { getOAuthLink, exchangeCodeForTokens, refreshAccessToken }