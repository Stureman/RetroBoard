import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-verify',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './auth-verify.component.html',
  styleUrls: ['./auth-verify.component.scss']
})
export class AuthVerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  verifying = true;
  error = false;

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
      this.error = true;
    }
  }
}
