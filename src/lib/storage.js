import { StorageKeys, defaultSettings } from '../config/settings'

export const loadSettings = () => {
  try {
    const stored = localStorage.getItem(StorageKeys.SETTINGS)
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  } catch (error) {
    console.error('Error loading settings:', error)
    return defaultSettings
  }
}

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

export const loadChatHistory = (languageCode) => {
  try {
    const stored = localStorage.getItem(StorageKeys.CHAT_PREFIX + languageCode)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

export const saveChatHistory = (languageCode, messages) => {
  try {
    localStorage.setItem(StorageKeys.CHAT_PREFIX + languageCode, JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

export const clearChatHistory = (languageCode) => {
  try {
    localStorage.removeItem(StorageKeys.CHAT_PREFIX + languageCode)
  } catch (error) {
    console.error('Error clearing chat history:', error)
  }
}

export const loadAuth = () => {
  try {
    return localStorage.getItem(StorageKeys.AUTH) === 'authenticated'
  } catch (error) {
    console.error('Error loading auth status:', error)
    return false
  }
}

export const saveAuth = () => {
  try {
    localStorage.setItem(StorageKeys.AUTH, 'authenticated')
  } catch (error) {
    console.error('Error saving auth status:', error)
  }
} 