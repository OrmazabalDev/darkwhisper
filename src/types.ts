export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  text: string;
  nickname: string;
  userId: string;
  timestamp: number | Date;
  createdAt: Date;
  encrypted?: boolean;
  encryptedContent?: string;
  reactions?: Reaction[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  encryptedFile?: boolean;
}

export interface User {
  uid: string;
  nickname: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}
