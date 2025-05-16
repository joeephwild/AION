
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect } from "react";
import { Save, AlertTriangle, CalendarClock, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

// Mock data for current availability settings
const mockSettings = {
  workingHours: [
    { day: "Monday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Thursday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Friday", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "Saturday", enabled: false, startTime: "10:00", endTime: "14:00" },
    { day: "Sunday", enabled: false, startTime: "10:00", endTime: "14:00" },
  ],
  bufferTime: 15, // minutes
  minNoticeTime: 24, // hours
};

type WorkingHour = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export default function AvailabilityPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(mockSettings.workingHours);
  const [bufferTime, setBufferTime] = useState<number>(mockSettings.bufferTime);
  const [minNoticeTime, setMinNoticeTime] = useState<number>(mockSettings.minNoticeTime);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (isConnected && address) {
      // In a real app, fetch user's availability settings
      setIsLoading(false);
    } else if (!isConnected) {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const handleWorkingHourChange = (day: string, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours(prev => 
      prev.map(wh => wh.day === day ? { ...wh, [field]: value } : wh)
    );
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    // Mock save operation
    setTimeout(() => {
      toast({
        title: "Settings Saved!",
        description: "Your availability settings have been updated. (Mock)",
      });
      setIsSaving(false);
    }, 1500);
  };

  if (isLoading) {
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
          Define your working hours, set buffer times, and manage your calendar.
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>Set your typical weekly availability. (Mock Interface)</CardDescription>
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
              <CardDescription>Configure buffer times and notice periods. (Mock Interface)</CardDescription>
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
              <CardTitle>Calendar View (Mock)</CardTitle>
              <CardDescription>Visualize your schedule. This is a non-interactive mock.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {/* In a real app, this would be a fully interactive calendar showing events */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled // Make it non-interactive for mock
              />
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Your connected calendars (Google/Outlook) would populate this view.</p>
            </CardFooter>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Override Availability</CardTitle>
                <CardDescription>Block specific dates or times. (Mock Interface)</CardDescription>
            </CardHeader>
            <CardContent>
                <Image src="https://placehold.co/300x180.png" data-ai-hint="calendar date picker" alt="Date picker mock" width={300} height={180} className="mx-auto rounded-md opacity-70" />
                <p className="text-sm text-muted-foreground mt-2 text-center">Interface for adding date overrides would be here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
