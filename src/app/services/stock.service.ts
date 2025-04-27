import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IStockMovement, IStockAdjustmentRequest, IStockAdjustmentResponse, PagedResponse, MovementType } from '../app.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}/Stock`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getStockMovements(pageNumber: number = 1, pageSize: number = 10): Observable<PagedResponse<IStockMovement>> {
    const params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<PagedResponse<IStockMovement>>(`${this.apiUrl}/movements`, { params });
  }

  adjustStock(adjustment: IStockAdjustmentRequest): Observable<IStockAdjustmentResponse> {
    return this.http.post<IStockAdjustmentResponse>(`${this.apiUrl}/CycleStocksAdjustment`, adjustment);
  }

  // New method that automatically includes the current user's ID
  createStockMovement(cycleId: string, quantity: number, movementType: MovementType, notes: string = ''): Observable<IStockAdjustmentResponse> {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      throw new Error('User not logged in or user ID not available');
    }
    
    const stockAdjustment: IStockAdjustmentRequest = {
      cycleId,
      quantity,
      userId,
      movementType,
      notes
    };
    
    return this.adjustStock(stockAdjustment);
  }

  deleteStockMovement(movementId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/movements/${movementId}`);
  }
}