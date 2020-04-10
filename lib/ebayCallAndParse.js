//For XML calls
const axios = require("axios");
const parser = require("xml2json")


async function ebayXMLRequest(url, query, config) {
    try {
        const response = await axios.post(url, query, config);
        let data = response.data
        
        if (data) {
            data = JSON.parse(parseXMLResponse(data));
            return data;
        }
    } catch (e) {
        console.log(e)
        return {message: "There was an error", err: e}
    }
    
}

function parseXMLResponse(response) {
    const options = {
        coerce: false,
        sanitize: true,
        trim: true,
        arrayNotation: false
    }
    const result = parser.toJson(response, options);
    return result;
}

module.exports = {
    ebayXMLRequest
}