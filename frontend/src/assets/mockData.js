const avatars = {
  sarah: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  alex: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  elena: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
  marcus: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  jasmine: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  anna: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  daniel: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
  maria: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
};

export const dashboardLinks = ["Dashboard", "Analytics", "Settings"];

export const stories = [
  { id: "story-own", name: "Your Story", avatar: avatars.elena, own: true },
  { id: "story-sarah", name: "Sarah.K", avatar: avatars.sarah, accent: true },
  { id: "story-alex", name: "Alex_v", avatar: avatars.alex },
  { id: "story-elena", name: "Elena_D", avatar: avatars.elena, accent: true },
  { id: "story-marcus", name: "Marcus", avatar: avatars.marcus, accent: true }
];

export const feedPosts = [
  {
    id: "post-spectrum",
    author: {
      name: "Elena Designer",
      handle: "@elena.curates",
      avatar: avatars.elena,
      location: "Paris, FR"
    },
    timestamp: "2 hours ago",
    likes: 1248,
    comments: 48,
    caption:
      "Exploring the depth of abstract forms today. What do you think about these colors?",
    commentPreview: {
      author: "Alex_v",
      text: "The flow is incredible. Truly inspiring work as always."
    },
    cover: {
      type: "gradient",
      value:
        "linear-gradient(135deg, #1f2558 0%, #374ea2 18%, #ff7f41 34%, #f5d364 52%, #28a389 74%, #4f46e5 100%)"
    }
  },
  {
    id: "post-valley",
    author: {
      name: "Alex Van",
      handle: "@alex.gallery",
      avatar: avatars.alex,
      location: "Berlin, DE"
    },
    timestamp: "5 hours ago",
    likes: 840,
    comments: 12,
    caption: "The morning stillness here is unmatched. #nature #serenity",
    cover: {
      type: "image",
      value:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
    }
  }
];

export const latestActivity = [
  {
    id: "activity-1",
    avatar: avatars.sarah,
    text: "Sarah liked your photo.",
    time: "10m ago"
  },
  {
    id: "activity-2",
    icon: "person_add",
    text: "Julian followed you.",
    time: "45m ago"
  },
  {
    id: "activity-3",
    icon: "chat_bubble",
    text: "Morgana replied in chat.",
    time: "1h ago"
  }
];

export const onlineFriends = [
  { id: "friend-anna", name: "Anna Bell", avatar: avatars.anna, status: "Active now" },
  { id: "friend-daniel", name: "Daniel Kim", avatar: avatars.daniel, status: "Active now" },
  { id: "friend-jasmine", name: "Jasmine T.", avatar: avatars.jasmine, status: "Active now" }
];

export const suggestedUsers = [
  {
    id: "suggested-maria",
    name: "Maria_Art",
    subtitle: "Followed by Elena",
    avatar: avatars.maria
  },
  {
    id: "suggested-sarah",
    name: "Sarah.K",
    subtitle: "Follows brutalist design",
    avatar: avatars.sarah
  }
];

export const profileSummary = {
  name: "Alex Rivera",
  title: "Visual Architect & Digital Curator",
  bio:
    "Exploring the intersection of brutalist architecture and minimalist digital spaces. Currently based in Lisbon.",
  website: "alexrivera.curator.io",
  avatar: avatars.alex,
  stats: {
    posts: 142,
    followers: 12800,
    following: 843
  }
};

export const profileGallery = [
  {
    id: "gallery-1",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "gallery-2",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "gallery-3",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "gallery-4",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "gallery-5",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "gallery-6",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80&sat=-50"
  }
];

export const exploreCards = [
  {
    id: "explore-1",
    title: "Minimal Interiors",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "explore-2",
    title: "Public Spaces",
    image:
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "explore-3",
    title: "Moodboards",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "explore-4",
    title: "Typography",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
  }
];

export const reels = [
  {
    id: "reel-1",
    title: "Studio Process",
    subtitle: "Shot in Lisbon",
    poster:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "reel-2",
    title: "Gallery Reveal",
    subtitle: "Launch teaser",
    poster:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  }
];

export const adminMetrics = [
  { id: "metric-users", label: "Active users", value: "12.8k" },
  { id: "metric-posts", label: "Published posts", value: "4.2k" },
  { id: "metric-chat", label: "Live conversations", value: "318" },
  { id: "metric-reports", label: "Pending reports", value: "7" }
];

export const conversations = [
  {
    id: "conversation-sarah",
    name: "Sarah Jenkins",
    avatar: avatars.sarah,
    preview: "The exhibition layout looks perfect. Let's keep the asymmetry.",
    time: "Just now",
    online: true,
    active: true
  },
  {
    id: "conversation-alex",
    name: "Alex Rivera",
    avatar: avatars.alex,
    preview: "Did you see the new digital sculpture?",
    time: "2h ago",
    online: false
  },
  {
    id: "conversation-morgana",
    name: "Morgana LeFay",
    avatar: avatars.maria,
    preview: "I'll send over the high-res files by tonight.",
    time: "5h ago",
    online: true
  }
];

export const messageThreads = {
  "conversation-sarah": [
    {
      id: "message-1",
      from: "them",
      avatar: avatars.sarah,
      text:
        "Hey! I just finished the draft for the gallery's front-end integration. What do you think about the asymmetrical layout?",
      time: "10:14 AM"
    },
    {
      id: "message-2",
      from: "me",
      text:
        "It looks amazing. The editorial feel really sets it apart from typical dashboards.",
      time: "10:16 AM • Read"
    },
    {
      id: "message-3",
      from: "them",
      avatar: avatars.sarah,
      text: "Great! Here is a sneak peek of the mobile view too.",
      attachment:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80",
      time: "10:18 AM"
    }
  ]
};
