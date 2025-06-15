
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, DollarSign, CheckCircle, AlertTriangle, Clock, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { Creator, CalendarEvent, CreatorPublicProfile, Token } from "@/types";
import { useActiveAccount } from "thirdweb/react";

// Mock availability - This would be fetched from the creator's actual calendar in a real app
const mockAvailability: CalendarEvent[] = [
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 2) + 9 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 2) + 10 * 3600000) },
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 2) + 11 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 2) + 12 * 3600000) },
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 3) + 14 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 3) + 15 * 3600000) },
];

// Mock token data, this should ideally be fetched on-chain if possible,
// or managed via creator's dashboard and stored in their profile.
// For now, we'll associate it based on creatorId if profile is fetched.
const getMockTokensForCreator = (creatorId: string): Token[] => {
  if (creatorId) { // Check if creatorId is truthy
    return [{ id: `0xMockTokenFor_${creatorId.slice(0,10)}`, name: '1-Hour Consultation Token', symbol: 'ACT', creatorId: creatorId, totalSupply: 100n }];
  }
  return [];
};


export default function BookingPage() {
  const params = useParams();
  const creatorIdParam = params.creatorId as string; 
  
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;

  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null);
  const [hasRequiredToken, setHasRequiredToken] = useState(false); 
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(null);

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
          const fetchedProfile = data.profile as CreatorPublicProfile;
          // Combine fetched profile with mock tokens for now
          setCreator({
            ...fetchedProfile,
            tokens: getMockTokensForCreator(fetchedProfile.id),
          });
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

  useEffect(() => {
    if (isConnected && address && creator && creator.tokens.length > 0) {
      // Mock token check: In a real app, query the blockchain for token balance
      // For now, assume user has the first token if it exists for the creator
      setHasRequiredToken(true); 
    } else {
      setHasRequiredToken(false);
    }
  }, [isConnected, address, creator]);

  const handleBookSlot = async (slot: CalendarEvent) => {
    if (!isConnected || !address) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to book a session.", variant: "destructive" });
      return;
    }
    if (!creator || !creator.tokens || creator.tokens.length === 0) {
       toast({ title: "Booking Error", description: "Creator or token information is missing.", variant: "destructive" });
      return;
    }
    if (!hasRequiredToken) {
      toast({
        title: "Token Required",
        description: `You need a "${creator.tokens[0].name}" to book this session.`,
        variant: "destructive",
        action: <Button onClick={() => alert(`Redirect to buy ${creator.tokens[0].symbol}`)}>Buy Token</Button>
      });
      return;
    }
    
    setSelectedSlot(slot);
    setIsBooking(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': address, // clientId is the booker's address
        },
        body: JSON.stringify({
          creatorId: creator.id,
          tokenId: creator.tokens[0].id, // Use the first token for now
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Booking Confirmed!",
          description: `Your session with ${creator.name} on ${slot.start.toLocaleDateString()} at ${slot.start.toLocaleTimeString()} is confirmed.`,
        });
        // Optionally, clear selected slot or refresh availability
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
      setIsBooking(false);
      setSelectedSlot(null); // Clear selection after attempt
    }
  };
  
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
            {creator.tokens && creator.tokens.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md text-center">
                <p className="text-sm font-semibold">Requires: <span className="text-primary">{creator.tokens[0].name} ({creator.tokens[0].symbol})</span></p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {!isConnected && (
          <Card className="bg-primary/10 border-primary/30 shadow-lg">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Connect your wallet to check token status and book sessions.</p>
            </CardContent>
          </Card>
        )}
        {isConnected && creator.tokens.length > 0 && !hasRequiredToken && (
           <Card className="bg-destructive/10 border-destructive/30 shadow-lg">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold">You don't have the required <span className="text-primary">{creator.tokens[0].name}</span>.</p>
              <Button variant="link" className="mt-2 text-accent hover:text-primary" onClick={() => alert(`Redirect to buy ${creator.tokens[0].symbol}`)}>
                <DollarSign className="mr-2 h-4 w-4" /> Acquire Token
              </Button>
            </CardContent>
          </Card>
        )}
         {isConnected && creator.tokens.length > 0 && hasRequiredToken && (
           <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
            <CardContent className="pt-6 text-center flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
              <p className="font-semibold text-green-400">You hold the required token!</p>
            </CardContent>
          </Card>
        )}
         {creator.tokens.length === 0 && (
             <Card className="bg-muted/20 border-border shadow-md">
                <CardContent className="pt-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold text-muted-foreground">This creator has not set up any specific tokens for booking yet.</p>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Booking Calendar Section */}
      <div className="md:col-span-2">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><Calendar className="h-7 w-7 text-primary" /> Book a Session</CardTitle>
            <CardDescription>Select an available time slot from {creator.name || 'the creator'}'s calendar. <br /><span className="text-xs text-accent/80 flex items-center mt-1"><Info size={14} className="mr-1"/> Availability shown is for demonstration purposes. Actual bookings use this data.</span></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-2">Available Slots (Mock Data):</h3>
              {mockAvailability.length > 0 ? mockAvailability.map((slot, index) => (
                <Card 
                  key={index} 
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedSlot === slot ? 'ring-2 ring-primary bg-primary/10' : 'bg-background'}`}
                  onClick={() => setSelectedSlot(slot)} // Select first, then book via button
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{slot.start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {slot.end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleBookSlot(slot); }} // Prevent card click, handle booking
                      variant={selectedSlot === slot ? "default" : "outline"} 
                      size="sm"
                      disabled={!isConnected || (creator.tokens.length > 0 && !hasRequiredToken) || isBooking || !creator}
                    >
                      {isBooking && selectedSlot === slot ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedSlot === slot ? "Confirm Booking" : "Book Slot")}
                    </Button>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-8">
                  <Image src="https://placehold.co/300x200.png" data-ai-hint="empty calendar" alt="No availability" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                  <p className="text-muted-foreground">This creator has no available slots at the moment. Please check back later.</p>
                </div>
              )}
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

