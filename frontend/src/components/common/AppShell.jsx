import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useSocketContext } from "../../context/SocketContext";
import { notificationService } from "../../services/notificationService";
import { chatService } from "../../services/chatService";
import { getApiErrorMessage, resolveAvatar } from "../../utils/helpers";
import { followService } from "../../services/followService";
import { postService } from "../../services/postService";
import NotificationBell from "../notification/NotificationBell";
import NotificationCenter from "../notification/NotificationCenter";
import PostModal from "../post/PostModal";
import Button from "./Button";

const navItems = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Search", icon: "search", to: "/explore" },
  { label: "Reels", icon: "movie", to: "/reels" },
  { label: "Messages", icon: "chat", to: "/chat" },
  { label: "Profile", icon: "person", to: "/profile" }
];

const topbarLinks = [
  { label: "Curated Feed", to: "/" },
  { label: "Creators", to: "/explore" },
  { label: "Collections", to: "/explore" }
];

const initialNotificationState = {
  error: "",
  hasLoaded: false,
  isLoading: false,
  items: [],
  unreadCount: 0
};

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { socket } = useSocketContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotificationState);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const postId = searchParams.get("post");

    if (postId) {
      if (!selectedPostDetail || selectedPostDetail.id !== postId) {
        loadPostDetail(postId);
      }
    } else {
      setSelectedPostDetail(null);
    }
  }, [location.search]);

  async function loadPostDetail(postId) {
    try {
      const post = await postService.getById(postId);
      setSelectedPostDetail(post);
    } catch (err) {
      console.error("Failed to load post detail", err);
    }
  }

  function handleClosePostModal() {
    setSelectedPostDetail(null);
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("post");
    const newSearch = searchParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, { replace: true });
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }
  const avatar = resolveAvatar(user?.fullName || user?.username, user?.avatar?.url);
  const displayName = user?.fullName || user?.username || "Curator Guest";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextQuery = location.pathname === "/explore" ? params.get("q") || "" : "";
    setSearchQuery(nextQuery);
  }, [location.pathname, location.search]);

  useEffect(() => {
    loadNotifications();
    loadUnreadChatCount();
  }, [user]);

  async function loadUnreadChatCount() {
    if (!user) return;
    try {
      const count = await chatService.getUnreadCount();
      setUnreadChatCount(count);
    } catch (err) {
      console.error("Failed to load chat unread count", err);
    }
  }

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function handleNotification(notification) {
      setNotifications((currentState) => {
        if (currentState.items.some((entry) => entry.id === notification.id)) {
          return currentState;
        }

        return {
          ...currentState,
          items: [notification, ...currentState.items].slice(0, 20),
          unreadCount: currentState.unreadCount + (notification.isRead ? 0 : 1)
        };
      });
    }

    socket.on("notification:new", handleNotification);

    function handleChatMessage(message) {
      // If we're not currently looking at the chat for this sender, increment unread count
      // This is a simple logic; a more precise one would check if we're on /chat exactly
      if (message.receiver.id === user?.id || message.receiver._id === user?.id) {
        setUnreadChatCount(prev => prev + 1);
      }
    }

    function handleChatSeen() {
      // Re-fetch count when something is marked as seen
      loadUnreadChatCount();
    }

    socket.on("chat:message", handleChatMessage);
    socket.on("chat:seen", handleChatSeen);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:seen", handleChatSeen);
    };
  }, [socket, user?.id]);

  function openPostComposer() {
    navigate("/", {
      state: {
        from: location.pathname,
        openCreatePostToken: Date.now()
      }
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    navigate(trimmedQuery ? `/explore?q=${encodeURIComponent(trimmedQuery)}` : "/explore");
  }

  function handleSearchClear() {
    setSearchQuery("");

    if (location.pathname === "/explore") {
      navigate("/explore");
    }
  }

  const [activeFilter, setActiveFilter] = useState("all");
  
  function handleOpenNotifications() {
    setIsNotificationOpen(true);

    if (!notifications.hasLoaded) {
      loadNotifications(activeFilter);
    }
  }

  async function loadNotifications(type = "all") {
    setNotifications((currentState) => ({
      ...currentState,
      error: "",
      isLoading: true
    }));

    try {
      const result = await notificationService.list({ limit: 20, type });

      setNotifications({
        error: "",
        hasLoaded: true,
        isLoading: false,
        items: result.items || [],
        unreadCount: result.unreadCount || 0
      });
    } catch (caughtError) {
      setNotifications((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load notifications right now."),
        hasLoaded: true,
        isLoading: false
      }));
    }
  }

  function handleFilterChange(newFilter) {
    setActiveFilter(newFilter);
    loadNotifications(newFilter);
  }

  async function handleMarkNotificationRead(notificationId) {
    setNotifications((currentState) => ({
      ...currentState,
      error: ""
    }));

    try {
      await notificationService.markRead(notificationId);

      setNotifications((currentState) => ({
        ...currentState,
        items: currentState.items.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true
              }
            : notification
        ),
        unreadCount: Math.max(
          currentState.unreadCount -
            (currentState.items.find((notification) => notification.id === notificationId)?.isRead ? 0 : 1),
          0
        )
      }));
    } catch (caughtError) {
      setNotifications((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to update this notification.")
      }));
    }
  }

  async function handleMarkAllRead() {
    setNotifications((currentState) => ({
      ...currentState,
      error: ""
    }));

    try {
      await notificationService.markAllRead();

      setNotifications((currentState) => ({
        ...currentState,
        items: currentState.items.map((notification) => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }));
    } catch (caughtError) {
      setNotifications((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to mark all notifications as read.")
      }));
    }
  }

  async function handleFollowToggle(userId) {
    try {
      const result = await followService.toggle(userId);
      setNotifications(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.actor?.id === userId || item.actor?._id === userId) {
            return {
              ...item,
              actor: { ...item.actor, isFollowing: result.following }
            };
          }
          return item;
        })
      }));
    } catch (err) {
      console.error("Follow toggle failed", err);
    }
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-lockup">
            <div className="brand-mark">
              <span className="material-symbols-outlined filled">gallery_thumbnail</span>
            </div>
            <div>
              <h1>Curator</h1>
              <p>The Digital Gallery</p>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
                }
                to={item.to}
              >
                <div style={{ position: 'relative', display: 'flex' }}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label === "Messages" && unreadChatCount > 0 && (
                    <span className="sidebar-badge">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <button
              className={`sidebar-link ${isNotificationOpen ? "sidebar-link--active" : ""}`}
              onClick={handleOpenNotifications}
              type="button"
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <span className={`material-symbols-outlined ${isNotificationOpen ? 'filled' : ''}`}>favorite</span>
                {notifications.unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6, 
                    background: 'var(--danger)', color: 'white', 
                    borderRadius: '50%', width: 16, height: 16, 
                    fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="theme-toggle-btn" onClick={toggleTheme} type="button">
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="user-chip" onClick={() => navigate('/profile')}>
              <img alt={displayName} className="user-chip__avatar" src={avatar} />
              <div className="user-chip__info">
                <strong>{displayName}</strong>
                <span>@{user?.username || "guest"}</span>
              </div>
            </div>
            <Button className="sidebar-cta" icon="logout" onClick={logout} type="button">
              Logout
            </Button>
          </div>
        </aside>

        <div className="shell-main">
          <header className="topbar">
            <div className="topbar-brand">
              Curator
            </div>
            <div className="topbar-tools">
              <NotificationBell count={notifications.unreadCount} onClick={handleOpenNotifications} />
              <button className="icon-button" onClick={() => navigate('/chat')} type="button" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined">near_me</span>
                {unreadChatCount > 0 && (
                  <span className="sidebar-badge sidebar-badge--topbar">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          <main className="shell-content">{children}</main>

          <nav aria-label="Mobile navigation" className="mobile-nav">
            {navItems.map((item) => (
              <NavLink
                key={`mobile-${item.to}`}
                className={({ isActive }) =>
                  isActive ? "mobile-link mobile-link--active" : "mobile-link"
                }
                to={item.to}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <button
              className={`mobile-link ${isNotificationOpen ? "mobile-link--active" : ""}`}
              onClick={handleOpenNotifications}
              type="button"
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <span className={`material-symbols-outlined ${isNotificationOpen ? 'filled' : ''}`}>favorite</span>
                {notifications.unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6, 
                    background: 'var(--danger)', color: 'white', 
                    borderRadius: '50%', width: 16, height: 16, 
                    fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </button>
          </nav>
        </div>
      </div>

      <NotificationCenter
        error={notifications.error}
        isLoading={notifications.isLoading}
        notifications={notifications.items}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onFollowToggle={handleFollowToggle}
        onClose={() => setIsNotificationOpen(false)}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkNotificationRead}
        open={isNotificationOpen}
        unreadCount={notifications.unreadCount}
      />

      <PostModal
        open={Boolean(selectedPostDetail)}
        post={selectedPostDetail}
        onClose={handleClosePostModal}
      />
    </>
  );
}