
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
import { Save, AlertTriangle, CalendarClock, Clock, List, CalendarIcon as LucideCalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WorkingHour, AvailabilitySettings, CalendarEvent } from "@/types";
import { format } from "date-fns";
import { gapi } from 'gapi-script'; // Import gapi

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
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly';


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
  const [outlookCalendarEvents, setOutlookCalendarEvents] = useState<CalendarEvent[]>([]); // For mock Outlook events
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isGoogleAuthLoaded, setIsGoogleAuthLoaded] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  const initGoogleClient = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) return;
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
      }).then(() => {
        setIsGoogleAuthLoaded(true);
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance) {
          setIsGoogleSignedIn(authInstance.isSignedIn.get());
          authInstance.isSignedIn.listen(setIsGoogleSignedIn);
        }
      }).catch(error => console.error("Error initializing Google API client for events page:", error));
    });
  }, []);

  useEffect(() => {
    initGoogleClient();
  }, [initGoogleClient]);

  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!isGoogleSignedIn || !isGoogleAuthLoaded || !gapi.client?.calendar) {
      setGoogleCalendarEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    try {
      // @ts-ignore // gapi.client.calendar might not be typed perfectly by @types/gapi
      const response = await gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
      });
      
      const events = response.result.items.map((event: any) => ({
        title: event.summary || 'No Title',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        isAllDay: !!event.start.date, // If only date is present, it's an all-day event
      }));
      setGoogleCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast({ title: "Error Fetching Google Events", description: "Could not load Google Calendar events.", variant: "destructive" });
      setGoogleCalendarEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isGoogleSignedIn, isGoogleAuthLoaded, toast]);


  useEffect(() => {
    // Fetch availability settings from mock DB
    async function fetchAvailabilitySettings() {
      if (isConnected && address) {
        setIsLoadingSettings(true);
        try {
          const response = await fetch(`/api/availability`, { headers: { 'x-user-id': address } });
          const data = await response.json();
          if (data.success && data.settings) {
            setWorkingHours(data.settings.workingHours);
            setBufferTime(data.settings.bufferTime);
            setMinNoticeTime(data.settings.minNoticeTime);
          } else {
            setWorkingHours(defaultSettings.workingHours);
            setBufferTime(defaultSettings.bufferTime);
            setMinNoticeTime(defaultSettings.minNoticeTime);
          }
        } catch (error) {
          console.error("Failed to fetch availability settings:", error);
          toast({ title: "Error", description: "Could not load availability settings.", variant: "destructive" });
        } finally {
          setIsLoadingSettings(false);
        }
      } else if (!isConnected) {
        setIsLoadingSettings(false);
        setWorkingHours(defaultSettings.workingHours);
        setBufferTime(defaultSettings.bufferTime);
        setMinNoticeTime(defaultSettings.minNoticeTime);
        setGoogleCalendarEvents([]);
        setOutlookCalendarEvents([]);
      }
    }
    fetchAvailabilitySettings();
  }, [isConnected, address, toast]);

  // Fetch mock Outlook events and potentially real Google events
 useEffect(() => {
    async function fetchEvents() {
      if (isConnected && address) {
        setIsLoadingEvents(true);
        // Fetch mock outlook events
        try {
          const response = await fetch(`/api/calendar/events?creatorId=${address}`);
          const data = await response.json();
          if (data.success && Array.isArray(data.events)) {
            const outlookEvents = data.events
              .filter((event: any) => event.title.includes('Outlook')) // Crude filter for mock
              .map((event: any) => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
              }));
            setOutlookCalendarEvents(outlookEvents);
          } else {
            setOutlookCalendarEvents([]);
          }
        } catch (error) {
          console.error("Failed to fetch mock calendar events:", error);
          setOutlookCalendarEvents([]);
        }

        // Fetch Google events if signed in
        if (isGoogleSignedIn && isGoogleAuthLoaded) {
          await fetchGoogleCalendarEvents();
        } else {
          setGoogleCalendarEvents([]); // Clear if not signed in
        }
        setIsLoadingEvents(false);
      }
    }
    fetchEvents();
  }, [isConnected, address, toast, isGoogleSignedIn, isGoogleAuthLoaded, fetchGoogleCalendarEvents]);

  // Listen for custom events from CalendarConnect component
  useEffect(() => {
    const handleGoogleConnected = () => {
        initGoogleClient(); // Re-initialize or check sign-in status
        // Small delay to allow gapi state to update before fetching
        setTimeout(() => fetchGoogleCalendarEvents(), 500);
    };
    const handleGoogleDisconnected = () => {
      setIsGoogleSignedIn(false);
      setGoogleCalendarEvents([]);
    };

    window.addEventListener('googleCalendarConnected', handleGoogleConnected);
    window.addEventListener('googleCalendarDisconnected', handleGoogleDisconnected);

    return () => {
      window.removeEventListener('googleCalendarConnected', handleGoogleConnected);
      window.removeEventListener('googleCalendarDisconnected', handleGoogleDisconnected);
    };
  }, [fetchGoogleCalendarEvents, initGoogleClient]);


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
        toast({ title: "Settings Saved!", description: "Your availability settings have been updated." });
      } else {
        throw new Error(result.message || "Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving availability settings:", error);
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const allCalendarEvents = [...googleCalendarEvents, ...outlookCalendarEvents].sort((a,b) => a.start.getTime() - b.start.getTime());


  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Clock className="h-8 w-8 animate-spin text-primary" />
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
          Define your working hours, connect calendars, and manage your schedule.
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
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Availability Settings"}
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
                {!GOOGLE_CLIENT_ID && <span className="text-xs text-destructive block mt-1">Google Calendar integration not configured by admin.</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-4">
                  <Clock className="h-6 w-6 animate-spin text-primary" />
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
                      {event.title.toLowerCase().includes('google') && <span className="text-xs text-blue-500"> (Google)</span>}
                      {event.title.toLowerCase().includes('outlook') && <span className="text-xs text-blue-400"> (Outlook Mock)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <List className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">
                    {isGoogleSignedIn ? "No upcoming events found." : "Connect your Google Calendar to see events."}
                  </p>
                   <p className="text-xs text-muted-foreground mt-1">Mock Outlook events are shown if Outlook is connected via dashboard.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">Real Google Calendar integration requires server-side token handling for production.</p>
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

