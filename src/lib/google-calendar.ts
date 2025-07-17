// src/lib/google-calendar.ts
import ApiCalendar from 'react-google-calendar-api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

const config = {
  clientId: GOOGLE_CLIENT_ID,
  apiKey: GOOGLE_API_KEY,
  scope: "https://www.googleapis.com/auth/calendar.readonly", // Only request read-only access
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],
};

const apiCalendar = new ApiCalendar(config);

export default apiCalendar;
