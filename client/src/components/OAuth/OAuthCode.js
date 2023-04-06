import React, { useEffect } from "react"

const OAuthCode = (storeData) => {
    const { setEbayOAuthTokens, user } = storeData

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
            localStorage.setItem("user", {...user, OAuthActive: true})
            window.location.href = "https://flintbooks.herokuapp.com/inventory"
        } else {
            console.log(response.data.message)
        }
    }
    return (
        <div>

        </div>
    )
}

export default OAuthCode