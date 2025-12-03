# SushiBot - AI Restaurant Chatbot Setup Guide

## Overview

SushiBot is an intelligent AI-powered chatbot that helps customers:
- 🍱 Explore the restaurant menu with natural language
- 🤖 Get personalized recommendations based on preferences and order history
- 🛒 Add items to cart through conversation
- 📦 Place orders and checkout
- ℹ️ Get information about restaurant hours, delivery, and policies

## Features

### 1. **Menu Expert**
- Answer questions about dishes, ingredients, and preparation methods
- Search menu items by name or description
- Browse items by category (appetizers, sushi, rolls, etc.)
- Get information about specific dishes

**Example queries:**
- "What sushi rolls do you have?"
- "Show me vegetarian options"
- "Tell me about the Dragon Roll"
- "What's in the California Roll?"

### 2. **Personalized Recommendations**
SushiBot provides smart recommendations based on:
- **Beginner-friendly**: Great for first-time sushi eaters
- **Adventurous**: For those wanting to try unique items
- **Vegetarian**: Plant-based options
- **Spicy**: Heat lovers
- **Cooked items**: No raw fish
- **Value meals**: Best deals and combinations
- **Order history**: Personalized based on past orders (for logged-in users)

**Example queries:**
- "What's good for beginners?"
- "Recommend something spicy"
- "What are your most popular items?"
- "What did I order last time?" (requires login)

### 3. **Conversational Ordering**
Place orders naturally through conversation:

**Example conversation:**
```
User: I want to order some sushi
Bot: I'd be happy to help! What kind of sushi are you in the mood for?
User: Something with salmon
Bot: Great choice! We have several salmon options:
     - Salmon Sushi - $5.50
     - Salmon Sashimi - $12.95
     - Spicy Salmon Roll - $7.50
     Which would you like?
User: Add 2 orders of the Spicy Salmon Roll
Bot: ✅ Added 2x Spicy Salmon Roll ($7.50) to your cart!
     Would you like to add anything else?
```

### 4. **Order Management**
- Add items to cart with quantities and special notes
- View cart contents
- Guide to checkout process
- Process payments securely through Stripe

**Example queries:**
- "Add California Roll to my cart"
- "I'll take 3 Spicy Tuna Rolls, no cucumber"
- "What's in my cart?"
- "I'm ready to checkout"

### 5. **Restaurant Information**
Get details about:
- Operating hours
- Delivery information and fees
- Pickup options
- Contact information
- Policies (cancellation, refunds, allergies)

**Example queries:**
- "What are your hours?"
- "Do you deliver?"
- "What's the delivery fee?"
- "Where are you located?"

## Technical Architecture

### Components

#### 1. **API Endpoint** (`/pages/api/chat.ts`)
- OpenAI GPT-4o-mini integration
- Function calling for menu search and cart operations
- Session management for personalized experiences
- Conversation history tracking

#### 2. **Frontend Component** (`/components/Chatbot.tsx`)
- Floating chat interface
- Real-time conversation
- Cart integration
- Session-aware (shows user name when logged in)

#### 3. **Data Files**
- `/data/menuData.ts` - Complete menu with prices and descriptions
- `/data/restaurantInfo.ts` - Restaurant details, hours, policies, and popular items

### OpenAI Function Calling

The chatbot uses OpenAI's function calling feature to perform actions:

| Function | Purpose |
|----------|---------|
| `search_menu` | Search menu items by keyword |
| `get_category_items` | Get all items in a category |
| `get_popular_items` | Retrieve popular menu items |
| `get_recommendations` | Get recommendations by preference type |
| `add_to_cart` | Add items to user's cart |
| `get_restaurant_info` | Get restaurant information |
| `get_user_order_history` | Analyze past orders for recommendations |
| `view_cart` | View current cart contents |
| `guide_to_checkout` | Help user proceed to checkout |

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- OpenAI API account
- Existing restaurant website setup (Next.js, Stripe, etc.)

### Installation

1. **Set up OpenAI API Key**
   ```bash
   # Get your API key from https://platform.openai.com/api-keys
   # Add to .env file:
   OPENAI_API_KEY="sk-proj-your-key-here"
   ```

2. **Customize Restaurant Information**

   Edit `/data/restaurantInfo.ts` with your restaurant's details:
   ```typescript
   export const restaurantInfo: RestaurantInfo = {
     name: "Your Restaurant Name",
     phone: "(555) 123-4567",
     email: "info@yourrestaurant.com",
     address: {
       street: "123 Main Street",
       city: "Your City",
       state: "ST",
       zip: "12345"
     },
     hours: {
       monday: "11:00 AM - 9:00 PM",
       // ... customize your hours
     },
     // ... more settings
   };
   ```

3. **Customize Popular Items**

   Update the `popularItems` array in `/data/restaurantInfo.ts`:
   ```typescript
   export const popularItems = [
     {
       name: "Your Popular Item",
       category: "Category Name",
       reason: "Why it's popular"
     },
     // ... add more
   ];
   ```

4. **Install Dependencies** (if not already installed)
   ```bash
   npm install openai axios
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Test the Chatbot**
   - Open your website
   - Click the "Chat with SushiBot 🍣" button in the bottom right
   - Try asking questions or placing an order

## Configuration

### Adjust Chatbot Behavior

Edit `/pages/api/chat.ts` to customize:

**Temperature** (creativity level):
```typescript
temperature: 0.7, // 0.0 = precise, 1.0 = creative
```

**Max Tokens** (response length):
```typescript
max_tokens: 500, // Adjust for longer/shorter responses
```

**System Prompt** (personality):
Edit the `buildSystemPrompt()` function to change the chatbot's personality, tone, or instructions.

### Customize UI

Edit `/components/Chatbot.tsx` to customize:
- Colors and styling
- Chat window size
- Quick action buttons
- Welcome message

### Add More Quick Actions

```typescript
const quickActions = [
  'Show me popular items',
  'What\'s good for beginners?',
  'Vegetarian options',
  'What are your hours?',
  // Add your own quick actions here
];
```

## Cost Considerations

### OpenAI API Pricing (as of 2024)
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average conversation (10 messages): ~$0.01-0.02
- 1000 conversations: ~$10-20

**Cost optimization tips:**
1. Use `gpt-4o-mini` for most queries (already configured)
2. Limit conversation history (currently storing full history)
3. Set appropriate `max_tokens` limits
4. Cache menu data (already implemented)
5. Monitor usage in OpenAI dashboard

## Security Best Practices

✅ **Implemented:**
- API key stored in environment variables
- User authentication with NextAuth
- Server-side session validation
- Input sanitization

⚠️ **Additional recommendations:**
- Set up rate limiting to prevent abuse
- Monitor API usage and set spending limits
- Implement conversation logging for quality control
- Add content moderation for user inputs

## Troubleshooting

### "Failed to get response" Error
**Cause:** OpenAI API key missing or invalid
**Solution:**
```bash
# Check .env file
OPENAI_API_KEY="sk-proj-your-actual-key"

# Restart dev server
npm run dev
```

### Items Not Adding to Cart
**Cause:** Item name mismatch between menu and chatbot
**Solution:**
- Ensure item names in `/data/menuData.ts` are exact
- Check browser console for errors
- Verify CartContext is properly set up

### Chatbot Not Responding
**Cause:** API endpoint error
**Solution:**
```bash
# Check API logs in terminal
# Verify OpenAI API quota
# Test API endpoint directly: POST /api/chat
```

### Conversation History Not Working
**Cause:** Session or state management issue
**Solution:**
- Ensure user is logged in for personalized features
- Check browser localStorage
- Clear browser cache and reload

## Future Enhancements

Potential improvements:
- 🗣️ Voice input/output
- 📸 Image recognition for menu items
- 🌐 Multi-language support
- 📊 Analytics dashboard for chatbot performance
- 💬 Conversation persistence across sessions
- 🔔 Proactive notifications (order status updates)
- 🎁 Promotional offers and discounts
- 📱 Mobile app integration

## Support

For issues or questions:
1. Check this documentation
2. Review OpenAI API documentation: https://platform.openai.com/docs
3. Check Next.js documentation: https://nextjs.org/docs
4. Review the code comments in `/pages/api/chat.ts`

## API Response Format

### Regular Response
```json
{
  "response": "Bot message text here"
}
```

### Action Response (Cart Addition)
```json
{
  "action": "add_to_cart",
  "data": {
    "itemName": "California Roll",
    "quantity": 2,
    "specialNotes": "No cucumber"
  },
  "message": "Adding California Roll to your cart..."
}
```

### Action Response (Checkout)
```json
{
  "action": "checkout",
  "message": "Guide message to checkout..."
}
```

## Monitoring & Analytics

Track these metrics:
- Total conversations initiated
- Average conversation length
- Most asked questions
- Cart addition rate
- Order completion rate
- Popular menu items requested
- Common customer questions
- Response time

Consider integrating:
- Google Analytics events
- Custom analytics dashboard
- Error tracking (Sentry, LogRocket)
- A/B testing different prompts

---

**Version:** 1.0.0
**Last Updated:** December 2024
**License:** MIT
