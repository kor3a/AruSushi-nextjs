import axios, { AxiosInstance } from 'axios';

export interface DoorDashDeliveryRequest {
  external_delivery_id: string; // Our order ID
  pickup_address: string;
  pickup_phone_number: string;
  pickup_business_name: string;
  pickup_instructions?: string;
  dropoff_address: string;
  dropoff_phone_number: string;
  dropoff_instructions?: string;
  order_value: number; // Order total in cents
  items?: Array<{
    name: string;
    quantity: number;
  }>;
}

export interface DoorDashDeliveryResponse {
  id: string; // DoorDash delivery ID
  external_delivery_id: string;
  status: string;
  fee: number;
  currency: string;
  estimated_pickup_time?: string;
  estimated_dropoff_time?: string;
}

export interface DoorDashDeliveryStatus {
  id: string;
  external_delivery_id: string;
  status: string;
  fee: number;
  currency: string;
  tracking_url?: string;
  estimated_pickup_time?: string;
  estimated_dropoff_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
}

class DoorDashClient {
  private client: AxiosInstance;
  private developerId: string;
  private keyId: string;
  private signingSecret: string;

  constructor() {
    this.developerId = process.env.DOORDASH_DEVELOPER_ID || '';
    this.keyId = process.env.DOORDASH_KEY_ID || '';
    this.signingSecret = process.env.DOORDASH_SIGNING_SECRET || '';

    if (!this.developerId || !this.keyId || !this.signingSecret) {
      console.warn('DoorDash credentials not configured. Delivery features will be disabled.');
    }

    // DoorDash API base URL - use sandbox for development
    const baseURL = process.env.DOORDASH_API_URL || 'https://openapi.doordash.com';
    const isSandbox = process.env.DOORDASH_SANDBOX === 'true' || !process.env.DOORDASH_SANDBOX;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      // DoorDash uses OAuth 2.0 or API key authentication
      // For simplicity, we'll use API key authentication
      // In production, you should implement proper OAuth 2.0 flow
      if (this.keyId && this.signingSecret) {
        config.headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
      }
      return config;
    });
  }

  /**
   * Get authentication token
   * In production, implement proper OAuth 2.0 token refresh
   */
  private getAuthToken(): string {
    // For now, return a placeholder
    // In production, implement OAuth 2.0 token generation
    // or use API key if DoorDash supports it
    return process.env.DOORDASH_ACCESS_TOKEN || '';
  }

  /**
   * Create a delivery request
   */
  async createDelivery(request: DoorDashDeliveryRequest): Promise<DoorDashDeliveryResponse> {
    if (!this.developerId || !this.keyId || !this.signingSecret) {
      throw new Error('DoorDash credentials not configured');
    }

    try {
      const response = await this.client.post<DoorDashDeliveryResponse>(
        '/drive/v2/deliveries',
        request
      );

      return response.data;
    } catch (error: any) {
      console.error('DoorDash API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to create DoorDash delivery'
      );
    }
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(deliveryId: string): Promise<DoorDashDeliveryStatus> {
    if (!this.developerId || !this.keyId || !this.signingSecret) {
      throw new Error('DoorDash credentials not configured');
    }

    try {
      const response = await this.client.get<DoorDashDeliveryStatus>(
        `/drive/v2/deliveries/${deliveryId}`
      );

      return response.data;
    } catch (error: any) {
      console.error('DoorDash API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to get DoorDash delivery status'
      );
    }
  }

  /**
   * Cancel a delivery
   */
  async cancelDelivery(deliveryId: string): Promise<void> {
    if (!this.developerId || !this.keyId || !this.signingSecret) {
      throw new Error('DoorDash credentials not configured');
    }

    try {
      await this.client.post(`/drive/v2/deliveries/${deliveryId}/cancel`);
    } catch (error: any) {
      console.error('DoorDash API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to cancel DoorDash delivery'
      );
    }
  }

  /**
   * Check if DoorDash is configured
   */
  isConfigured(): boolean {
    return !!(
      this.developerId &&
      this.keyId &&
      this.signingSecret
    );
  }
}

export const doordashClient = new DoorDashClient();
