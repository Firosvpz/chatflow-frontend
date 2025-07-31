"use client"

import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

export function ContactList({
  contacts,
  isLoadingContacts,
  contactsError,
  searchQuery,
  handleContactSelect,
  selectedContact,
  handleRetryContacts,
}) {
  return (
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
      ) : contacts.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-300">
              <span className="text-2xl">{"👥"}</span>
            </div>
            <p className="text-sm text-gray-600">{searchQuery ? "No contacts found" : "No contacts available"}</p>
          </div>
        </div>
      ) : (
        contacts.map((contact) => (
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
  )
}
