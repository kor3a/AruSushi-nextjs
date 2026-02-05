import axios, { AxiosInstance } from 'axios';

// Request types
export interface DoorDashQuoteRequest {
  external_delivery_id: string;
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

// Response types
export interface DoorDashQuoteResponse {
  id: string; // Quote ID - needed to accept the quote
  external_delivery_id: string;
  fee: number; // Delivery fee in cents
  currency: string;
  delivery_time?: {
    estimated_pickup_time: string;
    estimated_dropoff_time: string;
  };
  time_estimate_seconds?: number;
  expires_at?: string; // Quote expiration time
}

export interface DoorDashDeliveryResponse {
  id: string; // DoorDash delivery ID
  external_delivery_id: string;
  status: string;
  fee: number;
  currency: string;
  estimated_pickup_time?: string;
  estimated_dropoff_time?: string;
  tracking_url?: string;
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
    this.client.interceptors.request.use(
      async (config) => {
        // DoorDash Drive API uses OAuth 2.0 Bearer token authentication
        if (this.keyId && this.signingSecret) {
          try {
            const token = await this.getAuthToken();
            config.headers['Authorization'] = `Bearer ${token}`;
          } catch (error) {
            console.error('Failed to get DoorDash auth token:', error);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication token
   * DoorDash Drive API uses OAuth 2.0
   * You can either:
   * 1. Use a pre-generated access token (for testing)
   * 2. Implement OAuth 2.0 token generation/refresh (for production)
   */
  private async getAuthToken(): Promise<string> {
    // Option 1: Use pre-configured access token (simpler, but less secure)
    if (process.env.DOORDASH_ACCESS_TOKEN) {
      return process.env.DOORDASH_ACCESS_TOKEN;
    }

    // Option 2: Generate token via OAuth 2.0 (recommended for production)
    // This would require implementing the OAuth flow
    // For now, we'll throw an error if no token is provided
    throw new Error('DoorDash access token not configured. Please set DOORDASH_ACCESS_TOKEN or implement OAuth 2.0 flow.');
  }

  /**
   * Step 1: Get a delivery quote
   * This checks availability and returns delivery fee + time estimate
   */
  async getDeliveryQuote(request: DoorDashQuoteRequest): Promise<DoorDashQuoteResponse> {
    if (!this.developerId || !this.keyId || !this.signingSecret) {
      throw new Error('DoorDash credentials not configured');
    }

    try {
      const response = await this.client.post<DoorDashQuoteResponse>(
        '/drive/v2/quotes',
        request
      );

      return response.data;
    } catch (error: any) {
      console.error('DoorDash Quote API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to get DoorDash delivery quote'
      );
    }
  }

  /**
   * Step 2: Accept a delivery quote
   * This confirms the delivery and dispatches a Dasher
   */
  async acceptDeliveryQuote(quoteId: string): Promise<DoorDashDeliveryResponse> {
    if (!this.developerId || !this.keyId || !this.signingSecret) {
      throw new Error('DoorDash credentials not configured');
    }

    try {
      const response = await this.client.post<DoorDashDeliveryResponse>(
        `/drive/v2/quotes/${quoteId}/accept`
      );

      return response.data;
    } catch (error: any) {
      console.error('DoorDash Accept Quote API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to accept DoorDash delivery quote'
      );
    }
  }

  /**
   * Create a delivery request directly (without quote flow)
   * Note: The recommended flow is to use getDeliveryQuote + acceptDeliveryQuote
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
