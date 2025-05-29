
// /src/app/api/calendar/connect/[service]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'mock-db.json');

type UserData = {
  availabilitySettings?: any; // Replace with actual type if defined
  calendarConnections?: {
    google?: boolean;
    outlook?: boolean;
  };
  // other user properties
};

type DbData = {
  users: Record<string, UserData>;
  bookings: any[]; // Replace with actual type if defined
};


async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    // Ensure users object exists
    if (!parsedData.users) {
      parsedData.users = {};
    }
    return parsedData;
  } catch (error) {
    return { users: {}, bookings: [] };
  }
}

async function writeDb(data: DbData): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const service = params.service;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }
  if (service !== 'google' && service !== 'outlook') {
    return NextResponse.json({ success: false, message: 'Invalid service provider.' }, { status: 400 });
  }

  try {
    const { connect } = await request.json(); // Expecting a 'connect: true/false' in body
    const db = await readDb();

    if (!db.users[userId]) {
      db.users[userId] = {};
    }
    if (!db.users[userId].calendarConnections) {
      db.users[userId].calendarConnections = { google: false, outlook: false };
    }

    if (service === 'google') {
      db.users[userId].calendarConnections!.google = connect;
    } else if (service === 'outlook') {
      db.users[userId].calendarConnections!.outlook = connect;
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `Mock connection to ${service} ${connect ? 'established' : 'disconnected'}. Status updated.`,
      service: service,
      connected: connect,
    });

  } catch (error) {
    console.error(`Failed to update ${service} connection status:`, error);
    return NextResponse.json({ success: false, message: 'Failed to update connection status' }, { status: 500 });
  }
}

// GET method to fetch current connection status
export async function GET(
  request: NextRequest
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }

  try {
    const db = await readDb();
    const user = db.users[userId];
    const connections = user?.calendarConnections || { google: false, outlook: false };
    
    return NextResponse.json({
      success: true,
      connections,
    });

  } catch (error) {
    console.error('Failed to fetch calendar connection status:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch connection status' }, { status: 500 });
  }
}
