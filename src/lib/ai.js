import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

export async function matchReceiptToStatement(receipt, statement) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a financial reconciliation assistant. Compare the receipt data with the credit card statement and determine if they match."
      },
      {
        role: "user",
        content: `Receipt: ${JSON.stringify(receipt)}\nStatement: ${JSON.stringify(statement)}`
      }
    ]
  })
  
  return response.choices[0].message.content
}
