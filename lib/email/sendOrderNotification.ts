import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Order } from '../db';

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function sendOrderNotificationToRestaurant(order: Order) {
  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.itemName} x${item.quantity} - $${(Number(item.itemPrice) * item.quantity).toFixed(2)}${
          item.specialNotes ? `\n  Note: ${item.specialNotes}` : ''
        }`
    )
    .join('\n');

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
    return result;
  } catch (error: any) {
    // Handle AWS SES errors
    if (error.name === 'MessageRejected') {
      console.warn(
        `Could not send restaurant notification email: Email address not verified in AWS SES. ` +
        `This is normal in development/sandbox mode. Order was still created successfully.`
      );
    } else {
      console.error('Error sending restaurant notification email:', error.message || error);
    }
    // Don't throw error - order creation should succeed even if email fails
    return null;
  }
}

export async function sendOrderConfirmationToCustomer(order: Order) {
  if (!order.customerEmail) {
    console.log('No customer email provided, skipping confirmation email');
    return;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.itemName} x${item.quantity} - $${(Number(item.itemPrice) * item.quantity).toFixed(2)}`
    )
    .join('\n');

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
    console.log('Confirmation email sent successfully:', result.MessageId);
    return result;
  } catch (error: any) {
    // Handle AWS SES errors gracefully
    if (error.name === 'MessageRejected') {
      // Email address not verified in SES (common in sandbox mode)
      console.warn(
        `Could not send confirmation email to ${order.customerEmail}: Email address not verified in AWS SES. ` +
        `This is normal in development/sandbox mode. Order was still created successfully.`
      );
    } else {
      // Other email errors
      console.error('Error sending confirmation email:', error.message || error);
    }
    // Don't throw error - order creation should succeed even if email fails
    return null;
  }
}
