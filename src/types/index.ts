

export type CreatorProfileData = {
  name: string; 
  bio?: string;
  avatarUrl?: string;
};

// Represents the data returned by /api/creators/[creatorId]
export type CreatorPublicProfile = CreatorProfileData & {
  id: string; // Wallet address
};

export type Token = {
  id: string; // Zora Coin contract address
  name: string;
  symbol: string;
  creatorId: string; // Wallet address of creator (payoutRecipient)
  uri?: string; // Metadata URI
  totalSupply?: string; // Zora SDK might return as string or BigInt, handle accordingly
  imageUrl?: string; 
  createdAt?: Date; // Added for Firestore timestamp
};

// Type used by BookingPage and DashboardPage. It combines public profile with dynamic token data.
export type Creator = CreatorPublicProfile & {
  tokens: Token[];
};

export type Booking = {
  id: string;
  creatorId: string;
  clientId: string; // Wallet address of booker
  tokenId: string; // Token used for booking (Zora Coin contract address)
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt?: any; // Firestore serverTimestamp
};

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  isAllDay?: boolean;
};

export type WorkingHour = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type AvailabilitySettings = {
  workingHours: WorkingHour[];
  bufferTime: number; // minutes
  minNoticeTime: number; // hours
};

export type GoogleApiTokens = {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: 'Bearer';
  expiry_date: number;
  id_token?: string;
};
