import { useState, useCallback, useEffect } from 'react';
import { useAuthContext, useCryptoContext, useChatContext, useDMContext } from '../../contexts';
import { usePresence, useMessageCleanup, useTypingStatus, useTranslation, useMediaUpload, SUPPORTED_LANGUAGES } from '../../hooks';
import WelcomeScreen from '../ui/WelcomeScreen';
import Sidebar from '../ui/Sidebar';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import { Terminal, Users, Timer, Volume2, VolumeX, Languages, Menu, XCircle } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { db } from '../../firebase';

const Chat = () => {
  const { user, loading: authLoading, error: authError, signInAnonymous, nickname } = useAuthContext();
  const { encryptionKey, loading: encryptionLoading } = useCryptoContext();
  const { messages, loading: chatLoading, error: chatError, sendMessage, addReaction } = useChatContext();
  const { messages: dmMessages, activeConversation, sendDM, startConversation, endConversation, conversations } = useDMContext();
  const { onlineCount, loading: presenceLoading } = usePresence();
  const { uploadFile, downloadFile, uploading: uploadingFile } = useMediaUpload();
  const [mentionedUser, setMentionedUser] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? saved === 'true' : false;
  });
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(() => 
    localStorage.getItem('autoTranslate') === 'true'
  );
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [dmCountdown, setDmCountdown] = useState<number | null>(null);
  
  // Estado de escritura en tiempo real
  const { setTyping, typingUsers } = useTypingStatus();
  
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

  // Detectar mensaje del sistema y activar countdown de 30s
  useEffect(() => {
    if (!activeConversation || dmMessages.length === 0) {
      setDmCountdown(null);
      return;
    }

    const lastMessage = dmMessages[dmMessages.length - 1];
    if (lastMessage.isSystemMessage && lastMessage.text.includes('Chat terminado')) {
      setDmCountdown(30);
      const startTime = Date.now();
      const endTime = startTime + 30000;

      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setDmCountdown(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [dmMessages, activeConversation]);

  const onlineUsers = [...new Set(messages.map(msg => msg.nickname))];

  const handleMention = useCallback((nickname: string) => {
    setMentionedUser(nickname);
  }, []);

  const handleClearMention = useCallback(() => {
    setMentionedUser('');
  }, []);

  const handleSendMessage = useCallback(async (text: string, file?: any) => {
    if (!text.trim() && !file) return;

    // Detectar comandos
    if (text.startsWith('/')) {
      const command = text.toLowerCase().trim();
      
      if (command.startsWith('/dm ')) {
        const username = command.substring(4).trim();
        if (username) {
          await startConversation(username);
          return;
        }
      }
      
      if (command === '/help') {
        // Mostrar ayuda (puedes implementar un sistema de mensajes del sistema)
        alert('Commands:\n/dm <username> - Start a private conversation\n/help - Show this help');
        return;
      }
      
      if (command === '/clear') {
        // Implementar limpieza si es necesario
        return;
      }
      
      // Comando desconocido
      alert(`Unknown command: ${command}\nType /help for available commands`);
      return;
    }

    // Enviar mensaje normal o DM
    if (activeConversation) {
      await sendDM(activeConversation, text);
    } else {
      await sendMessage(text, file);
    }
  }, [activeConversation, sendDM, sendMessage, startConversation]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  }, []);

  const handleDeleteAllData = useCallback(async () => {
    if (!confirm('⚠️ This will delete your session and all local data. Continue?')) return;

    try {
      if (user?.uid) {
        // Eliminar todas las referencias del usuario en Firebase
        await Promise.all([
          remove(ref(db, `anonymous_sessions/${user.uid}`)),
          remove(ref(db, `presence/${user.uid}`)),
          remove(ref(db, `user_sessions_by_nickname/${nickname.toLowerCase()}`)),
          remove(ref(db, `dm_conversations/${user.uid}`))
        ]);
      }
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }, [user, nickname]);

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', width: '100%' }}>
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {!sidebarCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={handleToggleSidebar}
          style={{ 
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 40,
            display: window.innerWidth < 768 ? 'block' : 'none'
          }}
        />
      )}
      
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={handleToggleSidebar}
        currentUser={nickname}
        onDeleteSession={handleDeleteAllData}
        onChannelSelect={() => {
          if (window.innerWidth < 768) {
            handleToggleSidebar();
          }
        }}
      />
      
      <div className="chat-container" style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
        {/* Efecto de líneas de escaneo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="scan-line" style={{ top: 0 }} />
          <div className="scan-line" style={{ top: '33.333%', animationDelay: '1s' }} />
          <div className="scan-line" style={{ top: '66.666%', animationDelay: '2s' }} />
        </div>

        <header className="chat-header">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2" style={{ flex: '1 1 auto', minWidth: 0 }}>
            {sidebarCollapsed && (
              <button
                onClick={handleToggleSidebar}
                className="status-badge hover:bg-accent transition-colors cursor-pointer"
                title="Show sidebar"
                style={{ flexShrink: 0 }}
              >
                <Menu className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </button>
            )}
            <div className="relative" style={{ flexShrink: 0 }}>
              <Terminal className="w-6 h-6 md:w-8 md:h-8" style={{ color: 'var(--primary)' }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h1 className="chat-header-title glitch-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeConversation ? `@${activeConversation}` : 'DarkWhisper'}
              </h1>
              <p className="text-xs font-mono hidden md:block" style={{ color: 'var(--muted-foreground)' }}>
                {'>'} {activeConversation ? 'Private conversation' : 'Encrypted · Anonymous · Ephemeral'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ flexShrink: 0 }}>
            {activeConversation ? (
              <>
                {dmCountdown !== null && (
                  <div className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--destructive)' }}>
                    <Timer className="w-4 h-4 animate-pulse" style={{ color: 'var(--destructive)' }} />
                    <span className="font-bold" style={{ color: 'var(--destructive)' }}>
                      {dmCountdown}s
                    </span>
                    <span style={{ color: 'var(--destructive)', fontWeight: 600 }}>DELETE</span>
                  </div>
                )}
                <button
                  onClick={() => setShowEndChatModal(true)}
                  className="status-badge hover:bg-destructive/20 transition-colors cursor-pointer"
                  title="End private conversation"
                  style={{ borderColor: 'var(--destructive)' }}
                >
                  <XCircle className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                  <span style={{ color: 'var(--destructive)' }}>END CHAT</span>
                </button>
              </>
            ) : conversations.length === 0 && (
              <div className="status-badge">
                <Timer className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                <span className="font-bold" style={{ color: 'var(--destructive)' }}>
                  {countdown}s
                </span>
                <span style={{ color: 'var(--muted-foreground)' }}>RESET</span>
              </div>
            )}
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
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  minWidth: '200px',
                  maxWidth: 'calc(100vw - 2rem)',
                  maxHeight: 'calc(100vh - 4rem)',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }} className="language-menu-popup">
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
          </div>
        </div>
      </header>

      {(authError || chatError) && (
        <div className="px-4 py-3 text-sm border-b" role="alert" style={{ background: 'var(--destructive)', borderColor: 'var(--border)' }}>
          {authError || chatError}
        </div>
      )}

      <MessageList
        messages={activeConversation ? dmMessages : messages}
        currentUserId={user.uid}
        loading={chatLoading}
        onMention={handleMention}
        currentUserNickname={nickname}
        onReaction={activeConversation ? undefined : addReaction}
        notificationVolume={notificationVolume}
        onDownloadFile={downloadFile}
        encryptionKey={encryptionKey}
        translateText={translateText}
        isTranslationEnabled={autoTranslateEnabled}
      />

      {typingUsers.length > 0 && (
        <div style={{ 
          padding: '0.5rem 0.75rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'rgba(0, 255, 136, 0.05)',
          borderLeft: '3px solid var(--primary)',
          borderTop: '1px solid var(--border)',
          position: 'relative',
          zIndex: 10,
          flexWrap: 'wrap'
        }} className="typing-indicator-container">
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.15s' }} />
            <div style={{ width: '0.5rem', height: '0.5rem', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }} className="md:text-sm">
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{typingUsers.join(', ')}</span> {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!user || chatLoading || !encryptionKey}
        mentionedUser={mentionedUser}
        onClearMention={handleClearMention}
        onlineUsers={onlineUsers}
        onFileSelect={uploadFile}
        uploadingFile={uploadingFile}
        onTyping={setTyping}
        activeDM={activeConversation}
      />
      </div>

      {/* Modal de confirmación para terminar chat */}
      {showEndChatModal && activeConversation && (
        <>
          <div 
            className="modal-overlay" 
            onClick={() => setShowEndChatModal(false)}
            style={{ zIndex: 100 }}
          />
          <div className="user-modal" style={{ zIndex: 101, maxWidth: '400px' }}>
            <div className="user-modal-header" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--destructive)' }}>
              <XCircle className="w-6 h-6" style={{ color: 'var(--destructive)' }} />
              <div style={{ marginLeft: '1rem', flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--destructive)', margin: 0 }}>End Private Chat?</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>with @{activeConversation}</p>
              </div>
              <button
                onClick={() => setShowEndChatModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="user-modal-body">
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.6 }}>
                {dmCountdown !== null ? (
                  <>
                    This chat is already ending. All messages will be deleted in <span style={{ color: 'var(--destructive)', fontWeight: 700 }}>{dmCountdown} seconds</span>.
                  </>
                ) : (
                  <>
                    Are you sure you want to end this private conversation? All messages will be automatically deleted after <span style={{ color: 'var(--destructive)', fontWeight: 700 }}>30 seconds</span>.
                  </>
                )}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    endConversation(activeConversation);
                    setShowEndChatModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: 'var(--destructive)',
                    color: 'var(--destructive-foreground)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Yes, End Chat
                </button>
                <button
                  onClick={() => setShowEndChatModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--muted)'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
