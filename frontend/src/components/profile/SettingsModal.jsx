import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";

export default function SettingsModal({ isOpen, onClose, onEditProfile }) {
  const { user, logout, accounts, switchAccount, activeAccountId } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (!isOpen) return null;

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-container settings-modal-container modern-glass radius-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "420px",
          width: "90%",
          padding: "1.5rem",
          background: "var(--surface-card)",
          border: "1px solid var(--surface-outline)",
          borderRadius: "20px"
        }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem"
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>
            Settings
          </h3>
          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text)",
              cursor: "pointer"
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Edit Profile Option */}
          <button
            className="settings-option-btn"
            onClick={() => {
              onClose();
              onEditProfile();
            }}
            type="button"
          >
            <div className="settings-option-left">
              <span className="material-symbols-outlined">edit</span>
              <span>Edit Profile</span>
            </div>
            <span className="material-symbols-outlined chevron">chevron_right</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button className="settings-option-btn" onClick={toggleTheme} type="button">
            <div className="settings-option-left">
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <span className="theme-status-badge">{theme.toUpperCase()}</span>
          </button>

          {/* Account Switcher Section */}
          <div className="settings-section" style={{ marginTop: "0.5rem" }}>
            <h4
              className="settings-section-title"
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Accounts
            </h4>
            <div className="settings-accounts-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {accounts.map((acc) => {
                const accUser = acc.user;
                const accUserId = accUser?.id || accUser?._id;
                const isActive = Boolean(accUserId && String(accUserId) === String(activeAccountId));
                return (
                  <div
                    key={accUserId || Math.random()}
                    className={`settings-account-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (!isActive && accUser) {
                        switchAccount(accUser);
                        onClose();
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "12px",
                      background: isActive ? "var(--surface-high)" : "var(--surface-low)",
                      border: "1px solid var(--surface-outline)",
                      cursor: isActive ? "default" : "pointer"
                    }}
                  >
                    <img
                      src={getAvatarForUser(accUser, getDisplayName(accUser))}
                      alt={accUser?.username}
                      className="settings-account-avatar"
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div className="settings-account-info" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>
                        {getDisplayName(accUser)}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
                        @{accUser?.username}
                      </span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
                        check_circle
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="settings-option-btn danger"
            onClick={() => {
              onClose();
              logout();
            }}
            type="button"
            style={{ marginTop: "0.5rem" }}
          >
            <div className="settings-option-left">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
