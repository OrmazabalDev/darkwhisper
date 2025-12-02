import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import type { Message as MessageType } from './types';
import { formatFullTimestamp } from './utils';
import { MessageSquare, Clock, Shield, Download, FileText, FileArchive, Languages } from 'lucide-react';
import { useUserPresence } from './useUserPresence';

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  onMention?: (nickname: string) => void;
  allMessages: MessageType[];
  currentUserNickname?: string;
  onReaction?: (messageId: string, emoji: string) => void;
  onDownloadFile?: (url: string, fileName: string, fileType: string) => void;
  encryptionKey?: CryptoKey | null;
  translateText?: (text: string) => Promise<string>;
  isTranslationEnabled?: boolean;
}

const CYBER_REACTIONS = ['🔥', '⚡', '💀', '👾', '🎯', '💎'];

// Caché de traducciones para evitar re-traducir
const translationCache = new Map<string, string>();

const Message = memo(({ message, isOwnMessage, allMessages, currentUserNickname, onReaction, onDownloadFile, encryptionKey, translateText, isTranslationEnabled }: MessageProps) => {
  const [showModal, setShowModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { isOnline, lastSeen } = useUserPresence(message.userId);
  
  // Lazy loading de preview de imagen solo cuando se necesita
  useEffect(() => {
    if (message.fileUrl && message.fileType?.startsWith('image/') && encryptionKey && !imagePreview) {
      // Intersección para cargar solo cuando está visible
      const shouldLoad = true; // Simplificado, considerar IntersectionObserver para optimización extra
      if (shouldLoad) {
        decryptImagePreview();
      }
    }
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [message.fileUrl, encryptionKey]);

  const handleTranslate = useCallback(async () => {
    if (!translateText || !message.text) return;
    
    // Verificar caché primero
    const cacheKey = `${message.text}_${message.id}`;
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey)!);
      setShowTranslation(true);
      return;
    }
    
    setIsTranslating(true);
    try {
      const translated = await translateText(message.text);
      translationCache.set(cacheKey, translated);
      setTranslatedText(translated);
      setShowTranslation(true);
    } finally {
      setIsTranslating(false);
    }
  }, [translateText, message.text, message.id]);

  useEffect(() => {
    if (isTranslationEnabled && translateText && message.text && !isOwnMessage && !translatedText) {
      handleTranslate();
    }
  }, [isTranslationEnabled, message.id, handleTranslate, isOwnMessage, message.text, translatedText]);
  
  const decryptImagePreview = useCallback(async () => {
    if (!message.fileUrl || !encryptionKey) return;
    
    try {
      // Extraer Base64 del data URL de forma optimizada
      const base64Data = message.fileUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      // Optimización: llenar array en un solo loop
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Desencriptar
      const iv = bytes.slice(0, 12);
      const content = bytes.slice(12);
      
      const decryptedContent = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        content
      );
      
      // Crear blob URL para preview
      const blob = new Blob([decryptedContent], { type: message.fileType });
      const url = URL.createObjectURL(blob);
      setImagePreview(url);
    } catch {}
  }, [message.fileUrl, message.fileType, encryptionKey]);
  
  // Memoizar filtrado de mensajes del usuario
  const userMessages = useMemo(
    () => allMessages.filter(msg => msg.nickname === message.nickname),
    [allMessages, message.nickname]
  );
  
  // Memoizar cálculo de estadísticas del usuario
  const userStats = useMemo(() => {
    if (userMessages.length === 0) return null;
    
    const firstMessage = userMessages[0];
    const lastMessage = userMessages[userMessages.length - 1];
    
    let statusText = '';
    if (!isOnline && lastSeen) {
      const diff = Date.now() - lastSeen;
      const minutes = Math.floor(diff / 60000);
      
      statusText = minutes < 1 ? 'Just now'
        : minutes < 60 ? `${minutes}m ago`
        : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago`
        : `${Math.floor(minutes / 1440)}d ago`;
    }
    
    return {
      messageCount: userMessages.length,
      lastMessage: formatFullTimestamp(lastMessage.timestamp),
      joined: formatFullTimestamp(firstMessage.timestamp),
      lastSeenText: statusText
    };
  }, [userMessages, isOnline, lastSeen]);
  
  // Memoizar conversión de timestamp
  const { timeString, isoString } = useMemo(() => {
    const ts = typeof message.timestamp === 'number' 
      ? new Date(message.timestamp) 
      : message.timestamp;
    
    return {
      timeString: formatFullTimestamp(ts),
      isoString: ts.toISOString()
    };
  }, [message.timestamp]);
  
  const handleReaction = useCallback((emoji: string) => {
    if (onReaction && currentUserNickname) {
      onReaction(message.id, emoji);
      setShowReactionPicker(false);
    }
  }, [onReaction, currentUserNickname, message.id]);

  return (
    <>
      <article 
        className={`message ${isOwnMessage ? 'own-message' : 'other-message'} group`}
        style={{ position: 'relative' }}
        onMouseEnter={() => setShowReactionPicker(true)}
        onMouseLeave={() => setShowReactionPicker(false)}
      >
        <div className="message-header">
          <span className="message-nickname clickable" onClick={() => setShowModal(true)}>
            {message.encrypted && <span>🔒 </span>}
            {message.nickname}
          </span>
          <time className="message-timestamp" dateTime={isoString} title={timeString}>
            {timeString}
          </time>
        </div>
        
        {/* Preview de archivo */}
        {message.fileUrl && (
          <div className="message-file" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            {message.fileType?.startsWith('image/') && imagePreview ? (
              <div style={{ position: 'relative', maxWidth: '300px' }}>
                <img 
                  src={imagePreview} 
                  alt={message.fileName || 'Image'}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setShowImagePreview(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(4px)'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDownloadFile && message.fileName && message.fileType) {
                        onDownloadFile(message.fileUrl!, message.fileName, message.fileType);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Descargar"
                  >
                    <Download size={16} style={{ color: 'var(--primary)' }} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                maxWidth: '300px'
              }}>
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--card)',
                  borderRadius: '0.375rem'
                }}>
                  {message.fileType?.includes('pdf') ? (
                    <FileText size={24} style={{ color: 'var(--primary)' }} />
                  ) : (
                    <FileArchive size={24} style={{ color: 'var(--primary)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    color: 'var(--foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {message.fileName}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    color: 'var(--muted-foreground)' 
                  }}>
                    {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'File'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onDownloadFile && message.fileName && message.fileType) {
                      onDownloadFile(message.fileUrl!, message.fileName, message.fileType);
                    }
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'var(--card)',
                    border: '1px solid var(--primary)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="Download"
                >
                  <Download size={16} style={{ color: 'var(--primary)' }} />
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="message-text">
          {showTranslation && translatedText && translatedText !== message.text ? translatedText : message.text}
        </div>

        {/* Botón de traducción manual - siempre visible para mensajes de otros usuarios */}
        {translateText && !isOwnMessage && (
          <button
            onClick={() => {
              if (!translatedText) {
                // Primera vez: traducir
                handleTranslate();
              } else if (translatedText === message.text) {
                // Si la traducción es igual al original, no hacer nada
                return;
              } else {
                // Toggle entre original y traducción
                setShowTranslation(!showTranslation);
              }
            }}
            disabled={isTranslating}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: showTranslation && translatedText && translatedText !== message.text 
                ? 'rgba(0, 255, 136, 0.2)' 
                : 'rgba(0, 0, 0, 0.3)',
              border: '1px solid',
              borderColor: showTranslation && translatedText && translatedText !== message.text
                ? 'var(--primary)'
                : 'var(--border)',
              borderRadius: '0.375rem',
              color: showTranslation && translatedText && translatedText !== message.text
                ? 'var(--primary)'
                : 'var(--muted-foreground)',
              cursor: isTranslating ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s',
              fontFamily: 'monospace',
              opacity: isTranslating ? 0.5 : 1
            }}
            title={!translatedText ? 'Translate this message' : showTranslation ? 'Show original text' : 'Show translation'}
          >
            <Languages size={12} />
            {isTranslating 
              ? '⟳ Translating...' 
              : !translatedText 
                ? 'Translate' 
                : translatedText === message.text
                  ? 'Same language'
                  : showTranslation 
                    ? 'Show original' 
                    : 'Show translation'}
          </button>
        )}
        
        {/* Reacciones existentes */}
        {message.reactions && message.reactions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderColor: reaction.users.includes(currentUserNickname || '') ? 'var(--primary)' : 'var(--border)',
                  background: reaction.users.includes(currentUserNickname || '') ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'monospace'
                }}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
        
        {/* Selector de reacciones - aparece al hacer hover */}
        {showReactionPicker && onReaction && (
          <div 
            className="reaction-picker"
            style={{
              position: 'absolute',
              bottom: '-2.5rem',
              left: isOwnMessage ? 'auto' : '1rem',
              right: isOwnMessage ? '1rem' : 'auto',
              display: 'flex',
              gap: '0.25rem',
              padding: '0.5rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px oklch(0 0 0 / 0.3)',
              zIndex: 10
            }}
          >
            {CYBER_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </article>

      {showModal && userStats && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="user-modal">
            <div className="user-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div className="user-avatar">
                  {message.nickname.charAt(0).toUpperCase()}
                  {isOnline && <div className="user-status-dot" />}
                  {!isOnline && <div className="user-status-dot offline" />}
                </div>
                <div className="user-info-details">
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {message.nickname}
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: isOnline ? 'var(--primary)' : 'var(--muted-foreground)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>
                    {isOnline ? 'ONLINE' : (userStats?.lastSeenText ? `Last seen ${userStats.lastSeenText}` : 'OFFLINE')}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="user-modal-body">
              <div className="user-stats-grid">
                <div className="user-stat-card">
                  <div className="stat-icon">
                    <MessageSquare size={16} style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">MESSAGES</span>
                    <span className="stat-value">{userStats.messageCount}</span>
                  </div>
                </div>
                
                <div className="user-stat-card">
                  <div className="stat-icon">
                    <Clock size={16} style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">JOINED</span>
                    <span className="stat-value">{userStats.joined}</span>
                  </div>
                </div>
              </div>
              
              <div className="user-last-message">
                <div className="last-message-icon">▲</div>
                <div className="last-message-content">
                  <span className="last-message-label">LAST MESSAGE</span>
                  <span className="last-message-text">"{userMessages[userMessages.length - 1].text.substring(0, 50)}{userMessages[userMessages.length - 1].text.length > 50 ? '...' : ''}"</span>
                </div>
              </div>
              
              <div className="user-encryption-badge">
                <Shield size={16} style={{ color: 'var(--primary)' }} />
                <span>ENCRYPTED PROFILE · NO PERSONAL DATA STORED</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de preview de imagen */}
      {showImagePreview && imagePreview && (
        <>
          <div 
            className="modal-overlay" 
            onClick={() => setShowImagePreview(false)}
            style={{
              zIndex: 1000,
              backdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.9)'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '0.5rem',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ 
                color: 'var(--foreground)', 
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                {message.fileName}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    if (onDownloadFile && message.fileName && message.fileType) {
                      onDownloadFile(message.fileUrl!, message.fileName, message.fileType);
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Download size={16} />
                  Descargar
                </button>
                <button 
                  onClick={() => setShowImagePreview(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: 'var(--foreground)',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--destructive)';
                    e.currentTarget.style.borderColor = 'var(--destructive)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <img 
              src={imagePreview}
              alt={message.fileName || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 5rem)',
                objectFit: 'contain',
                borderRadius: '0.5rem',
                border: '2px solid var(--primary)',
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
              }}
            />
          </div>
        </>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para memo - solo re-renderizar si cambian propiedades importantes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
    prevProps.isOwnMessage === nextProps.isOwnMessage &&
    prevProps.currentUserNickname === nextProps.currentUserNickname &&
    prevProps.isTranslationEnabled === nextProps.isTranslationEnabled
  );
});

export default Message;
