
import ApiCalendar from 'react-google-calendar-api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

let apiCalendarInstance: ApiCalendar | null = null;

if (typeof window !== 'undefined') { // Ensure this runs only on the client-side
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    console.warn(
      'Google Client ID or API Key is missing in .env.local. Google Calendar integration will be disabled. Using mock.'
    );
    // Provide a mock/stub if not configured
    apiCalendarInstance = {
      handleAuthClick: () => { console.error("Google Calendar not configured (mock)."); return Promise.reject("Not configured"); },
      handleSignoutClick: () => { console.error("Google Calendar not configured (mock)."); },
      listUpcomingEvents: (maxResults: number) => {
        console.error("Google Calendar not configured (mock). Returning empty events list.");
        return Promise.resolve({ result: { items: [] } });
      },
      onLoad: (callback: () => void) => {
        console.log("Google Calendar mock: onLoad called.");
        if (typeof callback === 'function') setTimeout(callback, 0);
      },
      sign: false,
      // Add any other methods that might be called from your code with appropriate mocks
      // For example, if you were to use createEvent:
      // createEvent: (event: object, calendarId?: string) => {
      //   console.error("Google Calendar not configured (mock). Cannot create event.");
      //   return Promise.reject("Cannot create event - mock instance");
      // }
    } as unknown as ApiCalendar; // Use unknown to bypass strict type checking for the mock
  } else {
    // Instantiate the real ApiCalendar only if credentials are provided
    const config = {
      clientId: GOOGLE_CLIENT_ID,
      apiKey: GOOGLE_API_KEY,
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
      ],
    };
    try {
      apiCalendarInstance = new ApiCalendar(config);
      console.log("Real ApiCalendar instance created.");
    } catch (e) {
      console.error("Error instantiating real ApiCalendar:", e);
      // Fallback to mock if instantiation fails
      apiCalendarInstance = {
        handleAuthClick: () => Promise.reject("Real ApiCalendar instantiation failed"),
        handleSignoutClick: () => {},
        listUpcomingEvents: (maxResults: number) => Promise.resolve({ result: { items: [] } }),
        onLoad: (callback: () => void) => { if (typeof callback === 'function') setTimeout(callback, 0); },
        sign: false,
      } as unknown as ApiCalendar;
    }
  }
} else {
    // Provide a server-side mock if imported on server
    console.log("Google Calendar: Server-side context, using server mock.");
    apiCalendarInstance = {
      handleAuthClick: () => Promise.reject("Cannot use on server"),
      handleSignoutClick: () => {},
      listUpcomingEvents: (maxResults: number) => {
        console.log("Google Calendar server mock: listUpcomingEvents called.");
        return Promise.resolve({ result: { items: [] } });
      },
      onLoad: (callback: () => void) => {
        console.log("Google Calendar server mock: onLoad called.");
      },
      sign: false,
    } as unknown as ApiCalendar;
}

export const apiCalendar = apiCalendarInstance;
