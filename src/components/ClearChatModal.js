import React from 'react'

export default function ClearChatModal({ isOpen, onClose, onConfirm, currentLanguageName }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="glass-overlay fixed inset-0" onClick={onClose}></div>
      <div className="relative glass-modal border border-black/20 rounded-2xl max-w-sm mx-4 w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 glass-error rounded-full flex items-center justify-center mr-3">
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
            <h3 className="text-lg font-semibold text-gray-800">Clear Chat History</h3>
          </div>

          <div className="glass-surface-subtle rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Are you sure you want to clear all chat history for{' '}
              <strong className="text-gray-800">{currentLanguageName}</strong>? This action cannot be
              undone.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 glass-button text-gray-700 rounded-xl text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 glass-error text-white rounded-xl text-sm font-medium cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 