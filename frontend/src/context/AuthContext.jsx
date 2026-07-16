import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { authService } from "../services/authService";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_TOKEN_REFRESHED_EVENT,
  clearStoredToken,
  getStoredRefreshToken,
  getStoredToken,
  setStoredSession
} from "../services/api";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "curator-auth-accounts";
const ACTIVE_ACCOUNT_KEY = "curator-active-account";
const LEGACY_ACCOUNTS_KEY = "app_accounts";

function getUserId(user) {
  return user?.id || user?._id || "";
}

function normalizeSession(session = {}) {
  const accessToken = session.accessToken || session.token;
  const refreshToken = session.refreshToken;
  const user = session.user;

  if (!accessToken || !refreshToken || !user) {
    return null;
  }

  return {
    user,
    accessToken,
    token: accessToken,
    refreshToken,
    savedAt: session.savedAt || Date.now()
  };
}

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getStoredAccounts() {
  const accounts = readJson(ACCOUNTS_KEY, []);

  if (accounts.length > 0) {
    return accounts.map(normalizeSession).filter(Boolean);
  }

  return readJson(LEGACY_ACCOUNTS_KEY, [])
    .map((session) => normalizeSession({
      user: session.user,
      accessToken: session.accessToken || session.token,
      refreshToken: session.refreshToken
    }))
    .filter(Boolean);
}

function saveStoredAccounts(accounts) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
}

function getStoredActiveAccountId() {
  return window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

function setStoredActiveAccountId(userId) {
  if (userId) {
    window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, userId);
  } else {
    window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  }
}

function upsertAccount(accounts, session) {
  const normalizedSession = normalizeSession(session);

  if (!normalizedSession) {
    return accounts;
  }

  const userId = getUserId(normalizedSession.user);
  const filtered = accounts.filter((account) => getUserId(account.user) !== userId);

  return [normalizedSession, ...filtered];
}

function findInitialSession(accounts) {
  const activeAccountId = getStoredActiveAccountId();
  const activeAccount = accounts.find((account) => getUserId(account.user) === activeAccountId);

  if (activeAccount) {
    return activeAccount;
  }

  const token = getStoredToken();
  const refreshToken = getStoredRefreshToken();
  const tokenAccount = accounts.find(
    (account) => account.accessToken === token || account.refreshToken === refreshToken
  );

  return tokenAccount || accounts[0] || null;
}

export function AuthProvider({ children }) {
  const storedAccounts = useMemo(() => getStoredAccounts(), []);
  const initialSession = useMemo(() => findInitialSession(storedAccounts), [storedAccounts]);
  const [state, setState] = useState({
    status: initialSession ? "loading" : "ready",
    token: initialSession?.accessToken || null,
    refreshToken: initialSession?.refreshToken || null,
    user: initialSession?.user || null,
    accounts: storedAccounts
  });

  useEffect(() => {
    if (!initialSession) {
      clearStoredToken();
      return undefined;
    }

    setStoredSession(initialSession);
    setStoredActiveAccountId(getUserId(initialSession.user));

    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const user = await authService.getCurrentUser();

        if (!isMounted) {
          return;
        }

        const refreshedSession = {
          ...initialSession,
          user
        };

        startTransition(() => {
          setState((prev) => ({
            ...prev,
            status: "authenticated",
            token: refreshedSession.accessToken,
            refreshToken: refreshedSession.refreshToken,
            user,
            accounts: upsertAndPersist(prev.accounts, refreshedSession)
          }));
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        removeAccount(getUserId(initialSession.user), { silent: true });
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleTokenRefresh(event) {
      const session = normalizeSession(event.detail);

      if (!session) {
        return;
      }

      startTransition(() => {
        setState((prev) => ({
          ...prev,
          status: "authenticated",
          token: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          accounts: upsertAndPersist(prev.accounts, session)
        }));
      });
    }

    function handleSessionExpired() {
      logout({ skipServer: true });
    }

    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [state.user, state.accounts]);

  function upsertAndPersist(accounts, session) {
    const nextAccounts = upsertAccount(accounts, session);
    saveStoredAccounts(nextAccounts);
    setStoredSession(session);
    setStoredActiveAccountId(getUserId(session.user));
    return nextAccounts;
  }

  function applySession(session) {
    const normalizedSession = normalizeSession(session);

    if (!normalizedSession) {
      throw new Error("Invalid auth session");
    }

    setStoredSession(normalizedSession);
    setStoredActiveAccountId(getUserId(normalizedSession.user));

    startTransition(() => {
      setState((prev) => ({
        ...prev,
        status: "authenticated",
        token: normalizedSession.accessToken,
        refreshToken: normalizedSession.refreshToken,
        user: normalizedSession.user,
        accounts: upsertAndPersist(prev.accounts, normalizedSession)
      }));
    });

    return normalizedSession;
  }

  async function login(payload) {
    const session = await authService.login(payload);
    return applySession(session);
  }

  async function signup(payload) {
    const session = await authService.signup(payload);
    return applySession(session);
  }

  function switchAccount(userId) {
    const target = state.accounts.find((account) => getUserId(account.user) === userId);

    if (!target || getUserId(state.user) === userId) {
      return;
    }

    setStoredSession(target);
    setStoredActiveAccountId(userId);

    startTransition(() => {
      setState((prev) => ({
        ...prev,
        status: "authenticated",
        token: target.accessToken,
        refreshToken: target.refreshToken,
        user: target.user
      }));
    });
  }

  function removeAccount(userId, options = {}) {
    const remaining = state.accounts.filter((account) => getUserId(account.user) !== userId);
    saveStoredAccounts(remaining);

    const activeUserId = getUserId(state.user);

    if (activeUserId !== userId) {
      setState((prev) => ({ ...prev, accounts: remaining }));
      return;
    }

    const nextSession = remaining[0] || null;

    if (nextSession) {
      setStoredSession(nextSession);
      setStoredActiveAccountId(getUserId(nextSession.user));
      setState({
        status: "authenticated",
        token: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
        user: nextSession.user,
        accounts: remaining
      });
      return;
    }

    clearStoredToken();
    setStoredActiveAccountId("");
    setState({ status: "ready", token: null, refreshToken: null, user: null, accounts: [] });

    if (!options.silent) {
      window.history.replaceState(null, "", "/login");
    }
  }

  async function logout(options = {}) {
    const activeRefreshToken = state.refreshToken;

    if (!options.skipServer && activeRefreshToken) {
      authService.logout(activeRefreshToken).catch(() => {});
    }

    removeAccount(getUserId(state.user));
  }

  async function logoutAll() {
    if (state.token) {
      authService.logoutAll().catch(() => {});
    }

    saveStoredAccounts([]);
    clearStoredToken();
    setStoredActiveAccountId("");
    setState({ status: "ready", token: null, refreshToken: null, user: null, accounts: [] });
    window.history.replaceState(null, "", "/login");
  }

  function addAccount() {
    return null;
  }

  async function refreshUser() {
    const user = await authService.getCurrentUser();
    const session = {
      user,
      accessToken: state.token,
      token: state.token,
      refreshToken: state.refreshToken
    };

    setState((prev) => ({
      ...prev,
      user,
      accounts: upsertAndPersist(prev.accounts, session)
    }));

    return user;
  }

  const value = {
    user: state.user,
    token: state.token,
    refreshToken: state.refreshToken,
    accounts: state.accounts,
    activeAccountId: getUserId(state.user),
    isAuthenticated: Boolean(state.user && state.token),
    isLoading: state.status === "loading",
    addAccount,
    login,
    logout,
    logoutAll,
    refreshUser,
    removeAccount,
    signup,
    switchAccount
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
