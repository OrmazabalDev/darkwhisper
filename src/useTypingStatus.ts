import { useEffect, useRef, useCallback, useState } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { db } from './firebase';

// Debouncing para reducir writes a Firebase
const TYPING_DEBOUNCE_MS = 500;
const TYPING_TIMEOUT_MS = 3000;

export function useTypingStatus(sessionId: string | null, nickname: string) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingRef = useRef<any>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;

    typingRef.current = ref(db, `typing/${sessionId}`);

    return () => {
      if (typingRef.current) set(typingRef.current, null).catch(() => {});
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [sessionId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!typingRef.current || !nickname) return;

    // Debouncing: evitar múltiples writes rápidos
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      if (isTyping && !isTypingRef.current) {
        isTypingRef.current = true;
        set(typingRef.current, { nickname, timestamp: Date.now() }).catch(() => {});
        
        typingTimeoutRef.current = setTimeout(() => {
          if (typingRef.current) {
            set(typingRef.current, null).catch(() => {});
            isTypingRef.current = false;
          }
        }, TYPING_TIMEOUT_MS);
      } else if (!isTyping && isTypingRef.current) {
        set(typingRef.current, null).catch(() => {});
        isTypingRef.current = false;
      }
    }, TYPING_DEBOUNCE_MS);
  }, [nickname]);

  return { setTyping };
}

export function useTypingListeners(currentSessionId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const previousUsersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!currentSessionId) {
      setTypingUsers([]);
      previousUsersRef.current = [];
      return;
    }

    const typingRef = ref(db, 'typing');
    
    const handleTypingChange = (snapshot: any) => {
      const typing = snapshot.val();
      
      if (!typing) {
        if (previousUsersRef.current.length > 0) {
          setTypingUsers([]);
          previousUsersRef.current = [];
        }
        return;
      }

      const now = Date.now();
      const activeTypers = Object.entries(typing)
        .filter(([sessionId, data]: [string, any]) => 
          sessionId !== currentSessionId && 
          data?.nickname && 
          data?.timestamp && 
          (now - data.timestamp) < TYPING_TIMEOUT_MS
        )
        .map(([, data]: [string, any]) => data.nickname);

      // Solo actualizar si la lista cambió (optimización)
      const hasChanged = activeTypers.length !== previousUsersRef.current.length ||
        activeTypers.some((user, idx) => user !== previousUsersRef.current[idx]);

      if (hasChanged) {
        setTypingUsers(activeTypers);
        previousUsersRef.current = activeTypers;
      }
    };

    onValue(typingRef, handleTypingChange);

    return () => {
      off(typingRef, 'value', handleTypingChange);
    };
  }, [currentSessionId]);

  return typingUsers;
}
