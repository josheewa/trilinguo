import React from 'react'

export default function CulturalContextPanel({ culturalContext, onClose }) {
  if (!culturalContext) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/10 to-white/5 border-l border-white/20 shadow-2xl transform transition-transform duration-300">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-white/20 flex items-center justify-between backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Cultural Context
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/30 cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-gray-300 hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4">
              <p className="text-sm text-gray-200 leading-relaxed">{culturalContext}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 