export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type AssignmentStatus = 'pending' | 'solved' | 'skipped' | 'carried_over';

export type SolvedVia = 'auto_detected' | 'manual';

export type ReminderTemplate = 'gentle' | 'moderate' | 'aggressive' | 'custom';

export type Platform = 'ios' | 'android' | 'web' | 'macos';

export type NotificationChannelId = 'fcm' | 'email' | 'telegram' | 'discord';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
