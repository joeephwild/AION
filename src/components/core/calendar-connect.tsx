
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

  const updateConnectionStatusInMockDB = useCallback(async (service: 'google' | 'outlook', connected: boolean) => {
    if (!address) return;
    try {
      await fetch(`/api/calendar/connect/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify({ connect: connected }),
      });
    } catch (error) {
      console.error(`Failed to update ${service} connection status in mock DB:`, error);
    }
  }, [address]);

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
            setConnections(prev => ({...prev, outlook: data.connections.outlook}));
          }
        } catch (error) {
          console.error("Failed to fetch calendar connection status:", error);
          setConnections(prev => ({...prev, outlook: false})); // Default to false on error
        } finally {
          setIsFetchingStatus(false);
        }
      } else {
        setConnections({ google: false, outlook: false });
        setIsFetchingStatus(false);
      }
    };
    fetchInitialConnectionStatus();
  }, [address]);


  useEffect(() => {
    if (!address) {
        setIsGoogleApiLoaded(false);
        setConnections(prev => ({ ...prev, google: false }));
        return;
    }
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
        console.warn("CalendarConnect: Google Client ID or API Key is missing. Google integration disabled.");
        setIsGoogleApiLoaded(false);
        return;
    }

    if (!apiCalendar || typeof apiCalendar.onLoad !== 'function') {
        console.error("CalendarConnect: apiCalendar object or apiCalendar.onLoad method is not available.", { currentApiCalendar: apiCalendar });
        setIsGoogleApiLoaded(false);
        return;
    }

    const handleSign = (signedIn: boolean) => {
      setConnections(prev => ({ ...prev, google: signedIn }));
      setIsUpdating(null); // Reset loading state for Google
      if (signedIn) {
        updateConnectionStatusInMockDB('google', true);
        localStorage.setItem(`google_calendar_connected_${address}`, 'true');
        window.dispatchEvent(new Event('googleCalendarConnected'));
        toast({ title: "Google Calendar Connected", description: "Ready to fetch events."});
      } else {
        const wasPreviouslyConnected = localStorage.getItem(`google_calendar_connected_${address}`) === 'true';
        updateConnectionStatusInMockDB('google', false);
        localStorage.removeItem(`google_calendar_connected_${address}`);
        window.dispatchEvent(new Event('googleCalendarDisconnected'));
        if (wasPreviouslyConnected) { // Only toast disconnect if it was genuinely connected before
           toast({ title: "Google Calendar Disconnected", description: "Your Google Calendar has been disconnected." });
        }
      }
    };
    
    apiCalendar.onLoad(() => {
      setIsGoogleApiLoaded(true); // GAPI infrastructure is ready
      if (typeof apiCalendar.listenSign === 'function') {
        apiCalendar.listenSign(handleSign);
        // Check initial sign-in state from the library
        // The `apiCalendar.sign` property might take a moment to update after gapi loads.
        // listenSign's callback should correctly set the initial state.
        // Forcing an immediate check can sometimes be racy if gapi.auth2 isn't fully ready.
        // The library's internal listenSign usually handles the initial state correctly.
        // We can check apiCalendar.sign after a brief delay or rely on the first callback from listenSign.
        setTimeout(() => { // Slight delay to allow library's internal `sign` state to settle
          if (typeof apiCalendar.sign === 'boolean') {
            if (apiCalendar.sign !== connections.google) { // Sync if different from current state
                handleSign(apiCalendar.sign);
            }
          } else {
             console.warn("CalendarConnect: apiCalendar.sign is not a boolean. Initial state might be inaccurate.");
          }
        }, 100);

      } else {
        console.error("CalendarConnect: apiCalendar.listenSign is not a function after GAPI onLoad.", { apiCalendarObj: apiCalendar });
        handleSign(false); // Assume not signed in if listenSign is not available
      }
    });
  }, [address, toast, updateConnectionStatusInMockDB, connections.google]); // Added connections.google to re-sync if needed


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
      console.error("Google API not ready for handleAuthClick", {isGoogleApiLoaded, apiCalendar});
      return;
    }
    setIsUpdating('google');
    apiCalendar.handleAuthClick().catch((error: any) => {
      console.error("Google Sign-In flow error:", error);
      const errorMessage = error?.error || (error instanceof Error ? error.message : "Unknown error during Google Sign-In.");
      if (errorMessage.includes("popup_closed_by_user")) {
        toast({ title: "Google Sign-In Cancelled", description: "You closed the Google Sign-In popup." });
      } else if (errorMessage.includes("access_denied")) {
         toast({ title: "Google Access Denied", description: "You denied access to Google Calendar.", variant: "destructive" });
      } else {
        toast({ title: "Google Sign-In Failed", description: `Could not connect to Google Calendar: ${errorMessage}`, variant: "destructive" });
      }
      setIsUpdating(null); 
      handleSign(false); // Ensure UI reflects failure by calling handleSign
    });
  };

  const handleGoogleDisconnect = async () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY || !apiCalendar || typeof apiCalendar.handleSignoutClick !== 'function') return;
    setIsUpdating('google');
    apiCalendar.handleSignoutClick();
    // The listenSign callback in useEffect will handle other state updates and toasts.
  };


  const handleOutlookToggle = async () => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    setIsUpdating('outlook');
    const shouldConnect = !connections.outlook;
    // Simulate API call for mock
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    // Update mock DB
    await updateConnectionStatusInMockDB('outlook', shouldConnect);
    // Update local state
    setConnections(prev => ({ ...prev, outlook: shouldConnect }));
    toast({ title: `Outlook Calendar ${shouldConnect ? 'Connected (Mock)' : 'Disconnected (Mock)'}`, description: `Mock status updated for Outlook.` });
    setIsUpdating(null);
  };

  // Combined loading state for initial phase
  const isLoadingInitial = isFetchingStatus || (isUpdating === 'google' && !isGoogleApiLoaded && !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY);

  if (isLoadingInitial) {
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
            disabled={isUpdating === 'google' || !account || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY || !isGoogleApiLoaded}
            title={(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) ? "Google integration not configured by admin" : (!isGoogleApiLoaded ? "Google API still loading..." : "Connect Google Calendar")}
          >
            {(isUpdating === 'google' && isGoogleApiLoaded) ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <GoogleIcon />}
            {(isUpdating === 'google' && isGoogleApiLoaded) ? 'Connecting...' : 'Connect Google Calendar'}
            {!isGoogleApiLoaded && GOOGLE_CLIENT_ID && GOOGLE_API_KEY && <span className="text-xs ml-auto">(API Loading...)</span>}
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
            {isUpdating === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar (Mock)'}
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
