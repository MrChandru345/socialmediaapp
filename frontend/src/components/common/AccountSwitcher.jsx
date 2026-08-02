import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";

function getUserId(user) {
  return user?.id || user?._id || "";
}

export default function AccountSwitcher() {
  const navigate = useNavigate();
  const {
    accounts,
    activeAccountId,
    logout,
    logoutAll,
    removeAccount,
    switchAccount,
    user
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
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

  function handleSwitchAccount(accountUser) {
    switchAccount(accountUser);
    setIsOpen(false);
  }

  function handleRemoveAccount(accountUserId) {
    removeAccount(accountUserId);

    if (accounts.length <= 1 || String(accountUserId) === String(activeAccountId)) {
      setIsOpen(false);
    }
  }

  return (
    <div className="account-switcher-wrap" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        className={`user-chip ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
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
          <div className="account-switcher-dropdown__current">
            <img src={getAvatarForUser(user, getDisplayName(user))} alt={getDisplayName(user)} />
            <div>
              <strong>{getDisplayName(user)}</strong>
              <span>@{user.username}</span>
            </div>
          </div>

          <div className="dropdown-header">Saved Accounts</div>

          <div className="accounts-list">
            {accounts.map((account) => {
              const accountUser = account.user;
              const accountUserId = getUserId(accountUser);
              const isActive = String(accountUserId) === String(activeAccountId);

              return (
                <div className={`account-item ${isActive ? "active" : ""}`} key={accountUserId || Math.random()}>
                  <button
                    className="account-item__main"
                    disabled={isActive}
                    onClick={() => handleSwitchAccount(accountUser)}
                    type="button"
                  >
                    <img
                      src={getAvatarForUser(accountUser, getDisplayName(accountUser))}
                      alt={accountUser?.username}
                      className="account-item__avatar"
                    />
                    <span className="account-item__info">
                      <strong>{getDisplayName(accountUser)}</strong>
                      <span>@{accountUser?.username}</span>
                    </span>
                    {isActive ? <span className="material-symbols-outlined check-icon">check_circle</span> : null}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="dropdown-footer">
            {/* Add Existing Account -> Navigate to login page */}
            <Link
              className="dropdown-action-btn"
              onClick={() => setIsOpen(false)}
              to="/login?addAccount=1"
            >
              <span className="material-symbols-outlined">login</span>
              Add Existing Account
            </Link>

            {/* Create New Account -> Navigate to sign up page */}
            <Link
              className="dropdown-action-btn"
              onClick={() => setIsOpen(false)}
              to="/signup?addAccount=1"
            >
              <span className="material-symbols-outlined">person_add</span>
              Create New Account
            </Link>

            {/* Logout Current Account */}
            <button className="dropdown-action-btn" onClick={logout} type="button">
              <span className="material-symbols-outlined">logout</span>
              Logout Current Account
            </button>

            {/* Logout All Accounts */}
            <button className="dropdown-action-btn logout-all" onClick={logoutAll} type="button">
              <span className="material-symbols-outlined">logout</span>
              Logout All Accounts
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
