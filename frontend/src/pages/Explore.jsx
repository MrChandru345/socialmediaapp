import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import PostCard from "../components/post/PostCard";
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { postService } from "../services/postService";
import { userService } from "../services/userService";
import {
  createOptimisticPost,
  formatCompactNumber,
  getApiErrorMessage,
  getAvatarForUser,
  getDisplayName,
  getSuggestionSubtitle,
  isOwnResource,
  getPostMedia,
  isVideoMedia,
  getPostLikeCount,
  getPostCommentCount
} from "../utils/helpers";

const initialState = {
  error: "",
  posts: [],
  postsMeta: null,
  postsStatus: "loading",
  searchError: "",
  searchResults: [],
  searchStatus: "idle",
  suggestions: [],
  suggestionsStatus: "loading"
};

export default function Explore() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState("");
  const [pendingFollowIds, setPendingFollowIds] = useState([]);
  const [state, setState] = useState(initialState);
  const activeQuery = (searchParams.get("q") || "").trim();
  const visibleCreators = activeQuery ? state.searchResults : state.suggestions;
  const creatorsStatus = activeQuery ? state.searchStatus : state.suggestionsStatus;

  useEffect(() => {
    setSearchDraft(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    loadExplore();
  }, []);

  useEffect(() => {
    if (!activeQuery) {
      setState((currentState) => ({
        ...currentState,
        searchError: "",
        searchResults: [],
        searchStatus: "idle"
      }));
      return undefined;
    }

    let isCancelled = false;

    setState((currentState) => ({
      ...currentState,
      searchError: "",
      searchStatus: "loading"
    }));

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await userService.search(activeQuery);

        if (isCancelled) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          searchError: "",
          searchResults: results || [],
          searchStatus: "ready"
        }));
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          searchError: getApiErrorMessage(caughtError, "Unable to search creators right now."),
          searchStatus: "error"
        }));
      }
    }, 280);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeQuery]);

  async function loadExplore() {
    setState((currentState) => ({
      ...currentState,
      error: "",
      postsStatus: currentState.posts.length > 0 ? "refreshing" : "loading",
      suggestionsStatus: currentState.suggestions.length > 0 ? "refreshing" : "loading"
    }));

    try {
      const [explore, suggestions] = await Promise.all([
        postService.getExplore({ limit: 12 }),
        userService.getSuggestions()
      ]);

      setState((currentState) => ({
        ...currentState,
        error: "",
        posts: (explore.items || []).map(createOptimisticPost),
        postsMeta: explore.meta || null,
        postsStatus: "ready",
        suggestions: (suggestions || []).map((creator) => ({
          ...creator,
          isFollowing: Boolean(creator.isFollowing)
        })),
        suggestionsStatus: "ready"
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load explore right now."),
        postsStatus: "error",
        suggestionsStatus: "error"
      }));
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchDraft(value);
    if (!value.trim()) {
      setSearchParams({});
    } else {
      setSearchParams({ q: value.trim() });
    }
  }

  function handleClearSearch() {
    setSearchDraft("");
    setSearchParams({});
  }

  async function handleToggleFollow(targetUserId) {
    setPendingFollowIds((currentIds) => [...currentIds, targetUserId]);
    setState((currentState) => ({
      ...currentState,
      searchError: ""
    }));

    try {
      const result = await followService.toggle(targetUserId);

      setState((currentState) => ({
        ...currentState,
        searchResults: currentState.searchResults.map((creator) =>
          creator.id === targetUserId
            ? {
                ...creator,
                followersCount: result.followersCount,
                isFollowing: result.following
              }
            : creator
        ),
        suggestions: currentState.suggestions.map((creator) =>
          creator.id === targetUserId
            ? {
                ...creator,
                followersCount: result.followersCount,
                isFollowing: result.following
              }
            : creator
        )
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        searchError: getApiErrorMessage(caughtError, "Unable to update follow status right now.")
      }));
    } finally {
      setPendingFollowIds((currentIds) => currentIds.filter((id) => id !== targetUserId));
    }
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
        : currentState.postsMeta
    }));
  }

  const isInitialLoading = state.postsStatus === "loading" && state.suggestionsStatus === "loading";
  const creatorsTitle = activeQuery ? `Creators matching "${activeQuery}"` : "Suggested creators";
  const creatorsEyebrow = activeQuery ? "Search results" : "Creator discovery";
  const creatorsStatusLabel =
    creatorsStatus === "loading"
      ? activeQuery
        ? "Searching"
        : "Refreshing"
      : `${formatCompactNumber(visibleCreators.length)} found`;
  const publicPostsCount = formatCompactNumber(state.postsMeta?.total || state.posts.length);

  if (isInitialLoading) {
    return <Loader label="Loading explore..." />;
  }

  return (
    <div className="explore-page-wrapper">
      <div className="explore-search-header">
        <form className="instagram-search-form" onSubmit={(e) => e.preventDefault()}>
          <div className="instagram-search-input-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              onChange={handleSearchChange}
              placeholder="Search creators..."
              type="text"
              value={searchDraft}
            />
            {searchDraft && (
              <button className="search-clear-btn" onClick={handleClearSearch} type="button">
                <span className="material-symbols-outlined">cancel</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {state.error || state.searchError ? (
        <section className="explore-error-banner">
          <p>{state.error || state.searchError}</p>
          <Button onClick={loadExplore} size="sm" variant="ghost">Retry</Button>
        </section>
      ) : null}

      {activeQuery || searchDraft ? (
        <section className="explore-search-results">
          {creatorsStatus === "loading" ? (
            <Loader label="Searching creators..." />
          ) : visibleCreators.length > 0 ? (
            <div className="search-user-list">
              {visibleCreators.map((creator) => {
                const isOwnCreator = isOwnResource(creator.id, user?.id);
                const isPending = pendingFollowIds.includes(creator.id);
                return (
                  <div className="search-user-item" key={creator.id}>
                    <Link className="search-user-link" to={`/profile/${creator.username || creator.id}`}>
                      <img
                        alt={getDisplayName(creator)}
                        className="search-user-avatar"
                        src={getAvatarForUser(creator, getDisplayName(creator))}
                      />
                      <div className="search-user-info">
                        <strong>{creator.username}</strong>
                        <span>{getDisplayName(creator)} • {formatCompactNumber(creator.followersCount)} followers</span>
                      </div>
                    </Link>
                    {!isOwnCreator && (
                      <Button
                        disabled={isPending}
                        onClick={() => handleToggleFollow(creator.id)}
                        size="sm"
                        variant={creator.isFollowing ? "ghost" : "primary"}
                      >
                        {isPending ? "Updating..." : creator.isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="explore-empty-state">
               <p>No results found for "{activeQuery}".</p>
            </div>
          )}
        </section>
      ) : (
        <section className="explore-gallery-grid">
          {state.postsStatus === "loading" ? (
            <Loader label="Loading explore..." />
          ) : state.posts.length > 0 ? (
            <div className="gallery-grid">
              {state.posts.map((post) => {
                const media = getPostMedia(post);
                const profileUrl = `/profile/${post.author?.username || post.author?.id}`;
                return (
                  <Link key={post.id} className="gallery-tile" to={profileUrl}>
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
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="explore-empty-state">
              <p>No posts yet.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}