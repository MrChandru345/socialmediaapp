import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/common/AppShell";
import Loader from "./components/common/Loader";
import { useAuth } from "./hooks/useAuth";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Profile from "./pages/Profile";
import Reels from "./pages/Reels";
import Signup from "./pages/auth/Signup";

function ProtectedPage({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <AppShell>{children}</AppShell>;
}

function PublicPage({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicPage>
            <Login />
          </PublicPage>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicPage>
            <Signup />
          </PublicPage>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedPage>
            <Home />
          </ProtectedPage>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedPage>
            <Profile />
          </ProtectedPage>
        }
      />
      <Route
        path="/profile/:identifier"
        element={
          <ProtectedPage>
            <Profile />
          </ProtectedPage>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedPage>
            <Chat />
          </ProtectedPage>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedPage>
            <Explore />
          </ProtectedPage>
        }
      />
      <Route
        path="/reels"
        element={
          <ProtectedPage>
            <Reels />
          </ProtectedPage>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedPage>
            <Admin />
          </ProtectedPage>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
