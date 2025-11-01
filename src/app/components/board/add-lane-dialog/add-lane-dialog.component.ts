import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-add-lane-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule
    ],
    template: `
    <h2 mat-dialog-title>Add New Lane</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Lane Name</mat-label>
        <input matInput [(ngModel)]="laneName" placeholder="e.g., Action Items">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="!laneName.trim()">Add</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      padding: 1rem 0;
    }
    mat-dialog-actions {
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class AddLaneDialogComponent {
  private dialogRef = inject(MatDialogRef<AddLaneDialogComponent>);
  laneName = '';

  onCancel() {
    this.dialogRef.close();
  }

  onAdd() {
    if (this.laneName.trim()) {
      this.dialogRef.close(this.laneName);
    }
  }
}
