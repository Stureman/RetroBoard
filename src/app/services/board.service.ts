import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, CollectionReference, DocumentReference, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData, docData } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Board, Lane, Card } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private firestore: Firestore = inject(Firestore);
  private envInjector = inject(EnvironmentInjector);

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
  const querySnapshot = await runInInjectionContext(this.envInjector, () => getDocs(q));
    
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
    return runInInjectionContext(this.envInjector, () =>
      docData(boardRef as any, { idField: 'id' }) as Observable<Board | undefined>
    );
  }

  async updateBoard(boardId: string, updates: Partial<Board>): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    await runInInjectionContext(this.envInjector, () => updateDoc(boardRef, updates));
  }

  async addLane(boardId: string, laneName: string): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    const boardSnap = await runInInjectionContext(this.envInjector, () => getDoc(boardRef));
    
    if (boardSnap.exists()) {
      const board = boardSnap.data() as Board;
      const newLane: Lane = {
        id: Date.now().toString(),
        name: laneName,
        order: board.lanes.length
      };
      
      await runInInjectionContext(this.envInjector, () =>
        updateDoc(boardRef, { lanes: [...board.lanes, newLane] })
      );
    }
  }

  async updateLane(boardId: string, laneId: string, newName: string): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    const boardSnap = await runInInjectionContext(this.envInjector, () => getDoc(boardRef));
    
    if (boardSnap.exists()) {
      const board = boardSnap.data() as Board;
      const updatedLanes = board.lanes.map(lane => 
        lane.id === laneId ? { ...lane, name: newName } : lane
      );
      
      await runInInjectionContext(this.envInjector, () =>
        updateDoc(boardRef, { lanes: updatedLanes })
      );
    }
  }

  async deleteLane(boardId: string, laneId: string): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    const boardSnap = await runInInjectionContext(this.envInjector, () => getDoc(boardRef));
    
    if (boardSnap.exists()) {
      const board = boardSnap.data() as Board;
      const updatedLanes = board.lanes.filter(lane => lane.id !== laneId);
      
      await runInInjectionContext(this.envInjector, () =>
        updateDoc(boardRef, { lanes: updatedLanes })
      );
      
      // Delete all cards in this lane
      await this.deleteCardsByLaneId(boardId, laneId);
    }
  }

  async deleteCardsByLaneId(boardId: string, laneId: string): Promise<void> {
    const cardsRef = collection(this.firestore, 'cards');
    const q = query(cardsRef, where('boardId', '==', boardId), where('laneId', '==', laneId));
    const querySnapshot = await runInInjectionContext(this.envInjector, () => getDocs(q));
    
    const deletePromises = querySnapshot.docs.map(cardDoc => 
      runInInjectionContext(this.envInjector, () => deleteDoc(cardDoc.ref))
    );
    
    await Promise.all(deletePromises);
  }

  async toggleCardsVisibility(boardId: string, visible: boolean): Promise<void> {
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    await runInInjectionContext(this.envInjector, () => updateDoc(boardRef, { cardsVisible: visible }));
  }

  async addCard(boardId: string, laneId: string, text: string, authorEmail: string): Promise<void> {
    const cardData = {
      boardId,
      laneId,
      text,
      authorEmail,
      createdAt: serverTimestamp()
    };
    
    await runInInjectionContext(this.envInjector, () => addDoc(collection(this.firestore, 'cards'), cardData));
  }

  async updateCard(cardId: string, updates: Partial<Card>): Promise<void> {
    const cardRef = doc(this.firestore, `cards/${cardId}`);
    await runInInjectionContext(this.envInjector, () => updateDoc(cardRef, updates as any));
  }

  getCards(boardId: string): Observable<Card[]> {
    const cardsRef = collection(this.firestore, 'cards');
    // Avoid requiring a composite index by not ordering server-side; sort client-side instead
    const q = query(cardsRef, where('boardId', '==', boardId));
    return runInInjectionContext(this.envInjector, () =>
      (collectionData(q, { idField: 'id' }) as Observable<any[]>)
        .pipe(
          map(cards => cards
            .slice()
            .sort((a, b) => {
              const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : (a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
              const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : (b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
              return ta - tb;
            })
          )
        ) as Observable<Card[]>
    );
  }

  isAdmin(board: Board, userEmail: string | null): boolean {
    return board.creatorEmail === userEmail;
  }

  async getUserBoards(userEmail: string): Promise<Board[]> {
    // Get boards created by user
    const boardsRef = collection(this.firestore, 'boards');
    const createdQuery = query(boardsRef, where('creatorEmail', '==', userEmail));
    const createdSnapshot = await runInInjectionContext(this.envInjector, () => getDocs(createdQuery));
    
    const createdBoards = createdSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()['createdAt']?.toDate()
    })) as Board[];

    // Get boards where user has added cards
    const cardsRef = collection(this.firestore, 'cards');
    const cardsQuery = query(cardsRef, where('authorEmail', '==', userEmail));
    const cardsSnapshot = await runInInjectionContext(this.envInjector, () => getDocs(cardsQuery));
    
    // Get unique board IDs from cards
    const boardIdsFromCards = new Set<string>();
    cardsSnapshot.docs.forEach(doc => {
      const boardId = doc.data()['boardId'];
      if (boardId) boardIdsFromCards.add(boardId);
    });

    // Fetch boards where user has cards but didn't create
    const participatedBoards: Board[] = [];
    for (const boardId of boardIdsFromCards) {
      // Skip if already in created boards
      if (createdBoards.some(b => b.id === boardId)) continue;
      
      const boardRef = doc(this.firestore, `boards/${boardId}`);
      const boardSnap = await runInInjectionContext(this.envInjector, () => getDoc(boardRef));
      
      if (boardSnap.exists()) {
        participatedBoards.push({
          id: boardSnap.id,
          ...boardSnap.data(),
          createdAt: boardSnap.data()['createdAt']?.toDate()
        } as Board);
      }
    }

    // Combine and sort by creation date (newest first)
    const allBoards = [...createdBoards, ...participatedBoards];
    return allBoards.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
  }

  async deleteBoard(boardId: string): Promise<void> {
    // Delete all cards in the board
    const cardsRef = collection(this.firestore, 'cards');
    const cardsQuery = query(cardsRef, where('boardId', '==', boardId));
    const cardsSnapshot = await runInInjectionContext(this.envInjector, () => getDocs(cardsQuery));
    
    const deleteCardPromises = cardsSnapshot.docs.map(cardDoc => 
      runInInjectionContext(this.envInjector, () => deleteDoc(cardDoc.ref))
    );
    
    await Promise.all(deleteCardPromises);

    // Delete the board itself
    const boardRef = doc(this.firestore, `boards/${boardId}`);
    await runInInjectionContext(this.envInjector, () => deleteDoc(boardRef));
  }
}
