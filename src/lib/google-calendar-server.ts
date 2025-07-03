
// /src/lib/google-calendar-server.ts
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google Client ID or Secret is not configured. Google Calendar server-side integration will be disabled.");
}

/**
 * Creates an OAuth2 client for Google APIs.
 */
export function getGoogleOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google API credentials are not configured on the server.");
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Fetches calendar events for a user given their stored tokens.
 * Automatically handles token refreshing if necessary.
 * 
 * @param tokens The stored Google API credentials for the user.
 * @returns A promise that resolves to an array of calendar events.
 */
export async function getGoogleCalendarEvents(tokens: Credentials) {
  const auth = getGoogleOAuth2Client();
  auth.setCredentials(tokens);

  // The googleapis library automatically handles token refreshing if a refresh_token is present.
  // We can listen for the 'tokens' event to get the new tokens if they are refreshed.
  // This is useful for updating the stored tokens in Firestore, but for simplicity, we'll omit that for now.
  // auth.on('tokens', (newTokens) => {
  //   if (newTokens.refresh_token) {
  //     // New refresh token received, update it in your database
  //     console.log('A new refresh token was received.');
  //   }
  //   console.log('Access token was refreshed.');
  // });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50, // Fetch up to 50 upcoming events
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      return [];
    }

    // Map to our simplified CalendarEvent type
    return events.map((event) => ({
      title: event.summary || 'No Title (Google)',
      start: new Date(event.start?.dateTime || event.start?.date || Date.now()),
      end: new Date(event.end?.dateTime || event.end?.date || Date.now()),
      isAllDay: !!event.start?.date,
    }));
  } catch (error) {
    console.error('The API returned an error: ' + error);
    // If token is invalid or expired and cannot be refreshed, this will fail.
    // The caller should handle this, possibly by marking the connection as invalid.
    throw new Error('Failed to fetch Google Calendar events.');
  }
}
