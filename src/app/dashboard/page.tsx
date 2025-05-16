'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PlusCircle, CalendarDays, ListChecks, Settings, ExternalLink, Edit3, Eye, Zap } from "lucide-react"; // Added Zap
import { CalendarConnect } from "@/components/core/calendar-connect";
import Image from "next/image";
import type { Token, Booking } from "@/types";
import { useState, useEffect } from "react";
import { useActiveAccount } from "@thirdweb-dev/react";


const mockTokens: Token[] = [
  { id: '0x123...', name: '1-Hour Consultation', symbol: 'CONSULT', creatorId: '0xCreator', totalSupply: 100n },
  { id: '0x456...', name: '30-Min Quick Chat', symbol: 'CHAT30', creatorId: '0xCreator', totalSupply: 500n },
];

const mockBookings: Booking[] = [
  { id: 'booking1', creatorId: '0xCreator', clientId: '0xClient1', tokenId: '0x123...', startTime: new Date(Date.now() + 86400000 * 2), endTime: new Date(Date.now() + 86400000 * 2 + 3600000), status: 'confirmed' },
  { id: 'booking2', creatorId: '0xCreator', clientId: '0xClient2', tokenId: '0x456...', startTime: new Date(Date.now() + 86400000 * 3), endTime: new Date(Date.now() + 86400000 * 3 + 1800000), status: 'pending' },
];


export default function DashboardPage() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  const isConnected = !!address;

  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (isConnected && address) {
      // In a real app, fetch tokens and bookings for the connected user (address)
      setUserTokens(mockTokens); 
      setUserBookings(mockBookings); 
    } else {
      setUserTokens([]);
      setUserBookings([]);
    }
  }, [isConnected, address]);


  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">Please connect your wallet to access your creator dashboard.</p>
        {/* ConnectWalletButton is in Header */}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your time tokens, calendar, and bookings.</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-primary/30">
          <Link href="/mint">
            <PlusCircle className="mr-2 h-5 w-5" /> Mint New Token
          </Link>
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* My Tokens Section */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> My Time Tokens</CardTitle>
            <CardDescription>View and manage your minted ERC-20 time tokens.</CardDescription>
          </CardHeader>
          <CardContent>
            {userTokens.length > 0 ? (
              <ul className="space-y-4">
                {userTokens.map(token => (
                  <li key={token.id} className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{token.name} ({token.symbol})</h3>
                        <p className="text-sm text-muted-foreground">Contract: {`${token.id.slice(0,10)}...${token.id.slice(-8)}`}</p>
                        <p className="text-sm text-muted-foreground">Total Supply: {token.totalSupply.toString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" aria-label="View Token">
                           <Eye className="h-4 w-4 text-accent" />
                        </Button>
                         <Button variant="outline" size="icon" aria-label="Edit Token">
                           <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Image src="https://placehold.co/300x200.png" data-ai-hint="empty state tokens" alt="No tokens" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                <p className="text-muted-foreground">You haven't minted any tokens yet.</p>
                <Button variant="link" asChild className="text-primary hover:text-accent">
                  <Link href="/mint">Mint your first token</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Integration Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" /> Calendar Integration</CardTitle>
            <CardDescription>Connect your calendars to manage your availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarConnect />
          </CardContent>
          <CardFooter>
             <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" /> Manage Availability
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* My Bookings Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" /> My Bookings</CardTitle>
          <CardDescription>View and manage upcoming and past bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {userBookings.length > 0 ? (
            <ul className="space-y-4">
              {userBookings.map(booking => (
                <li key={booking.id} className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-semibold">Booking with {`${booking.clientId.slice(0,6)}...${booking.clientId.slice(-4)}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Token: {mockTokens.find(t => t.id === booking.tokenId)?.name || 'Unknown Token'}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center py-8">
                <Image src="https://placehold.co/300x200.png" data-ai-hint="empty state bookings" alt="No bookings" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                <p className="text-muted-foreground">No bookings found.</p>
              </div>
          )}
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full sm:w-auto">
                View All Bookings <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
