const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askGroq(prompt, maxTokens = 2048, temperature = 0.3) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous analyst. You only state facts you can directly verify from the text given to you. You never assume something is missing without explicitly checking the full text first. Generic, templated feedback that does not reference the actual provided content is considered a failure.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature,
    max_tokens: maxTokens,
  });
  return completion.choices[0].message.content;
}

module.exports = { askGroq };
