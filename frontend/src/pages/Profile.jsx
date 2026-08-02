import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EditProfileModal from "../components/profile/EditProfileModal";
import SettingsModal from "../components/profile/SettingsModal";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import PostGrid from "../components/profile/PostGrid";
import { reelService } from "../services/reelService";
import NetworkModal from "../components/profile/NetworkModal";
import PostModal from "../components/post/PostModal";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import CreationChoiceModal from "../components/profile/CreationChoiceModal";
import CreateReelModal from "../components/post/CreateReelModal";
import CreatePostModal from "../components/post/CreatePostModal";
import CreateStoryModal from "../components/story/CreateStoryModal";
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { userService } from "../services/userService";
import { getApiErrorMessage, isReel, getAvatarForUser, getDisplayName } from "../utils/helpers";

const initialState = {
  error: "",
  posts: [],
  postsMeta: null,
  savedPosts: [],
  savedStatus: "idle",
  profile: null,
  reels: [],
  status: "loading"
};

export default function Profile() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { user, accounts, switchAccount, activeAccountId } = useAuth();
  const [state, setState] = useState(initialState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [networkModal, setNetworkModal] = useState({ open: false, type: '', title: '' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const profileIdentifier = identifier || user?.username || user?.id;
  const isOwnProfile = Boolean(state.profile?.id && user?.id && state.profile.id === user.id);

  useEffect(() => {
    document.body.classList.add("profile-page-active");
    return () => {
      document.body.classList.remove("profile-page-active");
    };
  }, []);

  useEffect(() => {
    if (!profileIdentifier) return;
    loadProfile();
  }, [profileIdentifier]);

  useEffect(() => {
    if (activeTab === 'saved' && state.savedStatus === 'idle') {
      loadSavedPosts();
    }
    if (activeTab === 'reels' && state.reels.length === 0) {
      // Logic to load reels if needed, or they might be part of initial profile load
    }
  }, [activeTab, state.savedStatus, state.reels.length]);

  async function loadProfile() {
    if (!profileIdentifier) return;

    setState((currentState) => ({
      ...currentState,
      error: "",
      status: currentState.profile ? "refreshing" : "loading"
    }));

    try {
      const profile = await userService.getProfile(profileIdentifier);
      
      const [posts, reels] = await Promise.all([
        userService.getPosts(profileIdentifier, { limit: 12 }),
        reelService.getAll({ author: profile.id, limit: 12 }).catch(err => ({ items: [] }))
      ]);

      setState(prev => ({
        ...prev,
        error: "",
        posts: posts.items || [],
        postsMeta: posts.meta || null,
        reels: reels?.items || [],
        profile,
        status: "ready",
        // Reset saved status on profile change
        savedPosts: [],
        savedStatus: "idle"
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load this profile."),
        status: "error"
      }));
    }
  }

  async function loadSavedPosts() {
    setState(prev => ({ ...prev, savedStatus: 'loading' }));
    try {
      const result = await userService.getSavedPosts({ limit: 12 });
      setState(prev => ({
        ...prev,
        savedPosts: result.items || [],
        savedStatus: 'ready'
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load saved posts."),
        savedStatus: 'error'
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

  function handleCreationChoice() {
    setIsChoiceOpen(true);
  }

  function handlePostCreated(newPost) {
    setState(prev => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));
    setActiveTab('posts');
    setIsCreatePostOpen(false);
  }

  function handleReelCreated(newReel) {
    setState(prev => ({
      ...prev,
      reels: [newReel, ...prev.reels],
      // If we show reels in main feed too, add there
      posts: [newReel, ...prev.posts] 
    }));
    setActiveTab('reels');
    setIsCreateReelOpen(false);
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
        {/* Mobile Profile Header */}
        <div className="mobile-profile-header" style={{ position: 'relative' }}>
          <button className="mobile-header-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <button
            className="mobile-header-username-btn"
            onClick={() => isOwnProfile && setShowAccountDropdown(!showAccountDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              cursor: isOwnProfile ? 'pointer' : 'default',
              padding: '0 4px'
            }}
          >
            <span className="mobile-header-username">{state.profile.username}</span>
            {isOwnProfile && (
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text)', transition: 'transform 0.2s', transform: showAccountDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                keyboard_arrow_down
              </span>
            )}
          </button>

          {isOwnProfile ? (
            <button className="mobile-header-btn" onClick={() => navigate("/settings")}>
              <span className="material-symbols-outlined">settings</span>
            </button>
          ) : (
            <div style={{ width: '24px' }} />
          )}

          {/* Account Switcher Dropdown */}
          {showAccountDropdown && isOwnProfile && (
            <div
              className="profile-account-dropdown modern-glass radius-xl"
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '280px',
                zIndex: 100,
                padding: '0.75rem',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-outline)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.25rem' }}>
                Switch Account
              </div>
              {accounts.map((acc) => {
                const accUser = acc.user;
                const accUserId = accUser?.id || accUser?._id;
                const isActive = Boolean(accUserId && String(accUserId) === String(activeAccountId));
                return (
                  <div
                    key={accUserId || Math.random()}
                    onClick={() => {
                      if (!isActive && accUser) {
                        switchAccount(accUser);
                        setShowAccountDropdown(false);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '10px',
                      background: isActive ? 'var(--surface-high)' : 'var(--surface-low)',
                      cursor: isActive ? 'default' : 'pointer'
                    }}
                  >
                    <img
                      src={getAvatarForUser(accUser, getDisplayName(accUser))}
                      alt={accUser?.username}
                      style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getDisplayName(accUser)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                        @{accUser?.username}
                      </span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>
                        check_circle
                      </span>
                    )}
                  </div>
                );
              })}

              <div style={{ borderTop: '1px solid var(--surface-outline)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    navigate("/login?addAccount=1");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                  <span>Add Existing Account</span>
                </button>
                <button
                  onClick={() => {
                    setShowAccountDropdown(false);
                    navigate("/signup?addAccount=1");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                  <span>Create New Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
          profile={state.profile ? {
            ...state.profile,
            postCount: (state.profile.postCount || 0) + (state.reels?.length || 0)
          } : null}
          isOwnProfile={isOwnProfile}
          isFollowPending={isFollowPending}
          onEditProfile={() => setIsEditOpen(true)}
          onSettings={() => navigate("/settings")}
          onToggleFollow={handleToggleFollow}
          onShareProfile={handleShareProfile}
          onMessage={() => navigate(`/chat?userId=${state.profile.id}`)}
          onCreatePost={handleCreationChoice}
          onFollowersClick={() => setNetworkModal({ open: true, type: 'followers', title: 'Followers' })}
          onFollowingClick={() => setNetworkModal({ open: true, type: 'following', title: 'Following' })}
        />

        <div className="profile-page-feed-container" style={{ width: '100%', maxWidth: '100%', marginTop: '1.5rem' }}>
          <section className="profile-feed" style={{ width: '100%' }}>
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />
            
            <div key={activeTab} className="tab-content-wrapper animate-slide-up">
              <PostGrid 
                posts={
                  activeTab === 'saved' 
                    ? state.savedPosts 
                    : (activeTab === 'reels' 
                        ? state.reels 
                        : [...state.posts, ...state.reels].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()))
                } 
                isOwnProfile={isOwnProfile} 
                onCreatePost={handleCreationChoice} 
                activeTab={activeTab}
                onPostClick={(post) => {
                  const targetId = post?.id || post?._id;
                  if (isReel(post)) {
                    navigate(`/reels?reelId=${targetId}`);
                  } else if (window.innerWidth <= 768) {
                    navigate(`/post/${targetId}`);
                  } else {
                    setSelectedPost(post);
                  }
                }}
                status={activeTab === 'saved' ? state.savedStatus : 'ready'}
              />
            </div>
          </section>
        </div>
      </div>

      <PostModal
        open={Boolean(selectedPost)}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onPostUpdated={(updated) => {
          setState(prev => {
            if (updated.deleted) {
              return {
                ...prev,
                posts: prev.posts.filter(p => p.id !== updated.id),
                reels: prev.reels.filter(p => p.id !== updated.id),
                savedPosts: prev.savedPosts.filter(p => p.id !== updated.id)
              };
            }
            const newPosts = prev.posts.map(p => p.id === updated.id ? { ...p, ...updated } : p);
            const newReels = prev.reels.map(p => p.id === updated.id ? { ...p, ...updated } : p);
            let newSaved = prev.savedPosts.map(p => p.id === updated.id ? { ...p, ...updated } : p);
            
            if (updated.hasOwnProperty('savedByViewer') && !updated.savedByViewer) {
              newSaved = newSaved.filter(p => p.id !== updated.id);
            }

            return {
              ...prev,
              posts: newPosts,
              reels: newReels,
              savedPosts: newSaved
            };
          });
        }}
      />

      <NetworkModal
        open={networkModal.open}
        onClose={() => setNetworkModal({ open: false, type: '', title: '' })}
        targetUserId={state.profile?.id}
        type={networkModal.type}
        title={networkModal.title}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onEditProfile={() => setIsEditOpen(true)}
      />

      <EditProfileModal
        onClose={() => setIsEditOpen(false)}
        onUpdated={handleProfileUpdated}
        open={isEditOpen}
        profile={state.profile}
      />

      <CreationChoiceModal
        open={isChoiceOpen}
        onClose={() => setIsChoiceOpen(false)}
        onChoosePost={() => setIsCreatePostOpen(true)}
        onChooseReel={() => setIsCreateReelOpen(true)}
        onChooseStory={() => setIsCreateStoryOpen(true)}
      />

      <CreatePostModal
        open={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreated={handlePostCreated}
      />

      <CreateReelModal
        open={isCreateReelOpen}
        onClose={() => setIsCreateReelOpen(false)}
        onCreated={handleReelCreated}
      />

      <CreateStoryModal
        open={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onCreated={() => setIsCreateStoryOpen(false)}
      />
    </>
  );
}
