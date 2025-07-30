import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;


const token = localStorage.getItem("authToken")

export const sendMessage = async (recieverId, message) => {
    try {

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

export const deleteMessage = async (messageId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/messages/deleteMessage/${messageId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )
        return response.data
    } catch (error) {
        console.error("Error occurred while deleting message:", error);
        throw error;
    }
}