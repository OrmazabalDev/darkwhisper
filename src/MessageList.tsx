import { useEffect, useRef, useMemo } from 'react';
import type { Message as MessageType } from './types';
import Message from './Message';
import { playNotificationSound } from './notificationSound';

interface MessageListProps {
  messages: MessageType[];
  currentUserId: string;
  loading: boolean;
  onMention?: (nickname: string) => void;
  currentUserNickname?: string;
  onReaction?: (messageId: string, emoji: string) => void;
  notificationVolume?: number;
  onDownloadFile?: (url: string, fileName: string, fileType: string) => void;
  encryptionKey?: CryptoKey | null;
  translateText?: (text: string) => Promise<string>;
  isTranslationEnabled?: boolean;
}

const MessageList = ({ messages, currentUserId, loading, onMention, currentUserNickname, onReaction, notificationVolume = 0.5, onDownloadFile, encryptionKey, translateText, isTranslationEnabled }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const previousMessagesRef = useRef<number>(0);
  const processedMentionsRef = useRef<Set<string>>(new Set());

  // Memoizar patrón de regex para evitar recreación
  const mentionPattern = useMemo(() => {
    if (!currentUserNickname) return null;
    return new RegExp(`@${currentUserNickname}\\b`, 'i');
  }, [currentUserNickname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Detectar menciones con batching para reducir llamadas de sonido
  useEffect(() => {
    if (!currentUserNickname || notificationVolume === 0 || !mentionPattern) return;

    const newMessages = messages.slice(previousMessagesRef.current);
    previousMessagesRef.current = messages.length;

    // Batch de notificaciones - solo reproducir una vez aunque haya múltiples menciones
    let hasMention = false;

    newMessages.forEach(msg => {
      // No notificar mensajes propios o ya procesados
      if (msg.userId === currentUserId || processedMentionsRef.current.has(msg.id)) return;
      
      processedMentionsRef.current.add(msg.id);

      // Buscar @username en el mensaje (optimizado)
      const lowerText = msg.text.toLowerCase();
      const lowerNickname = currentUserNickname.toLowerCase();
      
      const mentioned = mentionPattern.test(msg.text) || 
                        lowerText.includes(`@${lowerNickname}`);
      
      if (mentioned) hasMention = true;
    });

    // Reproducir sonido una sola vez para todas las menciones nuevas
    if (hasMention) {
      playNotificationSound(notificationVolume);
    }
  }, [messages, currentUserNickname, currentUserId, notificationVolume, mentionPattern]);

  if (loading) {
    return (
      <div className="message-list loading">
        <div className="loading-spinner">
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <p>No messages yet. Be the first to say hello! 👋</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isOwnMessage={message.userId === currentUserId}
          onMention={onMention}
          allMessages={messages}
          currentUserNickname={currentUserNickname}
          onReaction={onReaction}
          onDownloadFile={onDownloadFile}
          encryptionKey={encryptionKey}
          translateText={translateText}
          isTranslationEnabled={isTranslationEnabled}
        />
      ))}
      
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
