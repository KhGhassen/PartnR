export interface UserInfo {
  id: string;
  firstName: string;
  email: string;
  avatarUrl: string | null;
  city: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface Profile {
  id: string;
  firstName: string;
  city: string;
  bio: string | null;
  avatarUrl: string | null;
  favoriteActivities: string[];
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  city: string;
  location: string | null;
  date: string;
  maxParticipants: number;
  status: string;
  activityName: string;
  activityIcon: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  createdAt: string;
}

export interface Participant {
  userId: string;
  firstName: string;
  avatarUrl: string | null;
  status: string;
  joinedAt: string;
}

export interface EventDetail extends EventSummary {
  participants: Participant[];
}

export interface Rating {
  id: string;
  eventId: string;
  raterId: string;
  raterName: string;
  ratedUserId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
}
