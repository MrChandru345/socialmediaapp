import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EditProfileModal from "../components/profile/EditProfileModal";
import PostCard from "../components/post/PostCard";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { userService } from "../services/userService";
import {
  formatCompactNumber,
  getApiErrorMessage,
  getAvatarForUser,
  getDisplayName,
  getPostMedia,
  isVideoMedia,
  getPostLikeCount,
  getPostCommentCount
} from "../utils/helpers";

const initialState = {
  error: "",
  posts: [],
  postsMeta: null,
  profile: null,
  status: "loading"
};

function normalizeWebsite(value) {
  if (!value) {
    return "";
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);

  const profileIdentifier = identifier || user?.username || user?.id;
  const isOwnProfile = Boolean(state.profile?.id && user?.id && state.profile.id === user.id);

  useEffect(() => {
    if (!profileIdentifier) {
      return;
    }

    loadProfile();
  }, [profileIdentifier]);

  async function loadProfile() {
    if (!profileIdentifier) {
      return;
    }

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
    if (!state.profile) {
      return;
    }

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

  function handlePostRemoved(postId) {
    setState((currentState) => ({
      ...currentState,
      posts: currentState.posts.filter((post) => post.id !== postId),
      postsMeta: currentState.postsMeta
        ? {
            ...currentState.postsMeta,
            total: Math.max((currentState.postsMeta.total || 1) - 1, 0)
          }
        : currentState.postsMeta,
      profile: currentState.profile
        ? {
            ...currentState.profile,
            postCount: Math.max((currentState.profile.postCount || 1) - 1, 0)
          }
        : currentState.profile
    }));
  }

  function openCreatePost() {
    navigate("/", {
      state: {
        from: identifier ? `/profile/${identifier}` : "/profile",
        openCreatePostToken: Date.now()
      }
    });
  }

  if (state.status === "loading") {
    return <Loader label="Loading profile..." />;
  }

  if (!state.profile) {
    return (
      <section className="sidebar-card empty-state">
        <span className="material-symbols-outlined">person_off</span>
        <h3>We could not find that profile</h3>
        <p>{state.error || "This profile may not exist anymore."}</p>
        <Button onClick={loadProfile} size="sm">
          Retry
        </Button>
      </section>
    );
  }

  const websiteHref = normalizeWebsite(state.profile.website);

  return (
    <>
      <div className="profile-page">
        {state.error ? (
          <section className="sidebar-card home-banner home-banner--error">
            <div>
              <p className="eyebrow">Sync issue</p>
              <h3>Profile data needs another try</h3>
              <p>{state.error}</p>
            </div>
            <Button onClick={loadProfile} size="sm" variant="ghost">
              Retry
            </Button>
          </section>
        ) : null}

        <section className="profile-hero">
          <div className="profile-avatar-wrap">
            <img
              alt={getDisplayName(state.profile)}
              className="profile-avatar"
              src={getAvatarForUser(state.profile, getDisplayName(state.profile))}
            />
          </div>
          <div className="profile-details">
            <div className="profile-headline-row">
              <div>
                <p className="eyebrow">{isOwnProfile ? "Your profile" : "Creator profile"}</p>
                <h2>{getDisplayName(state.profile)}</h2>
              </div>
              <div className="profile-actions">
                {isOwnProfile ? (
                  <>
                    <Button onClick={() => setIsEditOpen(true)} size="sm">
                      Edit Profile
                    </Button>
                    <Button onClick={openCreatePost} size="sm" variant="ghost">
                      Create Post
                    </Button>
                  </>
                ) : (
                  <>
                    <Button disabled={isFollowPending} onClick={handleToggleFollow} size="sm" variant={state.profile.isFollowing ? "ghost" : "primary"}>
                      {isFollowPending
                        ? "Updating..."
                        : state.profile.isFollowing
                          ? "Following"
                          : "Follow"}
                    </Button>
                    <Button onClick={() => navigate(`/chat?userId=${state.profile.id}`)} size="sm" variant="outline">
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{formatCompactNumber(state.profile.postCount)}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{formatCompactNumber(state.profile.followersCount)}</strong>
                <span>Followers</span>
              </div>
              <div>
                <strong>{formatCompactNumber(state.profile.followingCount)}</strong>
                <span>Following</span>
              </div>
            </div>

            <div className="profile-bio">
              <p className="profile-title">
                {state.profile.role === "admin" ? "Platform admin" : "Curator profile"}
              </p>
              <p>{state.profile.bio || "No bio shared yet."}</p>
              {state.profile.location ? <span className="profile-meta">Location: {state.profile.location}</span> : null}
              {websiteHref ? (
                <a href={websiteHref} rel="noreferrer" target="_blank">
                  {state.profile.website}
                </a>
              ) : null}
              <small>@{state.profile.username}</small>
            </div>
          </div>
        </section>

        <section className="gallery-section profile-feed">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Published work</p>
              <h3>Posts</h3>
            </div>
            <span className="status-pill">
              {state.status === "refreshing"
                ? "Syncing"
                : `${formatCompactNumber(state.postsMeta?.total || state.posts.length)} total`}
            </span>
          </div>

          {state.posts.length > 0 ? (
            <div className="gallery-grid">
              {state.posts.map((post) => {
                const media = getPostMedia(post);
                return (
                  <div key={post.id} className="gallery-tile">
                    {media && isVideoMedia(media) ? (
                      <video src={media.url} className="gallery-tile__image" playsInline muted loop />
                    ) : media ? (
                      <img src={media.url} alt="Post" className="gallery-tile__image" />
                    ) : (
                      <div className="gallery-tile__image empty" />
                    )}
                    <div className="gallery-tile__overlay">
                      <span><span className="material-symbols-outlined filled">favorite</span> {getPostLikeCount(post)}</span>
                      <span><span className="material-symbols-outlined filled">chat_bubble</span> {getPostCommentCount(post)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <section className="sidebar-card empty-state">
              <span className="material-symbols-outlined">photo_library</span>
              <h3>{isOwnProfile ? "No posts yet" : "No visible posts yet"}</h3>
              <p>
                {isOwnProfile
                  ? "Publish your first post and it will show up here immediately."
                  : "This creator has not shared a public post you can view yet."}
              </p>
              {isOwnProfile ? (
                <Button onClick={openCreatePost} size="sm">
                  Create your first post
                </Button>
              ) : null}
            </section>
          )}
        </section>
      </div>

      <EditProfileModal
        onClose={() => setIsEditOpen(false)}
        onUpdated={handleProfileUpdated}
        open={isEditOpen}
        profile={state.profile}
      />
    </>
  );
}
