import { PrismaClient, Prisma } from '@prisma/client';
import type { RewardType } from '../rewards/types';
import type { MemberRank } from '../ranks/types';
import { getNextRank, getUpgradeCost, getDiscountPercent, RANK_TIERS } from '../ranks/config';

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

export interface StoreSettings {
  ordersPaused: boolean;
  pauseReason: string | null;
  pausedAt: Date | null;
  resumeAt: Date | null;
  pausedByEmail: string | null;
}

type StoreSettingsRow = {
  orders_paused: boolean;
  pause_reason: string | null;
  paused_at: Date | null;
  resume_at: Date | null;
  paused_by_email: string | null;
};

export function isStoreSettingsMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; meta?: { message?: string } };
  if (e.code !== 'P2010') return false;
  const msg = `${e.message || ''} ${e.meta?.message || ''}`.toLowerCase();
  return msg.includes('relation "store_settings" does not exist');
}

export interface MemberRankRecord {
  rank: MemberRank;
  rankStartedAt: Date;
  rankExpiresAt: Date;
  freeAppetizerClaimed: boolean;
  freeRollClaimed: boolean;
  lastMonthlyAppetizerAt: Date | null;
}

type MemberRankRow = {
  rank: string;
  rank_started_at: Date;
  rank_expires_at: Date;
  free_appetizer_claimed: boolean;
  free_roll_claimed: boolean;
  last_monthly_appetizer_at: Date | null;
};

export function isRanksSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; meta?: { message?: string } };
  if (e.code !== 'P2010') return false;
  const msg = `${e.message || ''} ${e.meta?.message || ''}`.toLowerCase();
  return msg.includes('relation "member_ranks" does not exist');
}

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

  // Member rank operations
  private mapMemberRankRow(row: MemberRankRow): MemberRankRecord {
    return {
      rank: row.rank as MemberRank,
      rankStartedAt: row.rank_started_at,
      rankExpiresAt: row.rank_expires_at,
      freeAppetizerClaimed: row.free_appetizer_claimed,
      freeRollClaimed: row.free_roll_claimed,
      lastMonthlyAppetizerAt: row.last_monthly_appetizer_at,
    };
  }

  async ensureMemberRank(userId: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO member_ranks (user_id)
      VALUES (${userId}::uuid)
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  async getUserRank(userId: string): Promise<MemberRankRecord> {
    await this.ensureMemberRank(userId);

    const rows = await prisma.$queryRaw<MemberRankRow[]>`
      SELECT rank, rank_started_at, rank_expires_at,
             free_appetizer_claimed, free_roll_claimed,
             last_monthly_appetizer_at
      FROM member_ranks
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      return {
        rank: 'silver',
        rankStartedAt: new Date(),
        rankExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        freeAppetizerClaimed: false,
        freeRollClaimed: false,
        lastMonthlyAppetizerAt: null,
      };
    }

    const record = this.mapMemberRankRow(rows[0]);

    if (new Date() >= record.rankExpiresAt && record.rank !== 'silver') {
      return this.resetRankToSilver(userId);
    }

    return record;
  }

  async resetRankToSilver(userId: string): Promise<MemberRankRecord> {
    const rows = await prisma.$queryRaw<MemberRankRow[]>`
      UPDATE member_ranks
      SET rank = 'silver',
          rank_started_at = NOW(),
          rank_expires_at = NOW() + INTERVAL '1 year',
          free_appetizer_claimed = FALSE,
          free_roll_claimed = FALSE,
          last_monthly_appetizer_at = NULL,
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
      RETURNING rank, rank_started_at, rank_expires_at,
                free_appetizer_claimed, free_roll_claimed,
                last_monthly_appetizer_at
    `;

    return this.mapMemberRankRow(rows[0]);
  }

  async upgradeRank(userId: string): Promise<{
    rankRecord: MemberRankRecord;
    pointsSummary: UserPointsSummary;
  }> {
    const currentRank = await this.getUserRank(userId);
    const nextRank = getNextRank(currentRank.rank);

    if (!nextRank) {
      throw new Error('ALREADY_MAX_RANK');
    }

    const cost = getUpgradeCost(nextRank);
    if (!cost) {
      throw new Error('INVALID_UPGRADE');
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
          points_balance = points_balance - ${cost},
          lifetime_points_redeemed = lifetime_points_redeemed + ${cost},
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid AND points_balance >= ${cost}
        RETURNING points_balance, lifetime_points_earned, lifetime_points_redeemed
      `;

      if (!updatedPointsRows.length) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      const rankRows = await tx.$queryRaw<MemberRankRow[]>`
        UPDATE member_ranks
        SET rank = ${nextRank},
            rank_started_at = NOW(),
            rank_expires_at = NOW() + INTERVAL '1 year',
            free_appetizer_claimed = FALSE,
            free_roll_claimed = FALSE,
            last_monthly_appetizer_at = NULL,
            updated_at = NOW()
        WHERE user_id = ${userId}::uuid
        RETURNING rank, rank_started_at, rank_expires_at,
                  free_appetizer_claimed, free_roll_claimed,
                  last_monthly_appetizer_at
      `;

      return {
        rankRecord: this.mapMemberRankRow(rankRows[0]),
        pointsSummary: this.mapPointsRow(updatedPointsRows[0]),
      };
    });
  }

  // Store settings operations
  private mapStoreSettingsRow(row: StoreSettingsRow): StoreSettings {
    return {
      ordersPaused: row.orders_paused,
      pauseReason: row.pause_reason,
      pausedAt: row.paused_at,
      resumeAt: row.resume_at,
      pausedByEmail: row.paused_by_email,
    };
  }

  async getStoreSettings(): Promise<StoreSettings> {
    const rows = await prisma.$queryRaw<StoreSettingsRow[]>`
      SELECT orders_paused, pause_reason, paused_at, resume_at, paused_by_email
      FROM store_settings
      WHERE id = 1
      LIMIT 1
    `;

    if (!rows.length) {
      return {
        ordersPaused: false,
        pauseReason: null,
        pausedAt: null,
        resumeAt: null,
        pausedByEmail: null,
      };
    }

    return this.mapStoreSettingsRow(rows[0]);
  }

  async pauseOrders(params: {
    reason?: string;
    resumeAt?: Date | null;
    pausedByEmail: string;
  }): Promise<StoreSettings> {
    const rows = await prisma.$queryRaw<StoreSettingsRow[]>`
      UPDATE store_settings
      SET
        orders_paused = TRUE,
        pause_reason = ${params.reason ?? null},
        paused_at = NOW(),
        resume_at = ${params.resumeAt ?? null}::timestamptz,
        paused_by_email = ${params.pausedByEmail},
        updated_at = NOW()
      WHERE id = 1
      RETURNING orders_paused, pause_reason, paused_at, resume_at, paused_by_email
    `;
    return this.mapStoreSettingsRow(rows[0]);
  }

  async resumeOrders(): Promise<StoreSettings> {
    const rows = await prisma.$queryRaw<StoreSettingsRow[]>`
      UPDATE store_settings
      SET
        orders_paused = FALSE,
        pause_reason = NULL,
        paused_at = NULL,
        resume_at = NULL,
        paused_by_email = NULL,
        updated_at = NOW()
      WHERE id = 1
      RETURNING orders_paused, pause_reason, paused_at, resume_at, paused_by_email
    `;
    return this.mapStoreSettingsRow(rows[0]);
  }

  async areOrdersPaused(): Promise<{ paused: boolean; settings: StoreSettings }> {
    const settings = await this.getStoreSettings();

    if (settings.ordersPaused && settings.resumeAt) {
      const now = new Date();
      if (now >= settings.resumeAt) {
        const resumed = await this.resumeOrders();
        return { paused: false, settings: resumed };
      }
    }

    return { paused: settings.ordersPaused, settings };
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

  async updateOrder(id: string, updates: Partial<{
    status: string;
    paymentStatus: string;
    doordashDeliveryId: string;
    doordashDeliveryStatus: string;
    doordashTrackingUrl: string;
    dasherName: string;
    dasherPhone: string;
    dasherLatitude: number;
    dasherLongitude: number;
    estimatedPickupTime: Date;
    estimatedDropoffTime: Date;
    actualPickupTime: Date;
    actualDropoffTime: Date;
    deliveryLastEvent: string;
  }>) {
    return prisma.order.update({
      where: { id },
      data: updates,
      include: { items: true },
    });
  }

  async findOrderByDoordashDeliveryId(doordashDeliveryId: string) {
    return prisma.order.findFirst({
      where: { doordashDeliveryId },
      include: { items: true },
    });
  }
}

export const db = new Database();
