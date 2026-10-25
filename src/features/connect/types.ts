/** Ujyalo Connect — shapes shared by the pages and the Firestore client. */

export interface ConnectProfile {
  uid: string;
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatarUrl: string | null;
  /** Only present when the person granted the `email` scope. */
  email: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: string[];
  bio: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerUid: string;
  memberCount: number;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  topic: string;
  createdAt: string;
}

export interface ConnectMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
  /** Set locally until the write lands, so the composer can clear instantly. */
  pending?: boolean;
}

export interface ConnectStatus {
  configured: boolean;
  oauth: boolean;
  storage: string;
}
