import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICustomer } from '../app.models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  // Customer Form
  customerForm: FormGroup;
  
  // Selected customer for editing
  selectedCustomer: ICustomer | null = null;
  
  // For filtering and searching
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  
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
  
  // Mock customer data
  customers: ICustomer[] = [
    {
      customerId: '1',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      address: '123 Park Street, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      registrationDate: new Date('2024-02-15'),
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15'),
      isActive: true,
      preferredLanguage: 'English',
      marketingPreferences: 'Email',
      referralSource: 'Google'
    },
    {
      customerId: '2',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@example.com',
      phone: '8765432109',
      address: '456 Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400002',
      registrationDate: new Date('2024-03-20'),
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date('2024-03-20'),
      isActive: true,
      preferredLanguage: 'Hindi',
      marketingPreferences: 'Both',
      referralSource: 'Friend'
    },
    {
      customerId: '3',
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit.kumar@example.com',
      phone: '7654321098',
      address: '789 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      registrationDate: new Date('2024-01-10'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-03-22'),
      isActive: false,
      preferredLanguage: 'English',
      marketingPreferences: 'None',
      referralSource: 'Social Media'
    },
    {
      customerId: '4',
      firstName: 'Deepa',
      lastName: 'Singh',
      email: 'deepa.singh@example.com',
      phone: '6543210987',
      address: '234 Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
      registrationDate: new Date('2023-12-05'),
      createdAt: new Date('2023-12-05'),
      updatedAt: new Date('2023-12-05'),
      isActive: true,
      preferredLanguage: 'Hindi',
      marketingPreferences: 'SMS',
      referralSource: 'Advertisement'
    },
    {
      customerId: '5',
      firstName: 'Vikram',
      lastName: 'Reddy',
      email: 'vikram.reddy@example.com',
      phone: '9876123450',
      address: '567 Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500033',
      registrationDate: new Date('2024-04-01'),
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-01'),
      isActive: true,
      preferredLanguage: 'Telugu',
      marketingPreferences: 'Email',
      referralSource: 'Google'
    }
  ];
  
  constructor(private fb: FormBuilder) {
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
      isActive: [true],
      preferredLanguage: ['English'],
      marketingPreferences: ['Email'],
      referralSource: ['']
    });
  }
  
  ngOnInit(): void {
    // Any additional initialization
  }
  
  // Reset form
  resetForm(): void {
    this.customerForm.reset({
      isActive: true,
      preferredLanguage: 'English',
      marketingPreferences: 'Email'
    });
    this.selectedCustomer = null;
  }
  
  // Add new customer
  addCustomer(): void {
    if (this.customerForm.valid) {
      // Generate customer ID (normally handled by backend)
      const newId = (Math.max(...this.customers.map(c => parseInt(c.customerId))) + 1).toString();
      const currentDate = new Date();
      
      const newCustomer: ICustomer = {
        customerId: newId,
        firstName: this.customerForm.value.firstName,
        lastName: this.customerForm.value.lastName,
        email: this.customerForm.value.email,
        phone: this.customerForm.value.phone,
        address: this.customerForm.value.address,
        city: this.customerForm.value.city,
        state: this.customerForm.value.state,
        postalCode: this.customerForm.value.postalCode,
        registrationDate: currentDate,
        createdAt: currentDate,
        updatedAt: currentDate,
        isActive: this.customerForm.value.isActive,
        preferredLanguage: this.customerForm.value.preferredLanguage,
        marketingPreferences: this.customerForm.value.marketingPreferences,
        referralSource: this.customerForm.value.referralSource
      };
      
      this.customers.push(newCustomer);
      this.resetForm();
    }
  }
  
  // Edit customer
  editCustomer(customer: ICustomer): void {
    this.selectedCustomer = customer;
    this.customerForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      isActive: customer.isActive,
      preferredLanguage: customer.preferredLanguage || 'English',
      marketingPreferences: customer.marketingPreferences || 'Email',
      referralSource: customer.referralSource
    });
  }
  
  // Update customer
  updateCustomer(): void {
    if (this.customerForm.valid && this.selectedCustomer) {
      const index = this.customers.findIndex(c => c.customerId === this.selectedCustomer!.customerId);
      
      if (index !== -1) {
        this.customers[index] = {
          ...this.selectedCustomer,
          firstName: this.customerForm.value.firstName,
          lastName: this.customerForm.value.lastName,
          email: this.customerForm.value.email,
          phone: this.customerForm.value.phone,
          address: this.customerForm.value.address,
          city: this.customerForm.value.city,
          state: this.customerForm.value.state,
          postalCode: this.customerForm.value.postalCode,
          isActive: this.customerForm.value.isActive,
          preferredLanguage: this.customerForm.value.preferredLanguage,
          marketingPreferences: this.customerForm.value.marketingPreferences,
          referralSource: this.customerForm.value.referralSource,
          updatedAt: new Date()
        };
        
        this.resetForm();
      }
    }
  }
  
  // Delete customer
  deleteCustomer(customer: ICustomer): void {
    if (confirm(`Are you sure you want to delete customer ${customer.firstName} ${customer.lastName}?`)) {
      this.customers = this.customers.filter(c => c.customerId !== customer.customerId);
      if (this.selectedCustomer?.customerId === customer.customerId) {
        this.resetForm();
      }
    }
  }
  
  // Toggle customer status
  toggleCustomerStatus(customer: ICustomer): void {
    customer.isActive = !customer.isActive;
    customer.updatedAt = new Date();
  }
  
  // Format date for display
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN');
  }
  
  // Get full name helper
  getFullName(customer: ICustomer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }
  
  // Filter customers by search term and status
  get filteredCustomers(): ICustomer[] {
    let filtered = [...this.customers];
    
    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(customer => 
        this.statusFilter === 'active' ? customer.isActive : !customer.isActive
      );
    }
    
    // Search term
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(term) || 
        customer.lastName.toLowerCase().includes(term) || 
        customer.email.toLowerCase().includes(term) || 
        customer.phone.includes(term) || 
        customer.city.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }
}
