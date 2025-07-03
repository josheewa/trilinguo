import { useState, useRef, useCallback, useEffect } from 'react'

// Global audio cache to persist across component re-renders
const audioCache = new Map()
const audioRefs = new Map()

export const useAudioCache = () => {
  const [loadingStates, setLoadingStates] = useState(new Map())
  const [playingStates, setPlayingStates] = useState(new Map())
  
  // Generate cache key from message content
  const generateCacheKey = useCallback((messageContent, language) => {
    if (!messageContent) return null
    
    let text = ''
    if (messageContent.characters && Array.isArray(messageContent.characters)) {
      text = messageContent.characters.map(char => char.text).join('')
    } else if (messageContent.text) {
      text = messageContent.text
    }
    
    return `${language}-${text.slice(0, 100)}` // Use first 100 chars as key
  }, [])

  // Set loading state for a specific message
  const setLoading = useCallback((messageId, isLoading) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev)
      if (isLoading) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Set playing state for a specific message
  const setPlaying = useCallback((messageId, isPlaying) => {
    setPlayingStates(prev => {
      const newStates = new Map(prev)
      if (isPlaying) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Generate and cache audio for a message
  const generateAudio = useCallback(async (messageContent, language, messageId) => {
    const cacheKey = generateCacheKey(messageContent, language)
    if (!cacheKey) return { success: false, error: 'Invalid message content' }

    // Return cached audio if available
    if (audioCache.has(cacheKey)) {
      return { success: true, audioUrl: audioCache.get(cacheKey) }
    }

    setLoading(messageId, true)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageContent,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Please wait a moment before trying again')
        } else if (response.status === 503) {
          throw new Error('Audio service temporarily unavailable')
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again')
        } else {
          throw new Error(errorData.details || errorData.error || `Error: ${response.status}`)
        }
      }

      const audioBlob = await response.blob()
      
      // Validate audio blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data received')
      }
      
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Cache the audio URL
      audioCache.set(cacheKey, audioUrl)
      
      return { success: true, audioUrl }
    } catch (error) {
      console.error('Error generating audio:', error)
      return { success: false, error: error.message || 'Failed to generate audio' }
    } finally {
      setLoading(messageId, false)
    }
  }, [generateCacheKey, setLoading])

  // State for error messages
  const [errorStates, setErrorStates] = useState(new Map())

  // Set error state for a specific message
  const setError = useCallback((messageId, errorMessage) => {
    setErrorStates(prev => {
      const newStates = new Map(prev)
      if (errorMessage) {
        newStates.set(messageId, errorMessage)
        // Clear error after 5 seconds
        setTimeout(() => {
          setErrorStates(current => {
            const updated = new Map(current)
            updated.delete(messageId)
            return updated
          })
        }, 5000)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Play audio for a message
  const playAudio = useCallback(async (messageContent, language, messageId) => {
    // Clear any existing error
    setError(messageId, null)
    
    // Stop any currently playing audio
    audioRefs.forEach((audio, id) => {
      if (id !== messageId && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
        setPlaying(id, false)
      }
    })

    const cacheKey = generateCacheKey(messageContent, language)
    let audioUrl = audioCache.get(cacheKey)
    
    // Generate audio if not cached
    if (!audioUrl) {
      const result = await generateAudio(messageContent, language, messageId)
      if (!result.success) {
        setError(messageId, result.error)
        return
      }
      audioUrl = result.audioUrl
    }

    if (!audioUrl) {
      setError(messageId, 'No audio available')
      return
    }

    // Create or get audio element
    let audio = audioRefs.get(messageId)
    if (!audio) {
      audio = new Audio(audioUrl)
      audioRefs.set(messageId, audio)
      
      // Setup event listeners
      audio.addEventListener('ended', () => {
        setPlaying(messageId, false)
      })
      
      audio.addEventListener('error', (event) => {
        console.error('Audio playback error:', event)
        setPlaying(messageId, false)
        setError(messageId, 'Audio playback failed')
      })
    }

    // Play audio
    try {
      setPlaying(messageId, true)
      await audio.play()
    } catch (error) {
      console.error('Audio play error:', error)
      setPlaying(messageId, false)
      setError(messageId, 'Could not play audio')
    }
  }, [generateAudio, generateCacheKey, setPlaying, setError])

  // Stop audio for a message
  const stopAudio = useCallback((messageId) => {
    const audio = audioRefs.get(messageId)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPlaying(messageId, false)
  }, [setPlaying])

  // Get loading state for a message
  const isLoading = useCallback((messageId) => {
    return loadingStates.has(messageId)
  }, [loadingStates])

  // Get playing state for a message
  const isPlaying = useCallback((messageId) => {
    return playingStates.has(messageId)
  }, [playingStates])

  // Get error state for a message
  const getError = useCallback((messageId) => {
    return errorStates.get(messageId) || null
  }, [errorStates])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop all audio
    audioRefs.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    audioRefs.clear()
    
    // Clear states
    setLoadingStates(new Map())
    setPlayingStates(new Map())
    setErrorStates(new Map())
    
    // Note: We keep audioCache for performance, but could clear it here if needed
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    getError,
    cleanup,
  }
}