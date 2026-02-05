# DoorDash Drive API Setup Guide

This guide explains how to obtain DoorDash API credentials for delivery integration.

## Step 1: Register with DoorDash Developer Portal

1. Go to [DoorDash Developer Portal](https://developer.doordash.com/)
2. Sign up for a developer account or log in if you already have one
3. Complete the registration process

## Step 2: Create an Application

1. Navigate to the **Applications** section in the developer portal
2. Click **Create Application** or **New Application**
3. Fill in the application details:
   - Application Name: Your restaurant name (e.g., "A-Ru Sushi")
   - Description: Brief description of your use case

## Step 3: Get Your Access Key

After creating your application, you'll receive an **Access Key** that contains three parts:

- **Developer ID** (`developer_id`): Your unique developer identifier
- **Key ID** (`key_id`): Used for JWT authentication
- **Signing Secret** (`signing_secret`): Used to sign JWT tokens

The access key looks like this (JSON format):
```json
{
  "developer_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "key_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "signing_secret": "base64encodedstring=="
}
```

## Step 4: How Authentication Works

DoorDash uses **JWT (JSON Web Token)** authentication. Our integration automatically generates JWTs for each API request using your credentials:

1. Each request generates a new JWT signed with your `signing_secret`
2. The JWT includes your `developer_id` and `key_id`
3. Tokens expire after 5 minutes (generated fresh for each request)

**You don't need to manually generate tokens** - our code handles this automatically!

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# DoorDash Drive API Credentials (from your Access Key)
DOORDASH_DEVELOPER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
DOORDASH_KEY_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
DOORDASH_SIGNING_SECRET="base64encodedstring=="
DOORDASH_API_URL="https://openapi.doordash.com"
DOORDASH_SANDBOX="true"  # Set to "false" for production
```

## Step 6: Test Your Integration

1. Make sure all credentials are set in your `.env` file
2. Restart your development server
3. Go to checkout and select "Delivery"
4. Enter a delivery address and click "Get Delivery Quote"
5. Check the DoorDash Developer Portal dashboard for delivery requests

## Important Notes

- **Sandbox vs Production**: Use `DOORDASH_SANDBOX="true"` for testing. Set to `"false"` for production.
- **JWT Tokens**: Tokens are generated automatically for each request and expire after 5 minutes.
- **API Limits**: Check DoorDash's rate limits in their documentation.
- **Webhooks**: Consider setting up webhooks to receive delivery status updates.

## Troubleshooting

### "DoorDash credentials not configured" error
- Verify all three environment variables are set correctly:
  - `DOORDASH_DEVELOPER_ID`
  - `DOORDASH_KEY_ID`
  - `DOORDASH_SIGNING_SECRET`
- Check that `.env` file is loaded properly
- Restart your development server after adding credentials

### "Failed to get DoorDash delivery quote" error
- Verify your credentials are correct (copy them exactly from the access key)
- Make sure the `signing_secret` is the base64-encoded string (don't decode it)
- Check that you're using the correct API endpoint (sandbox vs production)
- Verify the delivery address is valid and within DoorDash service area

### "Failed to generate DoorDash JWT" error
- Ensure your Signing Secret is correct and base64-encoded
- Check that all three credentials are set

### JWT Authentication errors (401/403)
- Double-check your `developer_id`, `key_id`, and `signing_secret`
- Make sure you copied the values exactly (no extra spaces)
- Verify your application is active in the DoorDash Developer Portal

## How the Delivery Flow Works

1. **Customer selects delivery** at checkout
2. **Customer enters address** and phone number
3. **Get Quote**: System calls DoorDash API to get delivery fee and time estimate
4. **Customer reviews** the delivery fee and estimated time
5. **Customer pays**: System accepts the quote, DoorDash dispatches a Dasher
6. **Delivery tracking**: Customer can track their delivery via DoorDash

## Additional Resources

- [DoorDash Developer Documentation](https://developer.doordash.com/)
- [DoorDash Drive API Reference](https://developer.doordash.com/en-US/api/drive)
- [JWT Authentication Guide](https://developer.doordash.com/en-US/docs/drive/how_to/JWTs)

## Support

If you encounter issues:
1. Check DoorDash Developer Portal for API status
2. Review DoorDash API documentation
3. Contact DoorDash Developer Support through the portal
