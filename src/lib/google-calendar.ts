import ApiCalendar from 'react-google-calendar-api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

let apiCalendarInstance: ApiCalendar | null = null;

if (typeof window !== 'undefined') { // Ensure this runs only on the client-side
  let useMock = false;
  let mockReason = "";

  if (!GOOGLE_CLIENT_ID) {
    useMock = true;
    mockReason = "Google Client ID is missing.";
  }
  if (!GOOGLE_API_KEY) {
    useMock = true;
    mockReason = mockReason ? `${mockReason} Google API Key is missing.` : "Google API Key is missing.";
  } else if (GOOGLE_API_KEY.startsWith('GOCSPX-')) {
    // Force mock and issue a strong warning if API Key looks like a Client Secret
    useMock = true; 
    console.warn(
      "CRITICAL WARNING: Your NEXT_PUBLIC_GOOGLE_API_KEY appears to be a Google Client Secret (it starts with 'GOCSPX-'). " +
      "This is a severe security risk if exposed client-side and is NOT the correct type of key for the 'apiKey' field. " +
      "Please replace it with a proper Google API Key (usually starting with 'AIza...') from the Google Cloud Console. " +
      "Forcing mock Google Calendar integration to prevent errors and mitigate security risks."
    );
    // mockReason can be augmented if other reasons also exist, but the GOCSPX- is overriding.
    mockReason = "Potentially incorrect Google API Key (Client Secret detected).";
  }

  if (useMock) {
    console.warn(
      `${mockReason} Google Calendar integration will be disabled. Using mock.`
    );
    apiCalendarInstance = {
      handleAuthClick: () => { console.error("Google Calendar not configured or mock active."); return Promise.reject("Not configured or mock active"); },
      handleSignoutClick: () => { console.error("Google Calendar not configured or mock active."); },
      listUpcomingEvents: (maxResults: number) => {
        console.log("Google Calendar mock: listUpcomingEvents called. Returning empty events list.");
        return Promise.resolve({ result: { items: [] } });
      },
      onLoad: (callback: () => void) => {
        console.log("Google Calendar mock: onLoad called.");
        if (typeof callback === 'function') setTimeout(callback, 0);
      },
      sign: false,
    } as unknown as ApiCalendar;
  } else {
    // Both GOOGLE_CLIENT_ID and a non-GOCSPX GOOGLE_API_KEY are present
    const config = {
      clientId: GOOGLE_CLIENT_ID!, // Assert non-null as checks passed
      apiKey: GOOGLE_API_KEY!,   // Assert non-null
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
      ],
    };
    try {
      apiCalendarInstance = new ApiCalendar(config);
      console.log("Real ApiCalendar instance created.");
    } catch (e) {
      console.error("Error instantiating real ApiCalendar with provided credentials:", e);
      console.warn("Falling back to mock Google Calendar due to instantiation error.");
      // Fallback to mock if instantiation fails even with seemingly correct keys
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
