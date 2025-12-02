import { useState, useRef, useEffect, useCallback, memo } from 'react';
import FileUploadButton from './FileUploadButton';

interface MessageInputProps {
  onSendMessage: (text: string, file?: { url: string; fileName: string; fileType: string; fileSize: number; storagePath: string }) => Promise<void>;
  disabled?: boolean;
  mentionedUser?: string;
  onClearMention?: () => void;
  onlineUsers?: string[];
  onFileSelect?: (file: File) => Promise<{ url: string; fileName: string; fileType: string; fileSize: number; storagePath: string } | null>;
  uploadingFile?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

const MessageInput = memo(({ onSendMessage, disabled = false, mentionedUser, onClearMention, onlineUsers = [], onFileSelect, uploadingFile = false, onTyping }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{ url: string; fileName: string; fileType: string; fileSize: number; storagePath: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (mentionedUser) {
      setMessage(`@${mentionedUser} `);
      textareaRef.current?.focus();
    }
  }, [mentionedUser]);

  useEffect(() => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = message.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowUserList(false);
      return;
    }

    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) {
      setShowUserList(false);
      return;
    }

    const search = textAfterAt.toLowerCase();
    const filtered = onlineUsers.filter(user => user.toLowerCase().includes(search));
    setFilteredUsers(filtered);
    setShowUserList(filtered.length > 0);
    setSelectedIndex(0);
  }, [message, onlineUsers]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (onFileSelect) {
      setSelectedFile(file);
      const result = await onFileSelect(file);
      if (result) {
        setFileData(result);
      } else {
        setSelectedFile(null);
      }
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Debouncing para typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (onTyping) {
      const isTyping = newValue.trim().length > 0;
      onTyping(isTyping);
      
      // Auto-limpiar después de 2 segundos de inactividad
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  }, [onTyping]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setFileData(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !fileData) || sending) return;

    try {
      setSending(true);
      setError('');
      await onSendMessage(message || '📎 Archivo adjunto', fileData || undefined);
      setMessage('');
      setSelectedFile(null);
      setFileData(null);
      
      // Limpiar estado de escritura
      if (onTyping) {
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [message, fileData, sending, onSendMessage, onTyping]);

  const insertMention = useCallback((username: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const lastAtIndex = message.slice(0, cursorPos).lastIndexOf('@');
    
    if (lastAtIndex === -1) return;

    const newMessage = 
      message.slice(0, lastAtIndex) + 
      `@${username} ` + 
      message.slice(cursorPos);
    
    setMessage(newMessage);
    setShowUserList(false);
    
    setTimeout(() => {
      const newCursorPos = lastAtIndex + username.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
  }, [message]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showUserList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedUser = filteredUsers[selectedIndex];
        if (selectedUser) insertMention(selectedUser);
      } else if (e.key === 'Escape') {
        setShowUserList(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [showUserList, filteredUsers, selectedIndex, insertMention, handleSubmit]);

  const isDisabled = disabled || sending || uploadingFile;
  const canSend = !isDisabled && (message.trim() || fileData);

  return (
    <div className="message-input-container">
      {error && (
        <div className="error-banner" role="alert" style={{ 
          background: 'var(--destructive)', 
          color: 'var(--destructive-foreground)', 
          padding: '0.75rem 1rem', 
          borderRadius: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          {'>'} ERROR: {error}
        </div>
      )}
      
      {mentionedUser && (
        <div className="mention-badge">
          <span>{'>'} Mentioning: <strong style={{ color: 'var(--primary)' }}>@{mentionedUser}</strong></span>
          <button 
            type="button" 
            onClick={() => {
              onClearMention?.();
              setMessage('');
            }}
            className="clear-mention"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-input-form">
        <FileUploadButton 
          onFileSelect={handleFileSelect}
          disabled={isDisabled}
          selectedFile={selectedFile}
          onClearFile={handleClearFile}
        />
        
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={uploadingFile ? "⟳ Uploading file..." : sending ? "⟳ Encrypting and sending..." : "Type @ to mention users... 🔒 E2E encrypted"}
            disabled={isDisabled}
            className="message-textarea"
            rows={2}
            maxLength={1000}
            autoComplete="off"
          />
          
          {showUserList && filteredUsers.length > 0 && (
            <div className="user-autocomplete">
              {filteredUsers.map((user, index) => (
                <div
                  key={user}
                  className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="autocomplete-avatar">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <span className="autocomplete-name">@{user}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={!canSend} 
          className="send-button"
          style={{ fontSize: '1.5rem' }}
        >
          {sending ? '⟳' : '⚡'}
        </button>
      </form>
      
      <div className="input-footer" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--muted-foreground)'
      }}>
        <div>
          {'>'} <kbd style={{ padding: '0.125rem 0.375rem', background: 'var(--muted)', borderRadius: '0.25rem' }}>Enter</kbd> to send · <kbd style={{ padding: '0.125rem 0.375rem', background: 'var(--muted)', borderRadius: '0.25rem' }}>Shift+Enter</kbd> for new line · <kbd style={{ padding: '0.125rem 0.375rem', background: 'var(--muted)', borderRadius: '0.25rem' }}>@</kbd> to mention
        </div>
        <div>
          {message.length > 800 && (
            <span style={{ color: message.length >= 1000 ? 'var(--destructive)' : 'var(--warning)' }}>
              {message.length}/1000
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.mentionedUser === nextProps.mentionedUser &&
    prevProps.uploadingFile === nextProps.uploadingFile &&
    prevProps.onlineUsers === nextProps.onlineUsers
  );
});

export default MessageInput;
