/**
 * AuthContext - Manage user authentication state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { ref, set, onDisconnect, onValue } from 'firebase/database';
import { db } from '../firebase';

interface AuthContextType {
  user: { uid: string } | null;
  loading: boolean;
  error: string | null;
  nickname: string;
  signInAnonymous: (nickname?: string) => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState<string>('');

  useEffect(() => {
    // Verificar si existe una sesión guardada
    const existingSessionId = localStorage.getItem('ephemeral_session_id');
    const existingNickname = localStorage.getItem('chatNickname');
    
    // Solo restaurar si existe sesión previa
    if (existingSessionId && existingNickname) {
      const normalizedNickname = existingNickname.toLowerCase();
      
      setUser({ uid: existingSessionId });
      setNicknameState(normalizedNickname);
      
      // Restaurar sesión en Firebase
      const sessionRef = ref(db, `anonymous_sessions/${existingSessionId}`);
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${normalizedNickname}`);
      
      Promise.all([
        set(sessionRef, {
          nickname: normalizedNickname,
          active: true,
          created: Date.now(),
        }),
        set(nicknameIndexRef, existingSessionId)
      ]).then(() => {
        onDisconnect(sessionRef).remove();
        onDisconnect(nicknameIndexRef).remove();
      }).catch((err) => {
        console.error('❌ Error registering session:', err);
      });
    } else {
      // No hay sesión previa, mostrar WelcomeScreen
      setUser(null);
      setNicknameState('');
    }
    
    setLoading(false);
  }, []);

  const signInAnonymous = async (newNickname?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (newNickname) {
        const normalizedNickname = newNickname.toLowerCase();
        authService.setUserNickname(normalizedNickname);
        setNicknameState(normalizedNickname);
      }

      const sessionId = authService.getSessionId();
      const finalNickname = (newNickname || authService.getUserNickname()).toLowerCase();
      
      // Actualizar sesión en Firebase con nickname e índice
      const sessionRef = ref(db, `anonymous_sessions/${sessionId}`);
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${finalNickname}`);
      
      await Promise.all([
        set(sessionRef, {
          nickname: finalNickname,
          active: true,
          created: Date.now(),
        }),
        set(nicknameIndexRef, sessionId)
      ]);
      
      await onDisconnect(sessionRef).remove();
      await onDisconnect(nicknameIndexRef).remove();
      
      setUser({ uid: sessionId });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setNickname = async (newNickname: string): Promise<void> => {
    if (!user) return;
    
    const oldNickname = nickname;
    const normalizedNickname = newNickname.toLowerCase(); // Normalizar a minúsculas
    
    // Verificar si el nickname ya está en uso por otro usuario
    const newNicknameIndexRef = ref(db, `user_sessions_by_nickname/${normalizedNickname}`);
    const existingSessionSnapshot = await new Promise<any>((resolve) => {
      onValue(newNicknameIndexRef, resolve, { onlyOnce: true });
    });
    
    const existingSessionId = existingSessionSnapshot.val();
    
    // Si el nickname está en uso por otro usuario, rechazar el cambio
    if (existingSessionId && existingSessionId !== user.uid) {
      const error = `Nickname "${normalizedNickname}" is already in use. Please choose another one.`;
      setError(error);
      throw new Error(error);
    }
    
    // Si está disponible, proceder con el cambio
    authService.setUserNickname(normalizedNickname);
    setNicknameState(normalizedNickname);
    
    // Actualizar nickname en Firebase y reorganizar índice
    const sessionRef = ref(db, `anonymous_sessions/${user.uid}`);
    const oldNicknameIndexRef = ref(db, `user_sessions_by_nickname/${oldNickname}`);
    
    try {
      await Promise.all([
        set(sessionRef, {
          nickname: normalizedNickname,
          active: true,
          created: Date.now(),
        }),
        set(newNicknameIndexRef, user.uid),
        set(oldNicknameIndexRef, null) // Eliminar el índice anterior
      ]);
      setError(null);
    } catch (err) {
      console.error('❌ Error updating nickname:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        nickname, 
        signInAnonymous, 
        setNickname 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
