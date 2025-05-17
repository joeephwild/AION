
// /src/app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking } from '@/types';

const dbPath = path.join(process.cwd(), 'data', 'mock-db.json');

async function readDb(): Promise<{ users: any; bookings: Booking[] }> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return a default structure
    return { users: {}, bookings: [] };
  }
}

async function writeDb(data: any): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/bookings?creatorId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');
  // const clientId = searchParams.get('clientId'); // If we need to fetch by client

  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'creatorId is required' }, { status: 400 });
  }

  try {
    const db = await readDb();
    const creatorBookings = db.bookings.filter(b => b.creatorId === creatorId);
    return NextResponse.json({ success: true, bookings: creatorBookings });
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  const clientId = request.headers.get('x-user-id'); // Booker's address
  if (!clientId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required (clientId)' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { creatorId, tokenId, startTime, endTime } = body;

    if (!creatorId || !tokenId || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required booking fields' }, { status: 400 });
    }

    const db = await readDb();
    const newBooking: Booking = {
      id: `book_${Date.now().toString()}_${Math.random().toString(36).substring(2, 9)}`,
      creatorId,
      clientId,
      tokenId,
      startTime: new Date(startTime), // Ensure dates are stored as Date objects if read back directly, or handle as strings consistently
      endTime: new Date(endTime),
      status: 'confirmed', // Default to confirmed for mock
    };

    db.bookings.push(newBooking);
    await writeDb(db);

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error('Failed to create booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to create booking', error: errorMessage }, { status: 500 });
  }
}
