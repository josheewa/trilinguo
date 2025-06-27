import React from 'react'

export default function ClearChatModal({ isOpen, onClose, onConfirm, currentLanguageName }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/10 to-white/5 border border-white/20 rounded-2xl max-w-sm mx-4 w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500/90 to-red-600/90 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm border border-red-400/30 shadow-lg shadow-red-500/25">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Clear Chat History</h3>
          </div>

          <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
            <p className="text-sm text-gray-200 leading-relaxed">
              Are you sure you want to clear all chat history for{' '}
              <strong className="text-white">{currentLanguageName}</strong>? This action cannot be
              undone.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all duration-200 text-sm font-medium border border-white/20 hover:border-white/30 shadow-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 backdrop-blur-sm bg-gradient-to-br from-red-500/90 to-red-600/90 hover:from-red-600/90 hover:to-red-700/90 text-white rounded-xl transition-all duration-200 text-sm font-medium border border-red-400/50 hover:border-red-300/60 shadow-lg shadow-red-500/25 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 