'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PlusCircle, CalendarDays, ListChecks, Settings, ExternalLink, Edit3, Eye, Zap, Loader2 } from "lucide-react";
import { CalendarConnect } from "@/components/core/calendar-connect";
import Image from "next/image";
import type { Token, Booking } from "@/types";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useToast } from "@/hooks/use-toast";
import { getCoin } from "@zoralabs/coins-sdk";
import { baseSepolia } from "thirdweb/chains"; // Changed from base to baseSepolia

export default function DashboardPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      if (isConnected && address) {
        setIsLoading(true);
        setIsLoadingTokens(true);
        setIsLoadingBookings(true);

        // Fetch Zora tokens created by user (from localStorage for now)
        try {
          const storedTokensString = localStorage.getItem(`userTokens_${address}`);
          const storedCoinAddresses: { id: string, name: string, symbol: string, uri?: string, creatorId: string }[] = storedTokensString ? JSON.parse(storedTokensString) : [];

          const fetchedTokens: Token[] = [];
          for (const basicTokenInfo of storedCoinAddresses) {
            try {
              // Fetch details from Base Sepolia
              const response = await getCoin({ address: basicTokenInfo.id, chain: baseSepolia.id }); 
              const coinData = response.data?.zora20Token;
              if (coinData) {
                fetchedTokens.push({
                  id: coinData.address,
                  name: coinData.name || basicTokenInfo.name,
                  symbol: coinData.symbol || basicTokenInfo.symbol,
                  creatorId: coinData.creatorAddress || basicTokenInfo.creatorId,
                  totalSupply: coinData.totalSupply?.toString(),
                  uri: coinData?.tokenURI,
                  imageUrl: coinData?.mediaContent?.previewImage as string,
                });
              } else {
                 // Fallback to basic info if getCoin fails or returns no data
                fetchedTokens.push(basicTokenInfo as Token);
              }
            } catch (error) {
              console.warn(`Failed to fetch details for coin ${basicTokenInfo.id} on Base Sepolia:`, error);
              fetchedTokens.push(basicTokenInfo as Token); // Add basic info if detailed fetch fails
            }
          }
          setUserTokens(fetchedTokens.reverse()); // Show newest first
        } catch (error) {
          console.error("Error fetching tokens:", error);
          toast({ title: "Error Fetching Tokens", description: "Could not load your created tokens.", variant: "destructive" });
        } finally {
          setIsLoadingTokens(false);
        }
        
        // Fetch bookings (still from mock for now)
        try {
          const bookingsResponse = await fetch(`/api/bookings?creatorId=${address}`);
          const bookingsData = await bookingsResponse.json();
          if (bookingsResponse.ok && bookingsData.success) {
            const bookingsWithDates = bookingsData.bookings.map((b: any) => ({
              ...b,
              startTime: new Date(b.startTime),
              endTime: new Date(b.endTime),
            }));
            setUserBookings(bookingsWithDates);
          } else {
            throw new Error(bookingsData.message || 'Failed to fetch bookings');
          }
        } catch (error) {
          console.error("Error fetching bookings:", error);
          toast({ title: "Error Fetching Bookings", description: error instanceof Error ? error.message : "Could not load your bookings.", variant: "destructive" });
          setUserBookings([]);
        } finally {
          setIsLoadingBookings(false);
        }
        setIsLoading(false);
      } else if (!isConnected) {
        setUserTokens([]);
        setUserBookings([]);
        setIsLoading(false);
        setIsLoadingTokens(false);
        setIsLoadingBookings(false);
      }
    }
    fetchDashboardData();
  }, [isConnected, address, toast]);


  if (isLoading && isConnected) { // Only show main loader if connected and initial load pending
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">Please connect your wallet to access your creator dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your Zora time tokens (Base Sepolia), calendar, and bookings.</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-primary/30">
          <Link href="/mint">
            <PlusCircle className="mr-2 h-5 w-5" /> Mint New Zora Token
          </Link>
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> My Zora Time Tokens (Base Sepolia)</CardTitle>
            <CardDescription>View and manage your minted Zora time tokens. (Data from local storage & Zora SDK on Base Sepolia)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTokens ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading tokens...</p>
              </div>
            ) : userTokens.length > 0 ? (
              <ul className="space-y-4">
                {userTokens.map(token => (
                  <li key={token.id} className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        {token.imageUrl && (
                           <Image src={token.imageUrl} alt={token.name} width={64} height={64} className="rounded-md aspect-square object-cover" data-ai-hint="token icon" />
                        )}
                        {!token.imageUrl && token.id && ( // Placeholder if no image
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-primary text-2xl font-bold">
                            {token.symbol ? token.symbol.charAt(0) : '?'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{token.name} ({token.symbol})</h3>
                          <p className="text-sm text-muted-foreground">Contract: {`${token.id.slice(0,10)}...${token.id.slice(-8)}`}</p>
                          {token.totalSupply && <p className="text-sm text-muted-foreground">Total Supply: {token.totalSupply}</p>}
                           {token.uri && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                                URI: <Link href={token.uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${token.uri.substring(7)}` : token.uri} target="_blank" className="text-accent hover:underline">{token.uri}</Link>
                            </p>
                           )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button variant="outline" size="icon" aria-label="View Token on Sepolia Basescan" asChild>
                           <Link href={`https://sepolia.basescan.org/address/${token.id}`} target="_blank">
                             <Eye className="h-4 w-4 text-accent" />
                           </Link>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Image src="https://placehold.co/300x200.png" data-ai-hint="empty state tokens" alt="No tokens" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                <p className="text-muted-foreground">You haven't minted any Zora tokens on Base Sepolia yet, or none were found in local storage.</p>
                <Button variant="link" asChild className="text-primary hover:text-accent">
                  <Link href="/mint">Mint your first token</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" /> Calendar Integration</CardTitle>
            <CardDescription>Connect your calendars to manage your availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarConnect />
          </CardContent>
          <CardFooter>
             <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/availability">
                  <Settings className="mr-2 h-4 w-4" /> Manage Availability
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" /> My Bookings</CardTitle>
          <CardDescription>View and manage upcoming and past bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading bookings...</p>
            </div>
          ) : userBookings.length > 0 ? (
            <ul className="space-y-4">
              {userBookings.map(booking => (
                <li key={booking.id} className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-semibold">Booking with {`${booking.clientId.slice(0,6)}...${booking.clientId.slice(-4)}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.startTime.toLocaleString()} - {booking.endTime.toLocaleTimeString()}
                      </p>
                      {/* Link to token on Sepolia Basescan. Ensure tokenId is an address. */}
                      <p className="text-sm text-muted-foreground">Token ID: <Link href={`https://sepolia.basescan.org/token/${booking.tokenId}`} target="_blank" className="text-accent hover:underline">{`${booking.tokenId.slice(0,10)}...`}</Link></p>
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
