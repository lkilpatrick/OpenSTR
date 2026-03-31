// ─── Users ───────────────────────────────────────────────────────────────────

export type UserRole = 'guest' | 'cleaner' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Properties ──────────────────────────────────────────────────────────────

export type PropertyType = 'short_term_rental' | 'private_home';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address?: string;
  icalUrl?: string;
  lockEntityId?: string;
  sessionTriggerTime: string;
  minTurnaroundHours: number;
  standardId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  propertyId: string;
  slug: string;
  displayName: string;
  themeName?: string;
  standardRoomType?: string;
  displayOrder: number;
  isLaundryPhase: boolean;
  lastDeepCleanAt?: string;
  archived: boolean;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskType = 'checkbox' | 'photo' | 'quantity';

export interface Task {
  id: string;
  roomId: string;
  description: string;
  type: TaskType;
  displayOrder: number;
  isRequired: boolean;
  standardNotes?: string;
  archived: boolean;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export type SessionStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface CleanSession {
  id: string;
  propertyId: string;
  assignedTo: string;
  reservationId?: string;
  status: SessionStatus;
  startedAt?: string;
  completedAt?: string;
  guestRating?: number;
  guestNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionTaskDetail {
  id: string;
  sessionId: string;
  taskId: string;
  completed: boolean;
  photoUrl?: string;
  quantity?: number;
  completedAt?: string;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  propertyId: string;
  guestName?: string;
  checkIn: string;
  checkOut: string;
  icalUid: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  propertyIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
