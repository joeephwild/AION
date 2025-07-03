
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";

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
  google: { connected: boolean; email: string | null };
  outlook: { connected: boolean; email: string | null };
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function CalendarConnect() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();

  const [connections, setConnections] = useState<ConnectionStatus>({ google: { connected: false, email: null }, outlook: { connected: false, email: null } });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<null | 'google' | 'outlook'>(null);

  const fetchConnectionStatus = useCallback(async () => {
    if (address) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/calendar/connect/status`, {
          headers: { 'x-user-id': address }
        });
        const data = await response.json();
        if (data.success && data.connections) {
          setConnections(data.connections);
        } else {
           setConnections({ google: { connected: false, email: null }, outlook: { connected: false, email: null } });
        }
      } catch (error) {
        console.error("Failed to fetch calendar connection status:", error);
        setConnections({ google: { connected: false, email: null }, outlook: { connected: false, email: null } });
      } finally {
        setIsLoading(false);
      }
    } else {
      setConnections({ google: { connected: false, email: null }, outlook: { connected: false, email: null } });
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  const handleGoogleConnect = async () => {
    if (!address) return;
    setIsUpdating('google');
    try {
      const response = await fetch('/api/calendar/connect/google', {
        method: 'POST',
        headers: { 'x-user-id': address },
      });
      const data = await response.json();
      if (data.success && data.authUrl) {
        // Redirect the user to Google's OAuth screen
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.message || 'Failed to get auth URL');
      }
    } catch (error) {
      console.error('Google Connect Error:', error);
      toast({ title: "Error", description: "Could not initiate connection to Google.", variant: "destructive"});
      setIsUpdating(null);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!address) return;
    setIsUpdating('google');
    try {
      const response = await fetch('/api/calendar/connect/google', {
        method: 'DELETE',
        headers: { 'x-user-id': address },
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Disconnected from Google Calendar." });
        await fetchConnectionStatus(); // Refresh status from backend
      } else {
        throw new Error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
        console.error('Google Disconnect Error:', error);
        toast({ title: "Error", description: "Could not disconnect from Google.", variant: "destructive"});
    } finally {
        setIsUpdating(null);
    }
  };

  // Mock handler for Outlook
  const handleOutlookToggle = async () => {
    toast({ title: "Note", description: "Outlook Calendar integration is not implemented in this prototype." });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div>
        {connections.google.connected ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center overflow-hidden">
              <GoogleIcon />
              <span className="truncate" title={connections.google.email || 'Google Connected'}>
                {connections.google.email || 'Google Connected'}
              </span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500 flex-shrink-0" />
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
            title={!GOOGLE_CLIENT_ID ? "Google integration not configured by admin" : "Connect Google Calendar"}
          >
            {isUpdating === 'google' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <GoogleIcon />}
            {isUpdating === 'google' ? 'Redirecting...' : 'Connect Google Calendar'}
          </Button>
        )}
         {!GOOGLE_CLIENT_ID && (
           <p className="text-xs text-muted-foreground text-center pt-1">Google Calendar integration not configured.</p>
         )}
      </div>
      <div>
        {connections.outlook.connected ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center">
              <OutlookIcon />
              <span>Outlook Connected (Mock)</span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
            </div>
             <Button variant="link" size="sm" className="text-destructive" disabled>Disconnect</Button>
          </div>
        ) : (
          <Button
            onClick={handleOutlookToggle}
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={!account}
          >
            <OutlookIcon />
            Connect Outlook Calendar
          </Button>
        )}
      </div>
    </div>
  );
}
