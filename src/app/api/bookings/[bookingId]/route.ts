
// /src/app/api/bookings/[bookingId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Booking } from '@/types';

// PUT /api/bookings/[bookingId] - To update booking status
export async function PUT(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const authenticatedUserId = request.headers.get('x-user-id');
  const bookingId = params.bookingId;

  if (!authenticatedUserId) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  if (!bookingId) {
    return NextResponse.json({ success: false, message: 'Booking ID is required' }, { status: 400 });
  }
  
  const { status } = await request.json();

  if (status !== 'cancelled') {
      return NextResponse.json({ success: false, message: 'Only cancellation is supported at this time.' }, { status: 400 });
  }

  try {
    const bookingDocRef = doc(db, 'bookings', bookingId);
    const bookingDocSnap = await getDoc(bookingDocRef);

    if (!bookingDocSnap.exists()) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingDocSnap.data();

    // Check if the authenticated user is either the creator or the client
    if (authenticatedUserId !== bookingData.creatorId && authenticatedUserId !== bookingData.clientId) {
      return NextResponse.json({ success: false, message: 'Forbidden: You are not authorized to modify this booking.' }, { status: 403 });
    }

    // Update the status to 'cancelled'
    await updateDoc(bookingDocRef, { status: 'cancelled' });

    const updatedDoc = await getDoc(bookingDocRef);
    const updatedBookingData = updatedDoc.data();
    
    // Ensure timestamps are converted to Dates for the response
    const responseBooking = {
        ...updatedBookingData,
        id: updatedDoc.id,
        startTime: (updatedBookingData.startTime as Timestamp).toDate(),
        endTime: (updatedBookingData.endTime as Timestamp).toDate(),
        createdAt: updatedBookingData.createdAt ? (updatedBookingData.createdAt as Timestamp).toDate() : null,
    };

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully.', booking: responseBooking });

  } catch (error) {
    console.error('Failed to update booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to update booking', error: errorMessage }, { status: 500 });
  }
}
