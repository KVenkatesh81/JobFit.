const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askGroq(prompt, maxTokens = 2048) {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0].message.content;
}

module.exports = { askGroq };
