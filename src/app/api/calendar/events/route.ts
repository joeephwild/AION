
// /src/app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import type { CalendarEvent } from '@/types';

// Mock function to generate events if a calendar is connected
function getMockCalendarEvents(serviceName: string): CalendarEvent[] {
  const today = new Date();
  return [
    {
      title: `Meeting via ${serviceName}`,
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
    },
    {
      title: `Dentist Appointment (${serviceName})`,
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 14, 30),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 15, 30),
    },
    {
      title: `Project Sync (${serviceName})`,
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 45),
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
      if (userData && userData.calendarConnections) {
        if (userData.calendarConnections.google) {
          // In a real app, call Google Calendar API here using stored tokens
          // For now, we keep the mock generation logic
          // This part will be replaced when actual Google API calls are made server-side
          // console.log("Mocking Google events as it's connected in Firestore for user:", creatorId);
          // events = events.concat(getMockCalendarEvents('Google'));
          // Client-side fetch for google events is handled in AvailabilityPage for now.
          // This endpoint primarily serves mock outlook events or could serve merged server-side events in future.
        }
        if (userData.calendarConnections.outlook) {
          // In a real app, call Outlook Calendar API here
          events = events.concat(getMockCalendarEvents('Outlook (Mocked via Firestore status)'));
        }
      }
    }
    // Sort events by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Failed to fetch calendar events status from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch calendar events', error: errorMessage }, { status: 500 });
  }
}
