import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { AdminDashboard } from './dashboard/admin-dashboard/admin-dashboard';
import { OperatorDashboard } from './dashboard/operator-dashboard/operator-dashboard';
import { TechnicianDashboard } from './dashboard/technician-dashboard/technician-dashboard';
import { authGuard } from './auth/auth.guard';
import { SettingsComponent } from './dashboard/settings/settings';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        component: AdminDashboard,
        canActivate: [authGuard],
        data: { roles: ['Admin'] },
      },

      {
        path: 'operator',
        component: OperatorDashboard,
        canActivate: [authGuard],
        data: { roles: ['Admin', 'Operator'] },
      },

      {
        path: 'technician',
        component: TechnicianDashboard,
        canActivate: [authGuard],
        data: { roles: ['Admin', 'Technician'] },
      },
      {
        path: 'settings',
        loadComponent: () => import('./dashboard/settings/settings').then((m) => m.SettingsComponent),
        canActivate: [authGuard],
        data: { roles: ['Admin'] },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
