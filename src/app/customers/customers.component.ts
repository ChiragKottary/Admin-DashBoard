import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICustomer } from '../app.models';
import { CustomerService, CustomerResponse, CustomerRequest, CustomerFilterOptions } from '../services/customer.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  // Make Math available to template
  Math = Math;
  
  // Customer Form
  customerForm: FormGroup;
  
  // Selected customer for editing
  selectedCustomer: CustomerResponse | null = null;
  
  // For filtering and searching
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Loading state
  loading: boolean = false;
  
  // List of Indian states for dropdown
  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
  ];
  
  // Customer data
  customers: CustomerResponse[] = [];
  
  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {
    // Initialize form
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      hasActiveCart: [true],
      preferredLanguage: ['English'],
      marketingPreferences: ['Email'],
      referralSource: [''],
      password: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadCustomers();
  }
  
  // Load customers from API with filters
  loadCustomers(): void {
    this.loading = true;
    
    const filterOptions: CustomerFilterOptions = {
      searchTerm: this.searchTerm.trim() !== '' ? this.searchTerm : undefined,
      status: this.statusFilter
    };
    
    this.customerService.getCustomers(this.currentPage, this.pageSize, filterOptions)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.customers = response.items;
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          console.error('Error loading customers', error);
          alert('Failed to load customers. Please try again later.');
        }
      });
  }
  
  // Handle pagination
  goToPage(page: number): void {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCustomers();
    }
  }
  
  // Reset form
  resetForm(): void {
    this.customerForm.reset({
      hasActiveCart: true,
      preferredLanguage: 'English',
      marketingPreferences: 'Email'
    });
    this.selectedCustomer = null;
  }
  
  // Add new customer
  addCustomer(): void {
    if (this.customerForm.valid) {
      const customerData: CustomerRequest = {
        firstName: this.customerForm.value.firstName,
        lastName: this.customerForm.value.lastName,
        email: this.customerForm.value.email,
        phone: this.customerForm.value.phone,
        address: this.customerForm.value.address,
        city: this.customerForm.value.city,
        state: this.customerForm.value.state,
        postalCode: this.customerForm.value.postalCode,
        password: this.customerForm.value.password
      };
      
      this.loading = true;
      this.customerService.createCustomer(customerData)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            alert('Customer added successfully');
            this.resetForm();
            this.loadCustomers();
          },
          error: (error) => {
            console.error('Error creating customer', error);
            alert('Failed to add customer. Please try again.');
          }
        });
    }
  }
  
  // Edit customer
  editCustomer(customer: CustomerResponse): void {
    this.loading = true;
    this.customerService.getCustomer(customer.customerId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.selectedCustomer = response;
          this.customerForm.patchValue({
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            phone: response.phone,
            address: response.address,
            city: response.city,
            state: response.state,
            postalCode: response.postalCode,
            hasActiveCart: response.hasActiveCart,
            preferredLanguage: response.preferredLanguage || 'English',
            marketingPreferences: response.marketingPreferences || 'Email',
            referralSource: response.referralSource,
            password: '' // Clear password field for security
          });
        },
        error: (error) => {
          console.error('Error fetching customer details', error);
          alert('Failed to load customer details. Please try again.');
        }
      });
  }
  
  // Update customer
  updateCustomer(): void {
    if (this.customerForm.valid && this.selectedCustomer) {
      const customerData: CustomerRequest = {
        firstName: this.customerForm.value.firstName,
        lastName: this.customerForm.value.lastName,
        email: this.customerForm.value.email,
        phone: this.customerForm.value.phone,
        address: this.customerForm.value.address,
        city: this.customerForm.value.city,
        state: this.customerForm.value.state,
        postalCode: this.customerForm.value.postalCode,
        hasActiveCart: this.customerForm.value.hasActiveCart,
        preferredLanguage: this.customerForm.value.preferredLanguage,
        marketingPreferences: this.customerForm.value.marketingPreferences,
        referralSource: this.customerForm.value.referralSource,
        // Only include password if it's provided (not empty)
        ...(this.customerForm.value.password ? { password: this.customerForm.value.password } : {})
      };
      
      this.loading = true;
      this.customerService.updateCustomer(this.selectedCustomer.customerId, customerData)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            alert('Customer updated successfully');
            this.resetForm();
            this.loadCustomers();
          },
          error: (error) => {
            console.error('Error updating customer', error);
            alert('Failed to update customer. Please try again.');
          }
        });
    }
  }
  
  // Delete customer
  deleteCustomer(customer: CustomerResponse): void {
    if (confirm(`Are you sure you want to delete customer ${customer.firstName} ${customer.lastName}?`)) {
      this.loading = true;
      this.customerService.deleteCustomer(customer.customerId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            alert('Customer deleted successfully');
            if (this.selectedCustomer?.customerId === customer.customerId) {
              this.resetForm();
            }
            this.loadCustomers();
          },
          error: (error) => {
            console.error('Error deleting customer', error);
            alert('Failed to delete customer. Please try again.');
          }
        });
    }
  }
  
  // Toggle customer status
  toggleCustomerStatus(customer: CustomerResponse): void {
    // Toggle the status locally first for immediate UI feedback
    customer.hasActiveCart = !customer.hasActiveCart;
    
    // Prepare the data for the API call
    const customerData: CustomerRequest = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      hasActiveCart: customer.hasActiveCart,
      preferredLanguage: customer.preferredLanguage,
      marketingPreferences: customer.marketingPreferences,
      referralSource: customer.referralSource
    };
    
    // Call the API to update the customer status
    this.customerService.updateCustomer(customer.customerId, customerData)
      .subscribe({
        next: () => {
          // Success - no need to do anything as we've already updated the UI
          const statusText = customer.hasActiveCart ? 'active cart enabled' : 'active cart disabled';
          console.log(`Customer ${customer.firstName} ${customer.lastName} ${statusText} successfully`);
        },
        error: (error) => {
          // Revert the local change if API call fails
          customer.hasActiveCart = !customer.hasActiveCart;
          console.error('Error updating customer cart status:', error);
          alert(`Failed to update customer cart status. Please try again.`);
        }
      });
  }
  
  // Format date for display
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-IN');
  }
  
  // Get full name helper
  getFullName(customer: CustomerResponse): string {
    return customer.fullName || `${customer.firstName} ${customer.lastName}`;
  }
  
  // Apply filters
  applyFilters(): void {
    this.currentPage = 1;
    this.loadCustomers();
  }
  
  // Reset filters
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadCustomers();
  }
  
  // Filter customers by search term and status without API call (for quick filtering)
  applyQuickFilters(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = status;
    this.applyFilters();
  }
}
