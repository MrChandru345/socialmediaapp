import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EditProfileModal from "../components/profile/EditProfileModal";
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
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { userService } from "../services/userService";
import { getApiErrorMessage } from "../utils/helpers";

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
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [networkModal, setNetworkModal] = useState({ open: false, type: '', title: '' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);

  const profileIdentifier = identifier || user?.username || user?.id;
  const isOwnProfile = Boolean(state.profile?.id && user?.id && state.profile.id === user.id);

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
          onCreatePost={handleCreationChoice}
          onFollowersClick={() => setNetworkModal({ open: true, type: 'followers', title: 'Followers' })}
          onFollowingClick={() => setNetworkModal({ open: true, type: 'following', title: 'Following' })}
        />

        <div className="profile-page-feed-container" style={{ width: '100%', maxWidth: '100%', marginTop: '1.5rem' }}>
          <section className="profile-feed" style={{ width: '100%' }}>
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />
            
            <div key={activeTab} className="tab-content-wrapper animate-slide-up">
              <PostGrid 
                posts={activeTab === 'saved' ? state.savedPosts : (activeTab === 'reels' ? state.reels : state.posts)} 
                isOwnProfile={isOwnProfile} 
                onCreatePost={handleCreationChoice} 
                activeTab={activeTab}
                onPostClick={(post) => setSelectedPost(post)}
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
    </>
  );
}
