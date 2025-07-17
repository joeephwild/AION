
'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount } from "thirdweb/react";
import apiCalendar from "@/lib/google-calendar";

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

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export function CalendarConnect({ onConnectionChange }: { onConnectionChange: (isConnected: boolean) => void }) {
  const account = useActiveAccount();
  const { toast } = useToast();

  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check if the Google API script has loaded.
    const checkGapiReady = () => {
      if (window.gapi) {
        setIsGoogleApiLoaded(true);
        // Set initial sign-in state once the API is loaded
        const signedIn = apiCalendar.sign;
        setIsGoogleSignedIn(signedIn);
        onConnectionChange(signedIn);
      } else {
        setTimeout(checkGapiReady, 100); // Check again shortly
      }
    };
    checkGapiReady();
  }, [onConnectionChange]);
  
  const handleGoogleConnect = () => {
    setIsUpdating(true);
    apiCalendar.handleAuthClick()
      .then(() => {
        setIsGoogleSignedIn(true);
        onConnectionChange(true);
        toast({ title: "Success", description: "Google Calendar connected." });
      })
      .catch((e) => {
        console.error("Google Sign-In Error", e);
        toast({ title: "Error", description: "Failed to sign in with Google.", variant: "destructive" });
        setIsGoogleSignedIn(false);
        onConnectionChange(false);
    })
    .finally(() => {
        setIsUpdating(false);
    });
  };

  const handleGoogleDisconnect = () => {
    setIsUpdating(true);
    apiCalendar.handleSignoutClick();
    setIsGoogleSignedIn(false);
    onConnectionChange(false);
    setIsUpdating(false);
    toast({ title: "Success", description: "Google Calendar disconnected." });
  };

  // Mock handler for Outlook
  const handleOutlookToggle = async () => {
    toast({ title: "Note", description: "Outlook Calendar integration is not implemented in this prototype." });
  };
  
  if (!isGoogleApiLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">API Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div>
        {isGoogleSignedIn ? (
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div className="flex items-center overflow-hidden">
              <GoogleIcon />
              <span className="truncate" title={'Google Connected'}>
                Google Connected
              </span>
              <CheckCircle className="ml-2 h-5 w-5 text-green-500 flex-shrink-0" />
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={handleGoogleDisconnect}
              className="text-destructive"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleGoogleConnect}
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={isUpdating || !account || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY}
            title={!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY ? "Google integration not configured by admin" : "Connect Google Calendar"}
          >
            {isUpdating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <GoogleIcon />}
            {isUpdating ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        )}
         {(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) && (
           <p className="text-xs text-muted-foreground text-center pt-1">Google Calendar integration not configured.</p>
         )}
      </div>
      <div>
          <Button
            onClick={handleOutlookToggle}
            className="w-full justify-start bg-card hover:bg-muted/50 text-foreground border shadow-sm"
            disabled={true}
            title="Outlook integration is not yet available"
          >
            <OutlookIcon />
            Connect Outlook Calendar
          </Button>
      </div>
    </div>
  );
}
