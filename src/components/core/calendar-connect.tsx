
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { gapi } from 'gapi-script';

// Inline SVGs for Google and Outlook logos
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-current">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-current">
    <path d="M6.53 3H14.5L21 8.5V18.5C21 19.88 19.88 21 18.5 21H6.5C5.12 21 4 19.88 4 18.5V5.5C4 4.12 5.12 3 6.53 3ZM8.5 9V6H6V17H8.5V9ZM12.5 11H10V17H12.5V11ZM16.5 13H14V17H16.5V13Z" fill="#0078D4"/>
  </svg>
);

type ConnectionStatus = {
  google: boolean;
  outlook: boolean;
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; // Not typically needed for OAuth, but good for other GAPI calls
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly';
// Ensure this matches exactly what's in Google Cloud Console
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '';


export function CalendarConnect() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<ConnectionStatus>({ google: false, outlook: false });
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [isUpdating, setIsUpdating] = useState<null | 'google' | 'outlook'>(null);

  const updateConnectionStatus = useCallback(async (service: 'google' | 'outlook', connected: boolean) => {
    if (!address) return;
    try {
      await fetch(`/api/calendar/connect/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify({ connect: connected }),
      });
      setConnections(prev => ({ ...prev, [service]: connected }));
      if (connected && service === 'google') {
        // Store a flag or token (client-side for prototype) indicating Google is connected
        localStorage.setItem(`google_calendar_connected_${address}`, 'true');
      } else if (!connected && service === 'google') {
        localStorage.removeItem(`google_calendar_connected_${address}`);
        // Also sign out from Google if gapi is loaded and auth instance exists
        if (window.gapi && window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
          window.gapi.auth2.getAuthInstance().signOut();
        }
      }
    } catch (error) {
      console.error(`Failed to update ${service} connection status in mock DB:`, error);
    }
  }, [address]);


  useEffect(() => {
    const fetchConnectionStatusFromMockDB = async () => {
      if (address) {
        setIsFetchingStatus(true);
        try {
          const response = await fetch(`/api/calendar/connect/status`, {
            headers: { 'x-user-id': address }
          });
          const data = await response.json();
          if (data.success && data.connections) {
            setConnections(data.connections);
             // Check local storage for Google connection initiated by client-side OAuth
            const googleConnectedClientSide = localStorage.getItem(`google_calendar_connected_${address}`) === 'true';
            if (googleConnectedClientSide && !data.connections.google) {
                // If client-side says connected but mock DB doesn't, update mock DB
                // This handles the case after successful client-side OAuth redirect
                await updateConnectionStatus('google', true);
                setConnections(prev => ({ ...prev, google: true }));
            } else if (!googleConnectedClientSide && data.connections.google) {
                 // If mock DB says connected but client-side doesn't (e.g. after explicit disconnect)
                localStorage.removeItem(`google_calendar_connected_${address}`);
            }

          } else {
             setConnections({ google: false, outlook: false });
          }
        } catch (error) {
          console.error("Failed to fetch calendar connection status:", error);
          setConnections({ google: false, outlook: false });
        } finally {
          setIsFetchingStatus(false);
        }
      } else {
        setConnections({ google: false, outlook: false });
        setIsFetchingStatus(false);
      }
    };

    fetchConnectionStatusFromMockDB();
  }, [address, updateConnectionStatus]);


  const initGoogleClient = useCallback((callback: () => void) => {
    if (!GOOGLE_CLIENT_ID) {
      toast({ title: "Google Client ID Missing", description: "Google Calendar integration is not configured.", variant: "destructive" });
      setIsUpdating(null);
      return;
    }
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY, // May not be strictly necessary for OAuth token flow but good for discovery doc
        clientId: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
      }).then(() => {
        callback();
      }).catch(error => {
        console.error("Error initializing Google API client:", error);
        toast({ title: "Google API Init Failed", description: "Could not initialize Google Calendar client.", variant: "destructive" });
        setIsUpdating(null);
      });
    });
  }, [toast]);

  const handleGoogleConnect = () => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    setIsUpdating('google');

    const attemptSignIn = () => {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        console.error("Google Auth instance not available after init.");
        toast({ title: "Google Auth Error", description: "Failed to get Google Auth instance.", variant: "destructive" });
        setIsUpdating(null);
        return;
      }

      authInstance.signIn()
        .then(async (googleUser) => {
          // User signed in. The access token is available via googleUser.getAuthResponse().access_token
          // This token can be used for client-side API calls.
          // For production, you'd send an auth code to your backend from here (or via the redirect URI).
          console.log('Google Sign-In successful', googleUser);
          await updateConnectionStatus('google', true); // Update mock DB
          toast({ title: "Google Calendar Connected (Client-side)", description: "Ready to fetch events."});
          // Trigger a re-fetch or pass token to availability page if needed
          if (typeof window !== 'undefined') {
             // To notify availability page to re-fetch events
             window.dispatchEvent(new Event('googleCalendarConnected'));
          }
        })
        .catch(async (error) => {
          console.error("Google Sign-In error:", error);
          if (error.error === "popup_closed_by_user") {
            toast({ title: "Google Sign-In Cancelled", description: "You closed the Google Sign-In popup.", variant: "default" });
          } else if (error.error === "access_denied") {
            toast({ title: "Google Access Denied", description: "You denied access to Google Calendar.", variant: "destructive" });
          } else {
            toast({ title: "Google Sign-In Failed", description: error.details || "Could not connect to Google Calendar.", variant: "destructive" });
          }
          await updateConnectionStatus('google', false);
        })
        .finally(() => {
          setIsUpdating(null);
        });
    };

    if (typeof window.gapi !== 'undefined' && typeof window.gapi.auth2 !== 'undefined' && window.gapi.auth2.getAuthInstance()) {
       attemptSignIn();
    } else {
      initGoogleClient(attemptSignIn);
    }
  };

  const handleGoogleDisconnect = async () => {
    setIsUpdating('google');
    try {
      const authInstance = gapi.auth2?.getAuthInstance();
      if (authInstance) {
        await authInstance.signOut();
      }
    } catch (error) {
      console.error("Error signing out from Google:", error);
    } finally {
      await updateConnectionStatus('google', false);
      toast({ title: "Google Calendar Disconnected", description: "Your Google Calendar has been disconnected." });
      setIsUpdating(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('googleCalendarDisconnected'));
      }
    }
  };


  const handleOutlookToggle = async () => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    setIsUpdating('outlook');
    const shouldConnect = !connections.outlook;
    // Mock Outlook connection
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    await updateConnectionStatus('outlook', shouldConnect);
    toast({ title: `Outlook Calendar ${shouldConnect ? 'Connected' : 'Disconnected'} (Mock)`, description: `Mock status updated for Outlook.` });
    setIsUpdating(null);
  };


  if (isFetchingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading connection status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        {connections.google ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center">
              <GoogleIcon />
              <span>Google Calendar Connected</span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
            </div>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleGoogleDisconnect} 
              className="text-destructive"
              disabled={isUpdating === 'google'}
            >
              {isUpdating === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleGoogleConnect} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isUpdating === 'google' || !account || !GOOGLE_CLIENT_ID}
            title={!GOOGLE_CLIENT_ID ? "Google integration not configured by admin" : ""}
          >
            {isUpdating === 'google' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <GoogleIcon />}
            {isUpdating === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        )}
      </div>
      <div>
        {connections.outlook ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center">
              <OutlookIcon />
              <span>Outlook Calendar Connected</span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
            </div>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleOutlookToggle} 
              className="text-destructive"
              disabled={isUpdating === 'outlook'}
            >
              {isUpdating === 'outlook' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleOutlookToggle} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isUpdating === 'outlook' || !account}
          >
            {isUpdating === 'outlook' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <OutlookIcon />}
            {isUpdating === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar (Mock)'}
          </Button>
        )}
      </div>
       {!connections.google && !connections.outlook && !GOOGLE_CLIENT_ID && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Google Calendar integration is not configured by the administrator.
          </p>
       )}
       {(!account && (isUpdating === 'google' || isUpdating === 'outlook')) && (
        <p className="text-xs text-destructive text-center pt-2">
          Please connect your wallet to manage calendar integrations.
        </p>
      )}
    </div>
  );
}

