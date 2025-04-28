import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, ConfirmationDialogData } from '../../../../app/services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  
  isVisible = false;
  dialogData: ConfirmationDialogData | null = null;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.notificationService.confirmation$.subscribe(data => {
        this.dialogData = data;
        this.isVisible = true;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  confirm(): void {
    if (this.dialogData && this.dialogData.confirmCallback) {
      this.dialogData.confirmCallback();
    }
    this.close();
  }

  cancel(): void {
    if (this.dialogData && this.dialogData.cancelCallback) {
      this.dialogData.cancelCallback();
    }
    this.close();
  }

  close(): void {
    this.isVisible = false;
  }
}
