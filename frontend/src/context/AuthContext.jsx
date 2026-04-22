import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";

import { authService } from "../services/authService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../services/api";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "app_accounts";

function getStoredAccounts() {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    token: getStoredToken(),
    user: null,
    accounts: getStoredAccounts()
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const existingToken = getStoredToken();

      if (!existingToken) {
        setState(prev => ({ ...prev, status: "ready", token: null, user: null }));
        return;
      }

      try {
        const user = await authService.getCurrentUser();

        if (!isMounted) return;

        startTransition(() => {
          setState(prev => ({ 
            ...prev, 
            status: "authenticated", 
            token: existingToken, 
            user,
            // Ensure the current user is in accounts
            accounts: updateAccounts(prev.accounts, user, existingToken)
          }));
        });
      } catch (error) {
        clearStoredToken();
        if (!isMounted) return;
        setState(prev => ({ ...prev, status: "ready", token: null, user: null }));
      }
    }

    bootstrapAuth();
    return () => { isMounted = false; };
  }, []);

  function updateAccounts(accounts, user, token) {
    const filtered = accounts.filter(a => a.user.id !== user.id);
    const newList = [{ user, token }, ...filtered];
    saveStoredAccounts(newList);
    return newList;
  }

  function applySession(session) {
    setStoredToken(session.token);
    startTransition(() => {
      setState(prev => ({
        ...prev,
        status: "authenticated",
        token: session.token,
        user: session.user,
        accounts: updateAccounts(prev.accounts, session.user, session.token)
      }));
    });
  }

  async function login(payload) {
    const session = await authService.login(payload);
    applySession(session);
    return session;
  }

  async function signup(payload) {
    const session = await authService.signup(payload);
    applySession(session);
    return session;
  }

  function switchAccount(userId) {
    const target = state.accounts.find(a => a.user.id === userId);
    if (!target) return;

    setStoredToken(target.token);
    window.location.reload(); // Hard reload to clear all states/sockets for the new user
  }

  function addAccount() {
    // To add an account, we just log out the current one BUT keep it in the accounts list
    // The login screen will then allow adding a new one
    clearStoredToken();
    setState(prev => ({ ...prev, status: "ready", token: null, user: null }));
  }

  function logout() {
    const remaining = state.accounts.filter(a => a.user.id !== state.user?.id);
    saveStoredAccounts(remaining);
    clearStoredToken();

    if (remaining.length > 0) {
      setStoredToken(remaining[0].token);
      window.location.reload();
    } else {
      setState({ status: "ready", token: null, user: null, accounts: [] });
      window.location.href = "/login";
    }
  }

  function logoutAll() {
    saveStoredAccounts([]);
    clearStoredToken();
    setState({ status: "ready", token: null, user: null, accounts: [] });
    window.location.href = "/login";
  }

  const value = {
    user: state.user,
    token: state.token,
    accounts: state.accounts,
    isAuthenticated: Boolean(state.user && state.token),
    isLoading: state.status === "loading",
    login,
    logout,
    logoutAll,
    switchAccount,
    addAccount,
    refreshUser: async () => {
      const user = await authService.getCurrentUser();
      setState(prev => ({ ...prev, user }));
      return user;
    },
    signup
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
