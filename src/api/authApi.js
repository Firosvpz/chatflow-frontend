import axios from "axios";
import { disconnectSocket } from "../config/socket";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const register = async (userData) => {
    try {
        const response = await axios.post(`${BASE_URL}/register`, userData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },

            }
        )
        return response.data
    } catch (error) {
        console.error("Error occurred while register user:", error);
        throw error;
    }
}

export const verifyOtp = async (authData) => {
    try {
        const response = await axios.post(`${BASE_URL}/verifyOtp`, authData)
        return response
    } catch (error) {
        console.error("Error occurred while verifying otp:", error);
        throw error;
    }
}

export const loginUser = async (userData) => {
    try {
        const response = await axios.post(`${BASE_URL}/login`, userData)
        return response
    } catch (error) {
        console.error("Error occurred while login user:", error);
        throw error;
    }
}

export const logoutUser = () => {
  try {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    disconnectSocket()
    console.log("User logged out successfully.")
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}