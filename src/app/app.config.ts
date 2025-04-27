import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req, next) => {
          // Get the token from the auth service
          const token = localStorage.getItem('auth_token');
          
          if (token) {
            req = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
          }
          
          return next(req);
        }
      ])
    ),
    provideAnimations()
  ]
};
