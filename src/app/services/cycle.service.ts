import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ICycle, PagedResponse } from '../app.models';

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private apiUrl = `${environment.apiUrl}/Cycle`;

  constructor(private http: HttpClient) { }

  // Get all cycles with pagination
  getAllCycles(pageNumber: number = 1, pageSize: number = 10): Observable<PagedResponse<ICycle>> {
    const params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    console.log(`Fetching cycles: page=${pageNumber}, size=${pageSize}`); // Add logging
    
    return this.http.get<PagedResponse<ICycle>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  // Get all cycles without pagination
  getAllCyclesNoLimit(): Observable<ICycle[]> {
    return this.http.get<ICycle[]>(`${this.apiUrl}/all`)
      .pipe(catchError(this.handleError));
  }

  // Get cycle by ID
  getCycleById(id: string): Observable<ICycle> {
    return this.http.get<ICycle>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Create new cycle
  createCycle(cycle: Partial<ICycle>): Observable<ICycle> {
    return this.http.post<ICycle>(this.apiUrl, cycle)
      .pipe(catchError(this.handleError));
  }

  // Update existing cycle
  updateCycle(id: string, cycle: Partial<ICycle>): Observable<ICycle> {
    return this.http.put<ICycle>(`${this.apiUrl}/${id}`, cycle)
      .pipe(catchError(this.handleError));
  }

  // Delete cycle
  deleteCycle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Get cycles by brand
  getCyclesByBrand(brandId: string): Observable<ICycle[]> {
    return this.http.get<ICycle[]>(`${this.apiUrl}/brand/${brandId}`)
      .pipe(catchError(this.handleError));
  }

  // Get cycles by type (category)
  getCyclesByType(typeId: string): Observable<ICycle[]> {
    return this.http.get<ICycle[]>(`${this.apiUrl}/type/${typeId}`)
      .pipe(catchError(this.handleError));
  }

  // Add stock to a cycle
  addStock(cycleId: string, quantity: number): Observable<ICycle> {
    return this.http.post<ICycle>(`${this.apiUrl}/${cycleId}/stock/add`, { quantity })
      .pipe(catchError(this.handleError));
  }

  // Remove stock from a cycle
  removeStock(cycleId: string, quantity: number): Observable<ICycle> {
    return this.http.post<ICycle>(`${this.apiUrl}/${cycleId}/stock/remove`, { quantity })
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Use more specific error messages if available
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(errorMessage);
  }
}