
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PlusCircle, CalendarDays, ListChecks, Settings, ExternalLink, Eye, Zap, Loader2 } from "lucide-react";
import { CalendarConnect } from "@/components/core/calendar-connect";
import Image from "next/image";
import type { Token, Booking } from "@/types";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useToast } from "@/hooks/use-toast";
import { getCoin } from "@zoralabs/coins-sdk";
import { baseSepolia } from "thirdweb/chains"; 
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const { toast } = useToast();

  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (isConnected && address) {
        setIsLoadingTokens(true);
        setIsLoadingBookings(true);

        // Fetch tokens from Firestore via API
        try {
          const tokensResponse = await fetch(`/api/tokens?creatorId=${address}`, { cache: 'no-store' });
          const tokensData = await tokensResponse.json();

          if (tokensResponse.ok && tokensData.success && Array.isArray(tokensData.tokens)) {
            const firestoreTokens: Token[] = tokensData.tokens.map((t: any) => ({
                ...t,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
            }));

            const enrichedTokens: Token[] = [];
            for (const basicTokenInfo of firestoreTokens) {
              try {
                const response = await getCoin({ address: basicTokenInfo.id, chain: baseSepolia.id });
                const coinData = response.data?.zora20Token;
                if (coinData) {
                  enrichedTokens.push({
                    ...basicTokenInfo,
                    id: coinData.address,
                    name: coinData.name || basicTokenInfo.name,
                    symbol: coinData.symbol || basicTokenInfo.symbol,
                    totalSupply: coinData.totalSupply?.toString(),
                    imageUrl: coinData?.mediaContent?.previewImage as string || basicTokenInfo.imageUrl,
                  });
                } else {
                  enrichedTokens.push(basicTokenInfo);
                }
              } catch (error) {
                console.warn(`Failed to fetch on-chain details for coin ${basicTokenInfo.id} on Base Sepolia:`, error);
                enrichedTokens.push(basicTokenInfo); 
              }
            }
            setUserTokens(enrichedTokens.sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0) ));
          } else {
            throw new Error(tokensData.message || 'Failed to fetch tokens from API');
          }
        } catch (error) {
          console.error("Error fetching tokens from API/Firestore:", error);
          toast({ title: "Error Fetching Tokens", description: error instanceof Error ? error.message : "Could not load your created tokens.", variant: "destructive" });
          setUserTokens([]);
        } finally {
          setIsLoadingTokens(false);
        }
        
        // Fetch bookings from Firestore via API
        try {
          const bookingsResponse = await fetch(`/api/bookings?creatorId=${address}`, { cache: 'no-store' });
          const bookingsData = await bookingsResponse.json();
          if (bookingsResponse.ok && bookingsData.success) {
            const bookingsWithDates = bookingsData.bookings.map((b: any) => ({
              ...b,
              startTime: new Date(b.startTime),
              endTime: new Date(b.endTime),
            }));
            setUserBookings(bookingsWithDates.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
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
      } else if (!isConnected) {
        setUserTokens([]);
        setUserBookings([]);
        setIsLoadingTokens(false);
        setIsLoadingBookings(false);
      }
    }
    fetchDashboardData();
  }, [isConnected, address, toast]);

  const isLoading = isLoadingTokens || isLoadingBookings;

  if (isLoading && isConnected) { 
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
            <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> My Zora Time Tokens</CardTitle>
            <CardDescription>View and manage your minted Zora time tokens on Base Sepolia.</CardDescription>
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
                        <div className="relative w-16 h-16 shrink-0">
                          <Image src={token.imageUrl || `https://placehold.co/128x128.png`} alt={token.name} layout="fill" className="rounded-md aspect-square object-cover" data-ai-hint="token icon" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{token.name} ({token.symbol})</h3>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            Contract: <Link href={`https://sepolia.basescan.org/address/${token.id}`} target="_blank" className="text-accent hover:underline">{`${token.id.slice(0,10)}...${token.id.slice(-8)}`}</Link>
                          </p>
                          {token.totalSupply && <p className="text-sm text-muted-foreground">Total Supply: {token.totalSupply}</p>}
                           {token.uri && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                                URI: <Link href={token.uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${token.uri.substring(7)}` : token.uri} target="_blank" className="text-accent hover:underline">{token.uri}</Link>
                            </p>
                           )}
                           {token.createdAt && <p className="text-xs text-muted-foreground">Created: {token.createdAt.toLocaleDateString()}</p>}
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
              <div className="text-center py-8 rounded-lg border-2 border-dashed">
                <Image src="https://placehold.co/300x200.png" data-ai-hint="empty state tokens" alt="No tokens" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                <h3 className="text-xl font-semibold">No Tokens Minted Yet</h3>
                <p className="text-muted-foreground mt-2 mb-4">It looks like you're just getting started. Mint your first token to represent your time!</p>
                <Button asChild>
                  <Link href="/mint"><PlusCircle className="mr-2 h-4 w-4" />Mint Your First Token</Link>
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
          <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" /> My Recent Bookings</CardTitle>
          <CardDescription>A quick look at your 5 most recent bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading bookings...</p>
            </div>
          ) : userBookings.length > 0 ? (
            <ul className="space-y-3">
              {userBookings.slice(0, 5).map(booking => (
                <li key={booking.id} className="p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-semibold">Booking with {`${booking.clientId.slice(0,6)}...${booking.clientId.slice(-4)}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(booking.startTime, "MMM d, yyyy, h:mm a")}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-4">
                       <p className="text-sm text-muted-foreground hidden md:block truncate max-w-[200px]" title={booking.tokenId}>Token: <Link href={`https://sepolia.basescan.org/token/${booking.tokenId}`} target="_blank" className="text-accent hover:underline">{`${booking.tokenId.slice(0,10)}...`}</Link></p>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'destructive'} className={booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : ''}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center py-12 rounded-lg border-2 border-dashed">
                <Image src="https://placehold.co/300x200.png" data-ai-hint="empty state bookings" alt="No bookings" width={300} height={200} className="mx-auto mb-4 rounded-md opacity-50" />
                <h3 className="text-xl font-semibold">No Bookings Found</h3>
                <p className="text-muted-foreground mt-2">When someone books a session with you, it will appear here.</p>
              </div>
          )}
        </CardContent>
        {userBookings.length > 0 && (
          <CardFooter>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/bookings">
                Manage All Bookings <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
