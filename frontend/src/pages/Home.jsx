import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import OnlineUsers from "../components/chat/OnlineUsers";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import CreatePostModal from "../components/post/CreatePostModal";
import PostCard from "../components/post/PostCard";
import CreateStoryModal from "../components/story/CreateStoryModal";
import StoryBar from "../components/story/StoryBar";
import StoryViewerModal from "../components/story/StoryViewerModal";
import { useAuth } from "../hooks/useAuth";
import { followService } from "../services/followService";
import { postService } from "../services/postService";
import { storyService } from "../services/storyService";
import { userService } from "../services/userService";
import {
  buildSnapshotItems,
  countFeedPosts,
  countSuggestions,
  countUniqueAuthors,
  createOptimisticPost,
  getApiErrorMessage,
  getAvatarForUser,
  getDisplayName,
  getFeedHeading,
  getPostEmptyStateMessage,
  getStoryEmptyStateMessage,
  getSuggestionEmptyStateMessage,
  getSuggestionSubtitle
} from "../utils/helpers";

const initialState = {
  error: "",
  feedMeta: null,
  posts: [],
  status: "loading",
  stories: [],
  suggestions: []
};

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [pendingFollowIds, setPendingFollowIds] = useState([]);

  useEffect(() => {
    loadHome();
  }, []);

  useEffect(() => {
    if (location.state?.openCreatePostToken) {
      setIsCreatePostOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function loadHome() {
    setState((currentState) => ({
      ...currentState,
      error: "",
      status: currentState.posts.length > 0 ? "refreshing" : "loading"
    }));

    try {
      const [feed, stories, suggestions] = await Promise.all([
        postService.getFeed({ limit: 10 }),
        storyService.getFeed(),
        userService.getSuggestions()
      ]);

      setState({
        error: "",
        feedMeta: feed.meta || null,
        posts: (feed.items || []).map(createOptimisticPost),
        status: "ready",
        stories: stories || [],
        suggestions: suggestions || []
      });
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to load your home feed."),
        status: "error"
      }));
    }
  }

  function handlePostCreated(post) {
    setState((currentState) => ({
      ...currentState,
      feedMeta: currentState.feedMeta
        ? {
            ...currentState.feedMeta,
            total: (currentState.feedMeta.total || 0) + 1
          }
        : currentState.feedMeta,
      posts: [createOptimisticPost(post), ...currentState.posts]
    }));
  }

  function handlePostRemoved(postId) {
    setState((currentState) => ({
      ...currentState,
      feedMeta: currentState.feedMeta
        ? {
            ...currentState.feedMeta,
            total: Math.max((currentState.feedMeta.total || 1) - 1, 0)
          }
        : currentState.feedMeta,
      posts: currentState.posts.filter((post) => post.id !== postId)
    }));
  }

  function handleStoryCreated(story) {
    setState((currentState) => {
      const authorId = story.author?.id;
      const existingGroup = currentState.stories.find((group) => group.author?.id === authorId);

      if (existingGroup) {
        return {
          ...currentState,
          stories: currentState.stories.map((group) =>
            group.author?.id === authorId
              ? {
                  ...group,
                  items: [story, ...group.items]
                }
              : group
          )
        };
      }

      return {
        ...currentState,
        stories: [
          {
            author: story.author,
            items: [story]
          },
          ...currentState.stories
        ]
      };
    });
  }

  async function handleDeleteStory(storyId, authorId) {
    await storyService.remove(storyId);

    setState((currentState) => ({
      ...currentState,
      stories: currentState.stories
        .map((group) =>
          group.author?.id === authorId
            ? {
                ...group,
                items: group.items.filter((story) => story.id !== storyId)
              }
            : group
        )
        .filter((group) => group.items.length > 0)
    }));

    setActiveStoryGroup((currentGroup) => {
      if (!currentGroup || currentGroup.author?.id !== authorId) {
        return currentGroup;
      }

      const nextItems = currentGroup.items.filter((story) => story.id !== storyId);
      return nextItems.length > 0
        ? {
            ...currentGroup,
            items: nextItems
          }
        : null;
    });
  }

  async function handleFollow(userId) {
    setPendingFollowIds((currentIds) => [...currentIds, userId]);
    setState((currentState) => ({ ...currentState, error: "" }));

    try {
      await followService.toggle(userId);
      setState((currentState) => ({
        ...currentState,
        suggestions: currentState.suggestions.filter((suggestion) => suggestion.id !== userId)
      }));
    } catch (caughtError) {
      setState((currentState) => ({
        ...currentState,
        error: getApiErrorMessage(caughtError, "Unable to follow this creator right now.")
      }));
    } finally {
      setPendingFollowIds((currentIds) => currentIds.filter((id) => id !== userId));
    }
  }

  const snapshotItems = buildSnapshotItems({
    postsCount: countFeedPosts(state.posts),
    storiesCount: countUniqueAuthors(state.stories),
    suggestionsCount: countSuggestions(state.suggestions)
  });

  if (state.status === "loading") {
    return <Loader label="Loading your home feed..." />;
  }

  return (
    <>
      <div className="home-layout">
        <section className="feed-column">
          <StoryBar
            currentUser={user}
            onCreateStory={() => setIsCreateStoryOpen(true)}
            onSelectStory={setActiveStoryGroup}
            stories={state.stories}
          />

          <section className="sidebar-card composer-launcher">
            <div>
              <p className="eyebrow">Live feed</p>
              <h2>{getFeedHeading(user)}</h2>
              <p>
                Share a new post, add a story, and keep your network moving with real data from the
                backend.
              </p>
            </div>
            <div className="composer-launcher__actions">
              <Button icon="add_photo_alternate" onClick={() => setIsCreatePostOpen(true)}>
                Create post
              </Button>
              <Button icon="auto_stories" onClick={() => setIsCreateStoryOpen(true)} variant="ghost">
                Add story
              </Button>
            </div>
          </section>

          {state.error ? (
            <section className="sidebar-card home-banner home-banner--error">
              <div>
                <p className="eyebrow">Sync issue</p>
                <h3>Feed data needs another try</h3>
                <p>{state.error}</p>
              </div>
              <Button onClick={loadHome} size="sm" variant="ghost">
                Retry
              </Button>
            </section>
          ) : null}

          <div className="feed-stack">
            {state.posts.length > 0 ? (
              state.posts.map((post) => (
                <PostCard key={post.id} onRemove={handlePostRemoved} post={post} />
              ))
            ) : (
              <section className="sidebar-card empty-state">
                <span className="material-symbols-outlined">dynamic_feed</span>
                <h3>Your feed is ready for its first post</h3>
                <p>{getPostEmptyStateMessage()}</p>
                <Button onClick={() => setIsCreatePostOpen(true)} size="sm">
                  Publish now
                </Button>
              </section>
            )}
          </div>
        </section>

        <aside className="info-column">
          <section className="sidebar-card">
            <div className="section-heading">
              <h3>Feed Snapshot</h3>
              <span className="status-pill">{state.status === "refreshing" ? "Syncing" : "Live data"}</span>
            </div>
            <div className="stack-list">
              {snapshotItems.map((item) => (
                <div className="activity-row" key={item.id}>
                  <div className="activity-row__icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <p>{item.label}</p>
                    <span>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {state.suggestions.length > 0 ? (
            <OnlineUsers
              title="Suggested Creators"
              users={state.suggestions.map((suggestion) => ({
                avatar: getAvatarForUser(suggestion, getDisplayName(suggestion)),
                id: suggestion.id,
                name: getDisplayName(suggestion),
                status: getSuggestionSubtitle(suggestion)
              }))}
            />
          ) : null}

          <section className="sidebar-card">
            <div className="section-heading">
              <h3>Suggestions</h3>
              <button className="link-button" onClick={loadHome} type="button">
                Refresh
              </button>
            </div>

            {state.suggestions.length > 0 ? (
              <div className="stack-list">
                {state.suggestions.map((suggestion) => (
                  <div className="suggestion-row" key={suggestion.id}>
                    <Link className="suggestion-row__identity suggestion-row__identity--link" to={`/profile/${suggestion.username || suggestion.id}`}>
                      <img
                        alt={getDisplayName(suggestion)}
                        src={getAvatarForUser(suggestion, getDisplayName(suggestion))}
                      />
                      <div>
                        <strong>{getDisplayName(suggestion)}</strong>
                        <span>{getSuggestionSubtitle(suggestion)}</span>
                      </div>
                    </Link>
                    <button
                      className="mini-action"
                      disabled={pendingFollowIds.includes(suggestion.id)}
                      onClick={() => handleFollow(suggestion.id)}
                      type="button"
                    >
                      {pendingFollowIds.includes(suggestion.id) ? "Following..." : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sidebar-note">{getSuggestionEmptyStateMessage()}</p>
            )}
          </section>

          {state.stories.length === 0 ? (
            <section className="sidebar-card">
              <div className="section-heading">
                <h3>Stories</h3>
              </div>
              <p className="sidebar-note">{getStoryEmptyStateMessage()}</p>
            </section>
          ) : null}
        </aside>
      </div>

      <CreatePostModal
        onClose={() => setIsCreatePostOpen(false)}
        onCreated={handlePostCreated}
        open={isCreatePostOpen}
      />

      <CreateStoryModal
        onClose={() => setIsCreateStoryOpen(false)}
        onCreated={handleStoryCreated}
        open={isCreateStoryOpen}
      />

      <StoryViewerModal
        group={activeStoryGroup}
        onClose={() => setActiveStoryGroup(null)}
        onDeleteStory={handleDeleteStory}
        open={Boolean(activeStoryGroup)}
      />
    </>
  );
}
