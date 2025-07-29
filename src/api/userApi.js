import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getSidebarUsers = async () => {
  try {
    const token = localStorage.getItem("authToken")
    const response = await axios.get(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    return response
  } catch (error) {
    console.error("Error occurred while fetching users:", error)
    throw error
  }
}

