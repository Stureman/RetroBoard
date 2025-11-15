import { Component, inject, OnDestroy } from '@angular/core';

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
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  email = '';
  loading = false;
  loadingGoogle = false;
  linkSent = false;
  // Cooldown to prevent burning through email-link quota
  private static readonly COOLDOWN_SECONDS = 60; // adjust as desired
  remainingSeconds = 0;
  private cooldownTimer: any = null;

  private getLastSentTs(email: string): number {
    try {
      const ts = window.localStorage.getItem(`magicLinkLastSent:${email}`);
      return ts ? parseInt(ts, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setLastSentTs(email: string) {
    try {
      window.localStorage.setItem(`magicLinkLastSent:${email}`, Date.now().toString());
    } catch {
      // ignore storage errors
    }
  }

  private startCooldown(seconds: number) {
    this.clearCooldown();
    this.remainingSeconds = Math.max(0, Math.floor(seconds));
    if (this.remainingSeconds <= 0) return;
    this.cooldownTimer = setInterval(() => {
      this.remainingSeconds -= 1;
      if (this.remainingSeconds <= 0) {
        this.clearCooldown();
      }
    }, 1000);
  }

  private clearCooldown() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  async sendMagicLink() {
    if (!this.email.trim()) return;

    // Enforce client-side cooldown per email address
    const last = this.getLastSentTs(this.email.trim());
    const elapsed = (Date.now() - last) / 1000;
    if (elapsed < LoginComponent.COOLDOWN_SECONDS) {
      const wait = Math.ceil(LoginComponent.COOLDOWN_SECONDS - elapsed);
      this.startCooldown(wait);
      this.snackBar.open(`Please wait ${wait}s before requesting another link.`, 'Close', { duration: 4000 });
      return;
    }

    this.loading = true;
    try {
      await this.authService.sendMagicLink(this.email);
      this.linkSent = true;
      this.setLastSentTs(this.email.trim());
      this.startCooldown(LoginComponent.COOLDOWN_SECONDS);
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
      } else if (code === 'auth/quota-exceeded') {
        message = 'Daily email send limit reached. Please wait and try again later, or use a different sign-in method.';
      }
      this.snackBar.open(message, 'Close', { duration: 7000 });
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.loadingGoogle = true;
    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      const code = error?.code as string | undefined;
      let message = 'Failed to sign in with Google. Please try again.';
      if (code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed. Please try again.';
      } else if (code === 'auth/popup-blocked') {
        message = 'Popup was blocked by your browser. Please allow popups and try again.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is disabled. Please contact the administrator.';
      }
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.loadingGoogle = false;
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    this.clearCooldown();
  }
}
