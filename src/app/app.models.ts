// Enums
export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    StockIn = 0,
    StockOut = 1,
    InitialStock = 2,
    Adjustment = 3,
    Return = 4,
    Damaged = 5
}

export enum OrderStatus {
    PENDING = 0,
    PROCESSING = 1,
    SHIPPED = 2,
    DELIVERED = 3,
    CANCELLED = 4,
    // Adding additional values to match the API response (status 7 was observed)
    REFUNDED = 7
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

// Interfaces
export interface IUser {
    userId: string;
    username: string;
    passwordHash: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    role?: IRole;
}

export interface IStockMovement {
    movementId: string;
    cycleId: string;
    quantity: number;
    movementType: MovementType;
    referenceId?: string | null;
    userId: string;
    notes?: string;
    movementDate: string;
    updatedAt: string;
    cycle?: ICycle;
    user?: IUser;
}

export interface ISalesAnalytics {
    analyticsId: string;
    date: Date;
    dailyRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    totalOrders: number;
    totalUnitsSold: number;
    averageOrderValue: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    topSellingCycleId?: string;
    topSellingCycle?: ICycle;
    topSellingBrandId?: string;
    topSellingBrand?: IBrand;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRole {
    roleId: string;
    roleName: string;
    users?: IUser[];
}

export interface IPayment {
    paymentId: string;
    orderId: string;
    order?: IOrder;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
    paidAt?: Date;
}

export interface IOrderItem {
    orderItemId: string;
    orderId: string;
    cycleName:string;
    order?: IOrder;
    cycleId: string;
    cycle?: ICycle;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrder {
    orderId: string;
    customerId: string;
    customerName: string;
    customer?: ICustomer;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingPostalCode: string;
    notes?: string;
    processedByUserId?: string;
    processedByUser?: IUser;
    orderDate: Date;
    processedDate?: Date;
    shippedDate?: Date;
    deliveredDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    orderItems?: IOrderItem[];
}

export interface ICycleType {
    typeId: string;
    typeName: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PagedResponse<T> {
    items: T[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export interface ICycle {
    cycleId: string;
    modelName: string;
    brandId: string;
    typeId: string;
    description: string;
    price: number;
    costPrice: number;
    stockQuantity: number;
    reorderLevel: number;
    imageUrl: string;
    isActive: boolean;
    warrantyMonths: number;
    createdAt: Date;
    updatedAt: Date;
    brand?: IBrand;
    cycleType?: ICycleType;
    cartItems?: ICartItem[];
    orderItems?: IOrderItem[];
    stockMovements?: IStockMovement[];
}

export interface ICustomer {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    registrationDate: Date;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    lastLoginDate?: Date;
    preferredLanguage?: string;
    marketingPreferences?: string;
    referralSource?: string;
    passwordHash?: string;
    carts?: ICart[];
    orders?: IOrder[];
}

export interface ICartItem {
    cartItemId: string;
    cartId: string;
    cart?: ICart;
    cycleId: string;
    cycle?: ICycle;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    addedAt: Date;
    updatedAt: Date;
}

export interface ICartActivityLog {
    logId: string;
    cartId: string;
    customerId: string;
    cycleId?: string;
    userId?: string;
    action: string;
    quantity?: number;
    previousQuantity?: number;
    ipAddress: string;
    notes: string;
    createdAt: Date;
    cart?: ICart;
    customer?: ICustomer;
    cycle?: ICycle;
    user?: IUser;
}

export interface ICart {
    cartId: string;
    customerId: string;
    customer?: ICustomer;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    sessionId?: string;
    notes?: string;
    lastAccessedByUserId?: string;
    lastAccessedByUser?: IUser;
    lastAccessedAt?: Date;
    cartItems?: ICartItem[];
}

export interface IBrand {
    brandId: string;
    brandName: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    cycles?: ICycle[];
}

export interface IStockAdjustmentRequest {
    cycleId: string;
    quantity: number;
    userId: string;
    movementType: MovementType;
    notes?: string;
}

export interface IStockAdjustmentResponse {
    movement: {
        movementId: string;
        cycleId: string;
        quantity: number;
        movementType: MovementType;
        userId: string;
        notes?: string;
        movementDate: string;
        updatedAt: string;
    };
    cycle: {
        cycleId: string;
        modelName: string;
        stockQuantity: number;
        price: number;
        updatedAt: string;
    };
}