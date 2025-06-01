
// /src/app/api/availability/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { AvailabilitySettings } from '@/types';

// GET /api/availability
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const settings = userData.availabilitySettings;
      if (settings) {
        return NextResponse.json({ success: true, settings });
      }
    }
    // If no settings found, or user doc doesn't exist, can return default or indicate not found
    // For now, let's indicate not found, client can use defaults
    return NextResponse.json({ success: true, settings: null, message: 'No availability settings found for user.' });

  } catch (error) {
    console.error('Failed to fetch availability settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch availability settings', error: errorMessage }, { status: 500 });
  }
}

// POST /api/availability
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }

  try {
    const settingsToSave = await request.json() as AvailabilitySettings;

    if (!settingsToSave || typeof settingsToSave.workingHours === 'undefined' || typeof settingsToSave.bufferTime === 'undefined' || typeof settingsToSave.minNoticeTime === 'undefined') {
        return NextResponse.json({ success: false, message: 'Invalid availability settings payload' }, { status: 400 });
    }
    
    const userDocRef = doc(db, 'users', userId);
    
    // Use setDoc with merge:true to create or update the availabilitySettings field within the user's document
    // This will create the document if it doesn't exist, or update it if it does.
    await setDoc(userDocRef, { availabilitySettings: settingsToSave }, { merge: true });

    return NextResponse.json({ success: true, message: 'Availability settings saved successfully.' });
  } catch (error) {
    console.error('Failed to save availability settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to save availability settings', error: errorMessage }, { status: 500 });
  }
}
