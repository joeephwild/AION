'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar as ShadCNCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect, useCallback } from "react";
import { Save, AlertTriangle, CalendarClock, Clock, List, CalendarIcon as LucideCalendarIcon, Loader2 } from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";
import type { WorkingHour, AvailabilitySettings, CalendarEvent } from "@/types";
import { format } from "date-fns";
import { apiCalendar } from '@/lib/google-calendar';

const defaultSettings: AvailabilitySettings = {
  workingHours: [
    { day: "Monday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Thursday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Friday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Saturday", enabled: false, startTime: "10:00", endTime: "14:00" },
    { day: "Sunday", enabled: false, startTime: "10:00", endTime: "14:00" },
  ],
  bufferTime: 15,
  minNoticeTime: 24,
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;


export default function AvailabilityPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(defaultSettings.workingHours);
  const [bufferTime, setBufferTime] = useState<number>(defaultSettings.bufferTime);
  const [minNoticeTime, setMinNoticeTime] = useState<number>(defaultSettings.minNoticeTime);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<CalendarEvent[]>([]);
  const [outlookCalendarEvents, setOutlookCalendarEvents] = useState<CalendarEvent[]>([]); 
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!isGoogleSignedIn || !apiCalendar || !GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      setGoogleCalendarEvents([]);
      if (isGoogleSignedIn && (!apiCalendar || typeof apiCalendar.listUpcomingEvents !== 'function')) {
        console.warn("fetchGoogleCalendarEvents: apiCalendar or listUpcomingEvents is not available when expected.");
      }
      return;
    }

    if (typeof apiCalendar.listUpcomingEvents !== 'function') {
      console.error("fetchGoogleCalendarEvents: apiCalendar.listUpcomingEvents is not a function.", { currentApiCalendar: apiCalendar });
      toast({ title: "Error Fetching Google Events", description: "Calendar library function not available.", variant: "destructive" });
      setGoogleCalendarEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    try {
      console.log("Attempting to fetch Google Calendar events...");
      const response: any = await apiCalendar.listUpcomingEvents(10); // Fetches next 10 events
      console.log("Google Calendar API raw response:", response);

      if (response && response.result && Array.isArray(response.result.items)) {
        const events = response.result.items.map((event: any) => ({
          title: event.summary || 'No Title (Google)',
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          isAllDay: !!event.start.date, // Check if it's an all-day event
        }));
        setGoogleCalendarEvents(events);
        console.log("Fetched Google Calendar events:", events);
      } else if (response && response.result && response.result.error) {
        const err = response.result.error;
        const errorMessage = err.message || "Unknown error from Google Calendar API.";
        console.error('Google Calendar API returned an error in response.result:', err);
        toast({ title: "Google Calendar API Error", description: errorMessage, variant: "destructive" });
        setGoogleCalendarEvents([]);
      }
       else {
        console.warn("Google Calendar API response did not contain expected items array or error structure:", response);
        // toast({ title: "No Google Events", description: "No upcoming events found or response malformed.", variant: "default" });
        setGoogleCalendarEvents([]);
      }
    } catch (error: any) {
      console.error('Error fetching Google Calendar events (raw error):', error);
      let description = "Could not load Google Calendar events.";
      let detailedError = "";

      if (error instanceof Error) {
        description = error.message;
        detailedError = error.stack || "";
      } else if (typeof error === 'object' && error !== null) {
        if (error.result && error.result.error && error.result.error.message) {
          description = error.result.error.message;
        } else if ('message' in error) {
           description = String(error.message);
        } else if ('error' in error && typeof error.error === 'object' && error.error !== null && 'message' in error.error) {
           description = String(error.error.message);
        } else if ('error' in error && typeof error.error === 'string') {
            description = error.error;
        }
        try {
          detailedError = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch (e) {
          detailedError = "Could not stringify error object.";
        }
      } else if (typeof error === 'string') {
        description = error;
        detailedError = error;
      }
      
      console.error('Processed error details:', { description, detailedError });
      toast({ title: "Error Fetching Google Events", description, variant: "destructive" });
      setGoogleCalendarEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isGoogleSignedIn, toast]);


  useEffect(() => {
    async function fetchAvailabilitySettings() {
      if (isConnected && address) {
        setIsLoadingSettings(true);
        try {
          const response = await fetch(`/api/availability`, { headers: { 'x-user-id': address } });
          const data = await response.json();
          if (data.success && data.settings) {
            setWorkingHours(data.settings.workingHours || defaultSettings.workingHours);
            setBufferTime(data.settings.bufferTime || defaultSettings.bufferTime);
            setMinNoticeTime(data.settings.minNoticeTime || defaultSettings.minNoticeTime);
          } else if (data.success && data.settings === null) {
            // User exists but no settings saved yet, use defaults
            setWorkingHours(defaultSettings.workingHours);
            setBufferTime(defaultSettings.bufferTime);
            setMinNoticeTime(defaultSettings.minNoticeTime);
          } else if (!data.success) {
            throw new Error(data.message || "Failed to fetch settings from API");
          }
        } catch (error) {
          console.error("Failed to fetch availability settings:", error);
          toast({ title: "Error", description: "Could not load availability settings. Using defaults.", variant: "destructive" });
          setWorkingHours(defaultSettings.workingHours);
          setBufferTime(defaultSettings.bufferTime);
          setMinNoticeTime(defaultSettings.minNoticeTime);
        } finally {
          setIsLoadingSettings(false);
        }
      } else if (!isConnected) {
        setIsLoadingSettings(false); // Not loading if not connected
        setWorkingHours(defaultSettings.workingHours);
        setBufferTime(defaultSettings.bufferTime);
        setMinNoticeTime(defaultSettings.minNoticeTime);
        setGoogleCalendarEvents([]);
        setOutlookCalendarEvents([]);
        setIsGoogleSignedIn(false);
      }
    }
    fetchAvailabilitySettings();
  }, [isConnected, address, toast]);

 useEffect(() => {
    async function fetchMockOutlookEvents() {
      if (isConnected && address) {
         // This API now checks Firestore for outlook connection status
        const response = await fetch(`/api/calendar/events?creatorId=${address}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.events)) {
          const outlookEventsData = data.events
            .filter((event: any) => event.title && event.title.toLowerCase().includes('outlook')) 
            .map((event: any) => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end),
            }));
          setOutlookCalendarEvents(outlookEventsData);
        } else {
          setOutlookCalendarEvents([]);
        }
      } else {
        setOutlookCalendarEvents([]);
      }
    }
    fetchMockOutlookEvents();
  }, [isConnected, address]);


  useEffect(() => {
    const handleGoogleConnected = () => {
      console.log("AvailabilityPage: googleCalendarConnected event received");
      setIsGoogleSignedIn(true);
      // fetchGoogleCalendarEvents will be called due to isGoogleSignedIn changing
    };
    const handleGoogleDisconnected = () => {
      console.log("AvailabilityPage: googleCalendarDisconnected event received");
      setIsGoogleSignedIn(false);
      setGoogleCalendarEvents([]);
    };

    // Initial check for Google sign-in state, esp. on page load/refresh
    if (typeof window !== 'undefined' && apiCalendar && GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
        const initiallyConnected = localStorage.getItem(`google_calendar_connected_${address}`) === 'true';
        if (initiallyConnected) {
             console.log("AvailabilityPage: Google initially connected via localStorage flag.");
             // Check the library's actual sign-in state once it's loaded
             apiCalendar.onLoad(() => {
                if (apiCalendar.sign) {
                    console.log("AvailabilityPage: apiCalendar.sign is true, setting signedIn and fetching.");
                    setIsGoogleSignedIn(true); // This will trigger fetchGoogleCalendarEvents
                } else {
                    console.log("AvailabilityPage: apiCalendar.sign is false despite localStorage. Resetting.");
                    localStorage.removeItem(`google_calendar_connected_${address}`);
                    setIsGoogleSignedIn(false);
                }
             });
        } else {
            // If not connected via localStorage, still set initialLoadComplete.
            // This helps manage the initial loader for the whole page.
             apiCalendar.onLoad(() => {
                setIsGoogleSignedIn(apiCalendar.sign); // Set based on library state
             });
        }
    } else {
        // If Google integration not possible, mark as not signed in.
        setIsGoogleSignedIn(false);
    }
    
    window.addEventListener('googleCalendarConnected', handleGoogleConnected);
    window.addEventListener('googleCalendarDisconnected', handleGoogleDisconnected);
    
    setInitialLoadComplete(true); // Mark initial setup as complete

    return () => {
      window.removeEventListener('googleCalendarConnected', handleGoogleConnected);
      window.removeEventListener('googleCalendarDisconnected', handleGoogleDisconnected);
    };
  }, [address]); // Only address, as fetchGoogleCalendarEvents is memoized

  // Effect to fetch Google Calendar events when isGoogleSignedIn changes
  useEffect(() => {
    if (isGoogleSignedIn && initialLoadComplete) { // Fetch only if signed in and initial page load has passed relevant checks
      fetchGoogleCalendarEvents();
    }
  }, [isGoogleSignedIn, fetchGoogleCalendarEvents, initialLoadComplete]);

        return () => {
          window.removeEventListener('googleCalendarConnected', handleGoogleConnected);
          window.removeEventListener('googleCalendarDisconnected', handleGoogleDisconnected);
        };
    }
  }, [fetchGoogleCalendarEvents, address]);

  const handleWorkingHourChange = (day: string, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours(prev =>
      prev.map(wh => wh.day === day ? { ...wh, [field]: value } : wh)
    );
  };

  const handleSaveSettings = async () => {
    if (!isConnected || !address) {
      toast({ title: "Error", description: "Please connect your wallet to save settings.", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    try {
      const settingsToSave: AvailabilitySettings = { workingHours, bufferTime, minNoticeTime };
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify(settingsToSave),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Settings Saved!", description: "Your availability settings have been updated in Firestore." });
      } else {
        throw new Error(result.message || "Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving availability settings to Firestore:", error);
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!initialLoadComplete || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading availability settings...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <CalendarClock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Manage Availability</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to configure your booking availability.</p>
           <div className="flex items-center justify-center p-4 mt-4 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Please connect your wallet to proceed.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Availability</h1>
        <p className="text-muted-foreground">
          Define your working hours, connect calendars, and manage your schedule. Settings are saved to Firestore.
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>Set your typical weekly availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workingHours.map(wh => (
                <div key={wh.day} className="grid grid-cols-3 sm:grid-cols-4 items-center gap-3 p-3 border rounded-md">
                  <Label htmlFor={`${wh.day}-enabled`} className="col-span-1 sm:col-span-1 font-medium">{wh.day}</Label>
                  <div className="col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 items-center gap-3">
                    <Switch
                      id={`${wh.day}-enabled`}
                      checked={wh.enabled}
                      onCheckedChange={(checked) => handleWorkingHourChange(wh.day, 'enabled', checked)}
                      className="justify-self-start sm:justify-self-center"
                    />
                    <Input
                      type="time"
                      value={wh.startTime}
                      onChange={(e) => handleWorkingHourChange(wh.day, 'startTime', e.target.value)}
                      disabled={!wh.enabled}
                      className={!wh.enabled ? 'opacity-50' : ''}
                    />
                    <Input
                      type="time"
                      value={wh.endTime}
                      onChange={(e) => handleWorkingHourChange(wh.day, 'endTime', e.target.value)}
                      disabled={!wh.enabled}
                      className={!wh.enabled ? 'opacity-50' : ''}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Booking Preferences</CardTitle>
              <CardDescription>Configure buffer times and notice periods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bufferTime">Buffer time between sessions (minutes)</Label>
                <Select value={bufferTime.toString()} onValueChange={(value) => setBufferTime(parseInt(value))}>
                  <SelectTrigger id="bufferTime">
                    <SelectValue placeholder="Select buffer time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minNoticeTime">Minimum notice time for bookings (hours)</Label>
                 <Select value={minNoticeTime.toString()} onValueChange={(value) => setMinNoticeTime(parseInt(value))}>
                  <SelectTrigger id="minNoticeTime">
                    <SelectValue placeholder="Select notice time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
             <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Availability Settings"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LucideCalendarIcon className="h-5 w-5 text-primary" /> Connected Calendar Events</CardTitle>
              <CardDescription>
                Events from your connected calendars.
                {(!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) && <span className="text-xs text-destructive block mt-1">Google Calendar integration not fully configured by admin.</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading events...</p>
                </div>
              ) : allCalendarEvents.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {allCalendarEvents.map((event, index) => (
                    <li key={index} className="p-3 border rounded-md bg-muted/20">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.start ? format(event.start, "MMM d, yyyy, h:mm a") : 'Date N/A'} - {event.end ? format(event.end, "h:mm a") : 'Time N/A'}
                      </p>
                      {event.title && event.title.toLowerCase().includes('google') && <span className="text-xs text-blue-500"> (Google)</span>}
                      {event.title && event.title.toLowerCase().includes('outlook') && <span className="text-xs text-blue-400"> (Outlook Mock)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <List className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">
                    {isGoogleSignedIn ? "No upcoming Google events found or unable to fetch." : (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY ? "Google Calendar not configured by admin." : "Connect your Google Calendar to see events.")}
                  </p>
                   <p className="text-xs text-muted-foreground mt-1">Mock Outlook events are shown if Outlook is connected.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Google Calendar integration uses `react-google-calendar-api`.
                </p>
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Override Availability</CardTitle>
                <CardDescription>Block specific dates or times. (Mock Interface)</CardDescription>
            </CardHeader>
            <CardContent>
                <ShadCNCalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border mx-auto"
                    disabled // Make it non-interactive for mock
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">Interface for adding date overrides would be here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
