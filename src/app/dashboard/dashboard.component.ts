import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthService } from '../services/auth.service';
import { SalesAnalyticsService, RevenueTrendData, ChartSummaryData, SalesComparisonData } from '../services/sales-analytics.service';
import { OrderService } from '../services/order.service';
import { forkJoin, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define interfaces for our data
interface SalesSummary {
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

interface TopSellingItem {
  name: string;
  unitsSold: number;
  revenue: number;
}

interface SalesDataItem {
  date: string;
  revenue: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Summary metrics
  totalCycles: number = 0;
  totalRevenue: number = 0;
  totalOrders: number = 0;
  averageOrderValue: number = 0;
  totalProfit: number = 0;
  profitMargin: number = 0;
  totalEmployees: number = 12; // This might come from a different service
  pendingOrders: number = 0;
  isAdmin: boolean = false;
  
  // Date filter options
  selectedDateFilter: string = '30days';
  dateFilterOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];
  
  // Dashboard summary stats
  summaryStats: Array<{ label: string, value: number, color: string, format: string }> = [];

  // Track subscriptions to prevent memory leaks
  private subscriptions: Subscription[] = [];
  
  // Sales chart data
  public salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Sales Revenue',
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Sales chart options
  public salesChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Sales Revenue Trend'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '₹' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue (₹)'
        },
        ticks: {
          color: '#495057'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          color: '#495057'
        }
      }
    }
  };
  
  // Top Cycles chart data
  public cyclesChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Units Sold',
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(255, 99, 132, 0.9)',
          'rgba(54, 162, 235, 0.9)',
          'rgba(255, 206, 86, 0.9)',
          'rgba(75, 192, 192, 0.9)',
          'rgba(153, 102, 255, 0.9)'
        ],
        hoverBorderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ]
      }
    ]
  };
  
  // Cycles chart options
  public cyclesChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top Selling Cycles'
      },
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          color: '#495057'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + ' units sold';
            }
            return label;
          }
        }
      }
    }
  };
  
  // Brands chart data
  public brandsChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Units Sold',
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(255, 159, 64, 0.9)',
          'rgba(75, 192, 192, 0.9)',
          'rgba(153, 102, 255, 0.9)',
          'rgba(255, 99, 132, 0.9)',
          'rgba(54, 162, 235, 0.9)'
        ]
      }
    ]
  };
  
  // Brands chart options
  public brandsChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top Selling Brands'
      },
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          color: '#495057'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + ' units sold';
            }
            return label;
          }
        }
      }
    }
  };
  
  // New Revenue Trend Chart (from /chart/revenue-trend)
  public revenueTrendChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };
  
  public revenueTrendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Revenue & Profit Trend'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      },
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  
  // Sales Comparison Bar Chart (from /chart/sales-comparison)
  public salesComparisonChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };
  
  public salesComparisonChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Sales Metrics Comparison'
      },
      legend: {
        position: 'top'
      }
    }
  };
  
  // Recent orders data
  recentOrders: OrderData[] = [];

  // Default chart types
  public salesChartType: 'line' = 'line';
  public cyclesChartType: 'doughnut' = 'doughnut';
  public brandsChartType: 'pie' = 'pie';
  public revenueTrendChartType: 'line' = 'line';
  public salesComparisonChartType: 'bar' = 'bar';
  
  @ViewChild('salesChart') salesChart?: BaseChartDirective;
  @ViewChild('cyclesChart') cyclesChart?: BaseChartDirective;
  @ViewChild('brandsChart') brandsChart?: BaseChartDirective;
  @ViewChild('revenueTrendChart') revenueTrendChart?: BaseChartDirective;
  @ViewChild('salesComparisonChart') salesComparisonChart?: BaseChartDirective;

  constructor(
    private authService: AuthService,
    private salesAnalyticsService: SalesAnalyticsService,
    private orderService: OrderService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    this.isAdmin = this.authService.isAdmin();
    
    // Initialize with demo data first for a smoother UX
    this.initializeDemoData();

    // Then load real data from the API
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Increase timeout to ensure DOM is fully rendered
    setTimeout(() => {
      console.log('Executing chart update after view init');
      this.updateAllCharts();
    }, 1000); // Increased from 500ms to 1000ms
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Initialize with demo data to ensure charts render immediately
  initializeDemoData(): void {
    // Initialize with empty data structures first
    this.salesChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Sales Revenue',
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    this.cyclesChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          hoverBackgroundColor: [
            'rgba(255, 99, 132, 0.9)',
            'rgba(54, 162, 235, 0.9)',
            'rgba(255, 206, 86, 0.9)',
            'rgba(75, 192, 192, 0.9)',
            'rgba(153, 102, 255, 0.9)'
          ]
        }
      ]
    };

    this.brandsChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            'rgba(255, 159, 64, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)'
          ]
        }
      ]
    };
    
    // Initialize new charts with empty data
    this.revenueTrendChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Daily Revenue',
          borderColor: '#36a2eb',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          data: [],
          label: 'Profit',
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
    
    this.salesComparisonChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Orders',
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        },
        {
          data: [],
          label: 'Revenue',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        },
        {
          data: [],
          label: 'Units Sold',
          backgroundColor: 'rgba(75, 192, 192, 0.5)'
        }
      ]
    };

    // Get current date for dynamic date range
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const startDate = this.formatDate(oneMonthAgo);
    const endDate = this.formatDate(today);
    
    // Load initial data from services
    this.salesAnalyticsService.getPeriodSales(startDate, endDate).subscribe({
      next: (data: SalesDataItem[]) => {
        if (data && data.length > 0) {
          this.salesChartData.labels = data.map(item => 
            this.datePipe.transform(item.date, 'MMM d') || item.date);
          this.salesChartData.datasets[0].data = data.map(item => item.revenue);
          if (this.salesChart) {
            this.salesChart.update();
          }
        }
      },
      error: () => {
        // Use fallback data on error
        this.useFallbackSalesData();
      }
    });
    
    this.salesAnalyticsService.getSummary(startDate, endDate).subscribe({
      next: (summary: SalesSummary) => {
        // Update summary metrics
        this.totalRevenue = summary.totalRevenue || 0;
        this.totalOrders = summary.totalOrders || 0;
        this.averageOrderValue = summary.averageOrderValue || 0;
        this.totalProfit = summary.totalProfit || 0;
        this.profitMargin = summary.profitMargin || 0;
        
        // Update charts with top selling items
        if (summary.topSellingCycles?.length > 0) {
          this.updateCyclesChart(summary.topSellingCycles);
          this.totalCycles = summary.topSellingCycles.reduce(
            (total, cycle) => total + cycle.unitsSold, 0);
        }
        
        if (summary.topSellingBrands?.length > 0) {
          this.updateBrandsChart(summary.topSellingBrands);
        }
      },
      error: () => {
        // Use fallback data on error
        this.useFallbackChartData();
      }
    });
    
    // Initialize the new chart endpoints
    this.loadNewChartData(startDate, endDate);
  }
  
  // Fallback methods in case API calls fail
  private useFallbackSalesData(): void {
    this.salesChartData = {
      labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7'],
      datasets: [
        {
          data: [1500, 2000, 1800, 2500, 2200, 3000, 2800],
          label: 'Sales Revenue',
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
    if (this.salesChart) {
      this.salesChart.update();
    }
  }
  
  private useFallbackChartData(): void {
    this.totalCycles = 142;
    this.totalRevenue = 125000;
    this.totalOrders = 65;
    this.averageOrderValue = 1923.08;
    this.totalProfit = 37500;
    this.profitMargin = 30;
    
    // Fallback cycles chart data
    this.cyclesChartData = {
      labels: ['Mountain Bike', 'Road Bike', 'Hybrid', 'BMX', 'City Bike'],
      datasets: [{
        data: [45, 32, 28, 15, 22],
        backgroundColor: this.cyclesChartData.datasets[0].backgroundColor,
        hoverBackgroundColor: this.cyclesChartData.datasets[0].hoverBackgroundColor
      }]
    };
    
    // Fallback brands chart data
    this.brandsChartData = {
      labels: ['Hero', 'Trek', 'Giant', 'Specialized', 'Cannondale'],
      datasets: [{
        data: [50, 35, 25, 20, 15],
        backgroundColor: this.brandsChartData.datasets[0].backgroundColor
      }]
    };
    
    // Fallback revenue trend chart data
    this.revenueTrendChartData = {
      labels: ['Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28'],
      datasets: [
        {
          data: [15000, 18000, 17500, 19000, 20500, 22000, 25000],
          label: 'Daily Revenue',
          borderColor: '#36a2eb',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          data: [4500, 5400, 5250, 5700, 6150, 6600, 7500],
          label: 'Profit',
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
    
    // Fallback sales comparison chart data
    this.salesComparisonChartData = {
      labels: ['Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28'],
      datasets: [
        {
          data: [8, 10, 9, 11, 12, 13, 15],
          label: 'Orders',
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        },
        {
          data: [15000, 18000, 17500, 19000, 20500, 22000, 25000],
          label: 'Revenue',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        },
        {
          data: [8, 10, 9, 11, 12, 13, 15],
          label: 'Units Sold',
          backgroundColor: 'rgba(75, 192, 192, 0.5)'
        }
      ]
    };
    
    // Fallback summary stats
    this.summaryStats = [
      { label: 'Total Revenue', value: 125000, color: '#36a2eb', format: 'currency' },
      { label: 'Orders', value: 65, color: '#ff6384', format: 'number' },
      { label: 'Profit Margin', value: 30, color: '#4bc0c0', format: 'percent' },
      { label: 'Avg Order Value', value: 1923.08, color: '#ffcd56', format: 'currency' },
      { label: 'Total Profit', value: 37500, color: '#9966ff', format: 'currency' }
    ];
    
    if (this.cyclesChart) {
      this.cyclesChart.update();
    }
    if (this.brandsChart) {
      this.brandsChart.update();
    }
    if (this.revenueTrendChart) {
      this.revenueTrendChart.update();
    }
    if (this.salesComparisonChart) {
      this.salesComparisonChart.update();
    }
  }

  updateAllCharts(): void {
    console.log('Updating all charts');
    
    if (this.salesChart) {
      console.log('Sales chart exists, updating');
      this.salesChart.update();
    }
    
    if (this.cyclesChart) {
      console.log('Cycles chart exists, updating');
      this.cyclesChart.update();
    }
    
    if (this.brandsChart) {
      console.log('Brands chart exists, updating');
      this.brandsChart.update();
    }
    
    if (this.revenueTrendChart) {
      console.log('Revenue trend chart exists, updating');
      this.revenueTrendChart.update();
    }
    
    if (this.salesComparisonChart) {
      console.log('Sales comparison chart exists, updating');
      this.salesComparisonChart.update();
    }
  }
  
  loadSalesData(startDate: string, endDate: string): void {
    // Load period sales data for chart
    const salesSub = this.salesAnalyticsService.getPeriodSales(startDate, endDate).subscribe({
      next: (periodData: SalesDataItem[]) => {
        if (periodData && periodData.length > 0) {
          const labels: string[] = [];
          const data: number[] = [];
          
          periodData.forEach((item: SalesDataItem) => {
            labels.push(this.datePipe.transform(item.date, 'MMM d') || item.date);
            data.push(item.revenue);
          });
          
          this.salesChartData.labels = labels;
          this.salesChartData.datasets[0].data = data;
          
          if (this.salesChart) {
            console.log('Updating sales chart with real data');
            this.salesChart.update();
          }
        }
      },
      error: (error) => console.error('Error fetching period sales', error)
    });
    this.subscriptions.push(salesSub);
  }
  
  // Load data from the new chart endpoints
  loadNewChartData(startDate: string, endDate: string): void {
    // Revenue Trend Chart
    const revenueTrendSub = this.salesAnalyticsService.getRevenueTrend(startDate, endDate).subscribe({
      next: (data: RevenueTrendData) => {
        if (data) {
          this.revenueTrendChartData = {
            labels: data.labels,
            datasets: data.datasets
          };
          
          if (this.revenueTrendChart) {
            this.revenueTrendChart.update();
          }
        }
      },
      error: (error) => console.error('Error fetching revenue trend data:', error)
    });
    this.subscriptions.push(revenueTrendSub);
    
    // Chart Summary Data
    const chartSummarySub = this.salesAnalyticsService.getChartSummary(startDate, endDate).subscribe({
      next: (data: ChartSummaryData) => {
        if (data) {
          // Update summary stats
          this.summaryStats = data.summaryStats;
          
          // Update metrics from summary stats
          const revenueItem = data.summaryStats.find(item => item.label === 'Total Revenue');
          if (revenueItem) this.totalRevenue = revenueItem.value;
          
          const ordersItem = data.summaryStats.find(item => item.label === 'Orders');
          if (ordersItem) this.totalOrders = ordersItem.value;
          
          const marginItem = data.summaryStats.find(item => item.label === 'Profit Margin');
          if (marginItem) this.profitMargin = marginItem.value;
          
          const avgOrderItem = data.summaryStats.find(item => item.label === 'Avg Order Value');
          if (avgOrderItem) this.averageOrderValue = avgOrderItem.value;
          
          const profitItem = data.summaryStats.find(item => item.label === 'Total Profit');
          if (profitItem) this.totalProfit = profitItem.value;
          
          // Update top cycles chart
          this.cyclesChartData = {
            labels: data.topCycles.labels,
            datasets: [{
              data: data.topCycles.data,
              backgroundColor: data.topCycles.colors,
              hoverBackgroundColor: data.topCycles.colors.map(color => color) // Could make these slightly darker
            }]
          };
          
          // Update top brands chart
          this.brandsChartData = {
            labels: data.topBrands.labels,
            datasets: [{
              data: data.topBrands.data,
              backgroundColor: data.topBrands.colors,
              hoverBackgroundColor: data.topBrands.colors.map(color => color) // Could make these slightly darker
            }]
          };
          
          // Calculate total cycles
          this.totalCycles = data.topCycles.data.reduce((sum, current) => sum + current, 0);
          
          if (this.cyclesChart) {
            this.cyclesChart.update();
          }
          
          if (this.brandsChart) {
            this.brandsChart.update();
          }
        }
      },
      error: (error) => console.error('Error fetching chart summary data:', error)
    });
    this.subscriptions.push(chartSummarySub);
    
    // Sales Comparison Chart
    const salesComparisonSub = this.salesAnalyticsService.getSalesComparison(startDate, endDate).subscribe({
      next: (data: SalesComparisonData) => {
        if (data) {
          this.salesComparisonChartData = {
            labels: data.labels,
            datasets: data.datasets
          };
          
          // Set the chart options based on the API response
          if (data.options && data.options.scales && data.options.scales.yAxes) {
            // Create a configuration that works with Chart.js v3
            const yAxes = data.options.scales.yAxes;
            
            this.salesComparisonChartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Sales Metrics Comparison'
                },
                legend: {
                  position: 'top'
                }
              },
              scales: {}
            };
            
            // Create scales configuration dynamically
            const scales: any = {};
            
            yAxes.forEach(axis => {
              scales[axis.id] = {
                type: 'linear',
                position: axis.position,
                display: axis.display,
                title: axis.title
              };
            });
            
            this.salesComparisonChartOptions.scales = scales;
          }
          
          if (this.salesComparisonChart) {
            this.salesComparisonChart.update();
          }
        }
      },
      error: (error) => console.error('Error fetching sales comparison data:', error)
    });
    this.subscriptions.push(salesComparisonSub);
  }

  loadDashboardData(): void {
    // Calculate date range based on selected filter
    const today = new Date();
    let startDate: Date;
    
    switch(this.selectedDateFilter) {
      case '7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '90days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '6months':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        // Use a far past date for "all time"
        startDate = new Date(2020, 0, 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Format dates for API calls
    const formattedStartDate = this.formatDate(startDate);
    const formattedEndDate = this.formatDate(today);
    const todayFormatted = this.formatDate(today);

    console.log('Date Range:', formattedStartDate, 'to', formattedEndDate);

    // Combine all data loading operations
    const dailySales$ = this.salesAnalyticsService.getDailySales(todayFormatted);
    const salesSummary$ = this.salesAnalyticsService.getSummary(formattedStartDate, formattedEndDate);
    const periodSales$ = this.salesAnalyticsService.getPeriodSales(formattedStartDate, formattedEndDate);
    
    // Execute all requests and process results
    const combinedSub = forkJoin({
      daily: dailySales$,
      summary: salesSummary$,
      period: periodSales$
    }).subscribe({
      next: (results) => {
        // Process daily sales
        if (results.daily) {
          this.pendingOrders = results.daily.pendingOrders || 0;
        }
        
        // Process summary data
        if (results.summary) {
          this.totalRevenue = results.summary.totalRevenue || 0;
          this.totalOrders = results.summary.totalOrders || 0;
          this.averageOrderValue = results.summary.averageOrderValue || 0;
          this.totalProfit = results.summary.totalProfit || 0;
          this.profitMargin = results.summary.profitMargin || 0;

          // Set total cycles from the sum of top selling cycles
          this.totalCycles = results.summary.topSellingCycles?.reduce(
            (total, cycle) => total + cycle.unitsSold, 0
          ) || 0;

          // Update Top Selling Cycles chart
          if (results.summary.topSellingCycles && results.summary.topSellingCycles.length > 0) {
            this.updateCyclesChart(results.summary.topSellingCycles);
          }

          // Update Top Selling Brands chart
          if (results.summary.topSellingBrands && results.summary.topSellingBrands.length > 0) {
            this.updateBrandsChart(results.summary.topSellingBrands);
          }
        }
        
        // Process period sales for chart
        if (results.period && results.period.length > 0) {
          const labels: string[] = [];
          const data: number[] = [];
          
          results.period.forEach((item: SalesDataItem) => {
            labels.push(this.datePipe.transform(item.date, 'MMM d') || item.date);
            data.push(item.revenue);
          });
          
          this.salesChartData.labels = labels;
          this.salesChartData.datasets[0].data = data;
          
          if (this.salesChart) {
            console.log('Updating sales chart with real data');
            this.salesChart.update();
          }
        }
        
        // Force render all charts after all data is loaded
        setTimeout(() => {
          this.forceRenderCharts();
        }, 500);
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        // Continue showing demo data when API calls fail
        this.initializeDemoData();
        this.updateAllCharts();
      }
    });
    
    this.subscriptions.push(combinedSub);

    // Load data from the new chart endpoints
    this.loadNewChartData(formattedStartDate, formattedEndDate);

    // Load recent orders from the order service
    this.loadRecentOrders();
  }
  
  // Update chart titles to reflect the selected date range
  updateChartTitlesWithDateRange(): void {
    let periodText: string;
    
    switch (this.selectedDateFilter) {
      case '7days':
        periodText = 'Last 7 Days';
        break;
      case '30days':
        periodText = 'Last 30 Days';
        break;
      case '90days':
        periodText = 'Last 90 Days';
        break;
      case '6months':
        periodText = 'Last 6 Months';
        break;
      case '1year':
        periodText = 'Last Year';
        break;
      case 'all':
        periodText = 'All Time';
        break;
      default:
        periodText = 'Last 30 Days';
    }

    // Update chart titles
    if (this.revenueTrendChartOptions && this.revenueTrendChartOptions.plugins && this.revenueTrendChartOptions.plugins.title) {
      this.revenueTrendChartOptions.plugins.title.text = `Revenue & Profit Trend (${periodText})`;
    }

    if (this.salesChartOptions && this.salesChartOptions.plugins && this.salesChartOptions.plugins.title) {
      this.salesChartOptions.plugins.title.text = `Sales Revenue Trend (${periodText})`;
    }

    if (this.salesComparisonChartOptions && this.salesComparisonChartOptions.plugins && this.salesComparisonChartOptions.plugins.title) {
      this.salesComparisonChartOptions.plugins.title.text = `Sales Metrics Comparison (${periodText})`;
    }
  }

  // Force render all charts
  forceRenderCharts(): void {
    console.log('Force rendering all charts');
    
    if (this.salesChart && this.salesChart.chart) {
      console.log('Force rendering sales chart');
      this.salesChart.chart.render();
    }
    
    if (this.cyclesChart && this.cyclesChart.chart) {
      console.log('Force rendering cycles chart');
      this.cyclesChart.chart.render();
    }
    
    if (this.brandsChart && this.brandsChart.chart) {
      console.log('Force rendering brands chart');
      this.brandsChart.chart.render();
    }
    
    if (this.revenueTrendChart && this.revenueTrendChart.chart) {
      console.log('Force rendering revenue trend chart');
      this.revenueTrendChart.chart.render();
    }
    
    if (this.salesComparisonChart && this.salesComparisonChart.chart) {
      console.log('Force rendering sales comparison chart');
      this.salesComparisonChart.chart.render();
    }
  }

  // Load recent orders using the order service
  loadRecentOrders(): void {
    const ordersSub = this.orderService.getOrders(1, 5).subscribe({
      next: (response) => {
        if (response && response.items) {
          this.recentOrders = response.items.map(order => ({
            id: order.orderId,
            orderNumber: order.orderNumber,
            customer: order.customerName,
            date: this.datePipe.transform(order.orderDate, 'yyyy-MM-dd') || '',
            amount: order.totalAmount,
            status: this.getOrderStatusString(order.status)
          }));
        }
      },
      error: (error) => console.error('Error loading recent orders:', error)
    });
    this.subscriptions.push(ordersSub);
  }

  // Helper method to convert order status number to string
  getOrderStatusString(status: number): string {
    switch(status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      case 5: return 'Refunded';
      default: return 'Unknown';
    }
  }

  formatDate(date: Date): string {
    // Format as YYYY-MM-DD which is expected by most APIs
    return date.toISOString().split('T')[0];
  }

  // Method to handle date filter changes
  onDateFilterChange(filter: string): void {
    this.selectedDateFilter = filter;
    this.loadDashboardData();
  }

  // Get date range based on selected filter
  getDateRangeFromFilter(): { startDate: string, endDate: string } {
    const today = new Date();
    let startDate = new Date();
    
    switch (this.selectedDateFilter) {
      case '7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        // Set to a reasonable "all time" start date, e.g., 3 years ago
        startDate.setFullYear(today.getFullYear() - 3);
        break;
    }
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(today)
    };
  }

  updateCyclesChart(topCycles: TopSellingItem[]): void {
    console.log('Updating cycles chart with data:', topCycles);
    const labels: string[] = [];
    const data: number[] = [];
    
    topCycles.forEach((cycle: TopSellingItem) => {
      labels.push(cycle.name);
      data.push(cycle.unitsSold);
    });
    
    this.cyclesChartData.labels = labels;
    this.cyclesChartData.datasets[0].data = data;
    
    if (this.cyclesChart) {
      console.log('Cycles chart exists, updating with new data');
      setTimeout(() => {
        if (this.cyclesChart) {
          this.cyclesChart.chart?.update();
        }
      }, 100);
    }
  }

  updateBrandsChart(topBrands: TopSellingItem[]): void {
    console.log('Updating brands chart with data:', topBrands);
    const labels: string[] = [];
    const data: number[] = [];
    
    topBrands.forEach((brand: TopSellingItem) => {
      labels.push(brand.name);
      data.push(brand.unitsSold);
    });
    
    this.brandsChartData.labels = labels;
    this.brandsChartData.datasets[0].data = data;
    
    if (this.brandsChart) {
      console.log('Brands chart exists, updating with new data');
      setTimeout(() => {
        if (this.brandsChart) {
          this.brandsChart.chart?.update();
        }
      }, 100);
    }
  }
  
  // Helper method to format values based on their type
  formatValue(value: number, format: string): string {
    switch(format) {
      case 'currency':
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
      case 'number':
      default:
        return value.toLocaleString('en-IN');
    }
  }
}
