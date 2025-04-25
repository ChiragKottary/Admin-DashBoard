import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ICycleType, PagedResponse } from '../app.models';

@Injectable({
  providedIn: 'root'
})
export class CycleTypeService {
  private apiUrl = 'https://localhost:7042/api/CycleType';

  constructor(private http: HttpClient) { }

  // Get all cycle types
  getAllCycleTypes(): Observable<ICycleType[]> {
    return this.http.get<PagedResponse<ICycleType>>(this.apiUrl).pipe(
        map(response => response.items)
      );
  }

  // Get a specific cycle type by ID
  getCycleType(id: string): Observable<ICycleType> {
    return this.http.get<ICycleType>(`${this.apiUrl}/${id}`);
  }

  // Create a new cycle type
  createCycleType(cycleType: { typeName: string, description: string }): Observable<ICycleType> {
    return this.http.post<ICycleType>(this.apiUrl, cycleType);
  }

  // Update an existing cycle type
  updateCycleType(id: string, cycleType: { typeName: string, description: string }): Observable<ICycleType> {
    return this.http.put<ICycleType>(`${this.apiUrl}/${id}`, cycleType);
  }

  // Delete a cycle type
  deleteCycleType(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}