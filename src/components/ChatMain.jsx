"use client"

import { Phone, Video, MoreVertical, Sun, Loader2, X } from "lucide-react"
import { MessageInput } from "./MessageInput"
import { MessageList } from "./MessageList"


export function ChatMain({
  selectedContact,
  messages,
  isLoadingMessages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  isSendingMessage,
  isTyping,
  currentUser,
  handleDeleteMessageClick,
  deletingMessageId,
  selectedImage,
  imagePreview,
  handleImageSelect,
  handleImageUpload,
  isUploadingImage,
  clearImageSelection,
  messagesEndRef,
  imageInputRef,
  isSocketConnected,
  setSidebarOpen,
  getStatusColor,
  formatFileSize,
  isMobile,
  isLoadingContacts, // Declare the isLoadingContacts variable here
}) {
  return (
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
                  onClick={() => setSidebarOpen(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 md:hidden flex-shrink-0 border border-gray-200 hover:border-gray-300"
                >
                  <span className="text-gray-600">{"☰"}</span>
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
          <MessageList
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            currentUser={currentUser}
            selectedContact={selectedContact}
            handleDeleteMessageClick={handleDeleteMessageClick}
            deletingMessageId={deletingMessageId}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
          />

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
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            isSendingMessage={isSendingMessage}
            isUploadingImage={isUploadingImage}
            imageInputRef={imageInputRef}
            handleImageSelect={handleImageSelect}
            isSocketConnected={isSocketConnected}
          />
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
  )
}
