import { Component, OnInit, HostListener, ElementRef, ViewChild, Renderer2, OnDestroy } from '@angular/core';
import { OrderService, PaginatedResponse } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { OrderStatus } from '../models/order-status.enum';
// Fix the import path by moving up to the correct level
import { Order, OrderItem } from '../models/order.model';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class OrdersComponent implements OnInit, OnDestroy {
  // Make enum available to template
  OrderStatus = OrderStatus;
  Math = Math; // Make Math available in template
  
  // Orders data
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder: Order | null = null;
  isLoading = true;
  totalOrders = 0;
  
  // Server-side Pagination
  currentPage = 1;
  itemsPerPage = 7; // Default matching backend
  totalPages = 1;
  hasNextServerPage = false;
  hasPreviousServerPage = false;
  
  get hasPreviousPage(): boolean {
    return this.hasPreviousServerPage;
  }
  
  get hasNextPage(): boolean {
    return this.hasNextServerPage;
  }
  
  // Return orders for display
  get pagedOrders(): Order[] {
    return this.orders;
  }

  // Calculate page numbers to show in pagination
  get visiblePages(): number[] {
    const delta = 1; // Number of pages to show before and after current page
    const range: number[] = [];
    
    if (this.totalPages <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always include current page and delta pages on either side
      const lower = Math.max(1, this.currentPage - delta);
      const upper = Math.min(this.totalPages, this.currentPage + delta);
      
      for (let i = lower; i <= upper; i++) {
        range.push(i);
      }
    }
    
    return range;
  }

  // Filter states
  statusFilter: string = 'all';
  dateFilter: string = 'all';
  searchTerm: string = '';

  // Dropdown management
  activeDropdownId: string | null = null;
  dropdownOpen = false;
  statusUpdateNotes: string = '';
  private subscriptions: Subscription = new Subscription();

  @ViewChild('statusDropdown') statusDropdown!: ElementRef;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading = true;
    console.log('Loading orders for page:', this.currentPage);
    
    const sub = this.orderService.getOrders(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        console.log('Orders response:', response);
        if (response) {
          this.orders = response.items || [];
          this.totalOrders = response.totalItems || 0;
          this.currentPage = response.pageNumber || 1;
          this.totalPages = response.totalPages || 1;
          this.hasNextServerPage = response.hasNextPage || false;
          this.hasPreviousServerPage = response.hasPreviousPage || false;
          
          console.log(`Loaded ${this.orders.length} orders, page ${this.currentPage}/${this.totalPages}`);
        } else {
          this.orders = [];
          this.totalOrders = 0;
          console.error('Empty response received');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.notificationService.showError('Failed to load orders. Please try again later.');
        this.isLoading = false;
        this.orders = [];
      }
    });
    
    this.subscriptions.add(sub);
  }

  applyFilters(): void {
    // Reset to first page when applying filters
    this.currentPage = 1;
    this.loadOrders();
    // Note: Server-side filtering would ideally be implemented here
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.dateFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  // Update page size and reload
  updatePageSize(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1; // Reset to first page
    this.loadOrders();
  }

  viewOrderDetails(order: Order): void {
    // Prevent duplicate clicks
    if (this.selectedOrder?.orderId === order.orderId) return;
    
    this.selectedOrder = { ...order };
    this.closeAllDropdowns();
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  printInvoice(order: Order): void {
    // This would typically generate and open a print-friendly invoice
    console.log('Printing invoice for order:', order.orderNumber);
    this.notificationService.showInfo('Preparing invoice for printing...');
    
    // Example of invoice generation - would be replaced with actual implementation
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #2563EB; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f3f4f6; }
              .total { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Invoice: ${order.orderNumber}</h1>
            <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
            <p>Customer: ${order.customerName}</p>
            <h2>Order Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.orderItems.map((item: OrderItem) => `
                  <tr>
                    <td>${item.cycleName}</td>
                    <td>₹${item.unitPrice.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total">
                  <td colspan="3">Total</td>
                  <td>₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
    } else {
      this.notificationService.showError('Could not open print window. Please check your popup blocker settings.');
    }
  }

  calculateSubtotal(order: Order): number {
    return order.orderItems.reduce((sum: number, item: OrderItem) => sum + item.subtotal, 0);
  }

  calculateTax(order: Order): number {
    // Assuming 18% tax rate
    const subtotal = this.calculateSubtotal(order);
    return subtotal * 0.18;
  }

  toggleOrderDropdown(orderId: string, event: Event): void {
    // Prevent this from triggering document click
    event.stopPropagation();
    
    // Toggle dropdown for this order
    if (this.activeDropdownId === orderId) {
      this.activeDropdownId = null;
    } else {
      this.activeDropdownId = orderId;
      // Close modal dropdown if open
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    // Toggle dropdown in the modal
    this.dropdownOpen = !this.dropdownOpen;
    // Close table dropdowns if open
    this.activeDropdownId = null;
  }

  closeAllDropdowns(): void {
    this.activeDropdownId = null;
    this.dropdownOpen = false;
  }

  // Method to handle clicking outside of dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Check if click was outside dropdown
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    // Convert enum value to string status
    const statusString = this.getStatusLabel(newStatus);
    
    // Create payload for API
    const statusUpdate = {
      orderId: order.orderId,
      status: statusString, // Send string status instead of numeric enum
      notes: this.statusUpdateNotes || undefined
    };
    
    console.log('Updating order status:', statusUpdate);
    
    // Call API to update status
    this.orderService.updateOrderStatus(statusUpdate).subscribe({
      next: () => {
        // Update local order object
        order.status = newStatus;
        
        // If the selected order is the same, update it too
        if (this.selectedOrder && this.selectedOrder.orderId === order.orderId) {
          this.selectedOrder.status = newStatus;
        }
        
        this.notificationService.showSuccess(`Order status updated to ${statusString}`);
        this.closeAllDropdowns();
        this.statusUpdateNotes = ''; // Reset notes
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.notificationService.showError('Failed to update order status. Please try again.');
      }
    });
  }

  getStatusLabel(status?: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'Pending';
      case OrderStatus.PROCESSING: return 'Processing';
      case OrderStatus.SHIPPED: return 'Shipped';
      case OrderStatus.DELIVERED: return 'Delivered';
      case OrderStatus.CANCELLED: return 'Cancelled';
      case OrderStatus.REFUNDED: return 'Refunded';
      default: return 'Unknown';
    }
  }

  getStatusClass(status?: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Check user permissions
  hasRole(roleName: string): boolean {
    return this.authService.hasRole(roleName);
  }

  // Handler for the simplified status dropdown change event
  onStatusChanged(event: Event, order: Order): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = parseInt(select.value) as OrderStatus;
    
    // Prevent unnecessary status updates
    if (newStatus === order.status) {
      return;
    }
    
    // Confirm before changing to cancelled or refunded status
    if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.REFUNDED) {
      if (!confirm(`Are you sure you want to mark this order as ${this.getStatusLabel(newStatus)}?`)) {
        // Reset the dropdown to the original value if user cancels
        select.value = order.status.toString();
        return;
      }
    }
    
    // Update the order status
    this.updateOrderStatus(order, newStatus);
  }

  // Check if the current user can change the status
  canChangeStatus(status?: OrderStatus): boolean {
    // Only Admin and Managers can cancel or refund orders
    if ((status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) && 
        !(this.hasRole('Admin') || this.hasRole('Manager'))) {
      return false;
    }
    
    return true;
  }
}
