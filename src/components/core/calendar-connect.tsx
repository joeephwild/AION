
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react"; // Added Loader2
import { useState, useEffect } from "react";
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
  google: boolean;
  outlook: boolean;
};

export function CalendarConnect() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<ConnectionStatus>({ google: false, outlook: false });
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [isUpdating, setIsUpdating] = useState<null | 'google' | 'outlook'>(null);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (address) {
        setIsFetchingStatus(true);
        try {
          const response = await fetch(`/api/calendar/connect/status`, { // Assuming a general status endpoint
            headers: { 'x-user-id': address }
          });
          const data = await response.json();
          if (data.success && data.connections) {
            setConnections(data.connections);
          } else {
            // Keep default false if fetch fails or no data
             setConnections({ google: false, outlook: false });
          }
        } catch (error) {
          console.error("Failed to fetch calendar connection status:", error);
          setConnections({ google: false, outlook: false }); // Reset on error
        } finally {
          setIsFetchingStatus(false);
        }
      } else {
        setConnections({ google: false, outlook: false });
        setIsFetchingStatus(false);
      }
    };

    fetchConnectionStatus();
  }, [address]);


  const handleToggleConnection = async (service: 'google' | 'outlook') => {
    if (!address) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    setIsUpdating(service);
    const currentlyConnected = service === 'google' ? connections.google : connections.outlook;
    const shouldConnect = !currentlyConnected;

    try {
      const response = await fetch(`/api/calendar/connect/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': address,
        },
        body: JSON.stringify({ connect: shouldConnect }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setConnections(prev => ({ ...prev, [service]: shouldConnect }));
        toast({ title: `${service.charAt(0).toUpperCase() + service.slice(1)} Calendar ${shouldConnect ? 'Connected' : 'Disconnected'} (Mock)`, description: data.message });
      } else {
        throw new Error(data.message || `Failed to update ${service} connection`);
      }
    } catch (error) {
      console.error(`Error updating ${service} connection:`, error);
      const errorMessage = error instanceof Error ? error.message : `An unknown error occurred.`;
      toast({ title: `Update Failed (Mock)`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
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
              onClick={() => handleToggleConnection('google')} 
              className="text-destructive"
              disabled={isUpdating === 'google'}
            >
              {isUpdating === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleToggleConnection('google')} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isUpdating === 'google' || !account}
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
              onClick={() => handleToggleConnection('outlook')} 
              className="text-destructive"
              disabled={isUpdating === 'outlook'}
            >
              {isUpdating === 'outlook' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleToggleConnection('outlook')} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isUpdating === 'outlook' || !account}
          >
            {isUpdating === 'outlook' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <OutlookIcon />}
            {isUpdating === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar'}
          </Button>
        )}
      </div>
       {!connections.google && !connections.outlook && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Connect your calendar to automatically manage your booking availability.
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
