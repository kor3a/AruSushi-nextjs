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
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #fc3678 0%, #f1d00f 100%)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(252, 54, 120, 0.4), 0 0 20px rgba(241, 208, 15, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(252, 54, 120, 0.5), 0 0 30px rgba(241, 208, 15, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(252, 54, 120, 0.4), 0 0 20px rgba(241, 208, 15, 0.3)';
          }}
        >
          Chat with SushiBot 🍣
        </button>
      ) : (
        <div style={{
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          width: '380px',
          height: '500px',
          borderRadius: '16px',
          border: '2px solid rgba(252, 54, 120, 0.3)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(241, 208, 15, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fc3678 0%, #f1d00f 100%)',
            color: '#fff',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '14px 14px 0 0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            <span style={{ fontWeight: '600', fontSize: '18px' }}>SushiBot 🍣</span>
            <AiOutlineClose
              style={{ cursor: 'pointer', fontSize: '20px' }}
              onClick={() => setIsOpen(false)}
            />
          </div>
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '12px', textAlign: msg.isUser ? 'right' : 'left' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    wordWrap: 'break-word',
                    background: msg.isUser
                      ? 'rgba(252, 54, 120, 0.2)'
                      : 'rgba(241, 208, 15, 0.15)',
                    border: msg.isUser
                      ? '1px solid rgba(252, 54, 120, 0.4)'
                      : '1px solid rgba(241, 208, 15, 0.3)',
                    color: msg.isUser ? '#fff' : '#f1d00f',
                    fontWeight: msg.isUser ? '500' : '400',
                    fontSize: '14px'
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && (
              <div style={{ textAlign: 'center', color: '#f1d00f', fontSize: '14px', fontStyle: 'italic' }}>
                SushiBot is thinking...
              </div>
            )}
          </div>
          <div style={{
            padding: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px 0 0 8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Ask about sushi..."
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              style={{
                background: isLoading ? '#666' : '#fc3678',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '0 8px 8px 0',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
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