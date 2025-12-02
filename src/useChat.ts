import { useEffect, useState, useCallback } from 'react';
import { ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp, update } from 'firebase/database';
import { db } from './firebase';
import { Message, Reaction } from './types';
import { getUserNickname } from './useAuth';
import { encryptMessage, decryptMessage } from './utils';

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string, fileData?: { url: string; fileName: string; fileType: string; fileSize: number; storagePath: string }) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
}

export function useChat(userId: string | null, encryptionKey: CryptoKey | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const messagesQuery = query(
      ref(db, 'messages'),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const unsubscribe = onValue(
      messagesQuery,
      async (snapshot) => {
        const messageList: Message[] = [];
        const snapshotVal = snapshot.val();
        
        if (snapshotVal) {
          for (const [key, data] of Object.entries(snapshotVal)) {
            const msg = data as any;
            let displayText = '🔒 [Encrypted]';
            
            if (msg.encrypted && msg.encryptedContent && encryptionKey) {
              try {
                displayText = await decryptMessage(msg.encryptedContent, encryptionKey);
              } catch {
                displayText = '🔒 [Unable to decrypt]';
              }
            } else if (msg.encrypted && !encryptionKey) {
              displayText = '🔒 [Encryption key not available]';
            } else if (!msg.encrypted) {
              displayText = msg.text || '[Empty message]';
            }
            
            // Desencriptar nombre de archivo si existe
            let decryptedFileName = msg.fileName;
            if (msg.encryptedFileName && encryptionKey) {
              try {
                decryptedFileName = await decryptMessage(msg.encryptedFileName, encryptionKey);
              } catch {
                decryptedFileName = '🔒 [Encrypted file]';
              }
            }
            
            messageList.push({
              id: key,
              text: displayText,
              nickname: msg.nickname,
              userId: msg.sessionId || msg.userId,
              timestamp: msg.timestamp,
              createdAt: new Date(msg.timestamp),
              encrypted: msg.encrypted || false,
              encryptedContent: msg.encryptedContent,
              reactions: msg.reactions || [],
              fileUrl: msg.fileUrl,
              fileName: decryptedFileName,
              fileType: msg.fileType,
              fileSize: msg.fileSize,
              encryptedFile: msg.encryptedFile,
            });
          }
        }

        setMessages(messageList);
        setLoading(false);
        setError(null);
      },
      (err: any) => {
        const errorMessage = err.code === 'PERMISSION_DENIED'
          ? 'Failed to load messages. Check Firebase rules.'
          : 'Failed to load messages. Check connection.';
        setError(errorMessage);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, encryptionKey]);

  const sendMessage = useCallback(async (text: string, fileData?: { url: string; fileName: string; fileType: string; fileSize: number; storagePath: string }): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    if (!text?.trim() && !fileData) throw new Error('Message or file required');

    try {
      const trimmed = text.trim();
      
      if (!encryptionKey) {
        throw new Error('Encryption not available');
      }

      // Encriptar contenido y nombre de archivo en paralelo si aplica
      const encryptionTasks = [encryptMessage(trimmed, encryptionKey)];
      if (fileData) {
        encryptionTasks.push(encryptMessage(fileData.fileName, encryptionKey));
      }
      
      const [encryptedContent, encryptedFileName] = await Promise.all(encryptionTasks);
      
      const messageData: any = {
        text: '🔒',
        nickname: getUserNickname(),
        sessionId: userId,
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
        encrypted: true,
        encryptedContent,
      };

      // Agregar datos de archivo si existen
      if (fileData && encryptedFileName) {
        messageData.fileUrl = fileData.url;
        messageData.fileName = '🔒';
        messageData.encryptedFileName = encryptedFileName;
        messageData.fileType = fileData.fileType;
        messageData.fileSize = fileData.fileSize;
        messageData.storagePath = fileData.storagePath;
        messageData.encryptedFile = true;
      }

      await push(ref(db, 'messages'), messageData);
    } catch {
      throw new Error('Failed to send message');
    }
  }, [userId, encryptionKey]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    
    try {
      const currentUserNickname = getUserNickname();
      const message = messages.find(m => m.id === messageId);
      
      if (!message) throw new Error('Message not found');
      
      const reactions = message.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      let updatedReactions: Reaction[];
      
      if (existingReaction) {
        const hasUserReacted = existingReaction.users.includes(currentUserNickname);
        
        if (hasUserReacted) {
          // Eliminar reacción - filtrar usuarios y remover si count llega a 0
          updatedReactions = reactions
            .map(r => r.emoji === emoji 
              ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== currentUserNickname) }
              : r
            )
            .filter(r => r.count > 0);
        } else {
          // Agregar usuario a reacción existente
          updatedReactions = reactions.map(r => r.emoji === emoji 
            ? { ...r, count: r.count + 1, users: [...r.users, currentUserNickname] }
            : r
          );
        }
      } else {
        // Crear nueva reacción
        updatedReactions = [...reactions, { emoji, count: 1, users: [currentUserNickname] }];
      }
      
      await update(ref(db, `messages/${messageId}`), { reactions: updatedReactions });
    } catch {
      throw new Error('Failed to add reaction');
    }
  }, [userId, messages]);

  return { messages, loading, error, sendMessage, addReaction };
}
