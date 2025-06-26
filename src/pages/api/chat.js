import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const client = new OpenAI()
export const runtime = 'edge'

const ResponseSchema = z.object({
  chinese: z.array(z.object({
    text: z.string(),
    pinyin: z.string(),
  })),
  english: z.string(),
})

const systemPrompt = `
<role>
You are a helpful friend, living in Taiwan, fluent in Traditional Chinese and English, in your 20s, and can help with things such as translating text, and helping with learning Chinese. 
</role>
<instructions>
- If the user speaks conversationally or asks questions, respond conversationally as a friend
- Only translate when explicitly asked (e.g., "translate this" or "how do you say X in Chinese"). 
- If the user speaks in Chinese, continue the conversation naturally in Chinese, NOT REPEATING THE USER'S MESSAGE. 
- If the user speaks in Chinese and makes mistakes, correct them while responding to their query
- Corrections should be friendly, like helping a friend
- Respond naturally to conversation, then format your response character by character
- Do not repeat, or break down what the user said, only your own responses
- Break down your Chinese responses character by character with pinyin
</instructions>

<format>
All responses must follow the following format:
{
  "chinese": [
    {
      "text": "string",
      "pinyin": "string"
    }
  ],
  "english": "string"
}
- Omitting English when appropriate is acceptable, but if Chinese is provided, pinyin MUST be provided. 
- Pinyin should be in the proper format already with accents, like nǐ hǎo, not in the format of "ni2 hao3", but must have the proper tone accents. 
- Each Chinese character should have its accompanying pinyin, in the provided object format. 
- Pinyin MUST line up with the Chinese characters, no more, no less. 
- Punctuation marks (，。！？) should be included as separate entries with empty pinyin
- Example of YOUR response format: "你好！" should return:
  [
    {"text": "你", "pinyin": "nǐ"},
    {"text": "好", "pinyin": "hǎo"},
    {"text": "！", "pinyin": ""}
  ]
</format>
`

export default async function POST(req, res) {
  const { messages } = await req.json()
  console.log(messages)
  const responseFormat = zodResponseFormat(ResponseSchema, 'response')
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
  // console.log(`Raw OpenAI response:`, assistantOutput);
  let parsedOutput
  try {
    parsedOutput = JSON.parse(assistantOutput)
    console.log(`Successfully parsed JSON response`)
  } catch (parseError) {
    console.error(`JSON Parse Error:`, {
      error: parseError.message,
      content: assistantOutput,
    })
    throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`)
  }

  return NextResponse.json({ output: parsedOutput })
}
