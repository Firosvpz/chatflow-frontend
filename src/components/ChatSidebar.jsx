"use client"

import { MessageCircle, Settings, Bell, BellOff, Search, Sparkles, LogOut } from "lucide-react"
import { ContactList } from "./ContactsList"
import { LogoutConfirmationModal } from "./LogoutModal"
import { useState } from "react"


export function ChatSidebar({
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
    handleLogout
}) {

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true)
    }

    const handleConfirmLogout = () => {
        handleLogout()
        setShowLogoutConfirm(false)
    }

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false)
    }

    return (
        <div
            className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed md:relative z-50 md:z-auto w-80 sm:w-96 md:w-80 lg:w-96 h-full 
        md:translate-x-0 transition-all duration-300 bg-white border-r border-gray-200 
        flex flex-col overflow-hidden shadow-xl`}
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
                                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isSocketConnected ? "bg-green-500" : "bg-orange-500"
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
                        {/* <button className="p-2.5 hover:bg-purple-100 rounded-xl transition-all duration-200 text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 hover:shadow-md">
                            <Settings className="w-5 h-5" />
                        </button> */}
                        {/* Logout Button */}
                        <button
                            onClick={handleLogoutClick}
                            className="p-2.5 hover:bg-red-100 rounded-xl transition-all duration-200 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:shadow-md"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-700 border border-gray-200 hover:border-gray-300 md:hidden"
                            >
                                <span className="text-lg">{"✕"}</span>
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
            <ContactList
                contacts={contacts}
                isLoadingContacts={isLoadingContacts}
                contactsError={contactsError}
                searchQuery={searchQuery}
                handleContactSelect={handleContactSelect}
                selectedContact={selectedContact}
                handleRetryContacts={handleRetryContacts}
            />

            {/* Logout Confirmation Modal */}
            <LogoutConfirmationModal
                isOpen={showLogoutConfirm}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
        </div>
    )
}
