import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import Button from "../components/common/Button";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [showSwitchOptions, setShowSwitchOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await userService.deleteAccount();
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteError("Unable to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="settings-page"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "1.25rem 1rem 3rem 1rem",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}
    >
      {/* Page Header */}
      <div
        className="settings-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid var(--surface-outline)"
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="icon-button"
          type="button"
          style={{
            background: "var(--surface-low)",
            border: "1px solid var(--surface-outline)",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
            cursor: "pointer"
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            arrow_back
          </span>
        </button>
        <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text)" }}>
          Settings
        </h1>
      </div>

      {/* Main Options */}
      <div className="settings-page-content" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Appearance Option */}
        <div className="settings-group">
          <h2 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", margin: "0 0 0.5rem 0" }}>
            Preferences
          </h2>
          <button className="settings-option-btn" onClick={toggleTheme} type="button">
            <div className="settings-option-left">
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <span className="theme-status-badge">{theme.toUpperCase()}</span>
          </button>
        </div>

        {/* Switch Account Section */}
        <div className="settings-group">
          <h2 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", margin: "0 0 0.5rem 0" }}>
            Account Options
          </h2>

          <button
            className="settings-option-btn"
            onClick={() => setShowSwitchOptions((prev) => !prev)}
            type="button"
          >
            <div className="settings-option-left">
              <span className="material-symbols-outlined">swap_horiz</span>
              <span>Switch Account</span>
            </div>
            <span className="material-symbols-outlined" style={{ transition: "transform 0.2s", transform: showSwitchOptions ? "rotate(180deg)" : "rotate(0deg)" }}>
              keyboard_arrow_down
            </span>
          </button>

          {showSwitchOptions && (
            <div
              className="switch-account-submenu"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "0.5rem",
                paddingLeft: "0.5rem"
              }}
            >
              {/* Option 1: Add Existing Account */}
              <button
                className="settings-option-btn"
                onClick={() => navigate("/login?addAccount=1")}
                type="button"
                style={{ background: "var(--surface-high)" }}
              >
                <div className="settings-option-left">
                  <span className="material-symbols-outlined">login</span>
                  <span>Add Existing Account</span>
                </div>
                <span className="material-symbols-outlined chevron" style={{ opacity: 0.6 }}>chevron_right</span>
              </button>

              {/* Option 2: Create New Account */}
              <button
                className="settings-option-btn"
                onClick={() => navigate("/signup?addAccount=1")}
                type="button"
                style={{ background: "var(--surface-high)" }}
              >
                <div className="settings-option-left">
                  <span className="material-symbols-outlined">person_add</span>
                  <span>Create New Account</span>
                </div>
                <span className="material-symbols-outlined chevron" style={{ opacity: 0.6 }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Account Management & Delete */}
        <div className="settings-group" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <h2 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-soft)", margin: "0 0 0.25rem 0" }}>
            Account Management
          </h2>
          {/* Logout */}
          <button
            className="settings-option-btn"
            onClick={logout}
            type="button"
          >
            <div className="settings-option-left">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </div>
          </button>

          {/* Delete Account */}
          <button
            className="settings-option-btn danger"
            onClick={() => setShowDeleteConfirm(true)}
            type="button"
          >
            <div className="settings-option-left">
              <span className="material-symbols-outlined">delete_forever</span>
              <span>Delete Account</span>
            </div>
            <span className="material-symbols-outlined chevron" style={{ opacity: 0.7 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteConfirm(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-container modern-glass radius-xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              width: "90%",
              padding: "1.75rem",
              background: "var(--surface-card)",
              border: "1px solid var(--surface-outline)",
              borderRadius: "20px",
              textAlign: "center"
            }}
          >
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(239,68,68,0.12)", color: "#ef4444", display: "grid", placeItems: "center", margin: "0 auto 1rem auto" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>warning</span>
            </div>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>
              Delete Account?
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-soft)", lineHeight: "1.5", margin: "0 0 1.5rem 0" }}>
              Are you sure you want to delete your account? This action is <strong>permanent</strong> and will permanently remove all your posts, reels, comments, and profile data from the database.
            </p>

            {deleteError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "0 0 1rem 0" }}>{deleteError}</p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444", color: "#ffffff" }}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
