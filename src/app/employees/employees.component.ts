import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Employee, EmployeeService, EmployeeRegisterRequest, EmployeeUpdateRequest } from '../services/employee.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
  // Employee Form
  employeeForm: FormGroup;
  registerForm: FormGroup;
  
  // Employee data
  employees: Employee[] = [];
  isLoading = false;
  showRegisterForm = false;
  
  // Available roles and permissions
  roles: string[] = ['Manager', 'Sales Associate', 'Inventory Specialist', 'Technician', 'Cashier', 'Admin'];
  
  permissionOptions: { value: string, label: string }[] = [
    { value: 'manage_inventory', label: 'Manage Inventory' },
    { value: 'manage_employees', label: 'Manage Employees' },
    { value: 'manage_sales', label: 'Manage Sales' },
    { value: 'view_reports', label: 'View Reports' },
    { value: 'view_inventory', label: 'View Inventory' },
    { value: 'manage_customers', label: 'Manage Customers' }
  ];
  
  // Selected employee for editing
  selectedEmployee: Employee | null = null;
  
  // For filtering and searching
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  
  constructor(
    private fb: FormBuilder, 
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) {
    // Initialize edit form
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{value: '', disabled: true}],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],  // Changed from phone to phoneNumber with same validation as registration form
      address: [''],
      role: ['Employee'],  // Default role is Employee
      joinDate: [{value: '', disabled: true}],
      salary: [null, [Validators.min(0)]],
      permissions: [[]]
    });
    
    // Initialize register form
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],  // Changed from phone to phoneNumber and increased max digits
      address: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }
  
  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.notificationService.showError('Failed to load employees');
        this.isLoading = false;
      }
    });
  }

  // Reset form
  resetForm(): void {
    this.employeeForm.reset();
    this.selectedEmployee = null;
    this.showRegisterForm = false;
  }

  // Show register form
  showRegistrationForm(): void {
    this.resetForm();
    this.showRegisterForm = true;
  }

  // Register new employee
  registerEmployee(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const employeeData: EmployeeRegisterRequest = this.registerForm.value;
      
      this.employeeService.registerEmployee(employeeData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Employee registered successfully');
          this.loadEmployees();
          this.registerForm.reset();
          this.showRegisterForm = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error registering employee:', error);
          this.notificationService.showError('Failed to register employee');
          this.isLoading = false;
        }
      });
    }
  }

  // Edit employee
  editEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.showRegisterForm = false;
    
    this.employeeForm.patchValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber || '',  // Changed from phone to phoneNumber
      role: employee.role || 'Employee',  // Default to Employee if not set
      joinDate: employee.joinDate || new Date().toISOString().split('T')[0],
      address: employee.address || '',
      salary: employee.salary || null,
      permissions: employee.permissions || []
    });
  }

  // Update employee
  updateEmployee(): void {
    if (this.employeeForm.valid && this.selectedEmployee) {
      this.isLoading = true;
      
      const employeeData: EmployeeUpdateRequest = {
        firstName: this.employeeForm.value.firstName,
        lastName: this.employeeForm.value.lastName,
        phoneNumber: this.employeeForm.value.phoneNumber, // Changed to use phoneNumber instead of phone
        role: this.employeeForm.value.role,
        address: this.employeeForm.value.address,
        salary: this.employeeForm.value.salary,
        permissions: this.employeeForm.value.permissions
      };
      
      this.employeeService.updateEmployee(this.selectedEmployee.userId, employeeData).subscribe({
        next: () => {
          this.notificationService.showSuccess(`Employee ID ${this.selectedEmployee?.userId} updated successfully`);
          this.loadEmployees();
          this.resetForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error updating employee ID ${this.selectedEmployee?.userId}:`, error);
          this.notificationService.showError('Failed to update employee');
          this.isLoading = false;
        }
      });
    }
  }

  // Delete employee
  deleteEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
      this.isLoading = true;
      
      this.employeeService.deleteEmployee(employee.userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Employee deleted successfully');
          this.loadEmployees();
          if (this.selectedEmployee?.userId === employee.userId) {
            this.resetForm();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.notificationService.showError('Failed to delete employee');
          this.isLoading = false;
        }
      });
    }
  }

  // Toggle employee status
  toggleStatus(employee: Employee): void {
    // Display confirmation with employee ID
    const action = employee.isActive ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} employee ${employee.firstName} ${employee.lastName} (ID: ${employee.userId})?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    this.isLoading = true;
    
    if (employee.isActive) {
      // Currently active, so deactivate
      this.employeeService.deactivateEmployee(employee.userId).subscribe({
        next: () => {
          employee.isActive = false;
          this.notificationService.showSuccess(`Employee ID ${employee.userId} deactivated successfully`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error deactivating employee ID ${employee.userId}:`, error);
          this.notificationService.showError('Failed to deactivate employee');
          this.isLoading = false;
        }
      });
    } else {
      // Currently inactive, so activate
      this.employeeService.activateEmployee(employee.userId).subscribe({
        next: () => {
          employee.isActive = true;
          this.notificationService.showSuccess(`Employee ID ${employee.userId} activated successfully`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error activating employee ID ${employee.userId}:`, error);
          this.notificationService.showError('Failed to activate employee');
          this.isLoading = false;
        }
      });
    }
  }

  // Check if permission is selected
  isPermissionSelected(permission: string): boolean {
    return this.employeeForm.value.permissions?.includes(permission) || false;
  }

  // Toggle permission selection
  togglePermission(permission: string): void {
    const permissions = [...(this.employeeForm.value.permissions || [])];
    const index = permissions.indexOf(permission);
    
    if (index === -1) {
      permissions.push(permission);
    } else {
      permissions.splice(index, 1);
    }
    
    this.employeeForm.patchValue({ permissions });
  }

  // Filter employees by search term and status
  get filteredEmployees(): Employee[] {
    return this.employees
      .filter(employee => 
        (this.statusFilter === 'all' || 
         (this.statusFilter === 'active' && employee.isActive) || 
         (this.statusFilter === 'inactive' && !employee.isActive)) &&
        (this.searchTerm === '' || 
          `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (employee.role && employee.role.toLowerCase().includes(this.searchTerm.toLowerCase()))
        )
      );
  }
  
  // Get full name of employee
  getFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }
}
