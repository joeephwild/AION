export type Creator = {
  id: string; // Wallet address
  name?: string;
  bio?: string;
  avatarUrl?: string;
  tokens: Token[];
  calendarIntegrations: {
    google?: boolean;
    outlook?: boolean;
  };
};

export type Token = {
  id: string; // Contract address
  name: string;
  symbol: string;
  creatorId: string; // Wallet address of creator
  totalSupply: bigint;
  // Potentially add price, duration per token, etc.
};

export type Booking = {
  id: string;
  creatorId: string;
  clientId: string; // Wallet address of booker
  tokenId: string; // Token used for booking
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
