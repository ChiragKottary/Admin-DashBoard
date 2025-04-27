import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer, PagedResponse } from '../app.models';

// Define interfaces for Customer API responses
export interface CustomerResponse extends ICustomer {
  fullName: string;
  hasActiveCart: boolean;
  totalOrders: number;
  activeCart: any;
}

export interface CustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  password?: string;
  hasActiveCart?: boolean;
  preferredLanguage?: string;
  marketingPreferences?: string;
  referralSource?: string;
}

export interface CustomerFilterOptions {
  searchTerm?: string;
  status?: 'all' | 'active' | 'inactive';
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'https://localhost:7042/api/Customers';

  constructor(private http: HttpClient) { }

  // Get all customers with pagination and filtering
  getCustomers(
    pageNumber: number = 1, 
    pageSize: number = 10,
    filterOptions?: CustomerFilterOptions
  ): Observable<PagedResponse<CustomerResponse>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    // Add filters if provided
    if (filterOptions) {
      if (filterOptions.searchTerm) {
        params = params.set('searchTerm', filterOptions.searchTerm);
      }
      
      if (filterOptions.status && filterOptions.status !== 'all') {
        params = params.set('hasActiveCart', (filterOptions.status === 'active').toString());
      }
    }
    
    return this.http.get<PagedResponse<CustomerResponse>>(this.apiUrl, { params });
  }

  // Get a specific customer by ID
  getCustomer(id: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
  }

  // Create a new customer
  createCustomer(customer: CustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.apiUrl, customer);
  }

  // Update an existing customer
  updateCustomer(id: string, customer: CustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, customer);
  }

  // Delete a customer
  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}