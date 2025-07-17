
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, DollarSign, CheckCircle, AlertTriangle, Clock, Info, Loader2, ListFilter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { CreatorPublicProfile, Coin, Booking, AvailabilitySettings, CalendarEvent as AppCalendarEvent } from "@/types";
import { useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import { client } from "@/lib/thirdweb";
import { baseSepolia } from "thirdweb/chains";
import {
  addDays,
  addHours,
  addMinutes,
  areIntervalsOverlapping,
  differenceInDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  setHours,
  setMinutes,
  startOfDay,
  isSameDay,
} from "date-fns";

const SLOT_DURATION_MINUTES = 60; // Assuming 1-hour slots
const DAYS_TO_SHOW_AVAILABILITY = 7; // Show availability for the next 7 days

interface CalculatedSlot extends AppCalendarEvent {
  // Inherits title, start, end, isAllDay? from AppCalendarEvent
  // No new properties needed for now, but can be extended
}

export default function BookingPage() {
  const params = useParams();
  const creatorIdParam = params.creatorId as string;
  
  const account = useActiveAccount();
  const connectedAddress = account?.address;
  const isWalletConnected = !!connectedAddress;

  const { toast } = useToast();
  
  const [creator, setCreator] = useState<CreatorPublicProfile | null>(null);
  const [creatorCoins, setCreatorCoins] = useState<Coin[]>([]); // Separate from profile, as it's fetched differently
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);
  const [creatorBookings, setCreatorBookings] = useState<Booking[]>([]);
  const [externalCalendarEvents, setExternalCalendarEvents] = useState<AppCalendarEvent[]>([]);
  const [calculatedSlots, setCalculatedSlots] = useState<CalculatedSlot[]>([]);
  
  const [selectedSlot, setSelectedSlot] = useState<CalculatedSlot | null>(null);
  const [hasRequiredCoin, setHasRequiredCoin] = useState(false);
  const [isCheckingCoinBalance, setIsCheckingCoinBalance] = useState(false);
  
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingExternalEvents, setIsLoadingExternalEvents] = useState(true);
  const [isCalculatingSlots, setIsCalculatingSlots] = useState(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);


  // Fetch Creator Profile
  useEffect(() => {
    async function fetchCreatorProfile() {
      if (!creatorIdParam) {
        setIsLoadingCreator(false);
        setCreator(null);
        return;
      }
      setIsLoadingCreator(true);
      try {
        const response = await fetch(`/api/creators/${creatorIdParam}`);
        const data = await response.json();
        if (data.success && data.profile) {
          setCreator(data.profile as CreatorPublicProfile);
        } else {
          setCreator(null);
          toast({ title: "Creator Not Found", description: data.message || "Could not load creator profile.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch creator profile:", error);
        setCreator(null);
        toast({ title: "Error", description: "Could not load creator profile.", variant: "destructive" });
      } finally {
        setIsLoadingCreator(false);
      }
    }
    fetchCreatorProfile();
  }, [creatorIdParam, toast]);

  // Fetch Creator Coins (from Firestore via API)
  useEffect(() => {
    async function fetchCreatorCoins() {
      if (!creatorIdParam) {
        setCreatorCoins([]);
        return;
      }
      try {
        const response = await fetch(`/api/tokens?creatorId=${creatorIdParam}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.coins)) {
           const firestoreCoins: Coin[] = data.coins.map((c: any) => ({
                ...c,
                createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
            }));
            // Potentially enrich with on-chain data if needed here, or assume API returns enough
            setCreatorCoins(firestoreCoins);
        } else {
          setCreatorCoins([]);
          console.error("Failed to fetch creator coins:", data.message);
        }
      } catch (error) {
        console.error("Error fetching creator coins:", error);
        setCreatorCoins([]);
      }
    }
    fetchCreatorCoins();
  }, [creatorIdParam]);


  // Check Coin Balance
  useEffect(() => {
    async function checkCoinBalance() {
      if (!isWalletConnected || !connectedAddress || !creatorCoins.length) {
        setHasRequiredCoin(false);
        return;
      }
      
      const requiredCoin = creatorCoins[0]; // Assuming the first coin is the one needed
      if (!requiredCoin || !requiredCoin.id) {
        setHasRequiredCoin(false);
        return;
      }

      setIsCheckingCoinBalance(true);
      try {
        const contract = getContract({ client, chain: baseSepolia, address: requiredCoin.id as `0x${string}` });
        const balance = await balanceOf({ contract, owner: connectedAddress as `0x${string}` });
        setHasRequiredCoin(balance > 0n);
      } catch (error) {
        console.error("Failed to check coin balance:", error);
        setHasRequiredCoin(false);
        toast({ title: "Coin Check Error", description: "Could not verify your coin balance.", variant: "destructive" });
      } finally {
        setIsCheckingCoinBalance(false);
      }
    }
    checkCoinBalance();
  }, [isWalletConnected, connectedAddress, creatorCoins, toast]);

  // Fetch Availability Settings
  useEffect(() => {
    async function fetchAvailability() {
      if (!creatorIdParam) {
        setIsLoadingAvailability(false);
        return;
      }
      setIsLoadingAvailability(true);
      try {
        const response = await fetch(`/api/availability?creatorId=${creatorIdParam}`);
        const data = await response.json();
        if (data.success && data.settings) {
          setAvailabilitySettings(data.settings as AvailabilitySettings);
        } else if (data.success && data.settings === null) {
           setAvailabilitySettings(null); // Explicitly null if not found
           toast({ title: "Availability Not Set", description: "This creator has not configured their availability.", variant: "default" });
        } else {
          throw new Error(data.message || "Failed to fetch availability settings");
        }
      } catch (error) {
        console.error("Failed to fetch availability settings:", error);
        setAvailabilitySettings(null);
        toast({ title: "Error", description: "Could not load availability settings.", variant: "destructive" });
      } finally {
        setIsLoadingAvailability(false);
      }
    }
    fetchAvailability();
  }, [creatorIdParam, toast]);

  // Fetch Creator's Aion Bookings
  useEffect(() => {
    async function fetchBookings() {
      if (!creatorIdParam) {
        setIsLoadingBookings(false);
        return;
      }
      setIsLoadingBookings(true);
      try {
        const response = await fetch(`/api/bookings?creatorId=${creatorIdParam}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.bookings)) {
          setCreatorBookings(data.bookings.map((b: any) => ({ ...b, startTime: new Date(b.startTime), endTime: new Date(b.endTime) })));
        } else {
          throw new Error(data.message || "Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Failed to fetch creator bookings:", error);
        setCreatorBookings([]);
        toast({ title: "Error", description: "Could not load existing bookings.", variant: "destructive" });
      } finally {
        setIsLoadingBookings(false);
      }
    }
    fetchBookings();
  }, [creatorIdParam, toast]);

  // Fetch External Calendar Events (Mock Outlook for now)
  useEffect(() => {
    async function fetchExternalEvents() {
      if (!creatorIdParam) {
        setIsLoadingExternalEvents(false);
        return;
      }
      setIsLoadingExternalEvents(true);
      try {
        const response = await fetch(`/api/calendar/events?creatorId=${creatorIdParam}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.events)) {
          setExternalCalendarEvents(data.events.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
        } else {
          setExternalCalendarEvents([]);
        }
      } catch (error) {
        console.error("Failed to fetch external calendar events:", error);
        setExternalCalendarEvents([]);
      } finally {
        setIsLoadingExternalEvents(false);
      }
    }
    fetchExternalEvents();
  }, [creatorIdParam]);

  // Calculate Available Slots
  useEffect(() => {
    if (isLoadingAvailability || isLoadingBookings || isLoadingExternalEvents || !availabilitySettings) {
      // Don't calculate if data is missing or still loading, or if no settings defined
      if (!isLoadingAvailability && !availabilitySettings) { // Settings loaded but are null
        setCalculatedSlots([]); // Creator hasn't set availability
        setIsCalculatingSlots(false);
      }
      return;
    }

    setIsCalculatingSlots(true);
    const generatedSlots: CalculatedSlot[] = [];
    const today = startOfDay(new Date());
    const noticeTimeDate = addHours(new Date(), availabilitySettings.minNoticeTime);
    
    const busyIntervals = [
      ...creatorBookings.map(b => ({ start: addMinutes(b.startTime, -availabilitySettings.bufferTime), end: addMinutes(b.endTime, availabilitySettings.bufferTime) })),
      ...externalCalendarEvents.map(e => ({ start: addMinutes(e.start, -availabilitySettings.bufferTime), end: addMinutes(e.end, availabilitySettings.bufferTime) })),
    ];

    for (let i = 0; i < DAYS_TO_SHOW_AVAILABILITY; i++) {
      const currentDate = addDays(today, i);
      const dayOfWeek = format(currentDate, "EEEE"); // "Monday", "Tuesday", etc.
      const workingDay = availabilitySettings.workingHours.find(wh => wh.day === dayOfWeek && wh.enabled);

      if (workingDay) {
        const [startHour, startMinute] = workingDay.startTime.split(':').map(Number);
        const [endHour, endMinute] = workingDay.endTime.split(':').map(Number);

        let slotStart = setMinutes(setHours(currentDate, startHour), startMinute);
        const dayEnd = setMinutes(setHours(currentDate, endHour), endMinute);

        while (isBefore(slotStart, dayEnd)) {
          const slotEnd = addMinutes(slotStart, SLOT_DURATION_MINUTES);
          if (!isAfter(slotEnd, dayEnd) && isAfter(slotStart, noticeTimeDate)) { // Slot must end within working day & be after notice time
            const slotInterval = { start: slotStart, end: slotEnd };
            let isOverlapping = false;
            for (const busyInterval of busyIntervals) {
              if (areIntervalsOverlapping(slotInterval, {start: busyInterval.start, end: busyInterval.end}, { inclusive: false })) {
                isOverlapping = true;
                break;
              }
            }

            if (!isOverlapping) {
              generatedSlots.push({
                title: "Available Slot",
                start: slotStart,
                end: slotEnd,
              });
            }
          }
          slotStart = addMinutes(slotStart, SLOT_DURATION_MINUTES); // Check for next slot
          // More sophisticated would be to advance by slot + buffer, or by fixed increments (e.g. 15/30 min)
        }
      }
    }
    setCalculatedSlots(generatedSlots.sort((a, b) => a.start.getTime() - b.start.getTime()));
    setIsCalculatingSlots(false);

  }, [availabilitySettings, creatorBookings, externalCalendarEvents, isLoadingAvailability, isLoadingBookings, isLoadingExternalEvents]);


  const handleBookSlot = async (slot: CalculatedSlot) => {
    if (!isWalletConnected || !connectedAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to book a session.", variant: "destructive" });
      return;
    }
    if (!creator || !creatorCoins.length) {
       toast({ title: "Booking Error", description: "Creator or coin information is missing.", variant: "destructive" });
      return;
    }
    const requiredCoin = creatorCoins[0];
    if (!hasRequiredCoin) {
      toast({
        title: "Coin Required",
        description: `You need a "${requiredCoin.name}" to book this session.`,
        variant: "destructive",
        action: <Button onClick={() => alert(`Redirect to buy ${requiredCoin.symbol}`)}>Buy Coin</Button> // Placeholder
      });
      return;
    }
    
    setSelectedSlot(slot);
    setIsBookingInProgress(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': connectedAddress, 
        },
        body: JSON.stringify({
          creatorId: creator.id,
          coinId: requiredCoin.id,
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Booking Confirmed!",
          description: `Your session with ${creator.name} on ${format(slot.start, "PPPp")} is confirmed.`,
        });
        // Refetch bookings to update UI
        const bookingsResponse = await fetch(`/api/bookings?creatorId=${creatorIdParam}`);
        const bookingsData = await bookingsResponse.json();
        if (bookingsData.success) {
          setCreatorBookings(bookingsData.bookings.map((b: any) => ({ ...b, startTime: new Date(b.startTime), endTime: new Date(b.endTime) })));
        }
      } else {
        throw new Error(result.message || 'Failed to create booking.');
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsBookingInProgress(false);
      setSelectedSlot(null); 
    }
  };
  
  const overallIsLoading = isLoadingCreator || isLoadingAvailability || isLoadingBookings || isLoadingExternalEvents || isCalculatingSlots;
  const requiredCoinDetails = creatorCoins.length > 0 ? creatorCoins[0] : null;

  if (isLoadingCreator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading creator details...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Creator Not Found</h2>
        <p className="text-muted-foreground">The creator profile for "{creatorIdParam}" could not be loaded or does not exist.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      {/* Creator Info Section */}
      <div className="md:col-span-1 space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
              <AvatarImage src={creator.avatarUrl || `https://avatar.vercel.sh/${creator.id}.png`} alt={creator.name || 'Creator'} data-ai-hint="professional portrait" />
              <AvatarFallback>{creator.name ? creator.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{creator.name || 'Aion Creator'}</CardTitle>
             <CardDescription className="text-sm">{creator.id ? `${creator.id.slice(0,6)}...${creator.id.slice(-4)}` : 'No ID'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">{creator.bio || 'No bio available.'}</p>
            {requiredCoinDetails && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md text-center">
                <p className="text-sm font-semibold">Requires: <span className="text-primary">{requiredCoinDetails.name} ({requiredCoinDetails.symbol})</span></p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {!isWalletConnected && (
          <Card className="bg-primary/10 border-primary/30 shadow-lg">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Connect your wallet to check coin status and book sessions.</p>
            </CardContent>
          </Card>
        )}

        {isWalletConnected && requiredCoinDetails && isCheckingCoinBalance && (
          <Card className="bg-muted/20 border-border shadow-md">
            <CardContent className="pt-6 text-center flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p className="font-semibold text-muted-foreground">Checking coin balance...</p>
            </CardContent>
          </Card>
        )}

        {isWalletConnected && requiredCoinDetails && !isCheckingCoinBalance && !hasRequiredCoin && (
           <Card className="bg-destructive/10 border-destructive/30 shadow-lg">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold">You don't have the required <span className="text-primary">{requiredCoinDetails.name}</span>.</p>
              <Button variant="link" className="mt-2 text-accent hover:text-primary" onClick={() => alert(`Redirect to buy ${requiredCoinDetails.symbol}`)}>
                <DollarSign className="mr-2 h-4 w-4" /> Acquire Coin
              </Button>
            </CardContent>
          </Card>
        )}
         {isWalletConnected && requiredCoinDetails && !isCheckingCoinBalance && hasRequiredCoin && (
           <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
            <CardContent className="pt-6 text-center flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
              <p className="font-semibold text-green-400">You hold the required coin!</p>
            </CardContent>
          </Card>
        )}
         {!requiredCoinDetails && !isLoadingCreator && ( // Show if no coins are set up by creator
             <Card className="bg-muted/20 border-border shadow-md">
                <CardContent className="pt-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold text-muted-foreground">This creator has not set up any specific coins for booking yet.</p>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Booking Calendar Section */}
      <div className="md:col-span-2">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><Calendar className="h-7 w-7 text-primary" /> Book a Session</CardTitle>
            <CardDescription>
              Select an available time slot from {creator.name || 'the creator'}'s calendar.
              {!availabilitySettings && !isLoadingAvailability && <span className="block text-sm text-destructive mt-1">This creator has not set up their availability yet.</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-2">Available Slots:</h3>
              {overallIsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading availability...</p>
                </div>
              )}
              {!overallIsLoading && calculatedSlots.length === 0 && (
                <div className="text-center py-8">
                  <Image src="https://placehold.co/300x200.png" data-ai-hint="empty calendar" alt="No availability" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                  <p className="text-muted-foreground">
                    {(!availabilitySettings && !isLoadingAvailability) 
                      ? `${creator.name || 'This creator'} has not configured their availability settings yet.`
                      : `${creator.name || 'This creator'} has no available slots matching your criteria in the near future. Please check back later.`
                    }
                  </p>
                </div>
              )}
              {!overallIsLoading && calculatedSlots.length > 0 && calculatedSlots.map((slot, index) => (
                <Card 
                  key={index} 
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedSlot?.start.toISOString() === slot.start.toISOString() ? 'ring-2 ring-primary bg-primary/10' : 'bg-background'}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{format(slot.start, "EEEE, MMMM d")}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(slot.start, "p")} - {format(slot.end, "p")}
                      </p>
                    </div>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleBookSlot(slot); }}
                      variant={selectedSlot?.start.toISOString() === slot.start.toISOString() ? "default" : "outline"} 
                      size="sm"
                      disabled={!isWalletConnected || (!!requiredCoinDetails && !hasRequiredCoin) || isBookingInProgress || isCheckingCoinBalance}
                    >
                      {isBookingInProgress && selectedSlot?.start.toISOString() === slot.start.toISOString() ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedSlot?.start.toISOString() === slot.start.toISOString() ? "Confirm Booking" : "Book Slot")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <p className="text-xs text-muted-foreground">
                All times are displayed in your local timezone.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
