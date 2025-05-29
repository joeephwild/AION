
// /src/app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    // Redirect to an error page or dashboard with an error message
    return NextResponse.redirect(new URL('/dashboard?error=google_oauth_failed', request.url));
  }

  if (code) {
    console.log('Google OAuth Code:', code);
    console.log('Google OAuth State:', state);

    // **IMPORTANT: SERVER-SIDE TOKEN EXCHANGE REQUIRED HERE**
    // In a production app, you would now exchange this 'code' for an access token
    // and refresh token by making a POST request to Google's token endpoint.
    // This MUST be done server-side to protect your client_secret.
    // e.g., using fetch to 'https://oauth2.googleapis.com/token'
    //
    // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     code: code,
    //     client_id: process.env.GOOGLE_CLIENT_ID!, // Server-side env var
    //     client_secret: process.env.GOOGLE_CLIENT_SECRET!, // Server-side env var
    //     redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`, // Must match console
    //     grant_type: 'authorization_code',
    //   }),
    // });
    // const tokens = await tokenResponse.json();
    //
    // // Securely store tokens.access_token and tokens.refresh_token for the user.
    // // For this prototype, we are not implementing the full token exchange.

    // For prototyping, we'll assume the client-side got the token or will handle it.
    // Redirect to the dashboard or availability page, possibly with a success flag.
    // The client-side JavaScript that initiated the OAuth flow will pick up from here.
    // This simple redirect is often enough for client-side gapi flows that handle tokens themselves.
    return NextResponse.redirect(new URL('/dashboard/availability?google_auth=success', request.url));
  }

  // If no code and no error, something unexpected happened.
  return NextResponse.redirect(new URL('/dashboard?error=google_oauth_incomplete', request.url));
}
