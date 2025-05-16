
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, DollarSign, CheckCircle, AlertTriangle, Clock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { Creator, CalendarEvent } from "@/types";
import { useActiveAccount } from "thirdweb/react";

// Mock creator data
const mockCreator: Creator = {
  id: '0xCreatorAddressPlaceholder',
  name: 'Alex Chen',
  bio: 'Experienced Web3 consultant and smart contract developer. Book a session to discuss your project.',
  avatarUrl: 'https://placehold.co/128x128.png',
  tokens: [{ id: '0xTokenContract', name: '1-Hour Consultation Token', symbol: 'ACT', creatorId: '0xCreatorAddressPlaceholder', totalSupply: 100n }],
  calendarIntegrations: { google: true, outlook: false },
};

// Mock availability - This would be fetched from the creator's actual calendar in a real app
const mockAvailability: CalendarEvent[] = [
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 2) + 9 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 2) + 10 * 3600000) },
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 2) + 11 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 2) + 12 * 3600000) },
  { title: 'Available Slot', start: new Date(new Date().setDate(new Date().getDate() + 3) + 14 * 3600000), end: new Date(new Date().setDate(new Date().getDate() + 3) + 15 * 3600000) },
];


export default function BookingPage() {
  const params = useParams();
  const creatorId = params.creatorId as string; 
  
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;

  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<CalendarEvent | null>(null);
  const [hasRequiredToken, setHasRequiredToken] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching creator data
    setTimeout(() => {
      if (creatorId === 'alex-chen-web3') { // Use a mock slug or ID
        setCreator(mockCreator);
      } else {
        // In a real app, you'd fetch this from a backend/database
        // For now, handle as "not found" for other IDs
        setCreator(null);
      }
      setIsLoading(false);
    }, 1000);
  }, [creatorId]);

  useEffect(() => {
    if (isConnected && address && creator) {
      // Mock token check: In a real app, query the blockchain for token balance
      setHasRequiredToken(true); // Assume user has token for mock purposes
    } else {
      setHasRequiredToken(false);
    }
  }, [isConnected, address, creator]);

  const handleBookSlot = (slot: CalendarEvent) => {
    if (!isConnected) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to book a session.", variant: "destructive" });
      return;
    }
    if (!creator || creator.tokens.length === 0) {
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
    // Mock booking confirmation
    toast({
      title: "Booking Confirmed! (Mock)",
      description: `Your session with ${creator.name} on ${slot.start.toLocaleDateString()} at ${slot.start.toLocaleTimeString()} is confirmed. This is a mock confirmation.`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Clock className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading creator details...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Creator Not Found</h2>
        <p className="text-muted-foreground">The creator you are looking for does not exist or is unavailable.</p>
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
            <CardDescription className="text-sm">{`${creator.id.slice(0,6)}...${creator.id.slice(-4)}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">{creator.bio || 'No bio available.'}</p>
            {creator.tokens.length > 0 && (
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
        {isConnected && !hasRequiredToken && creator.tokens.length > 0 && (
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
         {isConnected && hasRequiredToken && (
           <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
            <CardContent className="pt-6 text-center flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
              <p className="font-semibold text-green-400">You hold the required token!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking Calendar Section */}
      <div className="md:col-span-2">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><Calendar className="h-7 w-7 text-primary" /> Book a Session</CardTitle>
            <CardDescription>Select an available time slot from {creator.name || 'the creator'}'s calendar. <br /><span className="text-xs text-accent/80 flex items-center mt-1"><Info size={14} className="mr-1"/> Availability shown is for demonstration purposes.</span></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-2">Available Slots (Mock Data):</h3>
              {mockAvailability.length > 0 ? mockAvailability.map((slot, index) => (
                <Card 
                  key={index} 
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedSlot === slot ? 'ring-2 ring-primary bg-primary/10' : 'bg-background'}`}
                  onClick={() => handleBookSlot(slot)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{slot.start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {slot.end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button 
                      variant={selectedSlot === slot ? "default" : "outline"} 
                      size="sm"
                      disabled={!isConnected || !hasRequiredToken}
                    >
                      {selectedSlot === slot ? "Selected" : "Book Slot"}
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
