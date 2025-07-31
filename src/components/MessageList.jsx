"use client"

import { Loader2, Trash2 } from "lucide-react"

export function MessageList({
  messages,
  isLoadingMessages,
  currentUser,
  selectedContact,
  handleDeleteMessageClick,
  deletingMessageId,
  isTyping,
  messagesEndRef,
}) {
  return (
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
              <span className="text-3xl">{"💬"}</span>
            </div>
            <p className="text-sm text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex items-end space-x-2 animate-fade-in-up group ${
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
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200 shadow-md"
            />
            <div
              className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg relative ${
                message.sender === "me"
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-md border border-blue-300 shadow-blue-500/25"
                  : "bg-white text-gray-800 rounded-bl-md border border-gray-200 shadow-gray-500/10"
              } ${message.isPending ? "opacity-70" : ""} ${deletingMessageId === message.id ? "opacity-50" : ""}`}
            >
              {/* Delete button (only for your own messages) */}
              {message.sender === "me" && !message.isPending && (
                <button
                  onClick={() => handleDeleteMessageClick(message.id)}
                  disabled={deletingMessageId === message.id}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete message"
                >
                  {deletingMessageId === message.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
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
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200 shadow-md"
          />
          <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-gray-200">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
