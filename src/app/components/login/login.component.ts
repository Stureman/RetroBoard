import { Component, inject } from '@angular/core';

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
    imports: [
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
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      const code = error?.code as string | undefined;
      let message = 'Failed to send magic link. Please try again.';
      if (code === 'auth/configuration-not-found') {
        message = 'Email link sign-in isn\'t enabled or configured. Please enable Email link in Firebase Auth and add your domain to Authorized domains.';
      } else if (code === 'auth/invalid-continue-uri' || code === 'auth/unauthorized-continue-uri') {
        message = 'The redirect URL is invalid or not authorized. Add your site domain to Firebase Authorized domains.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Email sign-in provider is disabled. Enable it in Firebase Auth > Sign-in method.';
      }
      this.snackBar.open(message, 'Close', { duration: 7000 });
    } finally {
      this.loading = false;
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
