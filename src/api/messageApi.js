import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const sendMessage = async (recieverId, message) => {
    try {
        const token = localStorage.getItem("authToken")
        const response = await axios.post(`${BASE_URL}/messages/sendMessage/${recieverId}`, message,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )
        return response
    } catch (error) {
        console.error("Error occurred while sending message:", error);
        throw error;
    }
}

export const getMessage = async (recieverId) => {
    try {
        const token = localStorage.getItem("authToken")
        const response = await axios.get(`${BASE_URL}/messages/${recieverId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        })
        
        return response.data
    } catch (error) {
        console.error("Error occurred while getting messages:", error);
        throw error;
    }
}

export const sendMessageWithImage = async (recieverId, imageFile) => {
    try {
        const token = localStorage.getItem("authToken")
        const formData = new FormData()
        formData.append("image", imageFile)

        const response = await axios.post(`${BASE_URL}/messages/sendFile/${recieverId}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        })
        return response.data
    } catch (error) {
        console.error("Error occurred while sending files:", error);
        throw error;
    }
}