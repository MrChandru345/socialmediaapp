import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppShell from "./components/common/AppShell";
import Loader from "./components/common/Loader";
import { useAuth } from "./hooks/useAuth";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Profile from "./pages/Profile";
import Reels from "./pages/Reels";
import ResetPassword from "./pages/auth/ResetPassword";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";

function ProtectedPage({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <AppShell>{children}</AppShell>;
}

function PublicPage({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const allowAuthenticatedSignup = location.pathname === "/signup" && new URLSearchParams(location.search).get("addAccount") === "1";

  if (isLoading) {
    return <Loader />;
  }

  if (isAuthenticated && !allowAuthenticatedSignup) {
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
        path="/forgot-password"
        element={
          <PublicPage>
            <ForgotPassword />
          </PublicPage>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicPage>
            <ResetPassword />
          </PublicPage>
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
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
