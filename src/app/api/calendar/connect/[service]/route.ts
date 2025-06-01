
// /src/app/api/calendar/connect/[service]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type CalendarConnections = {
  google?: boolean;
  outlook?: boolean;
};

// GET /api/calendar/connect/status
// Note: The [service] param is not used here, this endpoint is for overall status
export async function GET(
  request: NextRequest
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    let connections: CalendarConnections = { google: false, outlook: false }; // Default

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.calendarConnections) {
        connections = userData.calendarConnections;
      }
    }
    
    return NextResponse.json({
      success: true,
      connections,
    });

  } catch (error) {
    console.error('Failed to fetch calendar connection status from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch connection status', error: errorMessage }, { status: 500 });
  }
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
    const { connect } = await request.json(); // Expecting 'connect: true/false'
    
    if (typeof connect !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid payload: connect must be a boolean.' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);

    // Prepare the update object using dot notation for nested fields
    const updateData: Record<string, any> = {};
    updateData[`calendarConnections.${service}`] = connect;

    // Use setDoc with merge: true to ensure the document and calendarConnections field are created if they don't exist
    // Then updateDoc can be used if you are sure calendarConnections object exists.
    // For simplicity and robustness against missing fields/docs, setDoc with merge is often easier.
    await setDoc(userDocRef, { calendarConnections: { [service]: connect } }, { merge: true });
    
    return NextResponse.json({
      success: true,
      message: `Connection to ${service} ${connect ? 'established' : 'disconnected'}. Status updated in Firestore.`,
      service: service,
      connected: connect,
    });

  } catch (error) {
    console.error(`Failed to update ${service} connection status in Firestore:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to update connection status', error: errorMessage }, { status: 500 });
  }
}
