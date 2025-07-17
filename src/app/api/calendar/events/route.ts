
// /src/app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { CalendarEvent } from '@/types';
import { getGoogleCalendarEvents } from '@/lib/google-calendar-server';
import type { Credentials } from 'google-auth-library';

// Mock function to generate events for a "connected" Outlook calendar
function getMockOutlookEvents(): CalendarEvent[] {
  const today = new Date();
  return [
    {
      title: 'Project Deadline (Outlook Mock)',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 17, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 17, 30),
    },
    {
      title: 'Team Sync (Outlook Mock)',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 11, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 12, 0),
    },
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'creatorId is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', creatorId);
    const userDocSnap = await getDoc(userDocRef);
    
    let events: CalendarEvent[] = [];

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData) {
        
        // Fetch live Google Calendar events if tokens exist
        if (userData.googleTokens && userData.googleTokens.access_token) {
          try {
            const googleEvents = await getGoogleCalendarEvents(userData.googleTokens as Credentials);
            events = events.concat(googleEvents);
          } catch (e) {
            console.error(`Failed to fetch Google events for user ${creatorId}:`, e);
            // Don't fail the whole request, just skip Google events. 
            // This could happen if tokens are revoked. A production app might clear the tokens here.
          }
        }

        // Fetch mock Outlook events if connected
        if (userData.calendarConnections?.outlook?.connected) {
          events = events.concat(getMockOutlookEvents());
        }
      }
    }
    // Sort all combined events by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Failed to fetch calendar events from Firestore/Google:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch calendar events', error: errorMessage }, { status: 500 });
  }
}
