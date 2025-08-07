import React from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
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
  const { user } = useUser()
  const { signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
  }

  return (
    <>
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass-nav z-10">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <img src="/favicon.svg" alt="Trilinguo Logo" className="w-8 h-8 glass-logo rounded-lg" />
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Trilinguo</h1>

        {/* Language Dropdown - Desktop */}
        <div className="hidden sm:block" ref={languageDropdownRef}>
          <button
            onClick={() => updateUiState({ showLanguageDropdown: !uiState.showLanguageDropdown })}
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer"
          >
            <span className="text-sm font-medium text-gray-700">{currentLanguage.displayName}</span>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Romanization Toggle - only show if current language supports it */}
        {currentLanguage.hasRomanization && (
          <button
            onClick={() => updateSettings({ showRomanization: !showRomanization })}
            className={`glass-button px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              showRomanization
                ? 'glass-button-secondary text-white'
                : 'glass-button-light text-gray-700'
            }`}
          >
            {currentLanguage.romanizationLabel}
          </button>
        )}

        <button
          onClick={() => updateSettings({ showEnglish: !showEnglish })}
          className={`glass-button px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            showEnglish
              ? 'glass-button-blue-light text-white'
              : 'glass-button-light text-gray-700'
          }`}
        >
          EN
        </button>

        {/* Clear Chat Button - Desktop */}
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="hidden sm:flex items-center space-x-2 glass-button-red-light px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 cursor-pointer"
            title="Clear Chat History"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* User Menu - Desktop */}
        <div className="hidden sm:block relative" data-user-dropdown>
          <button
            onClick={() => updateUiState({ showUserDropdown: !uiState.showUserDropdown })}
            className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer border-2 border-white/60 hover:border-white/80 transition-colors shadow-sm"
          >
            <span className="text-white text-base font-medium">
              {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
            </span>
          </button>

          {/* User Dropdown */}
          {uiState.showUserDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-dropdown-fixed z-50">
              <div className="px-4 py-3 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/20 transition-colors cursor-pointer flex items-center space-x-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings Menu Button - Both Desktop and Mobile */}
        <button
          onClick={() => updateUiState({ showMobileMenu: true })}
          className="glass-button-light flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          <span className="hidden sm:inline text-sm text-gray-700 font-medium">Settings</span>
        </button>
      </div>

    </header>

    {/* Dropdown rendered outside header to prevent layout interference */}
    {uiState.showLanguageDropdown && languageDropdownRef.current && (
      <div 
        className="fixed w-64 glass-dropdown-fixed z-50"
        style={{
          top: `${languageDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
          left: `${languageDropdownRef.current.getBoundingClientRect().left}px`
        }}
      >
        {Object.values(LANGUAGES).map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-5 py-3 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg cursor-pointer relative overflow-hidden hover:bg-white/20 ${
              currentLanguage.code === lang.code
                ? 'text-blue-600 font-medium'
                : 'text-gray-700'
            }`}
          >
            <div className="flex items-center justify-between gap-4 relative z-10">
              <span className="whitespace-nowrap">{lang.name}</span>
              <span className="text-xs text-gray-500 whitespace-nowrap">{lang.displayName}</span>
            </div>
          </button>
        ))}
      </div>
    )}
    </>
  )
} 