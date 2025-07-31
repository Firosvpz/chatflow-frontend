"use client"

import { ChatMain } from "./ChatMain"
import { ChatSidebar } from "./ChatSidebar"

export function ChatLayout({
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    isSocketConnected,
    notifications,
    setNotifications,
    searchQuery,
    setSearchQuery,
    contacts,
    isLoadingContacts,
    contactsError,
    handleRetryContacts,
    selectedContact,
    handleContactSelect,
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
    getStatusColor,
    formatFileSize,
    handleLogout,
}) {
    return (
        <>
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
            <ChatSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                isMobile={isMobile}
                isSocketConnected={isSocketConnected}
                notifications={notifications}
                setNotifications={setNotifications}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                contacts={contacts}
                isLoadingContacts={isLoadingContacts}
                contactsError={contactsError}
                handleRetryContacts={handleRetryContacts}
                selectedContact={selectedContact}
                handleContactSelect={handleContactSelect}
                handleLogout={handleLogout}
            />

            {/* Main Chat Area */}
            <ChatMain
                selectedContact={selectedContact}
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
                isSocketConnected={isSocketConnected}
                setSidebarOpen={setSidebarOpen}
                getStatusColor={getStatusColor}
                formatFileSize={formatFileSize}
                isMobile={isMobile}
            />
        </>
    )
}
