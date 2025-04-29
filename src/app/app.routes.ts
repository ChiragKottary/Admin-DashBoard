import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CyclesComponent } from './cycles/cycles.component';
import { EmployeesComponent } from './employees/employees.component';
import { PosComponent } from './pos/pos.component';
import { OrdersComponent } from './orders/orders.component';
import { CustomersComponent } from './customers/customers.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './services/auth.guard';
import { RoleGuard } from './services/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // Apply AuthGuard to all child routes
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cycles', component: CyclesComponent },
      { path: 'customers', component: CustomersComponent },
      { 
        path: 'employees', 
        component: EmployeesComponent,
        canActivate: [RoleGuard],
        data: { role: 'Admin' } // Only admins can access employees
      },
      { path: 'pos', component: PosComponent },
      { path: 'orders', component: OrdersComponent },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
      }
    ]
  },
  // Catch-all route - redirect to login
  { path: '**', redirectTo: 'login' }
];
