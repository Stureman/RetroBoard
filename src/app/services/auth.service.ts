import { Injectable, inject } from '@angular/core';
import { Auth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = user(this.auth);

  async sendMagicLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + '/auth/verify',
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  async completeMagicLinkSignIn(email?: string): Promise<void> {
    if (isSignInWithEmailLink(this.auth, window.location.href)) {
      let userEmail = email;
      if (!userEmail) {
        userEmail = window.localStorage.getItem('emailForSignIn') || undefined;
      }
      
      if (!userEmail) {
        throw new Error('Email not found');
      }

      await signInWithEmailLink(this.auth, userEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
