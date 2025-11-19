// /app/components/Chatbot.tsx
import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineSend } from 'react-icons/ai';
import axios from 'axios';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: 'Hi! I\'m SushiBot, your sushi expert. Ask me about our menu, sushi types, or tips!', isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isUser: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: input });
      setMessages((prev) => [...prev, { text: res.data.response, isUser: false }]);
    } catch (error) {
      setMessages((prev) => [...prev, { text: 'Sorry, something went wrong!', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
        >
          Chat with SushiBot 🍣
        </button>
      ) : (
        <div className="bg-white w-80 h-96 rounded-lg shadow-xl flex flex-col">
          <div className="bg-blue-500 text-white p-2 flex justify-between items-center rounded-t-lg">
            <span>SushiBot</span>
            <AiOutlineClose className="cursor-pointer" onClick={() => setIsOpen(false)} />
          </div>
          <div className="flex-1 p-2 overflow-y-auto bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.isUser ? 'bg-blue-100 text-black font-medium' : 'bg-green-100 text-gray-800 font-normal'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="text-center text-gray-500 text-sm">SushiBot is thinking...</div>
            )}
          </div>
          <div className="p-2 border-t flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask about sushi..."
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white p-2 rounded-r-lg disabled:bg-gray-400"
              disabled={isLoading}
            >
              <AiOutlineSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;