// /src/app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CalendarEvent } from '@/types';

// This function now only serves mock data for non-Google calendars.
// Google Calendar data is now fetched entirely on the client-side.
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

// GET /api/calendar/events - This is now only for MOCK data
export async function GET(request: NextRequest) {
  try {
    // In a real app, you might check which non-Google calendars are connected
    // For this prototype, we'll just return the mock Outlook events.
    const events: CalendarEvent[] = getMockOutlookEvents();
    
    // Sort all combined events by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch calendar events', error: errorMessage }, { status: 500 });
  }
}
