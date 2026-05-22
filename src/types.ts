export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  badge: string[];
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  category: string; // "coding" | "midjourney" | "gemini" | "chatgpt" | "claude" | "business" | "marketing" | "education"
  coverImage: string; // Image URL, generated preset base64, or CSS styling
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  copiesCount?: number;
  createdAt: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorVerified: boolean;
  isFeatured: boolean;
  sharesCount?: number;
}

export interface Comment {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'save' | 'comment' | 'follow' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string; // route and extra details
}

export interface LeaderboardUser {
  id: string;
  username: string;
  avatar: string;
  points: number;
  promptsCount: number;
  followersCount: number;
  verified: boolean;
}

export interface AppActivity {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  action: string; // e.g., "published a new Midjourney prompt"
  targetId: string;
  targetTitle: string;
  createdAt: string;
}
