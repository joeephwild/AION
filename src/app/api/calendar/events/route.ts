
// /src/app/api/calendar/events/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { CalendarEvent } from '@/types';

const dbPath = path.join(process.cwd(), 'data', 'mock-db.json');

type UserData = {
  availabilitySettings?: any; 
  calendarConnections?: {
    google?: boolean;
    outlook?: boolean;
  };
};

type DbData = {
  users: Record<string, UserData>;
  bookings: any[];
};

async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { users: {}, bookings: [] };
  }
}

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
    const db = await readDb();
    const user = db.users[creatorId];
    let events: CalendarEvent[] = [];

    if (user && user.calendarConnections) {
      if (user.calendarConnections.google) {
        // In a real app, call Google Calendar API here
        events = events.concat(getMockCalendarEvents('Google'));
      }
      if (user.calendarConnections.outlook) {
        // In a real app, call Outlook Calendar API here
        events = events.concat(getMockCalendarEvents('Outlook'));
      }
    }
    // Sort events by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
