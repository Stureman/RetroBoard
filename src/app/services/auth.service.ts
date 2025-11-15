import { Injectable, inject } from '@angular/core';
import { Auth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, user, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = user(this.auth);

  async sendMagicLink(email: string): Promise<void> {
  // Build a path-relative URL so subpaths (e.g. GitHub Pages /RepoName/) are preserved
  // Also include email as a query param to improve cross-device sign-in success
  const verifyUrl = new URL(`auth/verify?email=${encodeURIComponent(email)}`, window.location.href).toString();
    const actionCodeSettings: any = {
      url: verifyUrl,
      handleCodeInApp: true,
    };
    if ((environment as any).firebase?.dynamicLinksDomain) {
      actionCodeSettings.dynamicLinkDomain = (environment as any).firebase.dynamicLinksDomain;
    }
    
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  async completeMagicLinkSignIn(email?: string): Promise<void> {
    if (isSignInWithEmailLink(this.auth, window.location.href)) {
      let userEmail = email;

      // 1) Prefer explicit email param
      if (!userEmail) {
        // 2) Try URL query param added in magic link
        try {
          const url = new URL(window.location.href);
          userEmail = url.searchParams.get('email') || undefined;
        } catch {
          // ignore URL parsing errors
        }
      }

      // 3) Fallback to localStorage (same-device flow)
      if (!userEmail) {
        userEmail = window.localStorage.getItem('emailForSignIn') || undefined;
      }
      
      if (!userEmail) {
        throw new Error('Email not found');
      }

      await signInWithEmailLink(this.auth, userEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
    } else {
      throw new Error('Invalid or expired magic link');
    }
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
