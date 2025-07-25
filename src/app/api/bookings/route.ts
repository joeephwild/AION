
// /src/app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import type { Booking } from '@/types';

// GET /api/bookings?creatorId=... or ?clientId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');
  const clientId = searchParams.get('clientId');

  if (!creatorId && !clientId) {
    return NextResponse.json({ success: false, message: 'creatorId or clientId is required' }, { status: 400 });
  }

  try {
    const bookingsRef = collection(db, 'bookings');
    let q: any;

    if (creatorId) {
      q = query(bookingsRef, where('creatorId', '==', creatorId));
    } else { // clientId must be present due to the check above
      q = query(bookingsRef, where('clientId', '==', clientId));
    }

    const querySnapshot = await getDocs(q);

    const fetchedBookings: Booking[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedBookings.push({
        id: docSnap.id,
        creatorId: data.creatorId,
        clientId: data.clientId,
        coinId: data.coinId,
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
        status: data.status,
      });
    });

    // Sort by startTime, most recent first (or ascending as preferred)
    fetchedBookings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return NextResponse.json({ success: true, bookings: fetchedBookings });
  } catch (error) {
    console.error('Failed to fetch bookings from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch bookings', error: errorMessage }, { status: 500 });
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
    const { creatorId, coinId, startTime, endTime } = body;

    if (!creatorId || !coinId || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'Missing required booking fields' }, { status: 400 });
    }

    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid date format for startTime or endTime' }, { status: 400 });
    }

    const newBookingData = {
      creatorId,
      clientId,
      coinId,
      startTime: Timestamp.fromDate(startTimeDate),
      endTime: Timestamp.fromDate(endTimeDate),
      status: 'confirmed' as Booking['status'],
      createdAt: serverTimestamp(),
    };

    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, newBookingData);

    const createdBooking: Booking = {
        id: docRef.id,
        creatorId: newBookingData.creatorId,
        clientId: newBookingData.clientId,
        coinId: newBookingData.coinId,
        startTime: startTimeDate,
        endTime: endTimeDate,
        status: newBookingData.status,
    };

    return NextResponse.json({ success: true, booking: createdBooking }, { status: 201 });
  } catch (error) {
    console.error('Failed to create booking in Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to create booking', error: errorMessage }, { status: 500 });
  }
}
