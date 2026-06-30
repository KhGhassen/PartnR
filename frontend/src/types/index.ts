export interface UserInfo {
  id: string;
  firstName: string;
  email: string;
  avatarUrl: string | null;
  city: string;
  role: string;
  emailConfirmed: boolean;
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
  profileType: string | null;
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
  photoUrl: string | null;
  createdAt: string;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  url: string;
  uploaderId: string;
  uploaderName: string;
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
  photos: EventPhoto[];
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

export interface RatingDto {
  id: string;
  raterId: string;
  raterName: string;
  ratedUserId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  email: string;
  city: string;
  role: string;
  isBanned: boolean;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  city: string;
  date: string;
  maxParticipants: number;
  status: string;
  activityName: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ActionByDay {
  date: string;
  count: number;
}

export interface ActionByType {
  action: string;
  count: number;
}

export interface TopEvent {
  id: string;
  title: string;
  city: string;
  participantCount: number;
}

export interface AnalyticsDashboard {
  totalUsers: number;
  totalEvents: number;
  totalActions: number;
  todayActions: number;
  newUsersLast7Days: number;
  actionsByDay: ActionByDay[];
  actionsByType: ActionByType[];
  topEvents: TopEvent[];
}
