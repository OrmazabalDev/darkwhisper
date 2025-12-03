import { MessageSquare, Hash, X, ChevronRight, LogOut } from 'lucide-react';
import { useDMContext } from '../../contexts/DMContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentUser?: string;
  onChannelSelect: () => void;
  onDeleteSession?: () => void;
}

const Sidebar = ({ isCollapsed, onToggle, currentUser = 'anon_6251', onChannelSelect, onDeleteSession }: SidebarProps) => {
  const { conversations, activeConversation, setActiveConversation, totalUnread } = useDMContext();
  
  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        width: isCollapsed ? '0' : '280px',
        minWidth: isCollapsed ? '0' : '280px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {!isCollapsed && (
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <h2 className="sidebar-title">CONVERSATIONS</h2>
              </div>
              <button
                onClick={onToggle}
                className="sidebar-collapse-btn md:hidden"
                title="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Public Channel - Always visible */}
            <button
              onClick={() => {
                setActiveConversation(null);
                onChannelSelect();
              }}
              className={`sidebar-channel-btn ${
                activeConversation === null ? 'sidebar-channel-btn-active' : ''
              }`}
            >
              <Hash className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="font-bold font-mono text-sm">general-chat</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Public forum</p>
              </div>
              {activeConversation === null && (
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              )}
            </button>
          </div>

          {/* Direct Messages Section */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">
                DIRECT MESSAGES {totalUnread > 0 && `(${totalUnread})`}
              </span>
            </div>
            
            <div className="sidebar-list">
              {conversations.length === 0 ? (
                <div className="sidebar-empty">
                  <MessageSquare className="w-12 h-12 mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                  <p className="text-sm font-mono font-bold" style={{ color: 'var(--muted-foreground)' }}>
                    No private conversations
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                    Click on a user's name in chat
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    or use <span style={{ color: 'var(--primary)' }}>/dm username</span>
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.username)}
                    className={`sidebar-dm-item ${
                      activeConversation === conv.username ? 'sidebar-dm-item-active' : ''
                    }`}
                  >
                    <div className="sidebar-dm-avatar">
                      <span className="sidebar-dm-avatar-text">
                        {conv.username.substring(0, 2).toUpperCase()}
                      </span>
                      {conv.isOnline && (
                        <div className="sidebar-online-indicator" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="sidebar-dm-name">{conv.username}</span>
                        {conv.unread > 0 && (
                          <span className="sidebar-badge">{conv.unread}</span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="sidebar-dm-preview">{conv.lastMessage}</p>
                      )}
                      <p className="sidebar-dm-time">{formatTimestamp(conv.timestamp)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* User Info Footer */}
          <div className="sidebar-footer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--primary-foreground)' }}>
                  {currentUser.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono font-bold truncate" style={{ color: 'var(--foreground)' }}>
                  {currentUser}
                </div>
                <div className="text-xs flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                  Online
                </div>
              </div>
              {onDeleteSession && (
                <button
                  onClick={onDeleteSession}
                  className="p-2 rounded transition-all hover:scale-110"
                  title="Delete session and all data"
                  style={{ 
                    color: 'var(--destructive)',
                    background: 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
