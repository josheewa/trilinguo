import OpenAI from 'openai'
import { getAuth } from '@clerk/nextjs/server'

const client = new OpenAI()

/**
 * POST /api/predict
 * Auth required. Generates autocomplete suggestions for the current input.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ suggestions: [] })
    }

    // Check authentication
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ suggestions: [] })
    }

    const { input, language = 'zh-tw', context = [], count = 3 } = req.body || {}

    if (!input || input.length < 2 || input.length > 80) {
      return res.status(200).json({ suggestions: [] })
    }

    if (/[.!?。！？]$/.test(input.trim())) {
      return res.status(200).json({ suggestions: [] })
    }

    const LANGUAGES = {
      'zh-tw': 'Traditional Chinese',
      'zh-cn': 'Simplified Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
    }

    const languageName = LANGUAGES[language] || 'the target language'

    const contextString =
      context.length > 0
        ? `This is the recent conversation history for context:
${context
  .slice(-2)
  .map(
    (msg) =>
      `${msg.role}: ${
        typeof msg.content === 'string'
          ? msg.content
          : msg.content?.text || JSON.stringify(msg.content) || ''
      }`,
  )
  .join('\n')}`
        : 'There is no previous conversation history.'

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI autocomplete assistant for a language learning app.
The user is learning ${languageName} and needs help completing their sentence.
Your task is to provide natural, realistic, and useful sentence completions.

${contextString}

IMPORTANT LANGUAGE HANDLING:
- If the user's input is in ${languageName}, provide completions in ${languageName}
- If the user's input is in English (or another language), provide helpful mixed-language suggestions that:
  1. Continue in the input language but transition to ${languageName} (e.g., "Hello" → "Hello, 你好吗？")
  2. Help learners transition to the target language naturally

SPECIAL HANDLING FOR TRANSLATION REQUESTS:
- For "How do I say" patterns, intelligently detect the language of the word/phrase being asked about:
  * "How do I say hello" → suggest English words/phrases to complete: "How do I say hello to my teacher", "How do I say hello in formal situations"
  * "How do I say 你好" → suggest ${languageName} words/phrases: "How do I say 你好 formally", "How do I say 你好 to children"
  * "How do I say 谢谢 in Chinese" → this is illogical (already Chinese), suggest: "How do I say 谢谢 in English", "How do I say 谢谢 politely"
- Prioritize logical translation directions and avoid suggesting illogical combinations

Rules:
1. Provide up to ${count} likely, complete, and natural-sounding continuations of the user's input text.
2. Return a JSON object with a "suggestions" key containing an array of strings, like: {"suggestions": ["completion one", "completion two"]}.
3. **Each completion you provide MUST start with the user's exact input text.** For example, if the input is "I want to", your output could be {"suggestions": ["I want to go to the park", "I want to eat pizza"]}.
4. For cross-language scenarios, help learners make logical language transitions.
5. Keep completions concise and practical for a language learner.
6. For translation requests, be smart about language detection and suggest logical completions.
7. If no good continuations are possible, return an object with an empty array: {"suggestions": []}.
8. The output must be ONLY the JSON object. Do not add any other text or explanation.`,
        },
        {
          role: 'user',
          content: `Here is my current text, please complete it: "${input}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const assistantOutput = response.choices[0].message.content
    
    try {
      const parsed = JSON.parse(assistantOutput)
      const suggestions = parsed.suggestions || []

      if (Array.isArray(suggestions)) {
        const filteredSuggestions = suggestions
          .slice(0, count)
          .filter(
            (s) =>
              s &&
              typeof s === 'string' &&
              s.length > 0 &&
              s.length < 100 &&
              s.toLowerCase().startsWith(input.toLowerCase()) &&
              s.toLowerCase() !== input.toLowerCase(),
          )
          .map((s) => s.trim())
        
        const uniqueSuggestions = [...new Set(filteredSuggestions)]
        
        return res.status(200).json({ suggestions: uniqueSuggestions })
      }
    } catch (parseError) {
      console.error('Predict API JSON parse error:', parseError, 'Raw output:', assistantOutput)
      return res.status(200).json({ suggestions: [] })
    }

    return res.status(200).json({ suggestions: [] })
  } catch (error) {
    console.error('Predict API Error:', error)
    return res.status(200).json({ suggestions: [] })
  }
} 