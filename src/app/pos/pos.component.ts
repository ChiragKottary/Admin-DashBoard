import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { 
  ICycle, 
  ICustomer, 
  ICartItem, 
  ICart, 
  IOrder, 
  OrderStatus, 
  PaymentStatus,
  ICycleType
} from '../app.models';
import { environment } from '../../environments/environment';

// Extended interfaces to match the template requirements
interface ExtendedCustomer extends ICustomer {
  fullName: string;
  hasActiveCart: boolean;
}

interface ExtendedCartItem extends ICartItem {
  cycleName: string;
  cycleBrand: string;
  cycleType: string;
  cycleImage?: string;
  cycleDescription?: string;
}

interface ExtendedCart extends ICart {
  totalAmount: number;
  totalItems: number;
  cartItems: ExtendedCartItem[];
}

// Interface for order creation
interface OrderCreate {
  orderId?: string;
  customerId: string;
  orderNumber?: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  notes?: string;
  orderItems: {
    cycleId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss'
})
export class PosComponent implements OnInit {
  // API URL
  private apiUrl = 'https://localhost:7042/api';
  
  // Cycles
  cycles: ICycle[] = [];
  
  // Customers
  customers: ExtendedCustomer[] = [];
  
  // Cart
  cartItems: ExtendedCartItem[] = [];
  activeCart: ExtendedCart | null = null;
  
  // Search and filters
  cycleSearchTerm: string = '';
  customerSearchTerm: string = '';
  categoryFilter: string = 'All Categories';
  
  // Selected customer
  selectedCustomer: ExtendedCustomer | null = null;
  
  // Modal states
  showCustomerDetailsModal: boolean = false;
  showPaymentModal: boolean = false;
  
  // Payment success animation
  showSuccessAnimation: boolean = false;
  successOrderNumber: string = '';
  
  // Forms
  customerDetailsForm: FormGroup;
  paymentForm: FormGroup;
  
  // Delivery fee
  deliveryFee: number = 100;
  
  // Recent orders
  recentOrders: IOrder[] = [];
  
  // Customer search timeout
  private customerSearchTimeout: any;
  
  // Categories - Will be populated from API
  categories: string[] = ['All Categories'];
  cycleTypes: ICycleType[] = [];
  
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    // Initialize payment form
    this.paymentForm = this.fb.group({
      paymentMethod: ['razorpay', Validators.required],
      cashAmount: [''],
      cardNumber: [''],
      cardExpiry: [''],
      cardCvv: ['']
    });
    
    // Initialize customer details form
    this.customerDetailsForm = this.fb.group({
      orderType: ['inStore', Validators.required],
      shippingAddress: [''],
      shippingCity: [''],
      shippingState: [''],
      shippingPostalCode: [''],
      deliveryInstructions: ['']
    });
    
    // Set up conditional validation for delivery details
    this.customerDetailsForm.get('orderType')?.valueChanges.subscribe(orderType => {
      if (orderType === 'delivery') {
        this.customerDetailsForm.get('shippingAddress')?.setValidators([Validators.required]);
        this.customerDetailsForm.get('shippingCity')?.setValidators([Validators.required]);
        this.customerDetailsForm.get('shippingPostalCode')?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
        this.customerDetailsForm.get('shippingState')?.setValidators([Validators.required]);
      } else {
        this.customerDetailsForm.get('shippingAddress')?.clearValidators();
        this.customerDetailsForm.get('shippingCity')?.clearValidators();
        this.customerDetailsForm.get('shippingPostalCode')?.clearValidators();
        this.customerDetailsForm.get('shippingState')?.clearValidators();
      }
      
      this.customerDetailsForm.get('shippingAddress')?.updateValueAndValidity();
      this.customerDetailsForm.get('shippingCity')?.updateValueAndValidity();
      this.customerDetailsForm.get('shippingPostalCode')?.updateValueAndValidity();
      this.customerDetailsForm.get('shippingState')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadRazorpayScript();
    this.loadCycles();
    this.loadCycleTypes();
    this.loadRecentOrders();
  }

  // Load Razorpay script
  loadRazorpayScript(): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }

  // Load cycle types from API
  loadCycleTypes(): void {
    this.http.get<any>(`${this.apiUrl}/CycleType`).subscribe({
      next: (response) => {
        if (response && response.items) {
          this.cycleTypes = response.items;
          // Add all cycle types to categories
          this.categories = ['All Categories', ...this.cycleTypes.map(type => type.typeName)];
        }
      },
      error: (error) => {
        console.error('Error loading cycle types:', error);
      }
    });
  }

  // Load cycles from API
  loadCycles(): void {
    // Use a large pageSize to effectively disable pagination and get all cycles
    this.http.get<any>(`${this.apiUrl}/Cycle?pageSize=1000`).subscribe({
      next: (response) => {
        if (response && response.items) {
          this.cycles = response.items;
          console.log(`Loaded ${this.cycles.length} cycles`);
        }
      },
      error: (error) => {
        console.error('Error loading cycles:', error);
      }
    });
  }

  // Load recent orders
  loadRecentOrders(): void {
    this.http.get<any>(`${this.apiUrl}/Order?pageSize=5&sortBy=orderDate&sortDirection=0`).subscribe({
      next: (response) => {
        if (response && response.items) {
          this.recentOrders = response.items;
        }
      },
      error: (error) => {
        console.error('Error loading recent orders:', error);
      }
    });
  }

  // Search customers
  searchCustomers(): void {
    if (this.customerSearchTimeout) {
      clearTimeout(this.customerSearchTimeout);
    }
    
    if (this.customerSearchTerm.trim().length < 1) {
      this.customers = [];
      return;
    }
    
    this.customerSearchTimeout = setTimeout(() => {
      this.http.get<any[]>(`${this.apiUrl}/Customers/search?searchTerm=${this.customerSearchTerm}`).subscribe({
        next: (response) => {
          // Transform the API customer data to match our extended interface
          this.customers = response.map(customer => ({
            ...customer,
            fullName: `${customer.firstName} ${customer.lastName}`,
            hasActiveCart: customer.carts?.some((cart: any) => cart.isActive) ?? false
          })) as ExtendedCustomer[];
        },
        error: (error) => {
          console.error('Error searching customers:', error);
        }
      });
    }, 300);
  }

  // Filter cycles by search term and category
  get filteredCycles(): ICycle[] {
    return this.cycles.filter(cycle => {
      // Filter by search term
      const matchesTerm = this.cycleSearchTerm.trim() === '' ||
        cycle.modelName.toLowerCase().includes(this.cycleSearchTerm.toLowerCase()) ||
        cycle.brand?.brandName?.toLowerCase().includes(this.cycleSearchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = this.categoryFilter === 'All Categories' ||
        cycle.cycleType?.typeName === this.categoryFilter;
      
      return matchesTerm && matchesCategory;
    });
  }

  // Filter customers by search term
  get filteredCustomers(): ExtendedCustomer[] {
    return this.customers;
  }

  // Add item to cart
  addToCart(cycle: ICycle): void {
    if (!this.selectedCustomer) {
      alert('Please select a customer first before adding items to cart.');
      return;
    }
    
    if (cycle.stockQuantity <= 0) {
      alert('This cycle is out of stock.');
      return;
    }
    
    // Check if customer already has an active cart
    if (this.activeCart && this.activeCart.cartId) {
      const payload = {
        cycleId: cycle.cycleId,
        quantity: 1
      };
      
      // Use direct Cart endpoint as specified
      this.http.post(`${this.apiUrl}/Cart/${this.activeCart.cartId}/items`, payload).subscribe({
        next: () => {
          // Reload cart after adding item
          if (this.selectedCustomer) {
            this.loadCustomerCart(this.selectedCustomer.customerId);
          }
        },
        error: (error) => {
          console.error('Error adding item to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        }
      });
    } else {
      // No active cart exists, create one via the customer endpoint first
      this.http.post<any>(`${this.apiUrl}/Customers/${this.selectedCustomer.customerId}/cart`, {}).subscribe({
        next: (response) => {
          if (response && response.cartId) {
            // Now add the item to the newly created cart
            const payload = {
              cycleId: cycle.cycleId,
              quantity: 1
            };
            
            this.http.post(`${this.apiUrl}/Cart/${response.cartId}/items`, payload).subscribe({
              next: () => {
                // Reload cart after adding item
                this.loadCustomerCart(this.selectedCustomer!.customerId);
              },
              error: (error) => {
                console.error('Error adding item to cart:', error);
                alert('Failed to add item to cart. Please try again.');
              }
            });
          } else {
            alert('Failed to create cart. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error creating cart:', error);
          alert('Failed to create cart. Please try again.');
        }
      });
    }
  }

  // Update cart item quantity
  updateQuantity(item: ExtendedCartItem, change: number): void {
    if (!this.activeCart || !this.selectedCustomer) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      this.removeFromCart(item);
    } else {
      // Find the cycle to check stock
      const cycle = this.cycles.find(c => c.cycleId === item.cycleId);
      if (cycle && newQuantity > cycle.stockQuantity) {
        alert('Cannot add more units. Maximum stock reached.');
        return;
      }
      
      const payload = {
        quantity: newQuantity
      };
      
      // Use the direct Cart endpoint as specified
      this.http.put(`${this.apiUrl}/Cart/items/${item.cartItemId}`, payload).subscribe({
        next: () => {
          // Reload cart after updating item
          if (this.selectedCustomer) {
            this.loadCustomerCart(this.selectedCustomer.customerId);
          }
        },
        error: (error) => {
          console.error('Error updating item quantity:', error);
          alert('Failed to update item quantity. Please try again.');
        }
      });
    }
  }

  // Remove item from cart
  removeFromCart(item: ExtendedCartItem): void {
    if (!this.activeCart || !this.selectedCustomer) return;
    
    if (confirm('Are you sure you want to remove this item from the cart?')) {
      this.http.delete(`${this.apiUrl}/Cart/items/${item.cartItemId}`).subscribe({
        next: () => {
          // Reload cart after removing item
          if (this.selectedCustomer) {
            this.loadCustomerCart(this.selectedCustomer.customerId);
          }
        },
        error: (error) => {
          console.error('Error removing item from cart:', error);
          alert('Failed to remove item from cart. Please try again.');
        }
      });
    }
  }

  // Calculate cart total (without tax and delivery fee)
  get cartTotal(): number {
    if (this.activeCart) {
      return this.activeCart.totalAmount;
    }
    return 0;
  }

  // Calculate subtotal
  calculateSubtotal(): number {
    if (this.activeCart) {
      return this.activeCart.totalAmount;
    }
    return 0;
  }

  // Calculate tax
  calculateTax(): number {
    return this.calculateSubtotal() * 0.18;
  }

  // Calculate total including tax and delivery fee
  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const delivery = this.customerDetailsForm.value.orderType === 'delivery' ? this.deliveryFee : 0;
    
    return subtotal + tax + delivery;
  }

  // Select customer
  selectCustomer(customer: any): void {
    // Transform customer to match our extended interface
    this.selectedCustomer = {
      ...customer,
      fullName: `${customer.firstName} ${customer.lastName}`,
      hasActiveCart: customer.carts?.some((cart: any) => cart.isActive) ?? false
    } as ExtendedCustomer;
    
    this.customerSearchTerm = '';
    this.customers = [];
    
    // Load customer cart regardless of hasActiveCart flag
    // The API will return null if no active cart exists
    this.loadCustomerCart(this.selectedCustomer.customerId);
  }

  // Load customer cart
  loadCustomerCart(customerId: string): void {
    console.log('Loading cart for customer:', customerId);
    
    // Use the customer-centric cart endpoint to get cart information
    this.http.get<any>(`${this.apiUrl}/Customers/${customerId}/cart`).subscribe({
      next: (response) => {
        console.log('Cart API response:', response);
        
        if (response && response.cartId) {
          // Store the active cart data including cartId
          // The cart items already have cycleName, cycleBrand, and cycleType properties,
          // so we don't need to map them from cycle object
          const transformedCart: ExtendedCart = {
            ...response,
            totalAmount: response.totalAmount || 0,
            totalItems: response.totalItems || 0,
            cartItems: response.cartItems?.map((item: any) => {
              console.log('Processing cart item:', item);
              // We use the properties directly from the cart item
              // They're already named correctly (cycleName, cycleBrand, cycleType)
              return {
                ...item,
                // If properties are missing, provide defaults
                cycleName: item.cycleName || 'Unknown Cycle',
                cycleBrand: item.cycleBrand || 'Unknown Brand',
                cycleType: item.cycleType || 'Unknown Type',
                cycleImage: item.cycleImage || ''
              };
            }) || []
          };
          
          console.log('Transformed cart:', transformedCart);
          this.activeCart = transformedCart;
          this.cartItems = transformedCart.cartItems;
          
          // Update customer's hasActiveCart status
          if (this.selectedCustomer) {
            this.selectedCustomer.hasActiveCart = true;
          }
        } else {
          console.log('No active cart found for customer');
          this.activeCart = null;
          this.cartItems = [];
          
          // Update customer's hasActiveCart status
          if (this.selectedCustomer) {
            this.selectedCustomer.hasActiveCart = false;
          }
        }
      },
      error: (error) => {
        console.error('Error loading customer cart:', error);
        console.error('Error details:', error.message, error.status);
        this.activeCart = null;
        this.cartItems = [];
      }
    });
  }

  // Clear selected customer
  clearCustomer(): void {
    this.selectedCustomer = null;
    this.activeCart = null;
    this.cartItems = [];
  }

  // Open checkout modal
  openCheckoutModal(): void {
    if (!this.activeCart || this.cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    
    if (!this.selectedCustomer) {
      alert('Please select a customer.');
      return;
    }

    // Reset customer details form
    this.customerDetailsForm.reset({
      orderType: 'inStore',
      shippingAddress: this.selectedCustomer.address || '',
      shippingCity: this.selectedCustomer.city || '',
      shippingPostalCode: this.selectedCustomer.postalCode || '',
      deliveryInstructions: ''
    });
    
    this.showCustomerDetailsModal = true;
  }

  // Check if customer details are valid
  isCustomerDetailsValid(): boolean {
    return this.customerDetailsForm.valid;
  }

  // Close customer details modal
  closeCustomerDetailsModal(): void {
    this.showCustomerDetailsModal = false;
  }

  // Proceed to payment after customer details
  proceedToPayment(): void {
    this.showCustomerDetailsModal = false;
    this.showPaymentModal = true;
    
    // Reset payment form
    this.paymentForm.reset({
      paymentMethod: 'razorpay',
      cashAmount: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: ''
    });
  }

  // Close payment modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  // Process payment
  processPayment(): void {
    const paymentMethod = this.paymentForm.value.paymentMethod;
    
    if (paymentMethod === 'razorpay') {
      this.initiateRazorpayPayment();
    } else {
      this.processOfflinePayment();
    }
  }

  // Process offline payment (cash)
  processOfflinePayment(): void {
    const paymentMethod = this.paymentForm.value.paymentMethod;
    
    if (paymentMethod === 'cash' && this.paymentForm.value.cashAmount) {
      const cashAmount = parseFloat(this.paymentForm.value.cashAmount);
      const totalAmount = this.calculateTotal();
      
      if (cashAmount < totalAmount) {
        alert('Cash amount is less than the total amount.');
        return;
      }
    }
    
    // Create order with offline payment
    this.createOrder(paymentMethod);
  }

  // Create order after successful cash payment
  createOrder(paymentMethod: string): void {
    if (!this.activeCart || !this.selectedCustomer) return;
    
    // Create order from cart using dedicated endpoint with all required fields
    const shippingAddress = this.customerDetailsForm.value.shippingAddress || this.selectedCustomer.address;
    const orderFromCartPayload = {
      cartId: this.activeCart.cartId,
      shippingAddress: (!shippingAddress || shippingAddress.length < 5) ? 'Default Address' : shippingAddress,
      shippingCity: this.customerDetailsForm.value.shippingCity || this.selectedCustomer.city || 'Default City',
      shippingState: this.customerDetailsForm.value.shippingState || 'Karnataka',
      shippingPostalCode: this.customerDetailsForm.value.shippingPostalCode || this.selectedCustomer.postalCode || '000000',
      notes: this.customerDetailsForm.value.deliveryInstructions || 'Order placed'
    };
    
    // Use the dedicated endpoint to create order from cart
    this.http.post<IOrder>(`${this.apiUrl}/Order/from-cart`, orderFromCartPayload).subscribe({
      next: (createdOrder) => {
        // Close modal and show success
        this.closePaymentModal();
        
        // Update local data
        this.loadRecentOrders();
        
        // Show success animation and redirect to orders page
        this.showOrderSuccessAndRedirect(createdOrder.orderNumber);
      },
      error: (error) => {
        console.error('Failed to create order:', error);
        alert('Failed to process order. Please try again.');
      }
    });
  }

  // Initiate Razorpay payment
  initiateRazorpayPayment(): void {
    // First, create an order from the cart with all required fields filled
    const shippingAddress = this.customerDetailsForm.value.shippingAddress || this.selectedCustomer!.address;
    const orderFromCartPayload = {
      cartId: this.activeCart!.cartId,
      shippingAddress: (!shippingAddress || shippingAddress.length < 5) ? 'Default Address' : shippingAddress,
      shippingCity: this.customerDetailsForm.value.shippingCity || this.selectedCustomer!.city || 'Default City',
      shippingState: this.customerDetailsForm.value.shippingState || 'Karnataka',
      shippingPostalCode: this.customerDetailsForm.value.shippingPostalCode || this.selectedCustomer!.postalCode || '000000',
      notes: this.customerDetailsForm.value.deliveryInstructions || 'Order placed'
    };
    
    // Create the order first
    this.http.post<IOrder>(`${this.apiUrl}/Order/from-cart`, orderFromCartPayload).subscribe({
      next: (createdOrder) => {
        // Calculate the total amount in paise (multiply by 100 and round to ensure integer)
        const amountInPaise = Math.round(createdOrder.totalAmount * 100);
        
        // Now create a payment intent for this order using the new endpoint
        const paymentCreatePayload = {
          orderId: createdOrder.orderId
        };

        this.http.post<any>(`${this.apiUrl}/Payment/create`, paymentCreatePayload).subscribe({
          next: (razorpayResponse) => {
            console.log('Razorpay create response:', razorpayResponse);
            
            // Use the order's total amount converted to paise, not the amount from the response
            const options = {
              key: environment.razorpayKey,
              amount: amountInPaise, // Using the order's amount, not razorpayResponse.amount
              currency: 'INR', // Assuming currency is INR
              name: 'Cycle Enterprise',
              description: `Order: ${createdOrder.orderNumber}`,
              order_id: razorpayResponse.orderId, // Still using Razorpay's order ID
              image: 'assets/images/logo.png',
              handler: (response: any) => {
                console.log('Razorpay payment response:', response);
                
                // Check if we have all required fields
                if (!response.razorpay_payment_id) {
                  console.error('Missing payment ID in Razorpay response');
                  alert('Payment verification failed: Missing payment ID');
                  return;
                }
                
                // After successful payment, verify with your backend
                // Handle potentially missing signature - some integration methods might not return it
                const verifyPayload = {
                  orderId: razorpayResponse.orderId, // Using Razorpay order ID instead of backend order ID
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature || '' // Provide empty string if undefined
                };
                
                console.log('Verification payload:', verifyPayload);
                
                // Verify the payment
                this.http.post(`${this.apiUrl}/Payment/verify`, verifyPayload).subscribe({
                  next: () => {
                    console.log('Payment verified successfully');
                    
                    // Close payment modal
                    this.closePaymentModal();
                    
                    // Update local data - cart is already cleared on the backend
                    this.loadRecentOrders();
                    
                    // Show success animation and redirect to orders page
                    this.showOrderSuccessAndRedirect(createdOrder.orderNumber);
                  },
                  error: (error) => {
                    console.log('Verification payload that failed:', verifyPayload);
                    console.error('Payment verification failed:', error);
                    alert('Payment verification failed. Please contact support with your order number.');
                  }
                });
              },
              modal: {
                ondismiss: () => {
                  console.log('Payment modal dismissed');
                  alert('Payment cancelled. Your order will be processed once payment is completed.');
                }
              },
              prefill: {
                name: this.selectedCustomer?.fullName || '',
                email: this.selectedCustomer?.email || '',
                contact: this.selectedCustomer?.phone || ''
              },
              theme: {
                color: '#3399cc'
              }
            };
            
            // Open Razorpay checkout
            const razorpayWindow = new (window as any).Razorpay(options);
            razorpayWindow.open();
          },
          error: (error) => {
            console.error('Failed to create payment:', error);
            alert('Failed to initialize payment. Please try again.');
          }
        });
      },
      error: (error) => {
        console.error('Failed to create order:', error);
        alert('Failed to create order. Please try again.');
      }
    });
  }

  // Clear cart
  clearCart(): void {
    if (!this.activeCart || !this.selectedCustomer) return;
    
    if (confirm('Are you sure you want to clear the cart?')) {
      // Use direct Cart endpoint as specified
      this.http.delete(`${this.apiUrl}/Cart/${this.activeCart.cartId}`).subscribe({
        next: () => {
          this.activeCart = null;
          this.cartItems = [];
          
          // Update customer's hasActiveCart status
          if (this.selectedCustomer) {
            this.selectedCustomer.hasActiveCart = false;
          }
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          alert('Failed to clear cart. Please try again.');
        }
      });
    }
  }

  // Show success animation and redirect to orders
  showOrderSuccessAndRedirect(orderNumber: string): void {
    // Set success information
    this.successOrderNumber = orderNumber;
    this.showSuccessAnimation = true;
    
    // Clear the customer and cart data
    this.selectedCustomer = null;
    this.activeCart = null;
    this.cartItems = [];
    this.customerSearchTerm = '';
    
    // Play the animation for 3 seconds, then redirect
    setTimeout(() => {
      this.showSuccessAnimation = false;
      this.router.navigate(['/orders']);
    }, 3000);
  }
}
