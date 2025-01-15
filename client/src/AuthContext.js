import React, { createContext, useState } from "react";
import axios from "axios"
export const AuthContext = createContext();
const authAxios = axios.create()


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );


  const login = (credentials) => {
    return authAxios.post("/auth/login", credentials).then(async (response) => {
      const {
        user
      } = response.data
      localStorage.setItem("user", JSON.stringify(user))
      setUser(user)
      return response
    })
  }
  const logout = async () => {
    try {
      // Send a logout request to the backend
      await authAxios.post('/auth/logout'); // Adjust the endpoint to match your backend's logout API
  
      localStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Handle any errors that may occur during the logout request
    }
    }

  

  return (
    <AuthContext.Provider value={{setUser, user, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};