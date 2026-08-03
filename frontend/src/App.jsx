import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppShell from "./components/common/AppShell";
import Loader from "./components/common/Loader";
import { useAuth } from "./hooks/useAuth";

const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./components/auth/AuthPage"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Chat = lazy(() => import("./pages/Chat"));
const Explore = lazy(() => import("./pages/Explore"));
const Reels = lazy(() => import("./pages/Reels"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Admin = lazy(() => import("./pages/Admin"));

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
  const allowAuthenticatedAddAccount =
    (location.pathname === "/signup" || location.pathname === "/login") &&
    new URLSearchParams(location.search).get("addAccount") === "1";

  if (isLoading) {
    return <Loader />;
  }

  if (isAuthenticated && !allowAuthenticatedAddAccount) {
    return <Navigate replace to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
      <Route
        path="/login"
        element={
          <PublicPage>
            <AuthPage initialTab="signin" />
          </PublicPage>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicPage>
            <AuthPage initialTab="signup" />
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
        path="/settings"
        element={
          <ProtectedPage>
            <Settings />
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
        path="/post/:postId"
        element={
          <ProtectedPage>
            <PostDetail />
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
  </Suspense>
  );
}
