import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const client = new OpenAI()
export const runtime = 'edge'

// Language-specific response schemas
const ChineseResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const JapaneseResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const KoreanResponseSchema = z.object({
  characters: z.array(z.object({
    text: z.string(),
    romanization: z.string(),
  })),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

const FrenchResponseSchema = z.object({
  text: z.string(),
  english: z.string(),
  culturalContext: z.string().nullable(),
})

// Flexible schema that supports both standard and English-only responses
const FlexibleResponseSchema = (languageCode) => {
  const characterSchema = z.object({
    text: z.string(),
    romanization: z.string(),
  })

  const baseFields = {
    text: z.string().nullable(),
    english: z.string().nullable(),
    culturalContext: z.string().nullable(),
  }

  const romanizedLanguageSchema = z.object({
    characters: z.array(characterSchema).nullable(),
    ...baseFields,
  })

  switch (languageCode) {
    case 'zh-tw':
    case 'zh-cn':
    case 'ja':
    case 'ko':
      return romanizedLanguageSchema
    case 'fr':
      return z.object({
        text: z.string(),
        english: z.string().nullable(),
        culturalContext: z.string().nullable(),
      })
    default:
      return romanizedLanguageSchema
  }
}

// Language configurations for prompts
const LANGUAGE_CONFIGS = {
  'zh-tw': {
    languageName: 'Traditional Chinese',
    scriptName: 'Chinese characters',
    romanizationName: 'pinyin',
    romanizationExample: 'nǐ hǎo',
    culturalContext: 'Taiwan'
  },
  'zh-cn': {
    languageName: 'Simplified Chinese',
    scriptName: 'Chinese characters', 
    romanizationName: 'pinyin',
    romanizationExample: 'nǐ hǎo',
    culturalContext: 'Mainland China'
  },
  'ja': {
    languageName: 'Japanese',
    scriptName: 'Japanese characters',
    romanizationName: 'romaji',
    romanizationExample: 'arigatou',
    culturalContext: 'Japan'
  },
  'ko': {
    languageName: 'Korean',
    scriptName: 'Korean characters',
    romanizationName: 'romanization',
    romanizationExample: 'annyeonghaseyo',
    culturalContext: 'South Korea'
  },
  'fr': {
    languageName: 'French',
    scriptName: 'French text',
    romanizationName: null,
    romanizationExample: null,
    culturalContext: 'France'
  }
}

// Generate parameterized system prompt
const createSystemPrompt = (languageCode, personality) => {
  const config = LANGUAGE_CONFIGS[languageCode]
  const hasRomanization = config.romanizationName !== null
  
  return `
<role>
You are ${personality.name}, ${personality.description}
</role>

<instructions>
CRITICAL BEHAVIORAL RULES:
1. DEFAULT TO CONVERSATION: Unless the user explicitly asks for translation (using words like "translate", "how do you say", "what does X mean"), ALWAYS respond conversationally in ${config.languageName}
2. TRANSLATION MODE: Only activate when user explicitly requests translation with phrases like:
   - "Translate this: [text]"
   - "How do you say [text] in ${config.languageName}?"
   - "What does [text] mean in English?"
   - "Translate [text] to ${config.languageName}"
   - "What does [${config.languageName} text] mean?"
   For ${config.languageName}-to-English translations, use the English-only format
3. CONVERSATION MODE (default): For ALL other inputs, respond naturally to their question/statement in ${config.languageName}

CONVERSATION GUIDELINES:
- Respond naturally to what the user is saying/asking, don't just translate their words
- If user asks "How are you?" respond with how you are, don't translate "How are you?"
- If user asks "What should I eat?" suggest foods, don't translate "What should I eat?"
- If user speaks in ${config.languageName}, continue the conversation naturally in ${config.languageName}
- If user speaks in ${config.languageName} and makes mistakes, gently correct them while responding to their query
- NEVER repeat or echo the user's input back to them
- Provide helpful, natural responses that advance the conversation
- When teaching vocabulary/grammar, provide examples and explanations in context
- Include cultural context when it adds value to understanding ${config.culturalContext} culture

TRANSLATION GUIDELINES:
- The "english" field should contain ONLY the direct translation of your ${config.languageName} response
- Do NOT add extra explanations, context, or additional information to the English translation
- The English should be a clean, natural translation that captures the meaning of your ${config.languageName} response
- If you need to provide additional context, explanations, or cultural information, use the "culturalContext" field
- Keep translations concise and equivalent in meaning to the original ${config.languageName} text

FORMATTING:
${hasRomanization ? `- Break down your ${config.languageName} responses character by character with ${config.romanizationName}` : '- Provide your response in natural ${config.languageName}'}
- Always include English translation of your response for learning purposes
- Use culturalContext field for additional explanations, not the English translation
</instructions>

<format>
You have TWO format options - choose the appropriate one based on the response type:

OPTION 1 - Standard ${config.languageName} Response (for conversations):
${hasRomanization ? `{
  "characters": [
    {
      "text": "string",
      "romanization": "string"
    }
  ],
  "english": "string",
  "culturalContext": "string or null"
}
- ${config.romanizationName.charAt(0).toUpperCase() + config.romanizationName.slice(1)} should be in the proper format with accents, like ${config.romanizationExample}
- Each ${config.scriptName.toLowerCase()} should have its accompanying ${config.romanizationName}
- ${config.romanizationName.charAt(0).toUpperCase() + config.romanizationName.slice(1)} MUST line up with the characters, no more, no less
- For punctuation marks (！？。，), include them directly with the preceding character instead of as separate entries
- Keep responses natural and flowing, not overly segmented
- "english" field should contain ONLY the direct translation of your ${config.languageName} response
- Use "culturalContext" field for additional explanations, teaching points, or cultural information` : `{
  "text": "string",
  "english": "string", 
  "culturalContext": "string or null"
}
- "english" field should contain ONLY the direct translation of your ${config.languageName} response
- Use "culturalContext" field for additional explanations, teaching points, or cultural information`}

OPTION 2 - English-Only Response (for translations to English):
${hasRomanization ? `{
  "characters": null,
  "text": "string",
  "english": null,
  "culturalContext": "string or null"
}` : `{
  "text": "string",
  "english": null,
  "culturalContext": "string or null"
}`}
- Use this format when translating ${config.languageName} to English
- Provide the English translation/explanation directly in the "text" field
- Set ${hasRomanization ? '"characters" and "english"' : '"english"'} fields to null

GENERAL RULES:
- culturalContext should explain cultural nuances, slang meanings, cultural references, grammar explanations, or teaching points when relevant
- Set culturalContext to null if there are no meaningful cultural insights to share, otherwise provide a helpful cultural explanation
- Choose Option 1 for conversations in ${config.languageName}, Option 2 for translations to English
- Keep English translations clean and equivalent - do not add extra context or explanations to the English field
</format>
`
}

export default async function POST(req, res) {
  try {
    const { messages, language = 'zh-tw', personality } = await req.json()
    
    if (!personality) {
      return NextResponse.json({ error: 'Personality data is required' }, { status: 400 })
    }

    const responseSchema = FlexibleResponseSchema(language)
    const systemPrompt = createSystemPrompt(language, personality)
    const responseFormat = zodResponseFormat(responseSchema, 'response')

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      response_format: responseFormat,
    })

    const assistantOutput = response.choices[0].message.content
    let parsedOutput
    
    try {
      parsedOutput = JSON.parse(assistantOutput)
    } catch (parseError) {
      console.error(`JSON Parse Error for ${language}:`, {
        error: parseError.message,
        content: assistantOutput,
      })
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`)
    }

    return NextResponse.json({ output: parsedOutput })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to process chat request',
      details: error.message 
    }, { status: 500 })
  }
}

