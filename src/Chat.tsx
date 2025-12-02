import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth, getUserNickname } from './useAuth';
import { useChat } from './useChat';
import { usePresence } from './usePresence';
import { useEncryption } from './useEncryption';
import { useMessageCleanup } from './useMessageCleanup';
import { useFileUpload } from './useFileUpload';
import { useTypingStatus, useTypingListeners } from './useTypingStatus';
import { useTranslation, SUPPORTED_LANGUAGES } from './useTranslation';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Terminal, Wifi, Users, Shield, Trash2, Timer, LogOut, Volume2, VolumeX, Languages } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { db } from './firebase';

const Chat = () => {
  const { user, loading: authLoading, error: authError, signInAnonymous } = useAuth();
  const { encryptionKey, loading: encryptionLoading } = useEncryption();
  const { messages, loading: chatLoading, error: chatError, sendMessage, addReaction } = useChat(user?.uid || null, encryptionKey);
  const { onlineCount, loading: presenceLoading } = usePresence(user?.uid || null);
  const { uploadFile, downloadFile, uploading: uploadingFile } = useFileUpload(encryptionKey);
  const [mentionedUser, setMentionedUser] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(() => 
    localStorage.getItem('autoTranslate') === 'true'
  );
  
  // Estado de escritura en tiempo real
  const { setTyping } = useTypingStatus(user?.uid || null, getUserNickname());
  const typingUsers = useTypingListeners(user?.uid || null);
  
  // Traducción
  const { translateText, targetLanguage, changeTargetLanguage } = useTranslation();
  
  const [notificationVolume, setNotificationVolume] = useState(() => {
    const saved = localStorage.getItem('notificationVolume');
    return saved ? parseFloat(saved) : 0.5;
  });

  // 🔥 Auto-limpieza: Elimina todos los mensajes cada 120 segundos (sincronizado)
  const nextCleanupTime = useMessageCleanup(!!user);

  useEffect(() => {
    if (!user || !nextCleanupTime) return;

    const interval = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((nextCleanupTime - Date.now()) / 1000)));
    }, 100);

    return () => clearInterval(interval);
  }, [user, nextCleanupTime]);

  useEffect(() => {
    if (!showLanguageMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.volume-control-group')) setShowLanguageMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLanguageMenu]);

  // Memoizar lista de usuarios online para evitar recalculaciones
  const onlineUsers = useMemo(() => 
    [...new Set(messages.map(msg => msg.nickname))], 
    [messages]
  );

  const handleMention = useCallback((nickname: string) => {
    setMentionedUser(nickname);
  }, []);

  const handleClearMention = useCallback(() => {
    setMentionedUser('');
  }, []);

  const handleDeleteAllData = useCallback(async () => {
    if (!confirm('⚠️ This will delete your session and all local data. Continue?')) return;

    try {
      if (user?.uid) {
        // Ejecutar ambas eliminaciones en paralelo
        await Promise.all([
          remove(ref(db, `anonymous_sessions/${user.uid}`)),
          remove(ref(db, `presence/${user.uid}`))
        ]);
      }
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }, [user]);
  
  // Memoizar nickname para evitar llamadas repetitivas
  const currentUserNickname = useMemo(() => getUserNickname(), []);
  
  // Memoizar error combinado
  const combinedError = useMemo(() => authError || chatError, [authError, chatError]);

  if (authLoading || encryptionLoading) {
    return (
      <div className="chat-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <span style={{ marginLeft: '1rem', color: 'var(--text-primary)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomeScreen onJoinChat={signInAnonymous} loading={authLoading} />;
  }

  return (
    <div className="chat-container">
      {/* Efecto de líneas de escaneo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scan-line" style={{ top: 0 }} />
        <div className="scan-line" style={{ top: '33.333%', animationDelay: '1s' }} />
        <div className="scan-line" style={{ top: '66.666%', animationDelay: '2s' }} />
      </div>

      <header className="chat-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Terminal className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
            </div>
            <div>
              <h1 className="chat-header-title glitch-text">DarkWhisper</h1>
              <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                {'>'} Encrypted · Anonymous · Ephemeral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm">
            <div className="status-badge">
              <Wifi className="w-4 h-4 animate-pulse" style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--muted-foreground)' }}>CONNECTED</span>
            </div>
            <div className="status-badge">
              <Timer className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
              <span className="font-bold" style={{ color: 'var(--destructive)' }}>
                {countdown}s
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>RESET</span>
            </div>
            <div className="status-badge">
              <Users className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
              <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                {presenceLoading ? '...' : onlineCount}
              </span>
              <span style={{ color: 'var(--muted-foreground)' }}>ONLINE</span>
            </div>
            <div className="volume-control-group" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="status-badge hover:opacity-70 transition-opacity"
                title={`Translation: ${autoTranslateEnabled ? 'ON' : 'OFF'} (${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.flag || '🌐'})`}
                style={{ position: 'relative' }}
              >
                <Languages className="w-4 h-4" style={{ color: autoTranslateEnabled ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.flag || '🌐'}
                </span>
              </button>
              {showLanguageMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  minWidth: '200px',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--foreground)'
                    }}>
                      <input
                        type="checkbox"
                        checked={autoTranslateEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setAutoTranslateEnabled(enabled);
                          localStorage.setItem('autoTranslate', enabled.toString());
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      Auto-translate
                    </label>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                    Translate to:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeTargetLanguage(lang.code)}
                        style={{
                          padding: '0.5rem',
                          background: targetLanguage === lang.code ? 'rgba(0, 255, 136, 0.2)' : 'transparent',
                          border: '1px solid',
                          borderColor: targetLanguage === lang.code ? 'var(--primary)' : 'transparent',
                          borderRadius: '0.375rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: 'var(--foreground)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="volume-control-group">
              <button
                onClick={() => {
                  const newVolume = notificationVolume > 0 ? 0 : 0.5;
                  setNotificationVolume(newVolume);
                  localStorage.setItem('notificationVolume', newVolume.toString());
                }}
                className="status-badge hover:opacity-70 transition-opacity"
                title={notificationVolume > 0 ? 'Notificaciones activas' : 'Notificaciones silenciadas'}
              >
                {notificationVolume > 0 ? (
                  <Volume2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                ) : (
                  <VolumeX className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                )}
              </button>
              {/* Slider que aparece al hacer hover */}
              <div className="volume-control-popup">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Volumen: {Math.round(notificationVolume * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={notificationVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setNotificationVolume(vol);
                      localStorage.setItem('notificationVolume', vol.toString());
                    }}
                    className="volume-slider"
                    style={{ 
                      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${notificationVolume * 100}%, var(--border) ${notificationVolume * 100}%, var(--border) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleDeleteAllData}
              className="status-badge hover:bg-red-900/20 transition-colors cursor-pointer"
              title="Eliminar todos mis datos y sesión"
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
              <span style={{ color: 'var(--destructive)' }}>EXIT</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 mt-3 rounded text-xs border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--muted-foreground)' }}>
            {'>'} Connected as <span className="font-bold" style={{ color: 'var(--primary)' }}>{getUserNickname()}</span> · <span className="font-bold" style={{ color: 'var(--primary)' }}>E2E Encrypted</span> · Firebase cannot read your messages
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 mt-2 rounded text-xs border" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--destructive)' }}>
          <Trash2 className="w-4 h-4 animate-pulse" style={{ color: 'var(--destructive)' }} />
          <span style={{ color: 'var(--muted-foreground)' }}>
            {'>'} <span className="font-bold" style={{ color: 'var(--destructive)' }}>AUTO-DELETE:</span> All messages erased every 120s · 100% anonymous · No traces left
          </span>
        </div>
      </header>

      {combinedError && (
        <div className="px-4 py-3 text-sm border-b" role="alert" style={{ background: 'var(--destructive)', borderColor: 'var(--border)' }}>
          {combinedError}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={user.uid}
        loading={chatLoading}
        onMention={handleMention}
        currentUserNickname={currentUserNickname}
        onReaction={addReaction}
        notificationVolume={notificationVolume}
        onDownloadFile={downloadFile}
        encryptionKey={encryptionKey}
        translateText={translateText}
        isTranslationEnabled={autoTranslateEnabled}
      />

      {typingUsers.length > 0 && (
        <div style={{ 
          padding: '0.5rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          background: 'rgba(0, 255, 136, 0.05)',
          borderLeft: '3px solid var(--primary)',
          borderTop: '1px solid var(--border)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.15s' }} />
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{typingUsers.join(', ')}</span> {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      <MessageInput
        onSendMessage={sendMessage}
        disabled={!user || chatLoading || !encryptionKey}
        mentionedUser={mentionedUser}
        onClearMention={handleClearMention}
        onlineUsers={onlineUsers}
        onFileSelect={uploadFile}
        uploadingFile={uploadingFile}
        onTyping={setTyping}
      />
    </div>
  );
};

export default Chat;
