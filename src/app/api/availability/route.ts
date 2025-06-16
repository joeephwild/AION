
// /src/app/api/availability/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { AvailabilitySettings } from '@/types';

// GET /api/availability?creatorId=... OR use x-user-id header
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryCreatorId = searchParams.get('creatorId');
  const headerUserId = request.headers.get('x-user-id');

  const userIdToFetch = queryCreatorId || headerUserId;

  if (!userIdToFetch) {
    return NextResponse.json({ success: false, message: 'Creator ID is required either as a query parameter (creatorId) or x-user-id header.' }, { status: 400 });
  }

  try {
    // User ID for Firestore document is the creator's wallet address
    // The availability settings are stored under a sub-collection or a field in the user's main document or a dedicated 'creators' collection.
    // Assuming settings are stored in a 'users' collection with the document ID being the userIdToFetch
    const userDocRef = doc(db, 'users', userIdToFetch);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const settings = userData.availabilitySettings;
      if (settings) {
        return NextResponse.json({ success: true, settings });
      }
    }
    // If no settings found, or user doc doesn't exist, return null or default.
    // Client can then use hardcoded defaults if null.
    return NextResponse.json({ success: true, settings: null, message: 'No availability settings found for user.' });

  } catch (error) {
    console.error('Failed to fetch availability settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch availability settings', error: errorMessage }, { status: 500 });
  }
}

// POST /api/availability (uses x-user-id header for the creator saving their own settings)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id'); // Creator's ID

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required to save settings.' }, { status: 400 });
  }

  try {
    const settingsToSave = await request.json() as AvailabilitySettings;

    if (!settingsToSave || typeof settingsToSave.workingHours === 'undefined' || typeof settingsToSave.bufferTime === 'undefined' || typeof settingsToSave.minNoticeTime === 'undefined') {
        return NextResponse.json({ success: false, message: 'Invalid availability settings payload' }, { status: 400 });
    }
    
    // Settings are stored in a 'users' collection with the document ID being the userId
    const userDocRef = doc(db, 'users', userId);
    
    await setDoc(userDocRef, { availabilitySettings: settingsToSave }, { merge: true });

    return NextResponse.json({ success: true, message: 'Availability settings saved successfully.' });
  } catch (error) {
    console.error('Failed to save availability settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to save availability settings', error: errorMessage }, { status: 500 });
  }
}
