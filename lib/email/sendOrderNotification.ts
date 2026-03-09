import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Order } from '../db';

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSandboxError?: boolean;
}

function formatOrderItemsList(order: Order, includeNotes = false): string {
  return order.items
    .map(
      (item) =>
        `- ${item.itemName} x${item.quantity} - $${(Number(item.itemPrice) * item.quantity).toFixed(2)}${
          includeNotes && item.specialNotes ? `\n  Note: ${item.specialNotes}` : ''
        }`
    )
    .join('\n');
}

export async function sendOrderNotificationToRestaurant(order: Order): Promise<EmailResult> {
  const itemsList = formatOrderItemsList(order, true);

  const emailBody = `
New Order Received - Order #${order.id}

Customer Information:
- Name: ${order.customerName || 'N/A'}
- Email: ${order.customerEmail || 'N/A'}
- Phone: ${order.deliveryPhone || 'N/A'}
- Delivery Address: ${order.deliveryAddress || 'Pickup'}

Order Details:
${itemsList}

Total: $${Number(order.total).toFixed(2)}

Payment Status: ${order.paymentStatus}
${order.notes ? `\nSpecial Instructions: ${order.notes}` : ''}

Order Time: ${new Date(order.createdAt).toLocaleString()}

Please prepare this order as soon as possible.
  `.trim();

  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL || 'orders@arusushi.com',
    Destination: {
      ToAddresses: [process.env.AWS_SES_TO_EMAIL || 'restaurant@arusushi.com'],
    },
    Message: {
      Subject: {
        Data: `New Order #${order.id} - $${Number(order.total).toFixed(2)}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: emailBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await ses.send(command);
    console.log('Restaurant notification email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    if (error.name === 'MessageRejected') {
      console.warn(
        `Could not send restaurant notification email: Email address not verified in AWS SES. ` +
        `This is normal in development/sandbox mode. Order was still created successfully.`
      );
      return { success: false, error: error.message, isSandboxError: true };
    }
    console.error('Error sending restaurant notification email:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function sendOrderConfirmationToCustomer(order: Order): Promise<EmailResult> {
  if (!order.customerEmail) {
    console.log('No customer email provided, skipping confirmation email');
    return { success: false, error: 'No customer email provided' };
  }

  const itemsList = formatOrderItemsList(order);

  const emailBody = `
Thank you for your order!

Order Confirmation #${order.id}

Your order has been received and is being prepared.

Order Details:
${itemsList}

Total: $${Number(order.total).toFixed(2)}

${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}` : 'Pickup Order'}

We'll notify you when your order is ready!

Thank you for choosing A-Ru Sushi!
  `.trim();

  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL || 'orders@arusushi.com',
    Destination: {
      ToAddresses: [order.customerEmail],
    },
    Message: {
      Subject: {
        Data: `Order Confirmation #${order.id} - A-Ru Sushi`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: emailBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await ses.send(command);
    console.log('Customer confirmation email sent to', order.customerEmail, ':', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    if (error.name === 'MessageRejected') {
      console.error(
        `[SES SANDBOX] Cannot send confirmation to ${order.customerEmail}. ` +
        `Your AWS SES account is in sandbox mode, which only allows sending to verified email addresses. ` +
        `To fix: request production access in the AWS SES console, or verify this email address.`
      );
      return { success: false, error: error.message, isSandboxError: true };
    }
    console.error('Error sending customer confirmation email:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Sends the customer's order confirmation to the store email as a fallback
 * when SES cannot deliver directly to the customer (e.g. sandbox mode).
 * The store can then forward this to the customer manually.
 */
export async function sendCustomerConfirmationFallbackToStore(order: Order): Promise<EmailResult> {
  const storeEmail = process.env.AWS_SES_TO_EMAIL;
  if (!storeEmail) {
    return { success: false, error: 'No store email configured (AWS_SES_TO_EMAIL)' };
  }

  const itemsList = formatOrderItemsList(order);

  const emailBody = `
⚠️ CUSTOMER EMAIL DELIVERY FAILED — PLEASE FORWARD TO CUSTOMER

The order confirmation email could not be delivered to the customer.
This is likely because AWS SES is in sandbox mode.
To fix permanently, request SES production access in the AWS console.

Please forward the confirmation below to: ${order.customerEmail}

---

Thank you for your order!

Order Confirmation #${order.id}

Your order has been received and is being prepared.

Order Details:
${itemsList}

Total: $${Number(order.total).toFixed(2)}

${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}` : 'Pickup Order'}

We'll notify you when your order is ready!

Thank you for choosing A-Ru Sushi!
  `.trim();

  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL || 'orders@arusushi.com',
    Destination: {
      ToAddresses: [storeEmail],
    },
    Message: {
      Subject: {
        Data: `⚠️ Forward to Customer: Order #${order.id} Confirmation (${order.customerEmail})`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: emailBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await ses.send(command);
    console.log('Customer confirmation fallback sent to store:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('Error sending customer confirmation fallback to store:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
