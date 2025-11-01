import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, query, where, orderBy, Timestamp, CollectionReference, DocumentReference, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData, docData } from '@angular/fire/firestore';
import { Board, Lane, Card } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private firestore: Firestore = inject(Firestore);

  generateBoardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createBoard(name: string, creatorEmail: string): Promise<{ id: string; code: string }> {
    const code = this.generateBoardCode();
    const defaultLanes: Lane[] = [
      { id: '1', name: 'Good', order: 0 },
      { id: '2', name: 'Bad', order: 1 },
      { id: '3', name: 'Improve', order: 2 }
    ];

    const boardData = {
      code,
      name,
      creatorEmail,
      lanes: defaultLanes,
      cardsVisible: false,
      // Use server timestamp for consistency with security rules and ordering
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(this.firestore, 'boards'), boardData);
    return { id: docRef.id, code };
  }

  async getBoardByCode(code: string): Promise<Board | null> {
    const boardsRef = collection(this.firestore, 'boards');
    const q = query(boardsRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()['createdAt']?.toDate()
    } as Board;
  }

  getBoardById(boardId: string): Observable<Board | undefined> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    // Use any here to avoid type brand mismatch between nested @firebase versions
    return docData(boardRef as any, { idField: 'id' }) as Observable<Board | undefined>;
  }

  async updateBoard(boardId: string, updates: Partial<Board>): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    await updateDoc(boardRef, updates);
  }

  async addLane(boardId: string, laneName: string): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    const boardSnap = await getDoc(boardRef);
    
    if (boardSnap.exists()) {
      const board = boardSnap.data() as Board;
      const newLane: Lane = {
        id: Date.now().toString(),
        name: laneName,
        order: board.lanes.length
      };
      
      await updateDoc(boardRef, {
        lanes: [...board.lanes, newLane]
      });
    }
  }

  async toggleCardsVisibility(boardId: string, visible: boolean): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    await updateDoc(boardRef, { cardsVisible: visible });
  }

  async addCard(boardId: string, laneId: string, text: string, authorEmail: string): Promise<void> {
    const cardData = {
      boardId,
      laneId,
      text,
      authorEmail,
      createdAt: Timestamp.now()
    };
    
    await addDoc(collection(this.firestore, 'cards'), cardData);
  }

  getCards(boardId: string): Observable<Card[]> {
    const cardsRef = collection(this.firestore, 'cards');
    const q = query(cardsRef, where('boardId', '==', boardId), orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Card[]>;
  }

  isAdmin(board: Board, userEmail: string | null): boolean {
    return board.creatorEmail === userEmail;
  }
}
