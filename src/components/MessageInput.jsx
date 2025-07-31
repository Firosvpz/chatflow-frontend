"use client"

import { SendHorizonalIcon, ImageIcon, Loader2 } from "lucide-react"
import EmojiPickerButton from "./EmojiPickerButton"


export function MessageInput({
  newMessage,
  setNewMessage,
  handleSendMessage,
  isSendingMessage,
  isUploadingImage,
  imageInputRef,
  handleImageSelect,
  isSocketConnected,
}) {
  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-sm relative overflow-hidden">
      {/* Colorful accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        {/* Hidden image input */}
        <input ref={imageInputRef} type="file" onChange={handleImageSelect} className="hidden" accept="image/*" />
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
          {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizonalIcon className="w-5 h-5" />}
        </button>
      </form>
    </div>
  )
}
