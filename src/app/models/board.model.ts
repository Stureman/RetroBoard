export interface Board {
  id: string;
  code: string;
  name: string;
  creatorEmail: string;
  lanes: Lane[];
  cardsVisible: boolean;
  createdAt: Date;
}

export interface Lane {
  id: string;
  name: string;
  order: number;
}

export interface Card {
  id: string;
  boardId: string;
  laneId: string;
  text: string;
  authorEmail: string;
  createdAt: Date;
}
