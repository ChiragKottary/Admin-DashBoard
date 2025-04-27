import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { AuthService } from '../services/auth.service';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Summary metrics
  totalCycles: number = 245;
  totalRevenue: number = 52450;
  totalEmployees: number = 12;
  pendingOrders: number = 8;
  isAdmin: boolean = false;
  
  // Sales chart data
  public salesChartData: ChartConfiguration['data'] = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        data: [12500, 15700, 14300, 18500, 20200, 22500],
        label: 'Monthly Sales',
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true
      }
    ]
  };
  
  // Sales chart options
  public salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    elements: {
      line: {
        tension: 0.4
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Monthly Sales'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue (₹)'
        }
      }
    }
  };
  
  // Stock distribution chart data
  public stockChartData: ChartConfiguration['data'] = {
    labels: ['Mountain Bikes', 'Road Bikes', 'Hybrid Bikes', 'City Bikes', 'BMX', 'Kids Bikes'],
    datasets: [
      {
        data: [65, 45, 35, 50, 25, 30],
        label: 'Stock Level',
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ]
      }
    ]
  };
  
  // Stock chart options
  public stockChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Stock Distribution by Category'
      },
      legend: {
        position: 'right'
      }
    }
  };
  
  // Recent orders data
  recentOrders = [
    { id: 'ORD-1234', customer: 'Rahul Sharma', date: '2025-04-22', amount: 12500, status: 'Delivered' },
    { id: 'ORD-1235', customer: 'Priya Singh', date: '2025-04-23', amount: 8750, status: 'Processing' },
    { id: 'ORD-1236', customer: 'Amit Kumar', date: '2025-04-24', amount: 15200, status: 'Processing' },
    { id: 'ORD-1237', customer: 'Neha Patel', date: '2025-04-24', amount: 6300, status: 'Pending' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Check if user has admin role
    this.authService.user$.subscribe(user => {
      if (user) {
        this.isAdmin = user.roles.includes('Admin');
      }
    });
  }
}
