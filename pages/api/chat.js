import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: "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",
// });

// const response = openai.responses.create({
//   model: "gpt-4o-mini",
//   input: "write a haiku about ai",
//   store: true,
// });

// response.then((result) => console.log(result.output_text));

// /pages/api/chat.js

const openai = new OpenAI({
  apiKey: "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",
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are SushiBot, an expert AI assistant for ARU Sushi website. You know everything about sushi: types (e.g., nigiri, maki, sashimi), ingredients, preparation, history, nutrition, and Japanese cuisine. Reference the website's menu (e.g., recommend rolls from menu.tsx), contact info (from contact.tsx), and general tips like pairings or allergies. Be friendly, helpful, and engaging. Keep responses concise and fun, ending with a question to continue the chat if appropriate. If asked about non-sushi topics, politely redirect to sushi-related info.`,
          },
          { role: 'user', content: message },
        ],
      });

      const botResponse = completion.choices[0].message.content;
      res.status(200).json({ response: botResponse });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to get response' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}