"use client"
import { useState, useRef, useEffect } from "react"
import EmojiPicker from "emoji-picker-react"
import { SmileIcon } from "lucide-react"

export const EmojiPickerButton = ({ onEmojiClick }) => {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)
  const buttonRef = useRef(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showPicker])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors z-10 p-1 rounded-full hover:bg-orange-50"
        title="Add emoji"
      >
        <SmileIcon className="w-5 h-5" />
      </button>

      {showPicker && (
        <div
          ref={pickerRef}
          className="fixed bottom-20 right-4 z-[9999] shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white"
          style={{
            transform: "translateX(-50%)",
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onEmojiClick(emojiData.emoji)
              setShowPicker(false)
            }}
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={false}
            searchDisabled={false}
            theme="light"
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </>
  )
}

export default EmojiPickerButton
