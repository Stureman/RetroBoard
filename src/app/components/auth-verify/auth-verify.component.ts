import { Component, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-auth-verify',
    imports: [FormsModule, MatCardModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './auth-verify.component.html',
    styleUrls: ['./auth-verify.component.scss']
})
export class AuthVerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  verifying = true;
  error = false;
  needsEmail = false;
  email = '';
  submitting = false;

  async ngOnInit() {
    try {
      await this.authService.completeMagicLinkSignIn();
      this.verifying = false;
      // Navigate to home after successful sign-in
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1000);
    } catch (error) {
      console.error('Error verifying magic link:', error);
      this.verifying = false;
      const message = (error as Error)?.message || '';
      if (message.includes('Email not found')) {
        this.needsEmail = true;
      } else {
        this.error = true;
      }
    }
  }

  async submitEmail() {
    if (!this.email.trim()) return;
    this.submitting = true;
    try {
      await this.authService.completeMagicLinkSignIn(this.email.trim());
      this.error = false;
      this.needsEmail = false;
      // Navigate to home after successful sign-in
      this.router.navigate(['/home']);
    } catch (err) {
      console.error('Failed to complete sign-in with provided email:', err);
      this.error = true;
      this.needsEmail = false;
    } finally {
      this.submitting = false;
    }
  }
}
