import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EditProfileModal from "../components/profile/EditProfileModal";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import PostGrid from "../components/profile/PostGrid";
import NetworkModal from "../components/profile/NetworkModal";
import PostModal from "../components/post/PostModal";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { userService } from "../services/userService";
import { getApiErrorMessage } from "../utils/helpers";

const initialState = {
  error: "",
  posts: [],
  postsMeta: null,
  profile: null,
  status: "loading"
};

export default function Profile() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [networkModal, setNetworkModal] = useState({ open: false, type: '', title: '' });
  const [selectedPost, setSelectedPost] = useState(null);

  const profileIdentifier = identifier || user?.username || user?.id;
  const isOwnProfile = Boolean(state.profile?.id && user?.id && state.profile.id === user.id);

  useEffect(() => {
    if (!profileIdentifier) return;
    loadProfile();
  }, [profileIdentifier]);

  async function loadProfile() {
    if (!profileIdentifier) return;

    setState((currentState) => ({
      ...currentState,
      error: "",
      status: currentState.profile ? "refreshing" : "loading"
    }));

    try {
      const [profile, posts] = await Promise.all([
        userService.getProfile(profileIdentifier),
        userService.getPosts(profileIdentifier, { limit: 12 })
      ]);

      setState({
        error: "",
        posts: posts.items || [],
        postsMeta: posts.meta || null,
        profile,
        status: "ready"
      });
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load this profile."),
        status: "error"
      }));
    }
  }

  async function handleToggleFollow() {
    if (!state.profile) return;

    setIsFollowPending(true);
    setState((currentState) => ({ ...currentState, error: "" }));

    try {
      const result = await followService.toggle(state.profile.id);
      const posts = await userService.getPosts(profileIdentifier, { limit: 12 });

      setState((currentState) => ({
        ...currentState,
        posts: posts.items || [],
        postsMeta: posts.meta || null,
        profile: currentState.profile
          ? {
              ...currentState.profile,
              followersCount: result.followersCount,
              isFollowing: result.following
            }
          : currentState.profile
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to update follow status.")
      }));
    } finally {
      setIsFollowPending(false);
    }
  }

  function handleProfileUpdated(updatedProfile) {
    setState((currentState) => ({
      ...currentState,
      profile: updatedProfile
    }));
    setIsEditOpen(false);
  }

  function openCreatePost() {
    navigate("/", {
      state: {
        from: identifier ? `/profile/${identifier}` : "/profile",
        openCreatePostToken: Date.now()
      }
    });
  }



  function handleShareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    });
  }

  if (state.status === "loading") {
    return (
      <div className="profile-page-wrapper" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
        <div className="sidebar-card modern-glass radius-xl padding-lg" style={{ minHeight: '300px' }}>
           <Loader label="Loading profile..." />
        </div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <section className="sidebar-card empty-state modern-glass radius-xl">
        <span className="material-symbols-outlined">person_off</span>
        <h3>We could not find that profile</h3>
        <p>{state.error || "This profile may not exist anymore."}</p>
        <Button onClick={loadProfile} size="sm">
          Retry
        </Button>
      </section>
    );
  }

  return (
    <>
      {copiedToast && (
        <div className="toast-notification modern-glass radius-xl fadeIn">
          <span className="material-symbols-outlined">check_circle</span> Link copied to clipboard!
        </div>
      )}

      <div className="profile-page-wrapper" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
        {state.error ? (
          <section className="sidebar-card home-banner home-banner--error modern-glass radius-xl" style={{ marginBottom: '2rem' }}>
            <div>
              <p className="eyebrow">Sync issue</p>
              <h3>Profile data needs another try</h3>
              <p>{state.error}</p>
            </div>
            <Button onClick={loadProfile} size="sm" variant="ghost">Retry</Button>
          </section>
        ) : null}

        <ProfileHeader
          profile={state.profile}
          isOwnProfile={isOwnProfile}
          isFollowPending={isFollowPending}
          onEditProfile={() => setIsEditOpen(true)}
          onToggleFollow={handleToggleFollow}
          onShareProfile={handleShareProfile}
          onMessage={() => navigate(`/chat?userId=${state.profile.id}`)}
          onCreatePost={openCreatePost}
          onFollowersClick={() => setNetworkModal({ open: true, type: 'followers', title: 'Followers' })}
          onFollowingClick={() => setNetworkModal({ open: true, type: 'following', title: 'Following' })}
        />

        <div className="profile-page-feed-container" style={{ width: '100%', maxWidth: '100%', marginTop: '1.5rem' }}>
          <section className="profile-feed" style={{ width: '100%' }}>
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <PostGrid 
              posts={state.posts} 
              isOwnProfile={isOwnProfile} 
              onCreatePost={openCreatePost} 
              activeTab={activeTab}
              onPostClick={(post) => setSelectedPost(post)}
            />
          </section>
        </div>
      </div>

      <PostModal
        open={Boolean(selectedPost)}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onPostUpdated={(updated) => {
          setState(prev => ({
            ...prev,
            posts: prev.posts.map(p => p.id === updated.id ? { ...p, ...updated } : p)
          }));
        }}
      />

      <NetworkModal
        open={networkModal.open}
        onClose={() => setNetworkModal({ open: false, type: '', title: '' })}
        targetUserId={state.profile?.id}
        type={networkModal.type}
        title={networkModal.title}
      />

      <EditProfileModal
        onClose={() => setIsEditOpen(false)}
        onUpdated={handleProfileUpdated}
        open={isEditOpen}
        profile={state.profile}
      />
    </>
  );
}
