import React, { useEffect } from "react"

const OAuthCode = (storeData) => {
    const { setEbayOAuthTokens } = storeData

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (code) {
            setTokens(code)
        }
    }, [])

    async function setTokens(code) {
        let response = await setEbayOAuthTokens(code)
        if (response.success){

        } else {
            
        }
    }
    return (
        <div>

        </div>
    )
}

export default OAuthCode