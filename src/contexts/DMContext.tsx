import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { ref, onValue, push, set, query, orderByChild, off, remove } from 'firebase/database';
import { db } from '../firebase';
import { useAuthContext } from './AuthContext';
import { useCryptoContext } from './CryptoContext';
import { cryptoService } from '../services/crypto.service';
import { playNotificationSound } from '../utils/notification.utils';

export interface DMConversation {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isOnline?: boolean;
}

export interface DMMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  nickname: string; // Alias de from para compatibilidad con Message
  userId: string; // Alias de from para compatibilidad con Message
  timestamp: Date;
  createdAt: Date; // Alias de timestamp para compatibilidad con Message
  encrypted: boolean;
  encryptedContent?: string;
  isSystemMessage?: boolean; // Para mensajes del sistema como "Chat terminado"
}

interface DMContextType {
  conversations: DMConversation[];
  activeConversation: string | null;
  messages: DMMessage[];
  loading: boolean;
  setActiveConversation: (username: string | null) => void;
  sendDM: (to: string, text: string) => Promise<void>;
  startConversation: (username: string) => void;
  endConversation: (username: string) => Promise<void>;
  totalUnread: number;
}

const DMContext = createContext<DMContextType | undefined>(undefined);

export function DMProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, nickname } = useAuthContext();
  const { encryptionKey } = useCryptoContext();
  
  // Refs para el sistema de notificaciones
  const previousMessagesCountRef = useRef<number>(0);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const previousConversationsRef = useRef<DMConversation[]>([]);

  // Escuchar conversaciones del usuario
  useEffect(() => {
    if (!user) return;

    const conversationsRef = ref(db, `dm_conversations/${user.uid}`);
    
    onValue(conversationsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConversations([]);
        return;
      }

      const convList: DMConversation[] = [];
      
      // Obtener estados de presencia de todos los usuarios
      const presenceRef = ref(db, 'presence');
      const presenceSnapshot = await new Promise<any>((resolve) => {
        onValue(presenceRef, resolve, { onlyOnce: true });
      });
      const presenceData = presenceSnapshot.val() || {};

      for (const [key, value] of Object.entries(data)) {
        const conv = value as any;
        
        // Buscar el sessionId del usuario usando el índice
        let isOnline = false;
        const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${conv.username}`);
        const userSessionSnapshot = await new Promise<any>((resolve) => {
          onValue(nicknameIndexRef, resolve, { onlyOnce: true });
        });
        
        const userSessionId = userSessionSnapshot.val();
        if (userSessionId) {
          isOnline = presenceData[userSessionId]?.online || false;
        }
        
        convList.push({
          id: key,
          username: conv.username,
          lastMessage: conv.lastMessage || '',
          timestamp: new Date(conv.timestamp || Date.now()),
          unread: conv.unread || 0,
          isOnline,
        });
      }

      // Ordenar por timestamp descendente
      convList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Detectar nuevos mensajes no leídos en conversaciones inactivas
      if (previousConversationsRef.current.length > 0) {
        let hasNewUnreadMessage = false;
        
        convList.forEach(newConv => {
          const oldConv = previousConversationsRef.current.find(c => c.username === newConv.username);
          
          // Si hay una conversación con unread > 0 y no es la conversación activa
          if (newConv.unread > 0 && 
              newConv.username !== activeConversation &&
              (!oldConv || newConv.unread > oldConv.unread)) {
            hasNewUnreadMessage = true;
          }
        });
        
        // Reproducir sonido para nuevos mensajes en conversaciones inactivas
        if (hasNewUnreadMessage) {
          playNotificationSound(0.6);
        }
      }
      
      previousConversationsRef.current = convList;
      setConversations(convList);
    });

    return () => off(conversationsRef);
  }, [user]);

  // Escuchar mensajes de la conversación activa
  useEffect(() => {
    if (!user || !activeConversation || !encryptionKey) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const roomId = createRoomId(nickname, activeConversation);
    const messagesRef = query(ref(db, `dm_messages/${roomId}`), orderByChild('timestamp'));

    onValue(messagesRef, async (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const messagesList: DMMessage[] = [];
      
      for (const [key, value] of Object.entries(data)) {
        const msg = value as any;
        let displayText = msg.text;

        if (msg.encrypted && msg.encryptedContent && encryptionKey) {
          try {
            displayText = await cryptoService.decryptMessage(msg.encryptedContent, encryptionKey);
          } catch (error) {
            console.error('Error decrypting DM:', error);
            displayText = '🔒 [Unable to decrypt]';
          }
        }

        const msgTimestamp = new Date(msg.timestamp);
        messagesList.push({
          id: key,
          from: msg.from,
          to: msg.to,
          text: displayText,
          nickname: msg.from, // Alias para compatibilidad
          userId: msg.from, // Alias para compatibilidad
          timestamp: msgTimestamp,
          createdAt: msgTimestamp, // Alias para compatibilidad
          encrypted: msg.encrypted,
          encryptedContent: msg.encryptedContent,
          isSystemMessage: msg.isSystemMessage || false,
        });
      }

      // Ordenar por timestamp
      messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Detectar nuevos mensajes recibidos (no propios) para reproducir sonido
      const newMessages = messagesList.slice(previousMessagesCountRef.current);
      let hasNewIncomingMessage = false;
      
      newMessages.forEach(msg => {
        // Solo notificar mensajes de otros usuarios que no hayamos procesado
        if (msg.from !== nickname && 
            !msg.isSystemMessage && 
            !processedMessageIdsRef.current.has(msg.id)) {
          processedMessageIdsRef.current.add(msg.id);
          hasNewIncomingMessage = true;
        }
      });
      
      // Reproducir sonido una vez para todos los mensajes nuevos
      if (hasNewIncomingMessage) {
        playNotificationSound(0.6); // Volumen ligeramente más alto para DMs
      }
      
      previousMessagesCountRef.current = messagesList.length;
      setMessages(messagesList);
      setLoading(false);

      // Marcar como leído
      if (messagesList.length > 0) {
        markAsRead(activeConversation);
      }
    });

    return () => {
      off(messagesRef);
      // Reset refs al cambiar de conversación
      previousMessagesCountRef.current = 0;
      processedMessageIdsRef.current.clear();
    };
  }, [user, activeConversation, encryptionKey, nickname]);

  const createRoomId = (user1: string, user2: string): string => {
    return [user1, user2].sort().join('_');
  };

  const startConversation = useCallback(async (username: string) => {
    if (!user) {
      console.error('❌ Cannot start conversation: No user');
      return;
    }

    const normalizedUsername = username.toLowerCase(); // Normalizar a minúsculas

    try {
      // Crear conversación para el usuario actual
      const conversationRef = ref(db, `dm_conversations/${user.uid}/${normalizedUsername}`);
      await set(conversationRef, {
        username: normalizedUsername,
        lastMessage: '',
        timestamp: Date.now(),
        unread: 0,
        isOnline: false,
      });

      // Buscar el sessionId del destinatario usando el índice
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${normalizedUsername}`);
      const recipientSessionSnapshot = await new Promise<any>((resolve) => {
        onValue(nicknameIndexRef, resolve, { onlyOnce: true });
      });
      
      const recipientSessionId = recipientSessionSnapshot.val();
      
      if (recipientSessionId) {
        // Crear conversación para el destinatario
        const recipientConversationRef = ref(db, `dm_conversations/${recipientSessionId}/${nickname}`);
        await set(recipientConversationRef, {
          username: nickname,
          lastMessage: '',
          timestamp: Date.now(),
          unread: 0,
          isOnline: false,
        });
      }

      setActiveConversation(normalizedUsername);
      
    } catch (error) {
      console.error('❌ Error in startConversation:', error);
    }
  }, [user, nickname]);

  const sendDM = useCallback(async (to: string, text: string) => {
    if (!user || !encryptionKey || !text.trim()) return;

    const normalizedTo = to.toLowerCase(); // Normalizar a minúsculas
    try {
      const roomId = createRoomId(nickname, normalizedTo);
      const messagesRef = ref(db, `dm_messages/${roomId}`);
      const newMessageRef = push(messagesRef);

      // Encriptar mensaje
      const encryptedContent = await cryptoService.encryptMessage(text, encryptionKey);

      const messageData = {
        from: nickname,
        to: to,
        text: '🔒 [Encrypted]',
        encryptedContent,
        encrypted: true,
        timestamp: Date.now(),
      };

      await set(newMessageRef, messageData);

      // Actualizar conversación del remitente
      await updateConversation(user.uid, normalizedTo, text);
      
      // Buscar el sessionId del destinatario usando el índice
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${normalizedTo}`);
      const recipientSessionSnapshot = await new Promise<any>((resolve) => {
        onValue(nicknameIndexRef, resolve, { onlyOnce: true });
      });
      
      const recipientSessionId = recipientSessionSnapshot.val();
      
      if (recipientSessionId) {
        await updateConversationForRecipient(recipientSessionId, nickname, text);
      }
      
    } catch (error) {
      console.error('❌ Error sending DM:', error);
      throw error;
    }
  }, [user, nickname, encryptionKey]);

  const updateConversation = async (userId: string, otherUser: string, lastMessage: string) => {
    const conversationRef = ref(db, `dm_conversations/${userId}/${otherUser}`);
    await set(conversationRef, {
      username: otherUser,
      lastMessage,
      timestamp: Date.now(),
      unread: 0,
    });
  };

  const updateConversationForRecipient = async (recipientId: string, senderNickname: string, lastMessage: string) => {
    const conversationRef = ref(db, `dm_conversations/${recipientId}/${senderNickname}`);
    
    // Obtener el unread actual y aumentarlo
    onValue(conversationRef, async (snapshot) => {
      const currentData = snapshot.val();
      const currentUnread = currentData?.unread || 0;
      
      await set(conversationRef, {
        username: senderNickname,
        lastMessage,
        timestamp: Date.now(),
        unread: currentUnread + 1,
      });
    }, { onlyOnce: true });
  };

  const markAsRead = async (username: string) => {
    if (!user) return;
    
    const conversationRef = ref(db, `dm_conversations/${user.uid}/${username}`);
    
    onValue(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        set(conversationRef, {
          ...data,
          unread: 0,
        });
      }
    }, { onlyOnce: true });
  };

  // Función para terminar una conversación (eliminar todo el rastro)
  const endConversation = useCallback(async (username: string) => {
    if (!user) return;

    const normalizedUsername = username.toLowerCase(); // Normalizar a minúsculas
    try {
      const roomId = createRoomId(nickname, normalizedUsername);
      
      // 1. Enviar mensaje del sistema "Chat terminado" antes de eliminar
      const messagesRef = ref(db, `dm_messages/${roomId}`);
      const systemMessageRef = push(messagesRef);
      await set(systemMessageRef, {
        from: 'SYSTEM',
        to: normalizedUsername,
        text: '🔴 Chat terminado',
        encrypted: false,
        timestamp: Date.now(),
        isSystemMessage: true,
      });

      // 2. Auto-eliminar el mensaje del sistema después de 30 segundos
      setTimeout(async () => {
        try {
          await remove(ref(db, `dm_messages/${roomId}/${systemMessageRef.key}`));
        } catch (error) {
          console.error('Error removing system message:', error);
        }
      }, 30000);

      // 3. Eliminar todos los mensajes del roomId después de 30 segundos
      setTimeout(async () => {
        try {
          await remove(ref(db, `dm_messages/${roomId}`));
        } catch (error) {
          console.error('Error removing messages:', error);
        }
      }, 30000);

      // 4. Buscar el sessionId del otro usuario usando el índice y eliminar ambas conversaciones después de 30 segundos
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${normalizedUsername}`);
      const recipientSessionSnapshot = await new Promise<any>((resolve) => {
        onValue(nicknameIndexRef, resolve, { onlyOnce: true });
      });
      
      const recipientSessionId = recipientSessionSnapshot.val();
      if (recipientSessionId) {
        setTimeout(async () => {
          try {
            await remove(ref(db, `dm_conversations/${user.uid}/${normalizedUsername}`));
            await remove(ref(db, `dm_conversations/${recipientSessionId}/${nickname}`));
          } catch (error) {
            console.error('Error removing conversations:', error);
          }
        }, 30000);
      }

      // 5. Cerrar la conversación activa inmediatamente
      setActiveConversation(null);
      
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }, [user, nickname]);

  // Detectar cuando ambos usuarios están desconectados
  useEffect(() => {
    if (!user || !activeConversation) return;

    const roomId = createRoomId(nickname, activeConversation);
    
    // Listener de presence para ambos usuarios
    const presenceRef = ref(db, 'presence');

    const checkBothOffline = async () => {
      const presenceSnapshot = await new Promise<any>((resolve) => 
        onValue(presenceRef, resolve, { onlyOnce: true })
      );

      const presenceData = presenceSnapshot.val() || {};

      let myOnline = presenceData[user.uid]?.online || false;
      let otherOnline = false;

      // Buscar sessionId del otro usuario usando el índice
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${activeConversation}`);
      const otherSessionSnapshot = await new Promise<any>((resolve) => 
        onValue(nicknameIndexRef, resolve, { onlyOnce: true })
      );
      
      const otherSessionId = otherSessionSnapshot.val();
      if (otherSessionId) {
        otherOnline = presenceData[otherSessionId]?.online || false;
      }

      // Si ambos están offline, auto-eliminar el chat
      if (!myOnline && !otherOnline) {
        await remove(ref(db, `dm_messages/${roomId}`));
        await remove(ref(db, `dm_conversations/${user.uid}/${activeConversation}`));
        
        if (otherSessionId) {
          await remove(ref(db, `dm_conversations/${otherSessionId}/${nickname}`));
        }
        
        setActiveConversation(null);
      }
    };

    const interval = setInterval(checkBothOffline, 5000); // Verificar cada 5 segundos

    return () => clearInterval(interval);
  }, [user, nickname, activeConversation]);

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  const handleSetActiveConversation = useCallback((username: string | null) => {
    setActiveConversation(username);
    if (username) {
      markAsRead(username);
    }
  }, []);

  return (
    <DMContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loading,
        setActiveConversation: handleSetActiveConversation,
        sendDM,
        startConversation,
        endConversation,
        totalUnread,
      }}
    >
      {children}
    </DMContext.Provider>
  );
}

export function useDMContext() {
  const context = useContext(DMContext);
  if (context === undefined) {
    throw new Error('useDMContext must be used within a DMProvider');
  }
  return context;
}
