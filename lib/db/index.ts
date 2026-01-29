import { PrismaClient, Prisma } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Type exports for use in other files
export type User = Prisma.UserGetPayload<object>;
export type Order = Prisma.OrderGetPayload<{ include: { items: true } }>;
export type OrderItem = Prisma.OrderItemGetPayload<object>;

// Helper types for creating records
export type CreateUserInput = Prisma.UserCreateInput;
export type CreateOrderInput = {
  userId: string;
  items: {
    itemName: string;
    itemPrice: number;
    quantity: number;
    specialNotes?: string;
  }[];
  total: number;
  status?: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

// Database operations class for backward compatibility
class Database {
  // User operations
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(userData: { id: string; email: string; name?: string | null }) {
    return prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      },
    });
  }

  async updateUser(id: string, updates: Partial<{ name: string; phone: string; address: string }>) {
    return prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async upsertUser(userData: { id: string; email: string; name?: string | null }) {
    return prisma.user.upsert({
      where: { id: userData.id },
      update: { email: userData.email, name: userData.name },
      create: { id: userData.id, email: userData.email, name: userData.name },
    });
  }

  // Order operations
  async createOrder(orderData: CreateOrderInput) {
    return prisma.order.create({
      data: {
        userId: orderData.userId,
        total: new Prisma.Decimal(orderData.total),
        status: orderData.status || 'pending',
        paymentIntentId: orderData.paymentIntentId,
        paymentStatus: orderData.paymentStatus || 'pending',
        deliveryAddress: orderData.deliveryAddress,
        deliveryPhone: orderData.deliveryPhone,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        notes: orderData.notes,
        items: {
          create: orderData.items.map((item) => ({
            itemName: item.itemName,
            itemPrice: new Prisma.Decimal(item.itemPrice),
            quantity: item.quantity,
            specialNotes: item.specialNotes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findOrdersByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllOrders() {
    return prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrder(id: string, updates: Partial<{ status: string; paymentStatus: string }>) {
    return prisma.order.update({
      where: { id },
      data: updates,
      include: { items: true },
    });
  }
}

export const db = new Database();
