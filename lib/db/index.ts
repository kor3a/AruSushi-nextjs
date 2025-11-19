import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  specialNotes?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress?: string;
  deliveryPhone?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class Database {
  private getFilePath(collection: string): string {
    return path.join(DB_DIR, `${collection}.json`);
  }

  private read<T>(collection: string): T[] {
    const filePath = this.getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  private write<T>(collection: string, data: T[]): void {
    const filePath = this.getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const users = this.read<User>('users');
    return users.find(u => u.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const users = this.read<User>('users');
    return users.find(u => u.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = this.read<User>('users');
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.write('users', users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = this.read<User>('users');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      id: users[index].id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };
    this.write('users', users);
    return users[index];
  }

  // Order operations
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const orders = this.read<Order>('orders');
    const newOrder: Order = {
      ...orderData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    this.write('orders', orders);
    return newOrder;
  }

  async findOrderById(id: string): Promise<Order | null> {
    const orders = this.read<Order>('orders');
    return orders.find(o => o.id === id) || null;
  }

  async findOrdersByUserId(userId: string): Promise<Order[]> {
    const orders = this.read<Order>('orders');
    return orders.filter(o => o.userId === userId);
  }

  async findAllOrders(): Promise<Order[]> {
    return this.read<Order>('orders');
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const orders = this.read<Order>('orders');
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index] = {
      ...orders[index],
      ...updates,
      id: orders[index].id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };
    this.write('orders', orders);
    return orders[index];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const db = new Database();
