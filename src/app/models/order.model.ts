import { OrderStatus } from './order-status.enum';

export interface OrderItem {
  orderItemId: number;
  cycleId: number;
  cycleName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cycle?: any; // Used for cycle details if needed
}

export interface Order {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customer?: any; // Used for detailed customer info
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: number;
  paymentMethod: string;
  orderItems: OrderItem[];
  processedByUserId?: string;
  processedByUserName?: string;
  processedDate?: Date;
  notes?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  deliveryInstructions?: string;
}