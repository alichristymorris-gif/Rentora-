export type UserRole = 'owner' | 'renter' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  emailVerified: boolean;
  rating?: number;
  reviewsCount?: number;
  trustScore?: number;
  isVerified?: boolean;
  isBanned?: boolean;
  online?: boolean;
  lastSeen?: number;
  phoneVerified?: boolean;
  phone?: string;
  blockedUsers?: string[];
  analytics?: {
    totalViews: number;
    totalClicks: number;
  };
}

export interface RentalRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  ownerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: number;
}

export interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  period: string;
  city: string;
  country: string;
  flag: string;
  ownerName: string;
  ownerContact: string;
  ownerId: string;
  description: string;
  tags: string[];
  isNew?: boolean;
  isHot?: boolean;
  createdAt: number;
  status: 'available' | 'rented' | 'pending' | 'banned';
  images: string[];
  views?: number;
  clicks?: number;
  savedCount?: number;
  latitude?: number;
  longitude?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
  read: boolean;
  type?: 'text' | 'voice' | 'image' | 'file';
  fileUrl?: string;
  duration?: number;
  edited?: boolean;
}

export interface ChatSession {
  id: string;
  participants: string[]; // [uid1, uid2]
  participantData: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
    }
  };
  lastMessage?: string;
  lastMessageAt: number;
  unreadCount?: {
    [uid: string]: number;
  };
  typing?: {
    [uid: string]: boolean;
  };
  blocked?: string[];
  pinnedBy?: string[];
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'reconnecting';
  type: 'audio' | 'video';
  offer?: any;
  answer?: any;
  createdAt: number;
}


export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'rental_update' | 'system';
  link?: string;
  read: boolean;
  createdAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
