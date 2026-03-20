import { NavLink } from "react-router-dom";

import { dashboardLinks } from "../../assets/mockData";
import { useAuth } from "../../hooks/useAuth";
import { resolveAvatar } from "../../utils/helpers";
import NotificationBell from "../notification/NotificationBell";
import Button from "./Button";

const navItems = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Explore", icon: "explore", to: "/explore" },
  { label: "Reels", icon: "movie", to: "/reels" },
  { label: "Chat", icon: "chat", to: "/chat" },
  { label: "Profile", icon: "person", to: "/profile" }
];

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const avatar = resolveAvatar(user?.fullName || user?.username, user?.avatar?.url);
  const displayName = user?.fullName || user?.username || "Curator Guest";

  return (
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

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
              to={item.to}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Button className="sidebar-cta" icon="add_circle">
            Create Post
          </Button>
          <div className="user-chip">
            <img alt={displayName} className="user-chip__avatar" src={avatar} />
            <div>
              <strong>{displayName}</strong>
              <span>@{user?.username || "guest"}</span>
            </div>
            <button className="icon-button" onClick={logout} title="Log out" type="button">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-links">
            {dashboardLinks.map((link) => (
              <button className="topbar-link" key={link} type="button">
                {link}
              </button>
            ))}
          </div>
          <div className="topbar-tools">
            <label className="search-pill">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search gallery..." type="search" />
            </label>
            <NotificationBell count={3} />
            <button className="icon-button" type="button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <img alt={displayName} className="topbar-avatar" src={avatar} />
          </div>
        </header>

        <main className="shell-content">{children}</main>

        <nav className="mobile-nav" aria-label="Mobile navigation">
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
        </nav>
      </div>
    </div>
  );
}
