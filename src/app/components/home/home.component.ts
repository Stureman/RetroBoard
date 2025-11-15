import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BoardService } from '../../services/board.service';
import { Board } from '../../models/board.model';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatToolbarModule,
        MatIconModule,
        MatSnackBarModule,
        MatListModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  boardName = '';
  boardCode = '';
  user$ = this.authService.user$;
  userBoards: Board[] = [];
  loadingBoards = false;

  async ngOnInit() {
    // Load user's boards when they're signed in
    this.user$.subscribe(async user => {
      if (user?.email) {
        await this.loadUserBoards(user.email);
      } else {
        this.userBoards = [];
      }
    });
  }

  async loadUserBoards(email: string) {
    this.loadingBoards = true;
    try {
      this.userBoards = await this.boardService.getUserBoards(email);
    } catch (error) {
      console.error('Error loading boards:', error);
    } finally {
      this.loadingBoards = false;
    }
  }

  async createBoard() {
    if (!this.boardName.trim()) return;
    // Ensure we have the authenticated user from the stream (avoids race conditions)
    const user = await firstValueFrom(this.user$);
    if (!user || !user.email) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const created = await this.boardService.createBoard(this.boardName.trim(), user.email);
      // Refresh the boards list and clear the form
      await this.loadUserBoards(user.email);
      this.boardName = '';
      this.snackBar.open(`Board "${created.code}" created!`, 'Open', { duration: 4000 })
        .onAction().subscribe(() => {
          this.router.navigate(['/board', created.code]);
        });
    } catch (error) {
      console.error('Error creating board:', error);
      this.snackBar.open('Error creating board. Please try again.', 'Close', { duration: 3000 });
    }
  }

  async joinBoard() {
    if (!this.boardCode.trim()) return;
    
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const board = await this.boardService.getBoardByCode(this.boardCode.toUpperCase());
      if (board) {
        this.router.navigate(['/board', board.code]);
      } else {
        this.snackBar.open('Board not found', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error joining board:', error);
      this.snackBar.open('Error joining board. Please try again.', 'Close', { duration: 3000 });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToBoard(code: string) {
    this.router.navigate(['/board', code]);
  }

  async deleteBoard(board: Board, event: Event) {
    event.stopPropagation(); // Prevent navigation when clicking delete

    const user = await firstValueFrom(this.user$);
    if (!user?.email || board.creatorEmail !== user.email) {
      this.snackBar.open('Only the owner can delete this board', 'Close', { duration: 3000 });
      return;
    }

    const confirmed = confirm(`Delete board "${board.name}"? This will also delete all cards and cannot be undone.`);
    if (!confirmed) return;

    try {
      await this.boardService.deleteBoard(board.id);
      // Refresh the boards list
      await this.loadUserBoards(user.email);
      this.snackBar.open('Board deleted', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting board:', error);
      this.snackBar.open('Failed to delete board', 'Close', { duration: 3000 });
    }
  }

  async logout() {
    await this.authService.signOut();
  }
}
