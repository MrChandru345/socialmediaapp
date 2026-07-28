import { Link } from "react-router-dom";
import {
  formatRelativeTime,
  getAvatarForUser,
  getDisplayName
} from "../../utils/helpers";
import Loader from "../common/Loader";

function getNotificationDestination(notification) {
  if (notification.type === "message") {
    return "/chat";
  }

  if (notification.entityModel === "Reel") {
    return "/reels";
  }

  if (notification.type === "follow") {
     return `/profile/${notification.actor?.username || notification.actor?.id}`;
  }

  if (notification.entityModel === "Post" || notification.entityModel === "Like" || notification.entityModel === "Comment") {
     const currentPath = window.location.pathname === "/chat" ? "/" : window.location.pathname;
     return `${currentPath}?post=${notification.entityId}`;
  }

  return "/";
}

function groupNotifications(notifications) {
  const groups = {
    new: [],
    thisWeek: [],
    thisMonth: [],
    earlier: []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  notifications.forEach(notification => {
    const createdDate = new Date(notification.createdAt);

    if (createdDate >= today) {
      groups.new.push(notification);
    } else if (createdDate >= oneWeekAgo) {
      groups.thisWeek.push(notification);
    } else if (createdDate >= oneMonthAgo) {
      groups.thisMonth.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

export default function NotificationCenter({
  error,
  isLoading,
  notifications,
  activeFilter,
  onFilterChange,
  onFollowToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  open
}) {
  const grouped = groupNotifications(notifications);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'follow', label: 'Follows' },
    { id: 'comment', label: 'Comments' },
    { id: 'like', label: 'Likes' }
  ];

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="notification-group" key={title}>
        <h5 className="notification-group-header">{title}</h5>
        {items.map(notification => (
          <NotificationRow 
            key={notification.id} 
            notification={notification} 
            onFollowToggle={onFollowToggle}
            onMarkRead={onMarkRead}
            onClose={onClose}
          />
        ))}
      </div>
    );
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <>
      {open ? <div className="notification-sidebar-overlay" onClick={onClose} aria-hidden="true" /> : null}
      <aside className={`notification-sidebar ${open ? "open" : ""}`}>
        <div className="activity-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                className="mobile-back-btn" 
                onClick={onClose} 
                style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--text)" }}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h3 style={{ margin: 0 }}>Activity</h3>
            </div>
            {hasUnread && (
              <button 
                onClick={onMarkAllRead} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#0095f6", 
                  fontWeight: "600", 
                  cursor: "pointer", 
                  fontSize: "14px",
                  padding: 0
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="filter-tabs-row">
            {filters.map(f => (
              <button 
                key={f.id}
                className={`filter-tab ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => onFilterChange(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="form-error" style={{ margin: '1rem' }}>{error}</p> : null}

        <div className="activity-content">
          {isLoading ? (
            <Loader label="Loading activity..." />
          ) : notifications.length > 0 ? (
            <div className="notification-list">
               {renderGroup("New", grouped.new)}
               {renderGroup("Earlier this week", grouped.thisWeek)}
               {renderGroup("This month", grouped.thisMonth)}
               {renderGroup("Earlier", grouped.earlier)}
            </div>
          ) : (
            <section className="sidebar-card empty-state notification-empty-state">
              <span className="material-symbols-outlined">notifications_none</span>
              <h3>No activity yet</h3>
              <p>When someone likes or comments on one of your posts, you'll see it here.</p>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

function NotificationRow({ notification, onFollowToggle, onMarkRead, onClose }) {
  const actorName = getDisplayName(notification.actor);
  const destination = getNotificationDestination(notification);
  const isFollow = notification.type === 'follow';

  return (
    <div className={`notification-row ${notification.isRead ? '' : 'unread'}`}>
      <Link 
        to={`/profile/${notification.actor?.username}`} 
        onClick={onClose}
        className={`notification-avatar-container ${!notification.isRead ? 'has-story' : ''}`}
      >
        <img 
          src={getAvatarForUser(notification.actor, actorName)} 
          alt={actorName} 
          className="notification-avatar"
        />
      </Link>
      
      <Link 
        className="notification-body" 
        to={destination}
        onClick={() => {
          if (!notification.isRead) onMarkRead(notification.id);
          onClose();
        }}
      >
        <p className="notification-text">
          <span className="bold">{actorName}</span> {notification.message || "updated you"}
          <span className="notification-timestamp">{formatRelativeTime(notification.createdAt, true)}</span>
        </p>
      </Link>

      <div className="notification-actions">
        {isFollow && (
          <button 
            className={`follow-back-btn ${notification.actor?.isFollowing ? 'following' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onFollowToggle(notification.actor.id || notification.actor._id);
            }}
          >
            {notification.actor?.isFollowing ? 'Following' : 'Follow Back'}
          </button>
        )}
        {!notification.isRead && <div className="unread-dot-indicator" />}
      </div>
    </div>
  );
}