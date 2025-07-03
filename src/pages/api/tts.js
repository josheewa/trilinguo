import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI()
export const runtime = 'edge'

// Map language codes to appropriate OpenAI TTS voices
const VOICE_MAP = {
  'zh-tw': 'alloy',    // Good for Chinese
  'zh-cn': 'nova',     // Alternative for mainland Chinese
  'ja': 'shimmer',     // Good for Japanese
  'ko': 'alloy',       // Good for Korean
  'fr': 'nova',        // Good for French
}

// Extract text content from message for TTS
const extractTextForTTS = (messageContent, language) => {
  if (!messageContent) return ''
  
  // For languages with characters array (Chinese, Japanese, Korean)
  if (messageContent.characters && Array.isArray(messageContent.characters)) {
    return messageContent.characters.map(char => char.text).join('')
  }
  
  // For text-based languages (French) or fallback
  if (messageContent.text) {
    return messageContent.text
  }
  
  return ''
}

export default async function POST(req) {
  try {
    const { messageContent, language = 'zh-tw' } = await req.json()
    
    if (!messageContent) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const textToSpeak = extractTextForTTS(messageContent, language)
    
    if (!textToSpeak.trim()) {
      return NextResponse.json({ error: 'No text content found to synthesize' }, { status: 400 })
    }

    const voice = VOICE_MAP[language] || 'alloy'

    // Generate speech using OpenAI TTS
    const mp3Response = await client.audio.speech.create({
      model: 'tts-1', // Use tts-1 for speed (streaming), tts-1-hd for quality
      voice: voice,
      input: textToSpeak,
      response_format: 'mp3',
    })

    // Convert the response to a buffer
    const audioBuffer = await mp3Response.arrayBuffer()
    
    // Return audio as blob with proper headers for caching
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('TTS API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate speech',
      details: error.message 
    }, { status: 500 })
  }
}