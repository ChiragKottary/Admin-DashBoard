import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationDialogData {
  message: string;
  confirmCallback: () => void;
  cancelCallback?: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Subjects to emit notification events
  private successSubject = new Subject<string>();
  private errorSubject = new Subject<string>();
  private infoSubject = new Subject<string>();
  private warningSubject = new Subject<string>();
  private confirmationSubject = new Subject<ConfirmationDialogData>();

  // Observable streams that components can subscribe to
  success$ = this.successSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  info$ = this.infoSubject.asObservable();
  warning$ = this.warningSubject.asObservable();
  confirmation$ = this.confirmationSubject.asObservable();

  constructor() {}

  /**
   * Show a success notification
   * @param message The message to display
   */
  showSuccess(message: string): void {
    this.successSubject.next(message);
  }

  /**
   * Show an error notification
   * @param message The message to display
   */
  showError(message: string): void {
    this.errorSubject.next(message);
  }

  /**
   * Show an info notification
   * @param message The message to display
   */
  showInfo(message: string): void {
    this.infoSubject.next(message);
  }

  /**
   * Show a warning notification
   * @param message The message to display
   */
  showWarning(message: string): void {
    this.warningSubject.next(message);
  }

  /**
   * Show a confirmation dialog
   * @param data The confirmation dialog data
   */
  showConfirmation(data: ConfirmationDialogData): void {
    this.confirmationSubject.next({
      title: data.title || 'Confirmation',
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      ...data
    });
  }
}