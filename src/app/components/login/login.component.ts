import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  email = '';
  loading = false;
  linkSent = false;

  async sendMagicLink() {
    if (!this.email.trim()) return;

    this.loading = true;
    try {
      await this.authService.sendMagicLink(this.email);
      this.linkSent = true;
    } catch (error) {
      console.error('Error sending magic link:', error);
      this.snackBar.open('Failed to send magic link. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
