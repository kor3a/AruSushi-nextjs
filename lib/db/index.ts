import { PrismaClient, Prisma } from '@prisma/client';
import type { RewardType } from '../rewards/types';

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

export interface UserPointsSummary {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}

export interface RewardRedemptionRecord {
  id: string;
  rewardType: RewardType;
  rewardLabel: string;
  pointsCost: number;
  status: 'available' | 'used' | 'cancelled';
  claimedAt: Date;
  usedAt: Date | null;
  orderId: string | null;
}

type UserPointsRow = {
  points_balance: number;
  lifetime_points_earned: number;
  lifetime_points_redeemed: number;
};

type RewardRedemptionRow = {
  id: string;
  reward_type: string;
  reward_label: string;
  points_cost: number;
  status: string;
  claimed_at: Date;
  used_at: Date | null;
  order_id: string | null;
};

export function isRewardsSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const prismaError = error as {
    code?: string;
    message?: string;
    meta?: { message?: string };
  };

  if (prismaError.code !== 'P2010') {
    return false;
  }

  const fullMessage = `${prismaError.message || ''} ${prismaError.meta?.message || ''}`.toLowerCase();
  return (
    fullMessage.includes('relation "user_points" does not exist') ||
    fullMessage.includes('relation "reward_redemptions" does not exist')
  );
}

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
  orderType?: string; // 'pickup' or 'delivery'
  status?: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryFee?: number;
  doordashDeliveryId?: string;
  doordashDeliveryStatus?: string;
  doordashTrackingUrl?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

// Database operations class for backward compatibility
class Database {
  private mapPointsRow(row?: UserPointsRow): UserPointsSummary {
    return {
      pointsBalance: Number(row?.points_balance ?? 0),
      lifetimePointsEarned: Number(row?.lifetime_points_earned ?? 0),
      lifetimePointsRedeemed: Number(row?.lifetime_points_redeemed ?? 0),
    };
  }

  private mapRewardRedemptionRow(row: RewardRedemptionRow): RewardRedemptionRecord {
    return {
      id: row.id,
      rewardType: row.reward_type as RewardType,
      rewardLabel: row.reward_label,
      pointsCost: Number(row.points_cost),
      status: row.status as RewardRedemptionRecord['status'],
      claimedAt: row.claimed_at,
      usedAt: row.used_at,
      orderId: row.order_id,
    };
  }

  // User operations
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(userData: { id: string; email: string; name?: string | null }) {
    const createdUser = await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      },
    });

    try {
      await this.ensureUserPointsAccount(createdUser.id);
    } catch (error) {
      if (!isRewardsSchemaMissingError(error)) {
        throw error;
      }
      console.warn('Rewards schema not ready while creating user profile.');
    }

    return createdUser;
  }

  async updateUser(id: string, updates: Partial<{ name: string; phone: string; address: string }>) {
    return prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async upsertUser(userData: { id: string; email: string; name?: string | null }) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: { email: userData.email, name: userData.name },
      create: { id: userData.id, email: userData.email, name: userData.name },
    });

    try {
      await this.ensureUserPointsAccount(user.id);
    } catch (error) {
      if (!isRewardsSchemaMissingError(error)) {
        throw error;
      }
      console.warn('Rewards schema not ready while upserting user profile.');
    }

    return user;
  }

  async ensureUserPointsAccount(userId: string) {
    await prisma.$executeRaw`
      INSERT INTO user_points (user_id)
      VALUES (${userId}::uuid)
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  async getUserPointsSummary(userId: string): Promise<UserPointsSummary> {
    await this.ensureUserPointsAccount(userId);

    const rows = await prisma.$queryRaw<UserPointsRow[]>`
      SELECT points_balance, lifetime_points_earned, lifetime_points_redeemed
      FROM user_points
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;

    return this.mapPointsRow(rows[0]);
  }

  async addPointsToUser(userId: string, pointsToAdd: number): Promise<UserPointsSummary> {
    if (pointsToAdd <= 0) {
      return this.getUserPointsSummary(userId);
    }

    await this.ensureUserPointsAccount(userId);
    const rows = await prisma.$queryRaw<UserPointsRow[]>`
      UPDATE user_points
      SET
        points_balance = points_balance + ${pointsToAdd},
        lifetime_points_earned = lifetime_points_earned + ${pointsToAdd},
        updated_at = NOW()
      WHERE user_id = ${userId}::uuid
      RETURNING points_balance, lifetime_points_earned, lifetime_points_redeemed
    `;

    return this.mapPointsRow(rows[0]);
  }

  async getAvailableRewardRedemptions(userId: string): Promise<RewardRedemptionRecord[]> {
    const rows = await prisma.$queryRaw<RewardRedemptionRow[]>`
      SELECT
        id,
        reward_type,
        reward_label,
        points_cost,
        status,
        claimed_at,
        used_at,
        order_id
      FROM reward_redemptions
      WHERE user_id = ${userId}::uuid AND status = 'available'
      ORDER BY claimed_at ASC
    `;

    return rows.map((row) => this.mapRewardRedemptionRow(row));
  }

  async getRewardRedemptionById(
    userId: string,
    redemptionId: string
  ): Promise<RewardRedemptionRecord | null> {
    const rows = await prisma.$queryRaw<RewardRedemptionRow[]>`
      SELECT
        id,
        reward_type,
        reward_label,
        points_cost,
        status,
        claimed_at,
        used_at,
        order_id
      FROM reward_redemptions
      WHERE id = ${redemptionId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      return null;
    }

    return this.mapRewardRedemptionRow(rows[0]);
  }

  async markRewardRedemptionUsed(
    userId: string,
    redemptionId: string,
    orderId: string
  ): Promise<RewardRedemptionRecord | null> {
    const rows = await prisma.$queryRaw<RewardRedemptionRow[]>`
      UPDATE reward_redemptions
      SET status = 'used', used_at = NOW(), order_id = ${orderId}::uuid, updated_at = NOW()
      WHERE id = ${redemptionId}::uuid AND user_id = ${userId}::uuid AND status = 'available'
      RETURNING
        id,
        reward_type,
        reward_label,
        points_cost,
        status,
        claimed_at,
        used_at,
        order_id
    `;

    if (!rows.length) {
      return null;
    }

    return this.mapRewardRedemptionRow(rows[0]);
  }

  async claimReward(
    userId: string,
    rewardType: RewardType,
    rewardLabel: string,
    pointsCost: number
  ): Promise<{ pointsSummary: UserPointsSummary; redemption: RewardRedemptionRecord }> {
    if (pointsCost <= 0) {
      throw new Error('INVALID_POINTS_COST');
    }

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO user_points (user_id)
        VALUES (${userId}::uuid)
        ON CONFLICT (user_id) DO NOTHING
      `;

      const updatedPointsRows = await tx.$queryRaw<UserPointsRow[]>`
        UPDATE user_points
        SET
          points_balance = points_balance - ${pointsCost},
          lifetime_points_redeemed = lifetime_points_redeemed + ${pointsCost},
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid AND points_balance >= ${pointsCost}
        RETURNING points_balance, lifetime_points_earned, lifetime_points_redeemed
      `;

      if (!updatedPointsRows.length) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      const redemptionRows = await tx.$queryRaw<RewardRedemptionRow[]>`
        INSERT INTO reward_redemptions (
          user_id,
          reward_type,
          reward_label,
          points_cost,
          status
        )
        VALUES (
          ${userId}::uuid,
          ${rewardType},
          ${rewardLabel},
          ${pointsCost},
          'available'
        )
        RETURNING
          id,
          reward_type,
          reward_label,
          points_cost,
          status,
          claimed_at,
          used_at,
          order_id
      `;

      return {
        pointsSummary: this.mapPointsRow(updatedPointsRows[0]),
        redemption: this.mapRewardRedemptionRow(redemptionRows[0]),
      };
    });
  }

  // Order operations
  async createOrder(orderData: CreateOrderInput) {
    return prisma.order.create({
      data: {
        userId: orderData.userId,
        total: new Prisma.Decimal(orderData.total),
        orderType: orderData.orderType || 'pickup',
        status: orderData.status || 'pending',
        paymentIntentId: orderData.paymentIntentId,
        paymentStatus: orderData.paymentStatus || 'pending',
        deliveryAddress: orderData.deliveryAddress,
        deliveryPhone: orderData.deliveryPhone,
        deliveryFee: orderData.deliveryFee ? new Prisma.Decimal(orderData.deliveryFee) : undefined,
        doordashDeliveryId: orderData.doordashDeliveryId,
        doordashDeliveryStatus: orderData.doordashDeliveryStatus,
        doordashTrackingUrl: orderData.doordashTrackingUrl,
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

  async findAllOrdersByDateRange(startDate?: Date, endDate?: Date) {
    return prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrder(id: string, updates: Partial<{ status: string; paymentStatus: string; doordashDeliveryId: string; doordashDeliveryStatus: string }>) {
    return prisma.order.update({
      where: { id },
      data: updates,
      include: { items: true },
    });
  }
}

export const db = new Database();
