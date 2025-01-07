import React, { createContext, useState } from "react";
import axios from "axios"
export const AuthContext = createContext();
const authAxios = axios.create()


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );

  const login = (credentials) => {
    return authAxios.post("/auth/login", credentials).then(async (response) => {
      const {
        user,
        user: { token },
      } = response.data
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", token)
      setUser(user)

      return response
    })
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser({})
  }

  return (
    <AuthContext.Provider value={{setUser, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};