import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../services/notification.service';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout: any;
}

@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notifications.component.html',
  styleUrl: './toast-notifications.component.scss',
  animations: [
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();
  private nextId = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Subscribe to success notifications
    this.subscription.add(
      this.notificationService.success$.subscribe(message => {
        this.showNotification(message, 'success');
      })
    );

    // Subscribe to error notifications
    this.subscription.add(
      this.notificationService.error$.subscribe(message => {
        this.showNotification(message, 'error');
      })
    );

    // Subscribe to info notifications
    this.subscription.add(
      this.notificationService.info$.subscribe(message => {
        this.showNotification(message, 'info');
      })
    );

    // Subscribe to warning notifications
    this.subscription.add(
      this.notificationService.warning$.subscribe(message => {
        this.showNotification(message, 'warning');
      })
    );
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    this.subscription.unsubscribe();
    
    // Clear any remaining timeouts
    this.notifications.forEach(notification => {
      clearTimeout(notification.timeout);
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    const id = this.nextId++;
    
    // Create notification timeout (auto-dismiss after 5 seconds)
    const timeout = setTimeout(() => {
      this.removeNotification(id);
    }, 5000);
    
    // Add notification to array
    this.notifications.push({ id, message, type, timeout });
  }

  removeNotification(id: number) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      clearTimeout(this.notifications[index].timeout);
      this.notifications.splice(index, 1);
    }
  }

  getNotificationIcon(type: string): string {
    switch(type) {
      case 'success': return 'bi bi-check-circle-fill';
      case 'error': return 'bi bi-exclamation-circle-fill';
      case 'warning': return 'bi bi-exclamation-triangle-fill';
      case 'info': return 'bi bi-info-circle-fill';
      default: return 'bi bi-bell-fill';
    }
  }
}