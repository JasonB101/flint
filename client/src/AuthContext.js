import React, { createContext, useState } from "react";
import axios from "axios"
export const AuthContext = createContext();
const authAxios = axios.create()


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );

  const [token, setToken] = useState(localStorage.getItem("token"));


  const login = (credentials) => {
    return authAxios.post("/auth/login", credentials).then(async (response) => {
      const {
        user,
        user: { token: newToken },
      } = response.data
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", newToken)
      setToken(newToken)
      setUser(user)
      return response
    })
  }

  

  return (
    <AuthContext.Provider value={{setUser, user, login, setToken, token }}>
      {children}
    </AuthContext.Provider>
  );
};