// /src/app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CalendarEvent } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getGoogleCalendarEvents } from '@/lib/google-calendar-server';


// This function now serves mock data for non-Google calendars.
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


// GET /api/calendar/events?creatorId=... (for public booking page) OR uses x-user-id header (for creator dashboard)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId') || request.headers.get('x-user-id');
  
  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'Creator ID is required either via creatorId query param or x-user-id header.' }, { status: 400 });
  }

  try {
    let allEvents: CalendarEvent[] = [];

    // Fetch Google Calendar events if creator has connected their account
    const userDocRef = doc(db, 'users', creatorId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.googleTokens) {
        try {
          const googleEvents = await getGoogleCalendarEvents(userData.googleTokens, creatorId);
          allEvents = allEvents.concat(googleEvents);
        } catch (googleError) {
           console.error(`Failed to fetch Google Calendar events for ${creatorId}:`, googleError);
           // Don't fail the whole request, just log the error and continue.
           // You could optionally add a specific message to the response.
        }
      }
    }
    
    // Fetch mock Outlook events
    const outlookEvents = getMockOutlookEvents();
    allEvents = allEvents.concat(outlookEvents);
    
    // Sort all combined events by start time
    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({ success: true, events: allEvents });

  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch calendar events', error: errorMessage }, { status: 500 });
  }
}
