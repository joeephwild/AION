
// /src/app/api/calendar/connect/[service]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getGoogleOAuth2Client } from '@/lib/google-calendar-server';

// GET /api/calendar/connect/status - this is now the one source of truth for connection status
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    let connections = { 
      google: { connected: false, email: null }, 
      outlook: { connected: false, email: null } 
    };

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Check for Google tokens to determine connection status
      if (userData.googleTokens && userData.googleTokens.access_token) {
        connections.google.connected = true;
        connections.google.email = userData.calendarConnections?.google?.email || null;
      }
      // Check for Outlook (retains mock logic)
      if (userData.calendarConnections?.outlook?.connected) {
        connections.outlook.connected = true;
      }
    }
    
    return NextResponse.json({ success: true, connections });

  } catch (error) {
    console.error('Failed to fetch calendar connection status from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch connection status', error: errorMessage }, { status: 500 });
  }
}

// POST /api/calendar/connect/google - Initiates the Google OAuth flow by returning an auth URL
export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const service = params.service;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
  }
  
  if (service !== 'google') {
    return NextResponse.json({ success: false, message: 'This endpoint currently only supports initiating Google connection.' }, { status: 400 });
  }

  try {
    const oauth2Client = getGoogleOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get a refresh token
      prompt: 'consent', // Important to ensure refresh token is always sent
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: userId, // Pass the user's ID to identify them in the callback
    });
    
    return NextResponse.json({ success: true, authUrl });

  } catch (error) {
    console.error(`Failed to generate Google auth URL:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to generate auth URL', error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/calendar/connect/google - Disconnects Google Calendar by removing tokens
export async function DELETE(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
    const service = params.service;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ success: false, message: 'x-user-id header is required' }, { status: 400 });
    }
     if (service !== 'google') {
        return NextResponse.json({ success: false, message: 'This endpoint only supports disconnecting Google.' }, { status: 400 });
    }

    try {
        const userDocRef = doc(db, 'users', userId);
        // Remove the googleTokens and the connection status field from Firestore
        await updateDoc(userDocRef, {
            'googleTokens': null, // Or FieldValue.delete()
            'calendarConnections.google': null // Or FieldValue.delete()
        });

        return NextResponse.json({ success: true, message: 'Successfully disconnected from Google Calendar.' });
    } catch (error) {
        console.error('Failed to disconnect Google Calendar:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to disconnect', error: errorMessage }, { status: 500 });
    }
}
