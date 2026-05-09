import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";

export default function AccountSwitcher() {
  const { accounts, user, switchAccount, addAccount, logoutAll } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="account-switcher-wrap" ref={dropdownRef}>
      <div 
        className={`user-chip ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
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
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isOpen && (
        <div className="account-switcher-dropdown modern-glass animate-in">
          <div className="dropdown-header">
            Switch Accounts
          </div>
          
          <div className="accounts-list">
            {accounts.map((acc) => (
              <div 
                key={acc.user.id} 
                className={`account-item ${acc.user.id === user.id ? 'active' : ''}`}
                onClick={() => {
                  if (acc.user.id !== user.id) switchAccount(acc.user.id);
                }}
              >
                <img 
                  src={getAvatarForUser(acc.user, getDisplayName(acc.user))} 
                  alt={acc.user.username} 
                  className="account-item__avatar"
                />
                <div className="account-item__info">
                  <strong>{getDisplayName(acc.user)}</strong>
                  <span>@{acc.user.username}</span>
                </div>
                {acc.user.id === user.id && (
                  <span className="material-symbols-outlined check-icon">check_circle</span>
                )}
              </div>
            ))}
          </div>

          <div className="dropdown-footer">
            <button className="dropdown-action-btn" onClick={addAccount}>
              <span className="material-symbols-outlined">person_add</span>
              Add existing account
            </button>
            <button className="dropdown-action-btn logout-all" onClick={logoutAll}>
              <span className="material-symbols-outlined">logout</span>
              Logout all accounts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
