
// /src/lib/google-calendar-server.ts
import { google } from 'googleapis';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { CalendarEvent, GoogleApiTokens } from '@/types';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn("Google Calendar server-side integration is not fully configured. Missing environment variables.");
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Function to refresh the access token if it's expired
async function refreshAccessToken(userId: string, tokens: GoogleApiTokens): Promise<GoogleApiTokens> {
  if (tokens.expiry_date && tokens.expiry_date > Date.now()) {
    return tokens; // Token is still valid
  }

  if (!tokens.refresh_token) {
    throw new Error('Missing refresh token.');
  }
  
  oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newTokens: GoogleApiTokens = {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || tokens.refresh_token, // Keep old refresh token if new one isn't provided
      scope: credentials.scope!,
      token_type: credentials.token_type as 'Bearer',
      expiry_date: credentials.expiry_date!,
    };
    
    // Save the new tokens to Firestore for future use
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { googleTokens: newTokens }, { merge: true });

    return newTokens;
  } catch (error) {
    console.error('Failed to refresh Google access token:', error);
    // Optionally, clear the invalid tokens from Firestore
    // const userDocRef = doc(db, 'users', userId);
    // await setDoc(userDocRef, { googleTokens: null }, { merge: true });
    throw new Error('Could not refresh access token. Please reconnect your Google account.');
  }
}

// Function to get events from Google Calendar
export async function getGoogleCalendarEvents(storedTokens: GoogleApiTokens, userId: string): Promise<CalendarEvent[]> {
  try {
    const validTokens = await refreshAccessToken(userId, storedTokens);
    oauth2Client.setCredentials(validTokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      return [];
    }
    
    return events
        .filter(event => event.status !== 'cancelled') // Filter out cancelled events
        .map((event: any) => ({
            title: event.summary || 'Busy (Google Calendar)',
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            isAllDay: !!event.start.date,
        }));
        
  } catch (error) {
    console.error(`Error fetching Google Calendar events for user ${userId}:`, error);
    // Re-throw a more user-friendly error or handle as needed
    throw new Error('Failed to retrieve calendar events from Google.');
  }
}
