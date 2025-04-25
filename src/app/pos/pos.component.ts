import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

interface Cycle {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  purchaseHistory: Order[];
}

interface CartItem {
  cycle: Cycle;
  quantity: number;
}

interface Order {
  id: string;
  customerId: number;
  customerName: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
  shippingAddress?: string;
  deliveryFee?: number;
  paymentId?: string;
  orderType: 'inStore' | 'delivery';
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss'
})
export class PosComponent implements OnInit {
  // Available cycles
  cycles: Cycle[] = [
    { id: 1, name: 'Mountain Explorer Pro', category: 'Mountain Bikes', brand: 'TrekCycle', price: 24999, stock: 10, image: 'assets/images/mountain-bike.jpg', description: 'High-performance mountain bike for rough terrains' },
    { id: 2, name: 'City Cruiser', category: 'City Bikes', brand: 'UrbanRide', price: 15999, stock: 15, image: 'assets/images/city-bike.jpg', description: 'Comfortable city bike for daily commute' },
    { id: 3, name: 'Road Master', category: 'Road Bikes', brand: 'SpeedCycle', price: 34999, stock: 5, image: 'assets/images/road-bike.jpg', description: 'Lightweight race bike for speed enthusiasts' },
    { id: 4, name: 'Hybrid Commuter', category: 'Hybrid Bikes', brand: 'CommutePro', price: 18999, stock: 8, image: 'assets/images/hybrid-bike.jpg', description: 'Versatile bike for various terrains and conditions' },
    { id: 5, name: 'Kids Explorer', category: 'Kids Bikes', brand: 'JuniorRide', price: 6500, stock: 18, image: 'assets/images/kids-bike.jpg', description: 'Safe and durable bike for children aged 7-10' },
  ];
  
  customers: Customer[] = [
    { 
      id: 1, 
      name: 'Rahul Sharma', 
      email: 'rahul@example.com', 
      phone: '9876543210',
      address: '123 Main Street, Mumbai',
      purchaseHistory: [] 
    },
    { 
      id: 2, 
      name: 'Priya Singh', 
      email: 'priya@example.com', 
      phone: '8765432109',
      address: '456 Park Avenue, Delhi',
      purchaseHistory: [] 
    }
  ];
  
  // Cart
  cartItems: CartItem[] = [];
  
  // Search and filters
  cycleSearchTerm: string = '';
  customerSearchTerm: string = '';
  categoryFilter: string = '';
  
  // Selected customer
  selectedCustomer: Customer | null = null;
  
  // Modal states
  showCustomerDetailsModal: boolean = false;
  showPaymentModal: boolean = false;
  
  // Forms
  customerDetailsForm: FormGroup;
  paymentForm: FormGroup;
  
  // Delivery fee
  deliveryFee: number = 100;
  
  // Recent orders
  recentOrders: Order[] = [
    {
      id: 'ORD-1234',
      customerId: 1,
      customerName: 'Rahul Sharma',
      items: [
        { 
          cycle: this.cycles[0], 
          quantity: 1
        }
      ],
      total: 24999,
      date: '2025-04-22',
      paymentMethod: 'Card',
      status: 'completed',
      orderType: 'inStore'
    },
    {
      id: 'ORD-1235',
      customerId: 2,
      customerName: 'Priya Singh',
      items: [
        { 
          cycle: this.cycles[4], 
          quantity: 1
        }
      ],
      total: 6500,
      date: '2025-04-23',
      paymentMethod: 'Cash',
      status: 'completed',
      orderType: 'inStore'
    }
  ];

  // Categories
  categories: string[] = [
    'All Categories',
    'Mountain Bikes',
    'Road Bikes',
    'Hybrid Bikes',
    'City Bikes',
    'BMX',
    'Kids Bikes'
  ];
  
  constructor(private fb: FormBuilder) {
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
      city: [''],
      pincode: [''],
      deliveryInstructions: ['']
    });
    
    // Set up conditional validation for delivery details
    this.customerDetailsForm.get('orderType')?.valueChanges.subscribe(orderType => {
      const shippingAddressControl = this.customerDetailsForm.get('shippingAddress');
      const cityControl = this.customerDetailsForm.get('city');
      const pincodeControl = this.customerDetailsForm.get('pincode');
      
      if (orderType === 'delivery') {
        shippingAddressControl?.setValidators(Validators.required);
        cityControl?.setValidators(Validators.required);
        pincodeControl?.setValidators([Validators.required, Validators.pattern('^[0-9]{6}$')]);
      } else {
        shippingAddressControl?.clearValidators();
        cityControl?.clearValidators();
        pincodeControl?.clearValidators();
      }
      
      shippingAddressControl?.updateValueAndValidity();
      cityControl?.updateValueAndValidity();
      pincodeControl?.updateValueAndValidity();
    });
    
    // Add purchase history to customers
    this.customers.forEach(customer => {
      customer.purchaseHistory = this.recentOrders.filter(order => 
        order.customerId === customer.id
      );
    });
  }

  ngOnInit(): void {
    // Load Razorpay script
    this.loadRazorpayScript();
  }

  // Load Razorpay script
  loadRazorpayScript(): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  // Filter cycles by search term and category
  get filteredCycles(): Cycle[] {
    let filtered = [...this.cycles];
    
    if (this.categoryFilter && this.categoryFilter !== 'All Categories') {
      filtered = filtered.filter(cycle => cycle.category === this.categoryFilter);
    }
    
    if (this.cycleSearchTerm.trim() !== '') {
      const term = this.cycleSearchTerm.toLowerCase();
      filtered = filtered.filter(cycle => 
        cycle.name.toLowerCase().includes(term) ||
        cycle.brand.toLowerCase().includes(term) ||
        cycle.category.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  // Filter customers by search term
  get filteredCustomers(): Customer[] {
    if (this.customerSearchTerm === '') {
      return [];
    }
    
    return this.customers
      .filter(customer => 
        customer.name.toLowerCase().includes(this.customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(this.customerSearchTerm) ||
        customer.email.toLowerCase().includes(this.customerSearchTerm.toLowerCase())
      );
  }

  // Add item to cart
  addToCart(cycle: Cycle): void {
    if (cycle.stock <= 0) {
      alert('This cycle is out of stock.');
      return;
    }
    
    const existingItem = this.cartItems.find(item => item.cycle.id === cycle.id);
    
    if (existingItem) {
      if (existingItem.quantity < cycle.stock) {
        existingItem.quantity++;
      } else {
        alert('Cannot add more units. Maximum stock reached.');
      }
    } else {
      this.cartItems.push({ cycle, quantity: 1 });
    }
  }

  // Update cart item quantity
  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      this.removeFromCart(item);
    } else if (newQuantity <= item.cycle.stock) {
      item.quantity = newQuantity;
    } else {
      alert('Cannot add more units. Maximum stock reached.');
    }
  }

  // Remove item from cart
  removeFromCart(item: CartItem): void {
    this.cartItems = this.cartItems.filter(i => i.cycle.id !== item.cycle.id);
  }

  // Calculate cart total (without tax and delivery fee)
  get cartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.cycle.price * item.quantity), 0);
  }

  // Calculate subtotal
  calculateSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.cycle.price * item.quantity), 0);
  }

  // Calculate tax
  calculateTax(): number {
    return Math.round(this.calculateSubtotal() * 0.18);
  }

  // Calculate total including tax and delivery fee
  calculateTotal(): number {
    let total = this.calculateSubtotal() + this.calculateTax();
    
    if (this.customerDetailsForm.get('orderType')?.value === 'delivery') {
      total += this.deliveryFee;
    }
    
    return total;
  }

  // Select customer
  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.customerSearchTerm = customer.name;
    
    // Pre-fill shipping address if available
    if (customer.address) {
      this.customerDetailsForm.patchValue({
        shippingAddress: customer.address
      });
    }
  }

  // Clear selected customer
  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearchTerm = '';
  }

  // Open checkout modal
  openCheckoutModal(): void {
    if (this.cartItems.length === 0) {
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
      city: '',
      pincode: '',
      deliveryInstructions: ''
    });
    
    this.showCustomerDetailsModal = true;
  }

  // Check if customer details are valid
  isCustomerDetailsValid(): boolean {
    if (this.customerDetailsForm.get('orderType')?.value === 'inStore') {
      return true;
    }
    
    return this.customerDetailsForm.valid;
  }

  // Close customer details modal
  closeCustomerDetailsModal(): void {
    this.showCustomerDetailsModal = false;
  }

  // Proceed to payment after customer details
  proceedToPayment(): void {
    if (this.customerDetailsForm.get('orderType')?.value === 'delivery' && !this.customerDetailsForm.valid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.customerDetailsForm.controls).forEach(key => {
        const control = this.customerDetailsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    // Reset payment form
    this.paymentForm.reset({
      paymentMethod: 'razorpay',
      cashAmount: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: ''
    });
    
    this.closeCustomerDetailsModal();
    this.showPaymentModal = true;
  }

  // Close payment modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  // Process payment
  processPayment(): void {
    if (this.paymentForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }
    
    const paymentMethod = this.paymentForm.value.paymentMethod;
    
    // Validation for payment methods
    if (paymentMethod === 'cash' && !this.paymentForm.value.cashAmount) {
      alert('Please enter cash amount.');
      return;
    }
    
    if (paymentMethod === 'razorpay') {
      this.initiateRazorpayPayment();
    } else {
      this.processOfflinePayment();
    }
  }

  // Process offline payment (cash)
  processOfflinePayment(): void {
    const cashAmount = +this.paymentForm.value.cashAmount;
    
    if (cashAmount < this.calculateTotal()) {
      alert('Cash amount is less than the total amount.');
      return;
    }
    
    this.createOrder('Cash');
  }

  // Initiate Razorpay payment
  initiateRazorpayPayment(): void {
    const options = {
      key: 'rzp_test_ZZl8KM6xVpzuNp', // Replace with your Razorpay Key ID
      amount: this.calculateTotal() * 100, // Amount in paise
      currency: 'INR',
      name: 'Cycle Enterprise',
      description: 'Payment for cycles purchase',
      image: 'https://example.com/your_logo.png', // Replace with your logo URL
      prefill: {
        name: this.selectedCustomer?.name,
        email: this.selectedCustomer?.email,
        contact: this.selectedCustomer?.phone
      },
      handler: (response: any) => {
        // This function is called when payment is successful
        console.log('Payment success:', response);
        this.createOrder('Razorpay', response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        }
      },
      theme: {
        color: '#3399cc'
      }
    };
    
    // Open Razorpay checkout
    const razorpayWindow = new (window as any).Razorpay(options);
    razorpayWindow.open();
  }

  // Create order after successful payment
  createOrder(paymentMethod: string, paymentId?: string): void {
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    
    // Prepare shipping address
    let shippingAddress = undefined;
    if (this.customerDetailsForm.value.orderType === 'delivery') {
      shippingAddress = `${this.customerDetailsForm.value.shippingAddress}, ${this.customerDetailsForm.value.city}, ${this.customerDetailsForm.value.pincode}`;
      if (this.customerDetailsForm.value.deliveryInstructions) {
        shippingAddress += ` (${this.customerDetailsForm.value.deliveryInstructions})`;
      }
    }
    
    // Create new order
    const newOrder: Order = {
      id: orderId,
      customerId: this.selectedCustomer!.id,
      customerName: this.selectedCustomer!.name,
      items: [...this.cartItems],
      total: this.calculateTotal(),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod,
      status: paymentMethod === 'Razorpay' ? 'processing' : 'completed',
      shippingAddress: shippingAddress,
      orderType: this.customerDetailsForm.value.orderType,
      paymentId: paymentId,
      deliveryFee: this.customerDetailsForm.value.orderType === 'delivery' ? this.deliveryFee : undefined
    };
    
    // Update stock
    this.cartItems.forEach(item => {
      const cycle = this.cycles.find(c => c.id === item.cycle.id);
      if (cycle) {
        cycle.stock -= item.quantity;
      }
    });
    
    // Add to recent orders
    this.recentOrders.unshift(newOrder);
    
    // Add to customer's purchase history
    if (this.selectedCustomer) {
      this.selectedCustomer.purchaseHistory.push(newOrder);
    }
    
    // Close modal and show success
    this.closePaymentModal();
    
    // Empty cart
    this.cartItems = [];
    
    // Show success message
    alert(`Order ${orderId} has been successfully processed!`);
  }

  // Clear cart
  clearCart(): void {
    if (confirm('Are you sure you want to clear the cart?')) {
      this.cartItems = [];
    }
  }
}
