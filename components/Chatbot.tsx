// /app/components/Chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AiOutlineClose, AiOutlineSend, AiOutlineShoppingCart } from 'react-icons/ai';
import axios from 'axios';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { lunchMenu, dinnerMenu } from '@/data/menuData';

interface Message {
  text: string;
  isUser: boolean;
  isAction?: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleHovered, setIsBubbleHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm SushiBot, your personal ordering assistant. \n\nI can help you:\n* Explore our menu\n* Get recommendations\n* Add items to your cart\n* Answer questions about dishes\n\nWhat would you like today?",
      isUser: false
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { user } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper function to find menu item by name
  const findMenuItem = (itemName: string) => {
    const allMenus = [...lunchMenu, ...dinnerMenu];
    const searchName = itemName.toLowerCase();

    // Exact match
    for (const category of allMenus) {
      const item = category.items.find(
        i => i.name.toLowerCase() === searchName
      );
      if (item) return item;
    }

    // Substring match (either direction)
    for (const category of allMenus) {
      const item = category.items.find(i => {
        const name = i.name.toLowerCase();
        return name.includes(searchName) || searchName.includes(name);
      });
      if (item) return item;
    }

    // Word-based fallback: find item whose name words all appear in the query
    const searchWords = searchName.split(/\s+/).filter(w => w.length > 1);
    let bestMatch: typeof allMenus[0]['items'][0] | null = null;
    let bestScore = 0;

    for (const category of allMenus) {
      for (const item of category.items) {
        const nameWords = item.name.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const matchCount = nameWords.filter(w => searchWords.includes(w)).length;
        const score = nameWords.length > 0 ? matchCount / nameWords.length : 0;
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          bestMatch = item;
        }
      }
    }

    return bestMatch;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);

    // Add to conversation history
    const newHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const res = await axios.post('/api/chat', {
        message: userMessage,
        conversationHistory
      });

      // Handle different action types
      if (res.data.action === 'add_to_cart') {
        const { itemName, quantity, specialNotes } = res.data.data;
        const menuItem = findMenuItem(itemName);

        if (menuItem) {
          // Add to cart using CartContext
          addItem(
            {
              name: menuItem.name,
              price: menuItem.price
            },
            quantity || 1,
            specialNotes || undefined
          );

          const confirmMessage = `Added ${quantity || 1}x ${menuItem.name} ($${menuItem.price.toFixed(2)}) to your cart!\n\n${specialNotes ? `Note: ${specialNotes}\n\n` : ''}Would you like to add anything else, or are you ready to checkout?`;

          setMessages(prev => [
            ...prev,
            { text: confirmMessage, isUser: false, isAction: true }
          ]);

          // Update conversation history
          setConversationHistory([
            ...newHistory,
            { role: 'assistant', content: confirmMessage }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              text: `I couldn't find "${itemName}" on our menu. Could you try describing what you're looking for?`,
              isUser: false
            }
          ]);
        }
      } else if (res.data.action === 'checkout') {
        const checkoutMessage = res.data.message;
        setMessages(prev => [
          ...prev,
          { text: checkoutMessage, isUser: false, isAction: true }
        ]);
        setConversationHistory([
          ...newHistory,
          { role: 'assistant', content: checkoutMessage }
        ]);
      } else if (res.data.action === 'view_cart') {
        const viewCartMessage = res.data.message;
        setMessages(prev => [
          ...prev,
          { text: viewCartMessage, isUser: false }
        ]);
        setConversationHistory([
          ...newHistory,
          { role: 'assistant', content: viewCartMessage }
        ]);
      } else {
        // Regular text response
        const botResponse = res.data.response;
        setMessages(prev => [...prev, { text: botResponse, isUser: false }]);

        // Update conversation history
        setConversationHistory([
          ...newHistory,
          { role: 'assistant', content: botResponse }
        ]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = 'Sorry, something went wrong! Please try again.';

      if (error.response?.data?.details) {
        errorMessage += `\n\nDetails: ${error.response.data.details}`;
      }

      setMessages(prev => [
        ...prev,
        { text: errorMessage, isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const quickActions = [
    'Show me popular items',
    'What\'s good for beginners?',
    'Vegetarian options',
    'What are your hours?',
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsBubbleHovered(true)}
          onMouseLeave={() => setIsBubbleHovered(false)}
          style={{
            background: 'linear-gradient(135deg, #fc3678 0%, #f1d00f 100%)',
            color: '#fff',
            padding: isBubbleHovered ? '16px 24px' : '14px',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            fontSize: isBubbleHovered ? '16px' : '20px',
            fontWeight: '600',
            boxShadow: isBubbleHovered
              ? '0 12px 32px rgba(252, 54, 120, 0.5), 0 0 30px rgba(241, 208, 15, 0.4)'
              : '0 6px 16px rgba(252, 54, 120, 0.3), 0 0 12px rgba(241, 208, 15, 0.2)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isBubbleHovered ? '8px' : '0px',
            transform: isBubbleHovered ? 'scale(1.05)' : 'scale(1)',
            width: isBubbleHovered ? 'auto' : '52px',
            height: isBubbleHovered ? 'auto' : '52px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🍣</span>
          <span
            style={{
              maxWidth: isBubbleHovered ? '200px' : '0px',
              opacity: isBubbleHovered ? 1 : 0,
              transition: 'max-width 0.3s ease, opacity 0.25s ease',
              overflow: 'hidden',
              display: 'inline-block',
              fontSize: '16px',
            }}
          >
            Chat with SushiBot
          </span>
        </button>
      ) : (
        <div style={{
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          width: '420px',
          height: '600px',
          borderRadius: '16px',
          border: '2px solid rgba(252, 54, 120, 0.3)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(241, 208, 15, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
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
            <div>
              <div style={{ fontWeight: '600', fontSize: '18px' }}>SushiBot</div>
              {user?.user_metadata?.name && (
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                  Hi, {user.user_metadata.name}!
                </div>
              )}
            </div>
            <AiOutlineClose
              style={{ cursor: 'pointer', fontSize: '20px' }}
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.isUser ? 'flex-end' : 'flex-start'
              }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    background: msg.isUser
                      ? 'rgba(252, 54, 120, 0.2)'
                      : msg.isAction
                      ? 'rgba(76, 175, 80, 0.2)'
                      : 'rgba(241, 208, 15, 0.15)',
                    border: msg.isUser
                      ? '1px solid rgba(252, 54, 120, 0.4)'
                      : msg.isAction
                      ? '1px solid rgba(76, 175, 80, 0.4)'
                      : '1px solid rgba(241, 208, 15, 0.3)',
                    color: msg.isUser ? '#fff' : msg.isAction ? '#4caf50' : '#f1d00f',
                    fontWeight: msg.isUser ? '500' : '400',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(241, 208, 15, 0.15)',
                  border: '1px solid rgba(241, 208, 15, 0.3)',
                  color: '#f1d00f',
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}>
                  SushiBot is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(241, 208, 15, 0.1)',
                    border: '1px solid rgba(241, 208, 15, 0.3)',
                    borderRadius: '16px',
                    color: '#f1d00f',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 208, 15, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 208, 15, 0.1)';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            gap: '8px'
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
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Ask about menu, order food..."
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              style={{
                background: isLoading ? '#666' : '#fc3678',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = '#e02766';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = '#fc3678';
                }
              }}
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
