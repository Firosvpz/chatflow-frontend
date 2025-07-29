"use client"

import {
  Phone,
  Search,
  SendHorizonalIcon,
  Settings,
  Video,
  Loader2,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Bell,
  BellOff,
  MessageCircle,
  Sparkles,
  Sun,
  ImageIcon,
  X,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { getSidebarUsers } from "../api/userApi"
import AuthModal from "../components/AuthModal"
import { getMessage, sendMessage, sendMessageWithImage } from "../api/messageApi"
import { EmojiPickerButton } from "../components/EmojiPickerButton"
import { disconnectSocket, initSocket } from "../config/socket"

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

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token && currentUser.id && !showAuthModal) {
      try {
        socketRef.current = initSocket(currentUser.id)

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
              return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            }

            return prevMessages
          })
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
        socketRef.current.off("connect_error")
        socketRef.current.off("reconnect")
        socketRef.current.off("reconnect_failed")
        disconnectSocket()
        setIsSocketConnected(false)
      }
    }
  }, [currentUser.id, selectedContact, showAuthModal])

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

          transformedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

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
  }, [selectedContact, showAuthModal, isSocketConnected, currentUser.id])

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
        // console.log("response", response)

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
      } finally {
        setIsLoadingContacts(false)
      }
    }

    const token = localStorage.getItem("authToken")
    if (token) {
      fetchContacts()
    }
  }, [isMobile, selectedContact])

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

        transformedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        setMessages(transformedMessages)
      } catch (error) {
        console.error("Error fetching messages:", error)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedContact, currentUser.id])

  // Format message time
  const formatMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
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
    const diffInMinutes = (now - date) / (1000 * 60)
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
        alert("Please select an image file (JPG, PNG, GIF)")
        return
      }

      // Validate file size (5MB limit to match backend)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert("Image size should be less than 5MB")
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
      console.log('image response:',response);
      

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
    } catch (error) {
      console.error("Error uploading image:", error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploadingImage(false)
    }
  }, [selectedImage, selectedContact, isUploadingImage, imagePreview, currentUser.id])

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

        // In handleSendMessage, after the API call succeeds, add this:
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
        alert("Failed to send message. Please try again.")
        setNewMessage(messageText)
      } finally {
        setIsSendingMessage(false)
      }
    },
    [newMessage, selectedContact, isSendingMessage, currentUser.id],
  )

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

  return (
    <div className="h-screen bg-white flex overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-60"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-gradient-to-br from-yellow-100 to-pink-100 rounded-full opacity-50"></div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative z-50 md:z-auto w-80 sm:w-96 md:w-80 lg:w-96 h-full md:translate-x-0 transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-xl`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
          {/* Colorful accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 relative">
                <MessageCircle className="w-7 h-7 text-white" />
                {/* Socket connection indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    isSocketConnected ? "bg-green-500" : "bg-orange-500"
                  }`}
                  title={isSocketConnected ? "Real-time connected" : "Using fallback mode"}
                ></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChatFlow
                </h1>
                <p className="text-xs text-gray-500">{isSocketConnected ? "Real-time connected" : "Fallback mode"}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setNotifications(!notifications)}
                className="p-2.5 hover:bg-blue-100 rounded-xl transition-all duration-200 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 hover:shadow-md"
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button className="p-2.5 hover:bg-purple-100 rounded-xl transition-all duration-200 text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 hover:shadow-md">
                <Settings className="w-5 h-5" />
              </button>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-700 border border-gray-200 hover:border-gray-300 md:hidden"
                >
                  <span className="text-lg">✕</span>
                </button>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-500 text-sm hover:border-gray-400 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {isLoadingContacts ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading contacts...</p>
              </div>
            </div>
          ) : contactsError ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Failed to load contacts</p>
                <button
                  onClick={handleRetryContacts}
                  className="flex items-center justify-center mx-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25 font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-300">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-sm text-gray-600">{searchQuery ? "No contacts found" : "No contacts available"}</p>
              </div>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactSelect(contact)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 active:bg-gradient-to-r active:from-blue-100 active:to-purple-100 relative group ${
                  selectedContact?.id === contact.id
                    ? "bg-gradient-to-r from-blue-100 via-purple-50 to-pink-50 border-r-4 border-r-blue-500"
                    : ""
                }`}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <img
                      src={contact.image || "/placeholder.svg"}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200 shadow-md hover:ring-blue-300 transition-all duration-200"
                    />
                    {contact.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
                        {contact.unread > 9 ? "9+" : contact.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate text-base">{contact.name}</h3>
                      <span className="text-xs text-blue-600 flex-shrink-0 ml-2 font-medium">
                        {contact.lastMessageTime
                          ? new Date(contact.lastMessageTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : contact.lastSeen}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate leading-relaxed">{contact.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm relative overflow-hidden">
              {/* Colorful accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 md:hidden flex-shrink-0 border border-gray-200 hover:border-gray-300"
                  >
                    <span className="text-gray-600">☰</span>
                  </button>
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedContact.image || "/placeholder.svg"}
                      alt={selectedContact.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-200 shadow-md"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${getStatusColor(
                        selectedContact.status,
                      )} rounded-full border-2 border-white`}
                    ></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 truncate text-base">{selectedContact.name}</h2>
                    <p className="text-sm text-blue-600 capitalize flex items-center">
                      {/* <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(selectedContact.status)}`}></span> */}
                      {/* {selectedContact.status} */}
                      {isSocketConnected ? (
                        <span className="ml-2 text-xs text-green-600">Online</span>
                      ) : (
                        <span className="ml-2 text-xs text-orange-600">Sync</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button className="p-2.5 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-200 hover:border-green-300 hover:shadow-md">
                    <Phone className="text-green-600 w-5 h-5" />
                  </button>
                  <button className="p-2.5 hover:bg-blue-100 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:shadow-md">
                    <Video className="text-blue-600 w-5 h-5" />
                  </button>
                  <button className="p-2.5 hover:bg-purple-100 rounded-xl transition-all duration-200 border border-purple-200 hover:border-purple-300 hover:shadow-md">
                    <MoreVertical className="text-purple-600 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white relative">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-sm text-gray-600">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 animate-fade-in-up ${
                      message.sender === "me" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <img
                      src={
                        message.sender === "me"
                          ? currentUser.image || "/placeholder.svg?height=32&width=32&text=Me"
                          : selectedContact.image
                      }
                      alt="image"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200 shadow-md"
                    />
                    <div
                      className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg relative ${
                        message.sender === "me"
                          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-md border border-blue-300 shadow-blue-500/25"
                          : "bg-white text-gray-800 rounded-bl-md border border-gray-200 shadow-gray-500/10"
                      } ${message.isPending ? "opacity-70" : ""}`}
                    >
                      {/* Message Content */}
                      {message.messageType === "image" ? (
                        <div className="space-y-2">
                          {/* Image */}
                          <img
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="Shared image"
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-64 object-cover"
                            onClick={() => window.open(message.imageUrl, "_blank")}
                          />

                          {/* Time */}
                          <div className="flex items-center justify-end gap-1">
                            <span
                              className={`text-xs whitespace-nowrap ${
                                message.sender === "me" ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              {message.time}
                            </span>
                            {message.isPending && <Loader2 className="w-3 h-3 animate-spin text-current opacity-50" />}
                          </div>
                        </div>
                      ) : (
                        /* Text message */
                        <div className="flex items-end justify-between gap-3">
                          <p className="text-sm leading-relaxed break-words flex-1">{message.text}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`text-xs whitespace-nowrap ${
                                message.sender === "me" ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              {message.time}
                            </span>
                            {message.isPending && <Loader2 className="w-3 h-3 animate-spin text-current opacity-50" />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-end space-x-2 animate-fade-in-up">
                  <img
                    src={selectedContact.image || "/placeholder.svg"}
                    alt="image"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200 shadow-md"
                  />
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {selectedImage && (
              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedImage.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedImage.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isUploadingImage ? (
                        <div className="flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Uploading...
                        </div>
                      ) : (
                        "Send Image"
                      )}
                    </button>
                    <button
                      onClick={clearImageSelection}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-sm relative overflow-hidden">
              {/* Colorful accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                {/* Hidden image input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  onChange={handleImageSelect}
                  className="hidden"
                  accept="image/*"
                />

                {/* Image upload button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 flex-shrink-0 border border-gray-200 hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSendingMessage || isUploadingImage}
                    className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-500 disabled:opacity-50 hover:border-gray-400 focus:bg-white"
                  />
                  <EmojiPickerButton onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji)} />
                </div>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSendingMessage || isUploadingImage}
                  className="p-3.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white disabled:text-gray-300 rounded-2xl transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-blue-500/25 font-medium"
                  title={isSocketConnected ? "Send message (Real-time)" : "Send message (Sync mode)"}
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizonalIcon className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/30 to-white p-4 relative">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-blue-200">
                <Sun className="text-4xl text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to ChatFlow</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {isLoadingContacts
                  ? "Loading contacts..."
                  : "Select a contact to start chatting with our bright and colorful messaging experience"}
              </p>
              {isMobile && !isLoadingContacts && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:scale-105 font-medium"
                >
                  View Contacts
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={handleAuthSuccess} />
    </div>
  )
}
