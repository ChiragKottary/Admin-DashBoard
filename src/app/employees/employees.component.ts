import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinDate: string;
  status: 'active' | 'inactive';
  address?: string;
  salary?: number;
  permissions: string[];
}

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
  
  // Employee data
  employees: Employee[] = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@cycleenterprise.com',
      phone: '9876543210',
      role: 'Manager',
      joinDate: '2023-02-15',
      status: 'active',
      address: '123 Main Street, Mumbai',
      salary: 45000,
      permissions: ['manage_inventory', 'manage_employees', 'manage_sales', 'view_reports']
    },
    {
      id: 2,
      name: 'Priya Singh',
      email: 'priya@cycleenterprise.com',
      phone: '8765432109',
      role: 'Sales Associate',
      joinDate: '2023-05-10',
      status: 'active',
      address: '456 Park Avenue, Delhi',
      salary: 28000,
      permissions: ['manage_sales', 'view_inventory']
    },
    {
      id: 3,
      name: 'Amit Sharma',
      email: 'amit@cycleenterprise.com',
      phone: '7654321098',
      role: 'Inventory Specialist',
      joinDate: '2023-08-22',
      status: 'active',
      address: '789 Lake View, Bangalore',
      salary: 32000,
      permissions: ['manage_inventory', 'view_reports']
    },
    {
      id: 4,
      name: 'Neha Patel',
      email: 'neha@cycleenterprise.com',
      phone: '6543210987',
      role: 'Sales Associate',
      joinDate: '2024-01-05',
      status: 'active',
      address: '234 Green Road, Chennai',
      salary: 26000,
      permissions: ['manage_sales', 'view_inventory']
    },
    {
      id: 5,
      name: 'Vikram Roy',
      email: 'vikram@cycleenterprise.com',
      phone: '5432109876',
      role: 'Technician',
      joinDate: '2023-11-15',
      status: 'inactive',
      address: '567 Tech Lane, Hyderabad',
      salary: 30000,
      permissions: ['manage_inventory', 'view_reports']
    }
  ];
  
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
  
  constructor(private fb: FormBuilder) {
    // Initialize form
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      joinDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['active', Validators.required],
      address: [''],
      salary: [null, [Validators.min(0)]],
      permissions: [[], Validators.required]
    });
  }

  ngOnInit(): void {
  }

  // Reset form
  resetForm(): void {
    this.employeeForm.reset({
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      permissions: []
    });
    this.selectedEmployee = null;
  }

  // Add new employee
  addEmployee(): void {
    if (this.employeeForm.valid) {
      const newId = this.employees.length > 0 ? Math.max(...this.employees.map(e => e.id)) + 1 : 1;
      const newEmployee: Employee = {
        id: newId,
        ...this.employeeForm.value
      };
      this.employees.push(newEmployee);
      this.resetForm();
    }
  }

  // Edit employee
  editEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.employeeForm.patchValue({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      joinDate: employee.joinDate,
      status: employee.status,
      address: employee.address || '',
      salary: employee.salary || null,
      permissions: employee.permissions || []
    });
  }

  // Update employee
  updateEmployee(): void {
    if (this.employeeForm.valid && this.selectedEmployee) {
      const index = this.employees.findIndex(e => e.id === this.selectedEmployee!.id);
      if (index !== -1) {
        this.employees[index] = {
          ...this.selectedEmployee,
          ...this.employeeForm.value
        };
        this.resetForm();
      }
    }
  }

  // Delete employee
  deleteEmployee(employee: Employee): void {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      this.employees = this.employees.filter(e => e.id !== employee.id);
      if (this.selectedEmployee?.id === employee.id) {
        this.resetForm();
      }
    }
  }

  // Toggle employee status
  toggleStatus(employee: Employee): void {
    employee.status = employee.status === 'active' ? 'inactive' : 'active';
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
        (this.statusFilter === 'all' || employee.status === this.statusFilter) &&
        (this.searchTerm === '' || 
          employee.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          employee.role.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
  }
}
