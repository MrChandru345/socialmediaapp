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

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    token: getStoredToken(),
    user: null
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const existingToken = getStoredToken();

      if (!existingToken) {
        setState({ status: "ready", token: null, user: null });
        return;
      }

      try {
        const user = await authService.getCurrentUser();

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setState({ status: "authenticated", token: existingToken, user });
        });
      } catch (error) {
        clearStoredToken();

        if (!isMounted) {
          return;
        }

        setState({ status: "ready", token: null, user: null });
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  function applySession(session) {
    setStoredToken(session.token);

    startTransition(() => {
      setState({
        status: "authenticated",
        token: session.token,
        user: session.user
      });
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

  async function refreshUser() {
    const user = await authService.getCurrentUser();

    setState((currentState) => ({
      ...currentState,
      user
    }));

    return user;
  }

  function logout() {
    clearStoredToken();
    setState({ status: "ready", token: null, user: null });
  }

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: Boolean(state.user && state.token),
    isLoading: state.status === "loading",
    login,
    logout,
    refreshUser,
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
