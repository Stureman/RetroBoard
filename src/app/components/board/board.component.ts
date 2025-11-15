import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
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
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
  MatSnackBarModule,
  DragDropModule
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
  editingCardId: string | null = null;
  editingText: string = '';
  editingLaneId: string | null = null;
  editingLaneName: string = '';

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

  // Whether the current viewer should see the card's text (content)
  shouldRevealText(card: Card): boolean {
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

  canEdit(card: Card): boolean {
    return !!this.currentUserEmail && card.authorEmail === this.currentUserEmail;
  }

  startEdit(card: Card) {
    if (!this.canEdit(card)) return;
    this.editingCardId = card.id;
    this.editingText = card.text;
  }

  cancelEdit() {
    this.editingCardId = null;
    this.editingText = '';
  }

  async saveEdit(card: Card) {
    if (!this.editingCardId || !this.editingText.trim()) return;
    try {
      await this.boardService.updateCard(card.id, { text: this.editingText.trim() } as any);
      this.cancelEdit();
    } catch (error) {
      console.error('Error updating card:', error);
    }
  }

  async dropCard(event: CdkDragDrop<Card[]>, lane: Lane) {
    // Only handle cross-lane moves; ordering within lane is not persisted
    const card: Card | undefined = event.item.data as any;
    if (!card || card.laneId === lane.id) return;
    // Only authors can move their cards (per security rules)
    if (!this.canEdit(card)) return;
    try {
      await this.boardService.updateCard(card.id, { laneId: lane.id } as any);
    } catch (error) {
      console.error('Error moving card:', error);
    }
  }

  getColorForEmail(email: string): string {
    // Deterministic pastel HSL from email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    const sat = 70; // percent
    const light = 88; // percent, keep readable
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  getTextColorForBackground(bg: string): string {
    // For light pastels, dark text works
    return '#222';
  }

  async toggleVisibility(checked: boolean) {
    if (!this.board || !this.isAdmin) return;

    try {
      await this.boardService.toggleCardsVisibility(this.board.id, checked);
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

  startEditLane(lane: Lane) {
    if (!this.isAdmin) return;
    this.editingLaneId = lane.id;
    this.editingLaneName = lane.name;
    // Focus input after view updates
    setTimeout(() => {
      const input = document.querySelector('.lane-name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  cancelEditLane() {
    this.editingLaneId = null;
    this.editingLaneName = '';
  }

  async saveEditLane(lane: Lane) {
    if (!this.editingLaneId || !this.editingLaneName.trim() || !this.board) return;
    try {
      await this.boardService.updateLane(this.board.id, lane.id, this.editingLaneName.trim());
      this.cancelEditLane();
    } catch (error) {
      console.error('Error updating lane:', error);
    }
  }

  async deleteLane(lane: Lane) {
    if (!this.board || !this.isAdmin) return;

    const cardsInLane = this.getCardsForLane(lane.id).length;
    const message = cardsInLane > 0 
      ? `Delete "${lane.name}" and its ${cardsInLane} card(s)?`
      : `Delete lane "${lane.name}"?`;

    if (!confirm(message)) return;

    try {
      await this.boardService.deleteLane(this.board.id, lane.id);
      this.snackBar.open('Lane deleted', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting lane:', error);
      this.snackBar.open('Failed to delete lane', 'Close', { duration: 3000 });
    }
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
