import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Employee {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: string;
  joinDate?: string;
  isActive: boolean;
  address?: string;
  salary?: number;
  permissions?: string[];
}

export interface EmployeeRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;  // Changed from phone to phoneNumber
  address: string;
}

export interface EmployeeUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;  // Changed from phone to phoneNumber
  address?: string;
  role?: string;
  salary?: number;
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all employees
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/Employee`);
  }

  // Get employee by ID
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/Employee/${id}`);
  }

  // Register new employee
  registerEmployee(employeeData: EmployeeRegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/register/Employee`, employeeData);
  }

  // Update employee
  updateEmployee(id: string, employeeData: EmployeeUpdateRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employee/${id}`, employeeData);
  }

  // Delete employee
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Employee/${id}`);
  }

  // Activate employee
  activateEmployee(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/Employee/${id}/activate`, {});
  }

  // Deactivate employee
  deactivateEmployee(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/Employee/${id}/deactivate`, {});
  }
}