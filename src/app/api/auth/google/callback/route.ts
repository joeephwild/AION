
// /src/app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-calendar-server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Should contain our userId
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(new URL('/dashboard/availability?error=google_oauth_failed', request.url));
  }

  if (!code) {
    console.error('Google OAuth Error: No code received.');
    return NextResponse.redirect(new URL('/dashboard/availability?error=google_oauth_incomplete', request.url));
  }
  
  if (!state) {
    console.error('Google OAuth Error: No state (userId) received.');
    return NextResponse.redirect(new URL('/dashboard/availability?error=google_oauth_nostate', request.url));
  }

  const userId = state; // The user's wallet address

  try {
    const oauth2Client = getGoogleOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
        // This can happen if the user has already granted consent and we didn't use prompt: 'consent'
        // In this case, we should try to retrieve the existing refresh token from Firestore.
        // For simplicity here, we'll log a warning. For production, you'd handle this more gracefully.
        console.warn(`Google OAuth: No refresh_token received for user ${userId}. This may happen on re-authentication without 'prompt: consent'.`);
    }

    // Get user's primary email address to display in the UI
    oauth2Client.setCredentials(tokens);
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses',
    });
    const userEmail = profile.data.emailAddresses?.[0]?.value || 'N/A';
    
    // Securely store the tokens in Firestore under the user's document
    const userDocRef = doc(db, 'users', userId);

    const dataToStore: Record<string, any> = {
        googleTokens: tokens,
        calendarConnections: { 
            google: {
                connected: true,
                email: userEmail,
            }
        },
    };

    // If no new refresh token is provided, merge with existing data to preserve old one.
    if (!tokens.refresh_token) {
        const existingDoc = await getDoc(userDocRef);
        const existingTokens = existingDoc.data()?.googleTokens;
        if (existingTokens?.refresh_token) {
            dataToStore.googleTokens.refresh_token = existingTokens.refresh_token;
        }
    }

    await setDoc(userDocRef, dataToStore, { merge: true });

    // Redirect user back to the availability page with a success message
    return NextResponse.redirect(new URL('/dashboard/availability?google_auth=success', request.url));

  } catch (err) {
    console.error('Failed to exchange auth code or save tokens:', err);
    return NextResponse.redirect(new URL('/dashboard/availability?error=token_exchange_failed', request.url));
  }
}
