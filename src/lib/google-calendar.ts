
import ApiCalendar from 'react-google-calendar-api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

let apiCalendarInstance: ApiCalendar | null = null;

if (typeof window !== 'undefined') { // Ensure this runs only on the client-side
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    console.warn(
      'Google Client ID or API Key is missing in .env.local. Google Calendar integration will be disabled.'
    );
  }

  const config = {
    clientId: GOOGLE_CLIENT_ID || '',
    apiKey: GOOGLE_API_KEY || '',
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    ],
  };

  if (GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
    apiCalendarInstance = new ApiCalendar(config);
  } else {
    // Provide a mock/stub if not configured, to prevent errors if imported
    apiCalendarInstance = {
      handleAuthClick: () => { console.error("Google Calendar not configured."); return Promise.reject("Not configured"); },
      handleSignoutClick: () => { console.error("Google Calendar not configured."); },
      // @ts-ignore partial mock
      listUpcomingEvents: () => { console.error("Google Calendar not configured."); return Promise.resolve({ result: { items: [] } }); },
      // @ts-ignore partial mock
      onLoad: (callback: () => void) => { if (typeof callback === 'function') setTimeout(callback, 0); }, // Call onload async for mock
      sign: false, // Mock property
    } as ApiCalendar;
  }
} else {
    // Provide a server-side mock if imported on server
    apiCalendarInstance = {
      handleAuthClick: () => Promise.reject("Cannot use on server"),
      handleSignoutClick: () => {},
      listUpcomingEvents: () => Promise.resolve({ result: { items: [] } }),
      onLoad: (callback: () => void) => {},
      sign: false,
    } as any; // Cast to any for simplicity for server-side mock
}


export const apiCalendar = apiCalendarInstance;

