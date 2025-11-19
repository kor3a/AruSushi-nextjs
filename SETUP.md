# A-Ru Sushi Restaurant Ordering System - Setup Guide

This guide will help you set up and configure your restaurant's online ordering system.

## Features

✅ **User Authentication**
- Customer sign-up and sign-in
- Secure password hashing with bcrypt
- Session management with NextAuth.js

✅ **Menu & Shopping Cart**
- Browse restaurant menu with categories
- Add items to cart with special instructions
- Update quantities and manage cart items
- Persistent cart (saved in browser)

✅ **Secure Checkout**
- Stripe payment processing
- Customer delivery information
- Order notes and special instructions

✅ **Order Management**
- Orders saved to database
- Email notifications to restaurant
- Confirmation emails to customers
- Order history for customers

✅ **Email Notifications**
- AWS SES integration for email delivery
- Automatic notifications to restaurant staff
- Customer order confirmations

## Prerequisites

Before you begin, you need to create accounts and obtain API keys from:

1. **Stripe** (for payment processing) - https://stripe.com
2. **AWS** (for email notifications) - https://aws.amazon.com

## Installation

The dependencies have already been installed. If you need to reinstall them:

```bash
npm install
```

## Configuration

### 1. Environment Variables

Edit the `.env` file in the root directory with your actual credentials:

```env
# Database (already configured - uses local file storage)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Get from Stripe Dashboard
STRIPE_SECRET_KEY="sk_test_..."                    # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET="whsec_..."                  # Get after setting up webhook

# AWS SES Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_SES_FROM_EMAIL="orders@arusushi.com"           # Verified sender email
AWS_SES_TO_EMAIL="restaurant@arusushi.com"         # Restaurant's email
```

### 2. Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `NEXTAUTH_SECRET` value in `.env`.

### 3. Stripe Setup

#### a. Get API Keys

1. Go to https://dashboard.stripe.com/register
2. Create an account or sign in
3. Go to Developers > API keys
4. Copy your **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Copy your **Secret key** → `STRIPE_SECRET_KEY`

#### b. Test Mode vs Live Mode

- Start with **Test Mode** (keys start with `pk_test_` and `sk_test_`)
- Use test card: `4242 4242 4242 4242` with any future date and CVC
- Switch to **Live Mode** when ready for real payments

### 4. AWS SES Setup (Email Notifications)

#### a. Create AWS Account

1. Go to https://aws.amazon.com
2. Create an account (requires credit card, but SES has free tier)

#### b. Verify Email Addresses

In AWS SES Console:

1. Go to **Verified identities**
2. Click **Create identity**
3. Verify the email address you'll send FROM (`AWS_SES_FROM_EMAIL`)
4. Verify the restaurant email that will receive orders (`AWS_SES_TO_EMAIL`)
5. Check your email and click the verification link

#### c. Get Access Keys

1. Go to IAM (Identity and Access Management)
2. Create a new user with **SES sending permissions**
3. Create access keys for this user
4. Copy **Access Key ID** → `AWS_ACCESS_KEY_ID`
5. Copy **Secret Access Key** → `AWS_SECRET_ACCESS_KEY`

#### d. Request Production Access (Optional)

- Initially, SES is in "Sandbox mode" (can only send to verified emails)
- To send to any customer email, request production access:
  1. Go to SES Console
  2. Click "Request production access"
  3. Fill out the form explaining your use case

## Running the Application

### Development Mode

```bash
npm run dev
```

Visit http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## Testing the Ordering System

### 1. Create a Test Customer Account

1. Go to http://localhost:3000/auth/signup
2. Create an account with a test email
3. Sign in

### 2. Place a Test Order

1. Go to Menu page
2. Click "Add to Cart" on menu items
3. View cart and proceed to checkout
4. Fill in delivery information
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. Complete payment

### 3. Check Order Confirmation

- You should see an order confirmation page
- Check the restaurant email for order notification
- Check the customer email for confirmation

## Database

The system uses a JSON-based file database stored in the `/data` directory:
- `data/users.json` - Customer accounts
- `data/orders.json` - All orders

### Viewing Orders

All orders are stored in `/data/orders.json`. You can:
- View raw data by opening this file
- Access via customer "My Orders" page
- Build an admin dashboard (future enhancement)

### Backup

Regularly backup the `/data` directory to prevent data loss.

## Customization

### Menu Items

Edit `/data/menuData.ts` to:
- Add/remove menu items
- Update prices
- Change categories
- Add descriptions

### Email Templates

Edit `/lib/email/sendOrderNotification.ts` to customize:
- Email subject lines
- Email content and formatting
- Add HTML templates (currently uses plain text)

### Styling

- The site uses Tailwind CSS for styling
- Custom styles are in `/public/style/style.css`
- Component-specific styles are inline in the components

## Deployment

### Recommended Platforms

1. **Vercel** (easiest, made by Next.js creators)
   - Connect your GitHub repository
   - Set environment variables in Vercel dashboard
   - Automatic deployments on push

2. **Netlify**
   - Similar to Vercel
   - Connect GitHub and configure

### Environment Variables in Production

Make sure to set all environment variables in your hosting platform:
- Change `NEXTAUTH_URL` to your production domain
- Use Stripe **Live** keys (not test keys)
- Ensure AWS SES is in production mode

### Database Considerations

The current JSON-based database works for development and small scale. For production with higher traffic, consider migrating to:
- **PostgreSQL** with Prisma
- **MongoDB** with Mongoose
- **Supabase** (includes database + auth)

## Security Checklist

Before going live:

- [ ] Change `NEXTAUTH_SECRET` to a strong random value
- [ ] Use Stripe Live keys (not test keys)
- [ ] Set up Stripe webhooks for production
- [ ] Enable AWS SES production access
- [ ] Set secure environment variables on hosting platform
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Regular backups of `/data` directory
- [ ] Consider adding rate limiting
- [ ] Add proper error logging

## Troubleshooting

### Emails Not Sending

- Check AWS SES verified identities
- Ensure SES is in correct region (`AWS_REGION`)
- Check AWS access key permissions
- If in sandbox mode, verify recipient email addresses

### Payments Not Working

- Verify Stripe API keys are correct
- Check Stripe dashboard for error messages
- Ensure you're using test card in test mode
- Check browser console for errors

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

## Support

For issues or questions:
- Check the `/docs` folder for additional documentation
- Review error logs in the browser console
- Check the terminal for server-side errors

## Next Steps

Consider adding these features:
- Admin dashboard to view/manage all orders
- Real-time order status updates
- SMS notifications via Twilio
- Delivery time scheduling
- Loyalty/rewards program
- Restaurant operating hours check
- Minimum order amount validation

---

**Congratulations!** Your restaurant ordering system is ready to use. Start by testing with the instructions above, then go live when you're comfortable.
