import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IBrand, PagedResponse } from '../app.models';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = 'https://localhost:7042/api/Brand';

  constructor(private http: HttpClient) { }

  // Get all brands
  getAllBrands(): Observable<IBrand[]> {
    return this.http.get<PagedResponse<IBrand>>(this.apiUrl).pipe(
        map(response => response.items)
      );
  }

  // Get a specific brand by ID
  getBrand(id: string): Observable<IBrand> {
    return this.http.get<IBrand>(`${this.apiUrl}/${id}`);
  }

  // Create a new brand
  createBrand(brand: { brandName: string, description: string }): Observable<IBrand> {
    return this.http.post<IBrand>(this.apiUrl, brand);
  }

  // Update an existing brand
  updateBrand(id: string, brand: { brandName: string, description: string }): Observable<IBrand> {
    return this.http.put<IBrand>(`${this.apiUrl}/${id}`, brand);
  }

  // Delete a brand
  deleteBrand(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}