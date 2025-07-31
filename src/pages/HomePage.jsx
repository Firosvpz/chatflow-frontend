"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { getSidebarUsers } from "../api/userApi"
import AuthModal from "../components/AuthModal"
import { deleteMessage, getMessage, sendMessage, sendMessageWithImage } from "../api/messageApi"
import { disconnectSocket, initSocket } from "../config/socket"
import { ToastContainer, toast } from "react-toastify"
import { ConfirmationModal } from "../components/DeleteModal"
import { ChatLayout } from "../components/ChatLayout"
import { logoutUser } from "../api/authApi"

export default function ChatApp() {
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(true)
  const [contacts, setContacts] = useState([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [contactsError, setContactsError] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  // Toast and confirmation states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, messageId: null })
  const [deletingMessageId, setDeletingMessageId] = useState(null)

  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const socketRef = useRef(null)

  // Memoize current user data to prevent infinite re-renders
  const getCurrentUser = useCallback(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}")
      return userData
    } catch (error) {
      console.error("Error parsing userData:", error)
      return {}
    }
  }, [])

  // Memoize current user to prevent re-renders
  const currentUser = useMemo(() => getCurrentUser(), [getCurrentUser])

  // Format message time
  const formatMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }, [])

  // Format contact last seen time
  const formatContactTime = useCallback((timestamp) => {
    if (!timestamp) return "Recently"
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else if (diffInDays < 7) {
      if (diffInDays < 2) {
        return "Yesterday"
      }
      return `${Math.floor(diffInDays)}d`
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token && currentUser.id && !showAuthModal) {
      try {
        socketRef.current = initSocket(currentUser.id)
        socketRef.current.emit("join", currentUser.id)
        if (selectedContact) {
          const conversationId = [currentUser.id, selectedContact.id].sort().join("-")
          socketRef.current.emit("joinConversation", conversationId)
        }
        // Emit deletion event via socket if connected
        socketRef.current.on("messageDeleted", ({ messageId, conversationId }) => {
          console.log("Message deleted event received", { messageId, conversationId })
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
        })
        socketRef.current.on("connect", () => {
          console.log("Socket connected successfully")
          setIsSocketConnected(true)
          
        })
        socketRef.current.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason)
          setIsSocketConnected(false)
         
        })
        // Listen for incoming messages
        socketRef.current.on("sendMessage", (newMessage) => {
          console.log("Received new message:", newMessage)
          const transformedMessage = {
            id: newMessage._id,
            text: newMessage.message || "",
            sender: newMessage.senderId === currentUser.id ? "me" : "other",
            time: formatMessageTime(newMessage.createdAt || new Date()),
            timestamp: newMessage.createdAt || new Date().toISOString(),
            senderId: newMessage.senderId,
            receiverId: newMessage.recieverId || newMessage.receiverId,
            imageUrl: newMessage.file || null,
            messageType: newMessage.type || "text",
          }
          // Only add message if it's for the current conversation
          setMessages((prevMessages) => {
            // Check if message already exists
            const messageExists = prevMessages.some((msg) => msg.id === transformedMessage.id)
            if (messageExists) {
              return prevMessages
            }
            // Add message if it's part of current conversation
            if (
              selectedContact &&
              (newMessage.senderId === selectedContact.id ||
                newMessage.recieverId === selectedContact.id ||
                newMessage.receiverId === selectedContact.id)
            ) {
              const updatedMessages = [...prevMessages, transformedMessage]
              return updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            }
            return prevMessages
          })
        })
        // Listen for message deletion events
        socketRef.current.on("messageDeleted", ({ messageId, deletedBy }) => {
          console.log("Message deleted event received:", messageId)
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
         
        })
        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error)
          setIsSocketConnected(false)
         
        })
        socketRef.current.on("reconnect", () => {
          console.log("Socket reconnected")
          setIsSocketConnected(true)
          
        })
        socketRef.current.on("reconnect_failed", () => {
          console.error("Socket reconnection failed")
          setIsSocketConnected(false)
          
        })
      } catch (error) {
        console.error("Failed to initialize socket:", error)
        setIsSocketConnected(false)
       
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect")
        socketRef.current.off("disconnect")
        socketRef.current.off("sendMessage")
        socketRef.current.off("messageDeleted")
        socketRef.current.off("connect_error")
        socketRef.current.off("reconnect")
        socketRef.current.off("reconnect_failed")
        disconnectSocket()
        setIsSocketConnected(false)
      }
    }
  }, [currentUser.id, selectedContact, showAuthModal, formatMessageTime])

  // Fallback polling when socket is disconnected
  useEffect(() => {
    let pollingInterval = null
    if (selectedContact && !showAuthModal && !isSocketConnected) {
      console.log("Socket disconnected, falling back to polling")
      pollingInterval = setInterval(async () => {
        try {
          const response = await getMessage(selectedContact.id)
          const transformedMessages = response.map((msg) => ({
            id: msg._id,
            text: msg.message || "",
            sender: msg.senderId === currentUser.id ? "me" : "other",
            time: formatMessageTime(msg.createdAt),
            timestamp: msg.createdAt,
            senderId: msg.senderId,
            receiverId: msg.recieverId || msg.receiverId,
            imageUrl: msg.file || null,
            messageType: msg.type || "text",
          }))
          transformedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          setMessages((prevMessages) => {
            if (
              JSON.stringify(prevMessages.map((m) => m.id)) !== JSON.stringify(transformedMessages.map((m) => m.id))
            ) {
              return transformedMessages
            }
            return prevMessages
          })
        } catch (error) {
          console.error("Error polling messages:", error)
        }
      }, 3000) // Poll every 3 seconds when socket is disconnected
    }
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [selectedContact, showAuthModal, isSocketConnected, currentUser.id, formatMessageTime])

  // Check for auth token - only run once on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      setShowAuthModal(false)
    } else {
      setShowAuthModal(true)
    }
  }, [])

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoadingContacts(true)
        setContactsError(null)
        const response = await getSidebarUsers()
        const transformedContacts =
          response.data?.map((user) => ({
            id: user.id || user._id,
            name: user.name || user.username || "Unknown User",
            image: user.image || user.profilePicture || "/placeholder.svg?height=48&width=48&text=Profile",
            status: user.status || user.isOnline ? "online" : "offline",
            lastMessage: user.lastMessage || "No messages yet",
            lastSeen: formatContactTime(user.lastSeen || user.updatedAt),
            unread: user.unreadCount || 0,
            email: user.email,
            phone: user.phone || user.phoneNumber,
            lastMessageTime: user.lastMessageTime || user.updatedAt,
          })) || []
        setContacts(transformedContacts)
        // Only set selected contact if none is selected and we have contacts
        if (!isMobile && transformedContacts.length > 0 && !selectedContact) {
          setSelectedContact(transformedContacts[0])
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)
        setContactsError(error.message || "Failed to load contacts")
        toast.error("Failed to load contacts")
      } finally {
        setIsLoadingContacts(false)
      }
    }
    const token = localStorage.getItem("authToken")
    if (token) {
      fetchContacts()
    }
  }, [isMobile, selectedContact, formatContactTime])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Fetch messages when contact is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact) return
      try {
        setIsLoadingMessages(true)
        const response = await getMessage(selectedContact.id)
        const transformedMessages = response.map((msg) => ({
          id: msg._id,
          text: msg.message || "",
          sender: msg.senderId === currentUser.id ? "me" : "other",
          time: formatMessageTime(msg.createdAt),
          timestamp: msg.createdAt,
          senderId: msg.senderId,
          receiverId: msg.recieverId || msg.receiverId,
          imageUrl: msg.file || null,
          messageType: msg.type || "text",
        }))
        transformedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        setMessages(transformedMessages)
      } catch (error) {
        console.error("Error fetching messages:", error)
        setMessages([])
       
      } finally {
        setIsLoadingMessages(false)
      }
    }
    fetchMessages()
  }, [selectedContact, currentUser.id, formatMessageTime])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, selectedContact, scrollToBottom])

  const handleContactSelect = useCallback(
    (contact) => {
      setSelectedContact(contact)
      if (isMobile) {
        setSidebarOpen(false)
      }
    },
    [isMobile],
  )

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type - only images
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPG, PNG, GIF)")
        return
      }
      // Validate file size (5MB limit to match backend)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error("Image size should be less than 5MB")
        return
      }
      setSelectedImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!selectedImage || !selectedContact || isUploadingImage) return
    setIsUploadingImage(true)
    const tempId = Date.now()
    const currentTime = new Date()
    // Create optimistic image message
    const optimisticMessage = {
      id: tempId,
      text: "",
      sender: "me",
      time: currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: currentTime.toISOString(),
      senderId: currentUser.id,
      receiverId: selectedContact.id,
      isPending: true,
      messageType: "image",
      imageUrl: imagePreview,
    }
    setMessages((prev) => [...prev, optimisticMessage])
    try {
      const response = await sendMessageWithImage(selectedContact.id, selectedImage)
      console.log("image response:", response)
      // Update the optimistic message with real data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
              ...msg,
              id: response._id || response?.id || tempId,
              isPending: false,
              timestamp: response?.createdAt || msg.timestamp,
              time: formatMessageTime(response?.createdAt || msg.timestamp),
              imageUrl: response?.file || msg.imageUrl,
            }
            : msg,
        ),
      )
      // Clear image selection
      setSelectedImage(null)
      setImagePreview(null)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
      toast.success("Image sent successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploadingImage(false)
    }
  }, [selectedImage, selectedContact, isUploadingImage, imagePreview, currentUser.id, formatMessageTime])

  // Handle text message
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault()
      if (!newMessage.trim() || !selectedContact || isSendingMessage) return
      const messageText = newMessage.trim()
      const tempId = Date.now()
      const currentTime = new Date()
      const optimisticMessage = {
        id: tempId,
        text: messageText,
        sender: "me",
        time: currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: currentTime.toISOString(),
        senderId: currentUser.id,
        receiverId: selectedContact.id,
        isPending: true,
        messageType: "text",
      }
      setMessages((prev) => [...prev, optimisticMessage])
      setNewMessage("")
      setIsSendingMessage(true)
      try {
        const messageData = { message: messageText }
        const response = await sendMessage(selectedContact.id, messageData)
        // Update the optimistic message with real data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                ...msg,
                id: response.data.newMessage._id || response.data.id || tempId,
                isPending: false,
                timestamp: response.data.newMessage.createdAt || msg.timestamp,
                time: formatMessageTime(response.data.newMessage.createdAt || msg.timestamp),
              }
              : msg,
          ),
        )
        // Emit via socket if connected
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("sendMessage", {
            _id: response.data.newMessage._id,
            message: messageText,
            senderId: currentUser.id,
            recieverId: selectedContact.id,
            createdAt: response.data.newMessage.createdAt,
            type: "text",
          })
        }
      } catch (error) {
        console.error("Error sending message:", error)
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        toast.error("Failed to send message. Please try again.")
        setNewMessage(messageText)
      } finally {
        setIsSendingMessage(false)
      }
    },
    [newMessage, selectedContact, isSendingMessage, currentUser.id, formatMessageTime],
  )

  // Handle delete message confirmation
  const handleDeleteMessageClick = useCallback((messageId) => {
    setConfirmModal({ isOpen: true, messageId })
  }, [])

  // Handle confirmed delete message
  const handleConfirmDeleteMessage = useCallback(async () => {
    const { messageId } = confirmModal
    if (!messageId) return
    setDeletingMessageId(messageId)
    setConfirmModal({ isOpen: false, messageId: null })
    try {
      // Optimistic update - remove the message immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      // Call the API to delete from backend
      await deleteMessage(messageId)
     
    } catch (error) {
      console.error("Failed to delete message:", error)
     
      // Revert UI by re-fetching messages
      if (selectedContact) {
        try {
          const response = await getMessage(selectedContact.id)
          const transformedMessages = response.map((msg) => ({
            id: msg._id,
            text: msg.message || "",
            sender: msg.senderId === currentUser.id ? "me" : "other",
            time: formatMessageTime(msg.createdAt),
            timestamp: msg.createdAt,
            senderId: msg.senderId,
            receiverId: msg.recieverId || msg.receiverId,
            imageUrl: msg.file || null,
            messageType: msg.type || "text",
          }))
          setMessages(
            transformedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          )
        } catch (refetchError) {
          console.error("Failed to refetch messages:", refetchError)
        }
      }
    } finally {
      setDeletingMessageId(null)
    }
  }, [confirmModal, currentUser.id, selectedContact, formatMessageTime])

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setConfirmModal({ isOpen: false, messageId: null })
  }, [])

  const handleRetryContacts = useCallback(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      setContactsError(null)
      setIsLoadingContacts(true)
      window.location.reload()
    }
  }, [])

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [contacts, searchQuery],
  )

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-orange-500"
      default:
        return "bg-gray-400"
    }
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false) 
    window.location.reload()
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  // Clear image selection handler
  const clearImageSelection = useCallback(() => {
    setSelectedImage(null)
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }, [])

  // handle logout
  const handleLogout = useCallback(() => {
    logoutUser()
    setShowAuthModal(true) // Show auth modal again
    setSelectedContact(null) // Clear selected contact
    setMessages([]) // Clear messages
    setContacts([]) // Clear contacts
  }, [])

  return (
    <div className="h-screen bg-white flex overflow-hidden relative">
      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <ChatLayout
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isSocketConnected={isSocketConnected}
        notifications={notifications}
        setNotifications={setNotifications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        contacts={filteredContacts}
        isLoadingContacts={isLoadingContacts}
        contactsError={contactsError}
        handleRetryContacts={handleRetryContacts}
        selectedContact={selectedContact}
        handleContactSelect={handleContactSelect}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        isSendingMessage={isSendingMessage}
        isTyping={isTyping}
        currentUser={currentUser}
        handleDeleteMessageClick={handleDeleteMessageClick}
        deletingMessageId={deletingMessageId}
        selectedImage={selectedImage}
        imagePreview={imagePreview}
        handleImageSelect={handleImageSelect}
        handleImageUpload={handleImageUpload}
        isUploadingImage={isUploadingImage}
        clearImageSelection={clearImageSelection}
        messagesEndRef={messagesEndRef}
        imageInputRef={imageInputRef}
        getStatusColor={getStatusColor}
        formatFileSize={formatFileSize}
        handleLogout={handleLogout}
      />

      <AuthModal isOpen={showAuthModal} onClose={handleAuthSuccess} />
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onConfirm={handleConfirmDeleteMessage}
        onCancel={handleCancelDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
