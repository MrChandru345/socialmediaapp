import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";
import { getAuthErrorMessage } from "../../utils/authValidation";

function getUserId(user) {
  return user?.id || user?._id || "";
}

export default function AccountSwitcher() {
  const {
    accounts,
    activeAccountId,
    login,
    logout,
    logoutAll,
    removeAccount,
    switchAccount,
    user
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsAddOpen(false);
        setIsManaging(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) {
    return null;
  }

  async function handleAddAccount(event) {
    event.preventDefault();

    if (!loginForm.identifier.trim() || !loginForm.password || isSubmitting) {
      setError("Email or username and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await login(loginForm);
      setLoginForm({ identifier: "", password: "", remember: true });
      setIsAddOpen(false);
      setIsManaging(false);
      setIsOpen(false);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, "Unable to add this account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSwitchAccount(accountUserId) {
    switchAccount(accountUserId);
    setIsOpen(false);
    setIsManaging(false);
  }

  function handleRemoveAccount(accountUserId) {
    removeAccount(accountUserId);

    if (accounts.length <= 1 || accountUserId === activeAccountId) {
      setIsOpen(false);
      setIsManaging(false);
    }
  }

  return (
    <div className="account-switcher-wrap" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        className={`user-chip ${isOpen ? "active" : ""}`}
        onClick={() => {
          setIsOpen((current) => !current);
          setIsAddOpen(false);
          setIsManaging(false);
        }}
        type="button"
      >
        <img
          alt={getDisplayName(user)}
          className="user-chip__avatar"
          src={getAvatarForUser(user, getDisplayName(user))}
        />
        <div className="user-chip__info">
          <strong>{getDisplayName(user)}</strong>
          <span>@{user.username}</span>
        </div>
        <span className="material-symbols-outlined dropdown-arrow">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen ? (
        <div className="account-switcher-dropdown modern-glass animate-in">
          {isManaging ? (
            <>
              <div className="account-manager-header">
                <button
                  aria-label="Back to account menu"
                  className="account-manager-back"
                  onClick={() => setIsManaging(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                  <strong>Manage Accounts</strong>
                  <span>{accounts.length} saved {accounts.length === 1 ? "account" : "accounts"}</span>
                </div>
              </div>

              <div className="account-manager-list">
                {accounts.map((account) => {
                  const accountUserId = getUserId(account.user);
                  const isActive = accountUserId === activeAccountId;

                  return (
                    <div className="account-manager-row" key={`manage-${accountUserId}`}>
                      <img
                        src={getAvatarForUser(account.user, getDisplayName(account.user))}
                        alt={account.user.username}
                      />
                      <div className="account-manager-row__info">
                        <strong>{getDisplayName(account.user)}</strong>
                        <span>@{account.user.username}</span>
                      </div>
                      {isActive ? (
                        <span className="account-manager-badge">Active</span>
                      ) : (
                        <button
                          className="account-manager-switch"
                          onClick={() => handleSwitchAccount(accountUserId)}
                          type="button"
                        >
                          Switch
                        </button>
                      )}
                      <button
                        aria-label={`Remove ${account.user.username}`}
                        className="account-manager-remove"
                        onClick={() => handleRemoveAccount(accountUserId)}
                        type="button"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="dropdown-footer">
                <button className="dropdown-action-btn" onClick={() => { setIsManaging(false); setIsAddOpen(true); }} type="button">
                  <span className="material-symbols-outlined">person_add</span>
                  Add Existing Account
                </button>
                <button className="dropdown-action-btn" onClick={logout} type="button">
                  <span className="material-symbols-outlined">logout</span>
                  Logout Current Account
                </button>
                <button className="dropdown-action-btn logout-all" onClick={logoutAll} type="button">
                  <span className="material-symbols-outlined">logout</span>
                  Logout All Accounts
                </button>
              </div>
            </>
          ) : (
            <>
          <div className="account-switcher-dropdown__current">
            <img src={getAvatarForUser(user, getDisplayName(user))} alt={getDisplayName(user)} />
            <div>
              <strong>{getDisplayName(user)}</strong>
              <span>@{user.username}</span>
            </div>
          </div>

          <div className="dropdown-header">Current Accounts</div>

          <div className="accounts-list">
            {accounts.map((account) => {
              const accountUserId = getUserId(account.user);
              const isActive = accountUserId === activeAccountId;

              return (
                <div className={`account-item ${isActive ? "active" : ""}`} key={accountUserId}>
                  <button
                    className="account-item__main"
                    disabled={isActive}
                    onClick={() => handleSwitchAccount(accountUserId)}
                    type="button"
                  >
                    <img
                      src={getAvatarForUser(account.user, getDisplayName(account.user))}
                      alt={account.user.username}
                      className="account-item__avatar"
                    />
                    <span className="account-item__info">
                      <strong>{getDisplayName(account.user)}</strong>
                      <span>@{account.user.username}</span>
                    </span>
                    {isActive ? <span className="material-symbols-outlined check-icon">check_circle</span> : null}
                  </button>

                  {!isActive ? (
                    <button
                      aria-label={`Remove ${account.user.username}`}
                      className="account-remove-btn"
                      onClick={() => handleRemoveAccount(accountUserId)}
                      type="button"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {isAddOpen ? (
            <form className="account-add-form" onSubmit={handleAddAccount}>
              <label>
                <span>Email or username</span>
                <input
                  autoComplete="username"
                  onChange={(event) => {
                    setLoginForm((current) => ({ ...current, identifier: event.target.value }));
                    setError("");
                  }}
                  placeholder="name@example.com"
                  type="text"
                  value={loginForm.identifier}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => {
                    setLoginForm((current) => ({ ...current, password: event.target.value }));
                    setError("");
                  }}
                  placeholder="Password"
                  type="password"
                  value={loginForm.password}
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="dropdown-action-btn account-add-submit" disabled={isSubmitting} type="submit">
                <span className="material-symbols-outlined">login</span>
                {isSubmitting ? "Adding..." : "Log in account"}
              </button>
            </form>
          ) : null}

          <div className="dropdown-footer">
            <button className="dropdown-action-btn" onClick={() => setIsAddOpen((current) => !current)} type="button">
              <span className="material-symbols-outlined">person_add</span>
              Add Existing Account
            </button>
            <Link className="dropdown-action-btn" onClick={() => setIsOpen(false)} to="/signup?addAccount=1">
              <span className="material-symbols-outlined">add_circle</span>
              Create New Account
            </Link>
            <button className="dropdown-action-btn" onClick={() => { setIsAddOpen(false); setIsManaging(true); }} type="button">
              <span className="material-symbols-outlined">manage_accounts</span>
              Manage Accounts
            </button>
            <button className="dropdown-action-btn" onClick={logout} type="button">
              <span className="material-symbols-outlined">logout</span>
              Logout Current Account
            </button>
            <button className="dropdown-action-btn logout-all" onClick={logoutAll} type="button">
              <span className="material-symbols-outlined">logout</span>
              Logout All Accounts
            </button>
          </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
