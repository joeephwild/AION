
export type Creator = {
  id: string; // Wallet address
  name?: string;
  bio?: string;
  avatarUrl?: string;
  tokens: Token[]; // Will now be Zora Coins created by the user
  calendarIntegrations: {
    google?: boolean;
    outlook?: boolean;
  };
  availabilitySettings?: AvailabilitySettings; 
};

export type Token = {
  id: string; // Zora Coin contract address
  name: string;
  symbol: string;
  creatorId: string; // Wallet address of creator (payoutRecipient)
  uri?: string; // Metadata URI
  totalSupply?: string; // Zora SDK might return as string or BigInt, handle accordingly
  // Potentially add more fields from Zora's getCoin response like imageUrl, description
  imageUrl?: string; 
};

export type Booking = {
  id: string;
  creatorId: string;
  clientId: string; // Wallet address of booker
  tokenId: string; // Token used for booking (Zora Coin contract address)
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
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
