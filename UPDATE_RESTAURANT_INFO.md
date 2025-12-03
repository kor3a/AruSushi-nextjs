# How to Update Your Restaurant Information

The chatbot reads restaurant information from `/data/restaurantInfo.ts`. Follow these steps to update it with your actual details:

## Step 1: Open the Restaurant Info File

Open `/data/restaurantInfo.ts` in your editor.

## Step 2: Update Operating Hours

Find the `hours` section and replace with your actual hours:

```typescript
hours: {
  monday: "11:00 AM - 9:00 PM",      // ← Change these
  tuesday: "11:00 AM - 9:00 PM",
  wednesday: "11:00 AM - 9:00 PM",
  thursday: "11:00 AM - 9:00 PM",
  friday: "11:00 AM - 10:00 PM",
  saturday: "12:00 PM - 10:00 PM",
  sunday: "12:00 PM - 9:00 PM"
},
```

**Example:**
```typescript
hours: {
  monday: "Closed",
  tuesday: "11:30 AM - 9:30 PM",
  wednesday: "11:30 AM - 9:30 PM",
  thursday: "11:30 AM - 9:30 PM",
  friday: "11:30 AM - 10:00 PM",
  saturday: "12:00 PM - 10:00 PM",
  sunday: "12:00 PM - 9:00 PM"
},
```

## Step 3: Update Contact Information

```typescript
phone: "(555) 123-4567",           // ← Your actual phone
email: "info@arusushi.com",        // ← Your actual email
address: {
  street: "123 Main Street",        // ← Your actual address
  city: "Your City",
  state: "ST",
  zip: "12345"
},
```

## Step 4: Update Delivery Information

```typescript
deliveryInfo: {
  available: true,                  // true or false
  minimumOrder: 15,                 // $ minimum for delivery
  deliveryFee: 5,                   // $ delivery fee
  estimatedTime: "45-60 minutes",   // your typical delivery time
  deliveryRadius: "5 miles"         // your delivery radius
},
```

## Step 5: Update Pickup Information

```typescript
pickupInfo: {
  available: true,                  // true or false
  estimatedTime: "20-30 minutes"    // your typical pickup time
},
```

## Step 6: Update Special Hours (Optional)

For holidays or special dates:

```typescript
specialHours: [
  {
    date: "2025-12-25",
    hours: "Closed",
    note: "Christmas Day"
  },
  {
    date: "2025-01-01",
    hours: "2:00 PM - 9:00 PM",
    note: "New Year's Day"
  }
],
```

## Step 7: Update Popular Items

Update the `popularItems` array with your actual popular dishes:

```typescript
export const popularItems = [
  {
    name: "California Roll",         // ← Must match exact name from menuData.ts
    category: "Basic Rolls",
    reason: "Customer favorite, great for sushi beginners"
  },
  // Add more...
];
```

**IMPORTANT:** The `name` field must **exactly match** the item name in your menu (`/data/menuData.ts`).

## Step 8: Restart Your Development Server

After making changes:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Changes will be reflected immediately in the chatbot.

## Testing Your Changes

Ask the chatbot:
- "What are your operating hours?"
- "What's your phone number?"
- "Do you deliver?"
- "What are your most popular items?"

The chatbot should now respond with your actual information!

## Troubleshooting

### Chatbot still gives wrong hours
1. Make sure you saved `/data/restaurantInfo.ts`
2. Restart the development server
3. Clear your browser cache
4. Try asking in different ways:
   - "When are you open?"
   - "What time do you close on Friday?"
   - "Are you open on Monday?"

### Chatbot can't find menu items
Make sure the item names in `popularItems` exactly match the names in `/data/menuData.ts` (case-sensitive).

### Changes not appearing
1. Check for TypeScript errors: `npm run build`
2. Ensure the file syntax is correct (commas, quotes, etc.)
3. Restart the development server

## Quick Reference: File Locations

- Restaurant info: `/data/restaurantInfo.ts`
- Menu items: `/data/menuData.ts`
- Chatbot API: `/pages/api/chat.ts`
- Chatbot UI: `/components/Chatbot.tsx`

---

**Need Help?** Check the main documentation in `CHATBOT_SETUP.md`
