import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { lunchMenu, dinnerMenu, MenuItemData, MenuCategory } from '@/data/menuData';
import { restaurantInfo, popularItems, menuSuggestions } from '@/data/restaurantInfo';
import { db } from '@/lib/db';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to search menu items
function searchMenuItems(query: string): MenuItemData[] {
  const searchTerm = query.toLowerCase();
  const allMenus = [...lunchMenu, ...dinnerMenu];
  const results: MenuItemData[] = [];

  allMenus.forEach(category => {
    category.items.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemDesc = item.description?.toLowerCase() || '';

      if (itemName.includes(searchTerm) || itemDesc.includes(searchTerm)) {
        results.push(item);
      }
    });
  });

  // Remove duplicates
  return results.filter((item, index, self) =>
    index === self.findIndex(t => t.name === item.name)
  );
}

// Helper function to get items by category
function getItemsByCategory(categoryName: string): MenuItemData[] {
  const allMenus = [...lunchMenu, ...dinnerMenu];
  const category = allMenus.find(cat =>
    cat.category.toLowerCase().includes(categoryName.toLowerCase())
  );

  return category ? category.items : [];
}

// Helper function to get popular items
function getPopularItems(): any[] {
  return popularItems;
}

// Helper function to get recommendations based on preferences
function getRecommendations(preference: string): string[] {
  const key = preference.toLowerCase() as keyof typeof menuSuggestions;
  return menuSuggestions[key] || menuSuggestions.beginner;
}

// Helper function to get recent orders for a user
async function getRecentOrders(userId: string) {
  try {
    const orders = await db.findOrdersByUserId(userId);
    // Sort by createdAt desc and take first 5
    return orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}

// Define function schemas for OpenAI function calling
const functions = [
  {
    name: 'search_menu',
    description: 'Search for menu items by name or description. Use this when the user asks about specific dishes or ingredients.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search term to find menu items (e.g., "salmon", "spicy roll", "vegetarian")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_category_items',
    description: 'Get all items in a specific menu category',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The category name (e.g., "appetizers", "sushi", "rolls", "sashimi")',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_popular_items',
    description: 'Get a list of the most popular menu items among customers',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get menu recommendations based on user preferences',
    parameters: {
      type: 'object',
      properties: {
        preference: {
          type: 'string',
          enum: ['beginner', 'adventurous', 'vegetarian', 'spicy', 'cooked', 'valueMeal'],
          description: 'The type of recommendation to provide',
        },
      },
      required: ['preference'],
    },
  },
  {
    name: 'add_to_cart',
    description: 'Add an item to the user\'s cart. Use this when the user wants to order or add something to their cart.',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'The exact name of the menu item to add',
        },
        quantity: {
          type: 'number',
          description: 'The quantity to add (default: 1)',
        },
        specialNotes: {
          type: 'string',
          description: 'Any special instructions or notes for this item',
        },
      },
      required: ['itemName'],
    },
  },
  {
    name: 'get_restaurant_info',
    description: 'Get information about the restaurant (hours, location, contact, policies)',
    parameters: {
      type: 'object',
      properties: {
        infoType: {
          type: 'string',
          enum: ['hours', 'contact', 'delivery', 'pickup', 'policies', 'all'],
          description: 'The type of information to retrieve',
        },
      },
      required: ['infoType'],
    },
  },
  {
    name: 'get_user_order_history',
    description: 'Get the user\'s recent order history to provide personalized recommendations',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'view_cart',
    description: 'View the current contents of the user\'s cart',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'guide_to_checkout',
    description: 'Guide the user to proceed to checkout with their current cart',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

// Build the system prompt with full context
function buildSystemPrompt(userName?: string): string {
  const menuContext = `
MENU KNOWLEDGE:
You have access to our complete menu with ${lunchMenu.length + dinnerMenu.length} categories:

LUNCH MENU: ${lunchMenu.map(cat => cat.category).join(', ')}
DINNER MENU: ${dinnerMenu.map(cat => cat.category).join(', ')}

Total items available: ${[...lunchMenu, ...dinnerMenu].reduce((sum, cat) => sum + cat.items.length, 0)}+
`;

  const restaurantContext = `
RESTAURANT INFORMATION:
- Name: ${restaurantInfo.name}
- Phone: ${restaurantInfo.phone}
- Email: ${restaurantInfo.email}
- Address: ${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.zip}

HOURS:
${Object.entries(restaurantInfo.hours).map(([day, hours]) => `- ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`).join('\n')}

DELIVERY: ${restaurantInfo.deliveryInfo.available ? `Available - $${restaurantInfo.deliveryInfo.deliveryFee} fee, $${restaurantInfo.deliveryInfo.minimumOrder} minimum, ${restaurantInfo.deliveryInfo.estimatedTime}` : 'Not available'}
PICKUP: ${restaurantInfo.pickupInfo.available ? `Available - ${restaurantInfo.pickupInfo.estimatedTime}` : 'Not available'}
`;

  const greeting = userName ? `The user's name is ${userName}.` : '';

  return `You are SushiBot, an expert AI ordering assistant for ${restaurantInfo.name}. ${greeting}

${menuContext}

${restaurantContext}

YOUR CAPABILITIES:
1. **Menu Expert**: Answer questions about any dish, ingredients, preparation methods, and Japanese cuisine
2. **Ordering Assistant**: Help users add items to their cart and place orders
3. **Personal Shopper**: Provide recommendations based on preferences, dietary restrictions, mood, and order history
4. **Restaurant Guide**: Answer questions about hours, location, delivery, and policies
5. **Order History Analyst**: For logged-in users, analyze past orders to provide personalized recommendations

ORDERING WORKFLOW:
1. When users want to order, use the search_menu or get_category_items functions to find items
2. Confirm the item and price with the user
3. Use add_to_cart function to add items to their cart
4. When users want to see their cart, use view_cart function
5. When ready to checkout, use guide_to_checkout to help them complete the order
6. For returning users, use get_user_order_history to provide personalized recommendations

IMPORTANT GUIDELINES:
- Always verify item names exactly match menu items before adding to cart
- Mention prices when recommending items
- Ask about dietary restrictions or preferences proactively
- If an item isn't found, suggest similar alternatives
- Be conversational and friendly, but efficient
- When users ask about their cart or want to checkout, let them know they can view their cart at any time by clicking the cart icon
- Don't make assumptions about quantities unless specified

CONVERSATION STYLE:
- Warm, friendly, and professional
- Use food-related enthusiasm naturally
- Keep responses concise but informative
- Ask clarifying questions when needed
- Use emojis sparingly and naturally

Remember: Your goal is to make ordering easy and enjoyable while helping customers discover great food!`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user session if available
    const session = await getServerSession(req, res, authOptions);
    const userName = session?.user?.name || undefined;
    const userId = session?.user?.id;

    // Build messages array with system prompt and conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: buildSystemPrompt(userName),
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // Make initial API call with function calling enabled
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    });

    let assistantMessage = response.choices[0].message;

    // Handle function calls
    while (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      let functionResult: any;

      switch (functionName) {
        case 'search_menu':
          functionResult = searchMenuItems(functionArgs.query);
          break;

        case 'get_category_items':
          functionResult = getItemsByCategory(functionArgs.category);
          break;

        case 'get_popular_items':
          functionResult = getPopularItems();
          break;

        case 'get_recommendations':
          functionResult = getRecommendations(functionArgs.preference);
          break;

        case 'add_to_cart':
          // Return cart action to be handled by the client
          return res.status(200).json({
            action: 'add_to_cart',
            data: {
              itemName: functionArgs.itemName,
              quantity: functionArgs.quantity || 1,
              specialNotes: functionArgs.specialNotes || '',
            },
            message: assistantMessage.content || `Adding ${functionArgs.itemName} to your cart...`,
          });

        case 'get_restaurant_info':
          const { infoType } = functionArgs;
          if (infoType === 'all') {
            functionResult = restaurantInfo;
          } else if (infoType === 'hours') {
            functionResult = restaurantInfo.hours;
          } else if (infoType === 'contact') {
            functionResult = {
              phone: restaurantInfo.phone,
              email: restaurantInfo.email,
              address: restaurantInfo.address,
            };
          } else if (infoType === 'delivery') {
            functionResult = restaurantInfo.deliveryInfo;
          } else if (infoType === 'pickup') {
            functionResult = restaurantInfo.pickupInfo;
          } else if (infoType === 'policies') {
            functionResult = restaurantInfo.policies;
          }
          break;

        case 'get_user_order_history':
          if (userId) {
            const recentOrders = await getRecentOrders(userId);
            // Extract frequently ordered items
            const itemFrequency: { [key: string]: number } = {};
            recentOrders.forEach(order => {
              order.items.forEach((item: any) => {
                itemFrequency[item.itemName] = (itemFrequency[item.itemName] || 0) + item.quantity;
              });
            });
            functionResult = {
              totalOrders: recentOrders.length,
              recentOrders: recentOrders.slice(0, 3).map(order => ({
                date: order.createdAt,
                items: order.items.map((item: any) => item.itemName),
                total: order.total
              })),
              frequentItems: Object.entries(itemFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => ({ name, orderCount: count }))
            };
          } else {
            functionResult = { message: 'User not logged in. Unable to retrieve order history.' };
          }
          break;

        case 'view_cart':
          // Return action to fetch cart from client
          return res.status(200).json({
            action: 'view_cart',
            message: assistantMessage.content || 'Let me check your cart...',
          });

        case 'guide_to_checkout':
          return res.status(200).json({
            action: 'checkout',
            message: 'Ready to complete your order! Click the cart icon at the top right, review your items, and proceed to checkout. You\'ll be able to add delivery details and complete payment securely.',
          });

        default:
          functionResult = { error: 'Unknown function' };
      }

      // Add function call and result to messages
      messages.push(assistantMessage);
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        functions,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = response.choices[0].message;
    }

    // Return the final response
    res.status(200).json({
      response: assistantMessage.content,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Failed to get response',
      details: error.message
    });
  }
}
