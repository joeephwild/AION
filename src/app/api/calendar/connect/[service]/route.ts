
// /src/app/api/calendar/connect/[service]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const service = params.service;

  if (service !== 'google' && service !== 'outlook') {
    return NextResponse.json({ success: false, message: 'Invalid service provider.' }, { status: 400 });
  }

  // In a real application, you would:
  // 1. Generate a CSRF token (state parameter) and store it (e.g., in a session or short-lived DB entry).
  // 2. Construct the full authorization URL for the specific service.
  // 3. Redirect the user to that URL: return NextResponse.redirect(authorizationUrl);
  // For this prototype, we'll just log and return a mock success.

  console.log(`Initiating mock OAuth connection for: ${service}`);

  // Simulate constructing a redirect URL (optional for the client to use if we were doing a real redirect)
  const mockRedirectUri = `${request.nextUrl.origin}/api/calendar/callback/${service}`;
  const mockAuthUrl = `https://accounts.${service}.com/o/oauth2/v2/auth?client_id=MOCK_CLIENT_ID_${service.toUpperCase()}&redirect_uri=${encodeURIComponent(mockRedirectUri)}&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&access_type=offline&prompt=consent&state=MOCK_CSRF_STATE`;

  return NextResponse.json({
    success: true,
    message: `Mock connection to ${service} initiated. In a real app, you would be redirected.`,
    service: service,
    // mockAuthUrl: mockAuthUrl, // Client could use this if we wanted to simulate the redirect
  });
}
