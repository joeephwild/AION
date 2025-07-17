
'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, AlertTriangle, Loader2, CalendarX2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Booking, CreatorPublicProfile } from "@/types";

const BookingCard = ({ booking, perspective, profile, onCancel, isCancelling }: {
  booking: Booking;
  perspective: 'creator' | 'client';
  profile?: CreatorPublicProfile;
  onCancel: (bookingId: string) => void;
  isCancelling: boolean;
}) => {
  const isPast = new Date() > booking.endTime;
  const otherPartyAddress = perspective === 'creator' ? booking.clientId : booking.creatorId;
  const otherPartyProfile = profile;

  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
      default: return 'secondary';
    }
  };

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {perspective === 'creator' ? 'Session with Client' : `Session with ${otherPartyProfile?.name || 'Creator'}`}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={otherPartyProfile?.avatarUrl} alt={otherPartyProfile?.name || 'Avatar'} data-ai-hint="person avatar" />
                <AvatarFallback>{otherPartyProfile?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <span className="truncate" title={otherPartyAddress}>{otherPartyProfile?.name || `${otherPartyAddress.slice(0, 6)}...${otherPartyAddress.slice(-4)}`}</span>
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusBadgeVariant(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm space-y-2">
          <p><strong>Date:</strong> {format(booking.startTime, "EEEE, MMMM d, yyyy")}</p>
          <p><strong>Time:</strong> {format(booking.startTime, "p")} - {format(booking.endTime, "p")}</p>
          <p className="truncate"><strong>Coin Used:</strong> <Link href={`https://sepolia.basescan.org/token/${booking.coinId}`} target="_blank" className="text-accent hover:underline">{booking.coinId}</Link></p>
        </div>
      </CardContent>
      {!isPast && booking.status === 'confirmed' && (
        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onCancel(booking.id)}
            disabled={isCancelling}
          >
            {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarX2 className="mr-2 h-4 w-4" />}
            Cancel Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};


export default function BookingsPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [hostedBookings, setHostedBookings] = useState<Booking[]>([]);
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Record<string, CreatorPublicProfile>>({});
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const fetchBookings = useCallback(async (type: 'creator' | 'client') => {
    if (!address) return [];
    try {
      const response = await fetch(`/api/bookings?${type}Id=${address}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        return data.bookings.map((b: any) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
      }
      throw new Error(data.message || `Failed to fetch ${type} bookings.`);
    } catch (error) {
      toast({ title: "Error", description: `Could not load your ${type} bookings.`, variant: "destructive" });
      return [];
    }
  }, [address, toast]);

  useEffect(() => {
    if (address) {
      setIsLoading(true);
      Promise.all([
        fetchBookings('creator'),
        fetchBookings('client')
      ]).then(([hosted, client]) => {
        setHostedBookings(hosted);
        setClientBookings(client);
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [address, fetchBookings]);

  useEffect(() => {
    const fetchProfiles = async (ids: string[]) => {
      const uniqueIds = [...new Set(ids)].filter(id => !profiles[id] && id);
      if (uniqueIds.length === 0) return;

      setIsLoadingProfiles(true);
      const fetchedProfiles: Record<string, CreatorPublicProfile> = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const res = await fetch(`/api/creators/${id}`);
          const data = await res.json();
          if (data.success) fetchedProfiles[id] = data.profile;
        } catch (e) {
          console.error(`Failed to fetch profile for ${id}`, e);
        }
      }));
      setProfiles(prev => ({ ...prev, ...fetchedProfiles }));
      setIsLoadingProfiles(false);
    };

    const allInvolvedIds = [
      ...hostedBookings.map(b => b.clientId),
      ...clientBookings.map(b => b.creatorId)
    ];

    fetchProfiles(allInvolvedIds);
  }, [hostedBookings, clientBookings, profiles]);


  const handleCancelBooking = async (bookingId: string) => {
    if (!address) return;
    setIsCancelling(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': address,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Booking has been cancelled." });
        // Update local state to reflect cancellation
        const update = (b: Booking) => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b;
        setHostedBookings(prev => prev.map(update));
        setClientBookings(prev => prev.map(update));
      } else {
        throw new Error(result.message || 'Failed to cancel booking');
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not cancel the booking.", variant: "destructive" });
    } finally {
      setIsCancelling(null);
    }
  };

  if (!address) {
    return (
       <Card className="w-full max-w-md mx-auto mt-10 p-8 shadow-xl">
          <CardHeader className="text-center">
            <ListChecks className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Manage Your Bookings</CardTitle>
            <CardDescription>Connect your wallet to see your hosted and booked sessions.</CardDescription>
          </CardHeader>
           <CardContent className="flex items-center justify-center p-4 mt-4 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Please connect your wallet to proceed.
          </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage sessions you are hosting and sessions you have booked.
        </p>
      </div>
      <Tabs defaultValue="hosted" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hosted">Sessions I'm Hosting ({hostedBookings.length})</TabsTrigger>
          <TabsTrigger value="booked">My Booked Sessions ({clientBookings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="hosted" className="mt-6">
          <BookingList
            bookings={hostedBookings}
            perspective="creator"
            profiles={profiles}
            onCancel={handleCancelBooking}
            isCancellingId={isCancelling}
            userId={address}
          />
        </TabsContent>
        <TabsContent value="booked" className="mt-6">
           <BookingList
            bookings={clientBookings}
            perspective="client"
            profiles={profiles}
            onCancel={handleCancelBooking}
            isCancellingId={isCancelling}
            userId={address}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function BookingList({ bookings, perspective, profiles, onCancel, isCancellingId, userId }: {
  bookings: Booking[];
  perspective: 'creator' | 'client';
  profiles: Record<string, CreatorPublicProfile>;
  onCancel: (bookingId: string) => void;
  isCancellingId: string | null;
  userId: string;
}) {

  const { upcoming, past } = useMemo(() => ({
    upcoming: bookings.filter(b => new Date() < b.endTime).sort((a,b) => a.startTime.getTime() - b.startTime.getTime()),
    past: bookings.filter(b => new Date() >= b.endTime).sort((a,b) => b.startTime.getTime() - a.startTime.getTime()),
  }), [bookings]);
  
  if (bookings.length === 0) {
    return (
      <Card className="mt-6 text-center py-12 shadow-md">
        <CardHeader>
            <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Bookings Found</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                You have no {perspective === 'creator' ? 'hosted' : 'booked'} sessions yet.
            </p>
            {perspective === 'creator' ? (
                <Button asChild variant="default" className="mt-4">
                    <Link href={`/book/${userId}`}>View Your Public Booking Page</Link>
                </Button>
            ) : (
                 <Button asChild variant="default" className="mt-4">
                    <Link href="/explore">Explore Creators</Link>
                </Button>
            )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Upcoming Sessions ({upcoming.length})</h3>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                perspective={perspective}
                profile={profiles[perspective === 'creator' ? booking.clientId : booking.creatorId]}
                onCancel={onCancel}
                isCancelling={isCancellingId === booking.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground rounded-lg border border-dashed">
            <CalendarX2 className="h-8 w-8 mx-auto mb-2" />
            <p>No upcoming sessions.</p>
          </div>
        )}
      </div>

       <div>
        <h3 className="text-xl font-semibold mb-4">Past Sessions ({past.length})</h3>
        {past.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                perspective={perspective}
                profile={profiles[perspective === 'creator' ? booking.clientId : booking.creatorId]}
                onCancel={onCancel}
                isCancelling={isCancellingId === booking.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground rounded-lg border border-dashed">
            <CalendarX2 className="h-8 w-8 mx-auto mb-2" />
            <p>No past sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
