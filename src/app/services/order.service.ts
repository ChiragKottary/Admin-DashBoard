import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/Order`;  // Changed from 'orders' to 'Order' to match backend API

  constructor(private http: HttpClient) { }

  getOrders(pageNumber: number = 1, pageSize: number = 7): Observable<PaginatedResponse<Order>> {
    console.log(`Fetching orders from: ${this.apiUrl}, page: ${pageNumber}, size: ${pageSize}`);
    
    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<PaginatedResponse<Order>>(this.apiUrl, { params }).pipe(
      tap(response => {
        console.log('Paginated orders received:', response);
      }),
      catchError(this.handleError<PaginatedResponse<Order>>('getOrders', {
        items: [],
        totalItems: 0,
        pageNumber: 1,
        pageSize: pageSize,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false
      }))
    );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<Order>(`getOrderById id=${id}`))
    );
  }

  // Add method to update order status
  updateOrderStatus(statusUpdate: { orderId: string, status: string, notes?: string }): Observable<any> {
    // The API expects just the status string as the request body
    return this.http.put(`${this.apiUrl}/${statusUpdate.orderId}/status`, 
      JSON.stringify(statusUpdate.status), 
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      catchError(this.handleError<any>('updateOrderStatus'))
    );
  }

  // Add method to get order history/notes
  getOrderHistory(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${orderId}/history`).pipe(
      catchError(this.handleError<any[]>('getOrderHistory', []))
    );
  }
  
  // Generic error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}