import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SalesSummary {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  topSellingCycles: TopSellingItem[];
  topSellingBrands: TopSellingItem[];
}

export interface TopSellingItem {
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesDataItem {
  date: string;
  revenue: number;
}

// New interface for the revenue trend chart
export interface RevenueTrendData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
  }[];
  type: string;
}

// New interface for the chart summary data
export interface ChartSummaryData {
  summaryStats: {
    label: string;
    value: number;
    color: string;
    format: string;
  }[];
  topCycles: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  topBrands: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  dateRange: {
    start: string;
    end: string;
  };
}

// New interface for the sales comparison chart
export interface SalesComparisonData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    yAxisID: string;
  }[];
  type: string;
  options: {
    scales: {
      yAxes: {
        id: string;
        type: string;
        position: string;
        display: boolean;
        title: {
          display: boolean;
          text: string;
        };
      }[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SalesAnalyticsService {
  private baseUrl = `${environment.apiUrl}/SalesAnalytics`;

  constructor(private http: HttpClient) { }

  /**
   * Get daily sales analytics
   * @param date The date to get analytics for
   */
  getDailySales(date: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/daily`, {
      params: new HttpParams().set('date', date)
    });
  }

  /**
   * Get summary of sales analytics
   * @param startDate Start date for the summary
   * @param endDate End date for the summary
   * @param brandId Optional brand ID filter
   * @param cycleId Optional cycle ID filter
   * @param timeFrame Optional time frame
   */
  getSummary(startDate: string, endDate: string, brandId?: string, cycleId?: string, timeFrame?: string): Observable<SalesSummary> {
    let params = new HttpParams()
      .set('StartDate', startDate)
      .set('EndDate', endDate);
    
    if (brandId) {
      params = params.set('BrandId', brandId);
    }
    
    if (cycleId) {
      params = params.set('CycleId', cycleId);
    }
    
    if (timeFrame) {
      params = params.set('TimeFrame', timeFrame);
    }
    
    return this.http.get<SalesSummary>(`${this.baseUrl}/summary`, { params });
  }

  /**
   * Get top selling cycles
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @param top Number of top cycles to return
   */
  getTopCycles(startDate: string, endDate: string, top: number = 5): Observable<TopSellingItem[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('top', top.toString());
    
    return this.http.get<TopSellingItem[]>(`${this.baseUrl}/top-cycles`, { params });
  }

  /**
   * Get top selling brands
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @param top Number of top brands to return
   */
  getTopBrands(startDate: string, endDate: string, top: number = 5): Observable<TopSellingItem[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('top', top.toString());
    
    return this.http.get<TopSellingItem[]>(`${this.baseUrl}/top-brands`, { params });
  }

  /**
   * Get sales for a specific period
   * @param startDate Start date for the period
   * @param endDate End date for the period
   */
  getPeriodSales(startDate: string, endDate: string): Observable<SalesDataItem[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<SalesDataItem[]>(`${this.baseUrl}/period`, { params });
  }

  /**
   * Get revenue trend data from the new endpoint
   * @param startDate Start date for the period
   * @param endDate End date for the period
   */
  getRevenueTrend(startDate: string, endDate: string): Observable<RevenueTrendData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<RevenueTrendData>(`${this.baseUrl}/chart/revenue-trend`, { params });
  }

  /**
   * Get chart summary data from the new endpoint
   * @param startDate Start date for the period
   * @param endDate End date for the period
   */
  getChartSummary(startDate: string, endDate: string): Observable<ChartSummaryData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ChartSummaryData>(`${this.baseUrl}/chart/summary`, { params });
  }

  /**
   * Get sales comparison data from the new endpoint
   * @param startDate Start date for the period
   * @param endDate End date for the period
   */
  getSalesComparison(startDate: string, endDate: string): Observable<SalesComparisonData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<SalesComparisonData>(`${this.baseUrl}/chart/sales-comparison`, { params });
  }
}