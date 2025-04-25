import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

interface CartItem {
  cycle: Cycle;
  quantity: number;
}

interface Order {
  id: string;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
  paymentId?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  // Filters
  statusFilter: string = 'all';
  dateFilter: string = 'all';
  searchTerm: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalOrders: number = 0;
  hasMorePages: boolean = false;
  
  // Selected order for details view
  selectedOrder: Order | null = null;
  
  // Mock data for orders
  orders: Order[] = [
    {
      id: 'ORD-1234',
      customerId: 1,
      customerName: 'Rahul Sharma',
      customerEmail: 'rahul@example.com',
      customerPhone: '9876543210',
      shippingAddress: '123 Main Street, Mumbai, Maharashtra 400001',
      items: [
        { 
          cycle: {
            id: 1, 
            name: 'Mountain Explorer Pro', 
            category: 'Mountain Bikes', 
            brand: 'TrekCycle', 
            price: 24999, 
            stock: 10
          },
          quantity: 1
        }
      ],
      total: 24999,
      date: '2025-04-22',
      paymentMethod: 'Card',
      status: 'completed',
      paymentId: 'PAY-RAZR-12345'
    },
    {
      id: 'ORD-1235',
      customerId: 2,
      customerName: 'Priya Singh',
      customerEmail: 'priya@example.com',
      customerPhone: '8765432109',
      items: [
        { 
          cycle: {
            id: 5, 
            name: 'Kids Explorer', 
            category: 'Kids Bikes', 
            brand: 'JuniorRide', 
            price: 6500, 
            stock: 18
          },
          quantity: 1
        }
      ],
      total: 6500,
      date: '2025-04-23',
      paymentMethod: 'Cash',
      status: 'completed'
    },
    {
      id: 'ORD-1236',
      customerId: 3,
      customerName: 'Amit Kumar',
      customerEmail: 'amit@example.com',
      customerPhone: '7654321098',
      shippingAddress: '45 Park Avenue, Delhi, Delhi 110001',
      items: [
        { 
          cycle: {
            id: 2, 
            name: 'City Cruiser', 
            category: 'City Bikes', 
            brand: 'UrbanRide', 
            price: 15999, 
            stock: 15
          },
          quantity: 1
        },
        { 
          cycle: {
            id: 3, 
            name: 'Road Master', 
            category: 'Road Bikes', 
            brand: 'SpeedCycle', 
            price: 34999, 
            stock: 5
          },
          quantity: 1
        }
      ],
      total: 50998,
      date: '2025-04-24',
      paymentMethod: 'Card',
      status: 'processing',
      paymentId: 'PAY-RAZR-12346'
    },
    {
      id: 'ORD-1237',
      customerId: 4,
      customerName: 'Deepa Patel',
      customerEmail: 'deepa@example.com',
      customerPhone: '6543210987',
      shippingAddress: '789 Lake View, Bangalore, Karnataka 560001',
      items: [
        { 
          cycle: {
            id: 4, 
            name: 'Hybrid Commuter', 
            category: 'Hybrid Bikes', 
            brand: 'CommutePro', 
            price: 18999, 
            stock: 8
          },
          quantity: 2
        }
      ],
      total: 37998,
      date: '2025-04-24',
      paymentMethod: 'Card',
      status: 'pending',
      paymentId: 'PAY-RAZR-12347'
    }
  ];
  
  // Filtered orders based on applied filters
  filteredOrders: Order[] = [];
  
  constructor() {}
  
  ngOnInit(): void {
    this.applyFilters();
  }
  
  // Apply all filters
  applyFilters(): void {
    let filtered = [...this.orders];
    
    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }
    
    // Date filter
    if (this.dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch(this.dateFilter) {
        case 'today':
          filtered = filtered.filter(order => order.date === todayStr);
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.date) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.date) >= monthAgo);
          break;
      }
    }
    
    // Search term
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(term) || 
        order.customerName.toLowerCase().includes(term)
      );
    }
    
    // Update filtered orders and pagination info
    this.totalOrders = filtered.length;
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredOrders = filtered.slice(startIndex, startIndex + this.itemsPerPage);
    
    this.hasMorePages = startIndex + this.itemsPerPage < filtered.length;
  }
  
  // Reset all filters
  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateFilter = 'all';
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }
  
  // View order details
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
  }
  
  // Close order details modal
  closeOrderDetails(): void {
    this.selectedOrder = null;
  }
  
  // Print invoice
  printInvoice(order: Order): void {
    console.log('Printing invoice for order:', order.id);
    // In a real app, implement actual printing functionality here
    alert(`Printing invoice for order ${order.id}`);
  }
  
  // Get CSS class for status badge
  getStatusClass(status: string): string {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Calculate subtotal for an order (before tax)
  calculateSubtotal(order: Order): number {
    return order.total / 1.18; // Assuming 18% tax
  }
  
  // Calculate tax amount for an order
  calculateTax(order: Order): number {
    return order.total - this.calculateSubtotal(order);
  }
}
