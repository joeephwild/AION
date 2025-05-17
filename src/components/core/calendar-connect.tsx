
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react"; // For checking if user is logged in

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


export function CalendarConnect() {
  const account = useActiveAccount();
  const { toast } = useToast();
  
  // These states would ideally be fetched from the backend based on user's actual connections
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState<null | 'google' | 'outlook'>(null);

  // Effect to check existing connections when component mounts or user changes
  // In a real app, this would fetch connection status from your backend
  useEffect(() => {
    if (account) {
      // mock fetch existing connection status
      // e.g., fetchUserCalendarConnections(account.address).then(status => {
      //   setGoogleConnected(status.google);
      //   setOutlookConnected(status.outlook);
      // });
    } else {
      setGoogleConnected(false);
      setOutlookConnected(false);
    }
  }, [account]);


  const handleConnect = async (service: 'google' | 'outlook') => {
    if (!account) {
      toast({ title: "Not Connected", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    setIsConnecting(service);
    try {
      const response = await fetch(`/api/calendar/connect/${service}`);
      const data = await response.json();

      if (response.ok && data.success) {
        if (service === 'google') {
          setGoogleConnected(true);
        } else {
          setOutlookConnected(true);
        }
        toast({ title: `${service.charAt(0).toUpperCase() + service.slice(1)} Calendar Connected (Mock)`, description: data.message });
        // In a real OAuth flow, the API route would handle the redirect.
        // If data.mockAuthUrl was returned and used: window.location.href = data.mockAuthUrl;
      } else {
        throw new Error(data.message || `Failed to connect to ${service}`);
      }
    } catch (error) {
      console.error(`Error connecting to ${service}:`, error);
      const errorMessage = error instanceof Error ? error.message : `An unknown error occurred while connecting to ${service}.`;
      toast({ title: `Connection Failed (Mock)`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (service: 'google' | 'outlook') => {
    // In a real app, this would call an API to revoke tokens and update backend
    if (service === 'google') {
      setGoogleConnected(false);
    } else {
      setOutlookConnected(false);
    }
    toast({ title: `${service.charAt(0).toUpperCase() + service.slice(1)} Calendar Disconnected (Mock)`, variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div>
        {googleConnected ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center">
              <GoogleIcon />
              <span>Google Calendar Connected</span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
            </div>
            <Button variant="link" size="sm" onClick={() => handleDisconnect('google')} className="text-destructive">Disconnect</Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleConnect('google')} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isConnecting === 'google' || !account}
          >
            <GoogleIcon /> {isConnecting === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        )}
      </div>
      <div>
        {outlookConnected ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center">
              <OutlookIcon />
              <span>Outlook Calendar Connected</span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
            </div>
            <Button variant="link" size="sm" onClick={() => handleDisconnect('outlook')} className="text-destructive">Disconnect</Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleConnect('outlook')} 
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isConnecting === 'outlook' || !account}
          >
            <OutlookIcon /> {isConnecting === 'outlook' ? 'Connecting...' : 'Connect Outlook Calendar'}
          </Button>
        )}
      </div>
       {!googleConnected && !outlookConnected && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Connect your calendar to automatically manage your booking availability.
        </p>
      )}
       {(!account && (isConnecting === 'google' || isConnecting === 'outlook')) && (
        <p className="text-xs text-destructive text-center pt-2">
          Please connect your wallet to manage calendar integrations.
        </p>
      )}
    </div>
  );
}
