import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BoardService } from '../../services/board.service';
import { Board, Lane, Card } from '../../models/board.model';
import { AddLaneDialogComponent } from './add-lane-dialog/add-lane-dialog.component';

@Component({
    selector: 'app-board',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatToolbarModule,
        MatIconModule,
        MatChipsModule,
        MatSlideToggleModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  board: Board | null = null;
  cards: Card[] = [];
  isAdmin = false;
  currentUserEmail: string | null = null;
  newCardTexts: { [laneId: string]: string } = {};

  async ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.router.navigate(['/home']);
      return;
    }

    const user = this.authService.getCurrentUser();
    this.currentUserEmail = user?.email || null;

    // Load board
    this.board = await this.boardService.getBoardByCode(code);
    if (!this.board) {
      this.snackBar.open('Board not found', 'Close', { duration: 3000 });
      this.router.navigate(['/home']);
      return;
    }

    this.isAdmin = this.boardService.isAdmin(this.board, this.currentUserEmail);

    // Subscribe to board updates
    this.boardService.getBoardById(this.board.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(board => {
        if (board) {
          this.board = board;
        }
      });

    // Subscribe to cards
    this.boardService.getCards(this.board.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cards => {
        this.cards = cards;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCardsForLane(laneId: string): Card[] {
    return this.cards.filter(card => card.laneId === laneId);
  }

  shouldShowCard(card: Card): boolean {
    if (this.isAdmin) return true;
    if (this.board?.cardsVisible) return true;
    return card.authorEmail === this.currentUserEmail;
  }

  async addCard(laneId: string) {
    const text = this.newCardTexts[laneId]?.trim();
    if (!text || !this.board || !this.currentUserEmail) return;

    try {
      await this.boardService.addCard(this.board.id, laneId, text, this.currentUserEmail);
      this.newCardTexts[laneId] = '';
    } catch (error) {
      console.error('Error adding card:', error);
    }
  }

  async toggleVisibility() {
    if (!this.board || !this.isAdmin) return;

    try {
      await this.boardService.toggleCardsVisibility(this.board.id, !this.board.cardsVisible);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  }

  openAddLaneDialog() {
    const dialogRef = this.dialog.open(AddLaneDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(async (laneName: string) => {
      if (laneName && this.board) {
        try {
          await this.boardService.addLane(this.board.id, laneName);
        } catch (error) {
          console.error('Error adding lane:', error);
        }
      }
    });
  }

  copyBoardCode() {
    if (this.board) {
      navigator.clipboard.writeText(this.board.code);
      this.snackBar.open('Board code copied to clipboard!', 'Close', { duration: 2000 });
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/home']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
