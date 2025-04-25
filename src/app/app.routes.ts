import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CyclesComponent } from './cycles/cycles.component';
import { EmployeesComponent } from './employees/employees.component';
import { PosComponent } from './pos/pos.component';
import { OrdersComponent } from './orders/orders.component';
import { CustomersComponent } from './customers/customers.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cycles', component: CyclesComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'employees', component: EmployeesComponent },
      { path: 'pos', component: PosComponent },
      { path: 'orders', component: OrdersComponent },
    ]
  }
];
