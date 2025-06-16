
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import { apiCalendar } from '@/lib/google-calendar';

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
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export function CalendarConnect() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();

  const [connections, setConnections] = useState<ConnectionStatus>({ google: false, outlook: false });
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [isUpdating, setIsUpdating] = useState<null | 'google' | 'outlook'>(null);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);

  const updateConnectionStatusInBackend = useCallback(async (service: 'google' | 'outlook', connected: boolean) => {
    if (!address) return;
    setIsUpdating(service);
    try {
      const response = await fetch(`/api/calendar/connect/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify({ connect: connected }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || `Failed to update ${service} in backend`);
      }
      // Update local state after successful backend update
      setConnections(prev => ({ ...prev, [service]: connected }));
      if (service === 'google') {
        if (connected) {
          localStorage.setItem(`google_calendar_connected_${address}`, 'true');
          window.dispatchEvent(new Event('googleCalendarConnected'));
          toast({ title: "Google Calendar Connected", description: "Status saved. Ready to fetch events."});
        } else {
          localStorage.removeItem(`google_calendar_connected_${address}`);
          window.dispatchEvent(new Event('googleCalendarDisconnected'));
           toast({ title: "Google Calendar Disconnected", description: "Status saved." });
        }
      } else { // Outlook
         toast({ title: `Outlook Calendar ${connected ? 'Connected' : 'Disconnected'}`, description: `Mock status updated and saved.` });
      }
    } catch (error) {
      console.error(`Failed to update ${service} connection status:`, error);
      toast({ title: `Error Updating ${service}`, description: error instanceof Error ? error.message : "Could not update status.", variant: "destructive" });
      // Optionally revert local state if backend update fails, though this could be complex
    } finally {
      setIsUpdating(null);
    }
  }, [address, toast]);

  useEffect(() => {
    const fetchInitialConnectionStatus = async () => {
      if (address) {
        setIsFetchingStatus(true);
        try {
          const response = await fetch(`/api/calendar/connect/status`, {
            headers: { 'x-user-id': address }
          });
          const data = await response.json();
          if (data.success && data.connections) {
            setConnections(data.connections);
            // Initialize Google API based on fetched status for Google
            if (data.connections.google && GOOGLE_CLIENT_ID && GOOGLE_API_KEY && apiCalendar && !apiCalendar.sign) {
                // If DB says connected but library says not, this is complex.
                // The library's 'sign' state is king for API calls.
                // We might need to prompt user to re-auth if this desync happens,
                // or the library might handle it with its onLoad.
                // For now, local storage and event dispatch rely on interaction.
                localStorage.setItem(`google_calendar_connected_${address}`, 'true');
            } else if (!data.connections.google) {
                 localStorage.removeItem(`google_calendar_connected_${address}`);
            }

          } else {
             setConnections({ google: false, outlook: false }); // Default to false if API fails or no status
             localStorage.removeItem(`google_calendar_connected_${address}`);
          }
        } catch (error) {
          console.error("Failed to fetch initial calendar connection status:", error);
          setConnections({ google: false, outlook: false });
          localStorage.removeItem(`google_calendar_connected_${address}`);
        } finally {
          setIsFetchingStatus(false);
        }
      } else {
        setConnections({ google: false, outlook: false });
        setIsFetchingStatus(false);
        localStorage.removeItem(`google_calendar_connected_${address}`); // Clear if no address
      }
    };
    fetchInitialConnectionStatus();
  }, [address]);


  const handleGoogleSignInStateChange = useCallback((signedIn: boolean) => {
    // This function is now primarily for reacting to apiCalendar's state
    // The backend update is triggered by explicit connect/disconnect actions.
    if (connections.google !== signedIn) { // Only update if different from current state
        setConnections(prev => ({ ...prev, google: signedIn }));
        if (signedIn) {
            if(address) localStorage.setItem(`google_calendar_connected_${address}`, 'true');
            window.dispatchEvent(new Event('googleCalendarConnected'));
        } else {
            if(address) localStorage.removeItem(`google_calendar_connected_${address}`);
            window.dispatchEvent(new Event('googleCalendarDisconnected'));
        }
    }
    setIsUpdating(null); // Clear updating state
  }, [address, connections.google]);


  useEffect(() => {
    if (!address || !apiCalendar || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      setIsGoogleApiLoaded(false);
      if(connections.google && apiCalendar && !apiCalendar.sign) {
          // If we think we are connected but library says no, and user logs out of wallet
          handleGoogleSignInStateChange(false);
      }
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
    // No direct equivalent for listenSign, state is managed by onLoad and explicit actions
  }, [address, handleGoogleSignInStateChange, connections.google]);


  const handleGoogleConnect = () => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      toast({ title: "Google Not Configured", description: "Google Calendar integration is not configured by the admin.", variant: "destructive" });
      return;
    }
    if (!isGoogleApiLoaded || !apiCalendar || typeof apiCalendar.handleAuthClick !== 'function') {
      toast({ title: "Google API Not Ready", description: "Please wait for Google API to load or check configuration.", variant: "default" });
      return;
    }
    setIsUpdating('google');
    apiCalendar.handleAuthClick()
      .then(() => {
        if (apiCalendar.sign) {
          updateConnectionStatusInBackend('google', true); // This will update state and toast
        } else {
          // Should not happen if authClick resolves without error, but handle defensively
          updateConnectionStatusInBackend('google', false);
        }
      })
      .catch((error: any) => {
        console.error("Google Sign-In flow error:", error);
        // Error handling for popup close / access denied
        const errorMessage = error?.error || (error instanceof Error ? error.message : "Unknown error during Google Sign-In.");
        if (error && error.type === 'popup_closed_by_user' || errorMessage.includes("popup_closed_by_user")) {
           toast({ title: "Google Sign-In Cancelled", description: "You closed the Google Sign-In popup." });
        } else if (error && error.type === 'access_denied' || errorMessage.includes("access_denied")) {
           toast({ title: "Google Access Denied", description: "You denied access to Google Calendar.", variant: "destructive" });
        } else {
          toast({ title: "Google Sign-In Failed", description: `Could not connect to Google Calendar: ${errorMessage}`, variant: "destructive" });
        }
        updateConnectionStatusInBackend('google', false); // Ensure backend knows it failed
      });
  };

  const handleGoogleDisconnect = async () => {
    if (!apiCalendar || typeof apiCalendar.handleSignoutClick !== 'function') return;
    setIsUpdating('google');
    try {
        apiCalendar.handleSignoutClick();
        // react-google-calendar-api's handleSignoutClick is synchronous and updates apiCalendar.sign
        updateConnectionStatusInBackend('google', false); // This will update state and toast
    } catch (error) {
        console.error("Error during Google Signout:", error);
        toast({ title: "Google Sign-Out Failed", description: "Could not disconnect from Google Calendar.", variant: "destructive" });
        setIsUpdating(null); // Reset updating state on error
    }
  };

  const handleOutlookToggle = async () => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    const shouldConnect = !connections.outlook;
    await updateConnectionStatusInBackend('outlook', shouldConnect);
  };

  const isLoadingPage = isFetchingStatus || (isUpdating === 'google' && !isGoogleApiLoaded && !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY);

  if (isLoadingPage && !connections.google && !connections.outlook) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading calendar connections...</span>
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
            disabled={isUpdating === 'google' || !account || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY || (!!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY && !isGoogleApiLoaded) }
            title={(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) ? "Google integration not configured by admin" : (!isGoogleApiLoaded ? "Google API still loading..." : "Connect Google Calendar")}
          >
            {(isUpdating === 'google' && isGoogleApiLoaded) ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <GoogleIcon />}
            {(isUpdating === 'google' && isGoogleApiLoaded) ? 'Connecting...' : 'Connect Google Calendar'}
            {(!isGoogleApiLoaded && !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY) && <span className="text-xs ml-auto">(API Loading...)</span>}
          </Button>
        )}
         {(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) && (
           <p className="text-xs text-muted-foreground text-center pt-1">Google Calendar integration not configured.</p>
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
            {isUpdating === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar'}
          </Button>
        )}
      </div>
      {(!account && (isUpdating === 'google' || isUpdating === 'outlook')) && (
        <p className="text-xs text-destructive text-center pt-2">
          Please connect your wallet to manage calendar integrations.
        </p>
      )}
    </div>
  );
}
