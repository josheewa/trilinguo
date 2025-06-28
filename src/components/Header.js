import React from 'react'
import { LANGUAGES } from '../config/languages'

export default function Header({
  currentLanguage,
  showRomanization,
  showEnglish,
  messages,
  uiState,
  updateUiState,
  updateSettings,
  handleClearChat,
  handleLanguageChange,
  languageDropdownRef,
}) {
  return (
    <header className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass-nav border-b border-white/10 z-10 transition-all duration-300 ${uiState.showMobileMenu ? 'blur-sm' : ''}`}>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-6 h-6 sm:w-8 sm:h-8 glass-button-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs sm:text-sm">T</span>
        </div>
        <h1 className="text-lg sm:text-xl font-semibold">Trilinguo</h1>

        {/* Language Dropdown - Desktop */}
        <div className="relative hidden sm:block" ref={languageDropdownRef}>
          <button
            onClick={() => updateUiState({ showLanguageDropdown: true })}
            className="glass-button flex items-center space-x-1 px-3 py-2 rounded-xl cursor-pointer"
          >
            <span className="text-sm text-gray-300">{currentLanguage.displayName}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {/* Dropdown positioned absolutely outside layout flow */}
          {uiState.showLanguageDropdown && (
            <div className="fixed top-0 left-0 w-full h-full z-[50] pointer-events-none">
              <div 
                className="absolute w-64 glass-dropdown rounded-xl pointer-events-auto"
                style={{
                  top: `${languageDropdownRef.current?.getBoundingClientRect().bottom + 8}px`,
                  left: `${languageDropdownRef.current?.getBoundingClientRect().left}px`
                }}
              >
                {Object.values(LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-5 py-3 hover:bg-white/20 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl cursor-pointer ${
                      currentLanguage.code === lang.code
                        ? 'bg-white/20 text-blue-300'
                        : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="whitespace-nowrap">{lang.name}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{lang.displayName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Controls */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Romanization Toggle - only show if current language supports it */}
        {currentLanguage.hasRomanization && (
          <button
            onClick={() => updateSettings({ showRomanization: !showRomanization })}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
              showRomanization
                ? 'glass-button-secondary text-white'
                : 'glass-button text-gray-300'
            }`}
          >
            {currentLanguage.romanizationLabel}
          </button>
        )}

        <button
          onClick={() => updateSettings({ showEnglish: !showEnglish })}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
            showEnglish
              ? 'glass-button-blue text-white'
              : 'glass-button text-gray-300'
          }`}
        >
          EN
        </button>

        {/* Clear Chat Button - Desktop */}
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium glass-error text-red-200 hover:text-white transition-all duration-200 cursor-pointer"
            title="Clear Chat History"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
            <span>Clear</span>
          </button>
        )}

        {/* Settings Menu Button - Both Desktop and Mobile */}
        <button
          onClick={() => updateUiState({ showMobileMenu: true })}
          className="glass-button flex items-center sm:space-x-2 p-2 rounded-xl cursor-pointer"
        >
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          <span className="hidden sm:inline text-sm text-gray-300 font-medium">Settings</span>
        </button>
      </div>
    </header>
  )
} 