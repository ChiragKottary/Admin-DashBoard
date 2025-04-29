import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { EmployeeService, Employee, EmployeeUpdateRequest } from '../../services/employee.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  employeeDetails: Employee | null = null;
  profileForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  
  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) { 
    this.profileForm = this.fb.group({
      email: [{value: '', disabled: true}],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.user = this.authService.getCurrentUser();
    
    if (this.user && this.user.userId) {
      this.employeeService.getEmployeeById(this.user.userId).subscribe({
        next: (employeeData) => {
          this.employeeDetails = employeeData;
          this.updateFormWithEmployeeData(employeeData);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching employee details:', error);
          this.notificationService.showError('Failed to load profile details');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  updateFormWithEmployeeData(employee: Employee): void {
    this.profileForm.patchValue({
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.phoneNumber || '',
      address: employee.address || ''
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Reset form when canceling edit
      if (this.employeeDetails) {
        this.updateFormWithEmployeeData(this.employeeDetails);
      }
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.user?.userId) {
      return;
    }

    this.isLoading = true;
    const updateData: EmployeeUpdateRequest = {
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      phoneNumber: this.profileForm.get('phoneNumber')?.value,
      address: this.profileForm.get('address')?.value
    };

    this.employeeService.updateEmployee(this.user.userId, updateData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Profile updated successfully');
        this.isLoading = false;
        this.isEditMode = false;
        this.loadUserProfile(); // Reload the profile data
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.notificationService.showError('Failed to update profile');
        this.isLoading = false;
      }
    });
  }
}
