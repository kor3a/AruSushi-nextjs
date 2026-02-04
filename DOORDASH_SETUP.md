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
   - Redirect URI: Your callback URL (if using OAuth flow)

## Step 3: Get Your Credentials

After creating your application, you'll receive:

- **Developer ID**: Your unique developer identifier
- **Key ID (Client ID)**: Used for OAuth authentication
- **Signing Secret (Client Secret)**: Used for OAuth authentication

## Step 4: Obtain Access Token

DoorDash Drive API uses OAuth 2.0 authentication. You have two options:

### Option A: Pre-generated Access Token (Testing/Development)

1. In the DoorDash Developer Portal, go to your application settings
2. Look for **Access Tokens** or **API Keys** section
3. Generate a test/sandbox access token
4. Copy the token and add it to your `.env` file as `DOORDASH_ACCESS_TOKEN`

### Option B: OAuth 2.0 Flow (Production)

For production, you should implement the OAuth 2.0 flow:

1. **Authorization Code Flow**:
   - Redirect user to DoorDash authorization URL
   - User authorizes your application
   - Receive authorization code
   - Exchange code for access token
   - Refresh token when it expires

2. **Client Credentials Flow** (if supported):
   - Use your Client ID and Client Secret
   - Exchange for access token via token endpoint
   - Refresh as needed

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# DoorDash Drive API Credentials
DOORDASH_DEVELOPER_ID="your_developer_id_from_portal"
DOORDASH_KEY_ID="your_key_id_from_portal"
DOORDASH_SIGNING_SECRET="your_signing_secret_from_portal"
DOORDASH_ACCESS_TOKEN="your_access_token_here"
DOORDASH_API_URL="https://openapi.doordash.com"
DOORDASH_SANDBOX="true"  # Set to "false" for production
```

## Step 6: Test Your Integration

1. Make sure all credentials are set in your `.env` file
2. Test creating a delivery order through your checkout page
3. Check the DoorDash Developer Portal dashboard for delivery requests

## Important Notes

- **Sandbox vs Production**: Use `DOORDASH_SANDBOX="true"` for testing. Set to `"false"` for production.
- **Token Expiration**: Access tokens expire. For production, implement token refresh logic.
- **API Limits**: Check DoorDash's rate limits in their documentation.
- **Webhooks**: Consider setting up webhooks to receive delivery status updates.

## Troubleshooting

### "DoorDash credentials not configured" error
- Verify all environment variables are set correctly
- Check that `.env` file is loaded properly
- Restart your development server after adding credentials

### "Failed to create DoorDash delivery" error
- Verify your access token is valid and not expired
- Check that you're using the correct API endpoint (sandbox vs production)
- Review DoorDash API documentation for required fields

### Authentication errors
- Ensure your Developer ID, Key ID, and Signing Secret are correct
- Verify your access token is valid
- Check if you need to implement OAuth 2.0 token generation

## Additional Resources

- [DoorDash Developer Documentation](https://developer.doordash.com/)
- [DoorDash Drive API Reference](https://developer.doordash.com/en-US/api/drive)
- [OAuth 2.0 Guide](https://developer.doordash.com/en-US/docs/guides/oauth)

## Support

If you encounter issues:
1. Check DoorDash Developer Portal for API status
2. Review DoorDash API documentation
3. Contact DoorDash Developer Support through the portal
