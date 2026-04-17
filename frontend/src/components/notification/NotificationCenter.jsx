import { Link } from "react-router-dom";

import {
  formatRelativeTime,
  getAvatarForUser,
  getDisplayName
} from "../../utils/helpers";
import Button from "../common/Button";
import Loader from "../common/Loader";

function getNotificationDestination(notification) {
  if (notification.type === "message") {
    return "/chat";
  }

  if (notification.entityModel === "Reel") {
    return "/reels";
  }

  if (notification.actor?.username || notification.actor?.id) {
    return `/profile/${notification.actor.username || notification.actor.id}`;
  }

  return "/";
}

function getNotificationLabel(notification) {
  const actorName = getDisplayName(notification.actor);
  return `${actorName} ${notification.message || "sent you an update"}`;
}

export default function NotificationCenter({
  error,
  isLoading,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
  open,
  unreadCount
}) {
  return (
    <>
      {open ? <div className="notification-sidebar-overlay" onClick={onClose} aria-hidden="true" /> : null}
      <aside className={`notification-sidebar ${open ? "open" : ""}`}>
        <div className="notification-panel__actions">
          <div>
            <p className="eyebrow">Inbox</p>
            <h4>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</h4>
          </div>
          <Button disabled={unreadCount === 0 || isLoading} onClick={onMarkAllRead} size="sm" variant="ghost">
            Mark all read
          </Button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        {isLoading ? (
          <Loader label="Loading notifications..." />
        ) : notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map((notification) => {
              const destination = getNotificationDestination(notification);
              const actorName = getDisplayName(notification.actor);

              return (
                <article
                  className={notification.isRead ? "notification-item" : "notification-item notification-item--unread"}
                  key={notification.id}
                >
                  <Link className="notification-item__content" onClick={() => { if (!notification.isRead) { onMarkRead(notification.id); } onClose?.(); }} to={destination}>
                    <img
                      alt={actorName}
                      className="notification-item__avatar"
                      src={getAvatarForUser(notification.actor, actorName)}
                    />
                    <div className="notification-item__copy">
                      <p>{getNotificationLabel(notification)}</p>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                    </div>
                  </Link>
                  <div className="notification-item__actions">
                    {!notification.isRead ? (
                      <button className="link-button" onClick={() => onMarkRead(notification.id)} type="button">
                        Mark read
                      </button>
                    ) : (
                      <span className="notification-item__read">Read</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="sidebar-card empty-state notification-empty-state">
            <span className="material-symbols-outlined">notifications_none</span>
            <h3>No notifications yet</h3>
            <p>Likes, comments, follows, and messages will appear here as your app activity grows.</p>
          </section>
        )}
      </aside>
    </>
  );
}