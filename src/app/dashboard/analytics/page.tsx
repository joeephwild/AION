
'use client';

import { BarChart, Book, DollarSign, Users, Activity, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useActiveAccount } from 'thirdweb/react';
import { useState, useEffect } from 'react';
import type { Booking } from '@/types';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock data for charts
const mockChartData = [
  { date: 'Mon', bookings: 4 },
  { date: 'Tue', bookings: 3 },
  { date: 'Wed', bookings: 5 },
  { date: 'Thu', bookings: 2 },
  { date: 'Fri', bookings: 7 },
  { date: 'Sat', bookings: 6 },
  { date: 'Sun', bookings: 8 },
];

export default function AnalyticsPage() {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      if (isConnected && address) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/bookings?creatorId=${address}`);
          const data = await response.json();
          if (data.success) {
            setBookings(data.bookings.map((b: any) => ({ ...b, startTime: new Date(b.startTime) })));
          } else {
            throw new Error(data.message || 'Failed to fetch bookings');
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    fetchBookings();
  }, [isConnected, address]);

  const totalBookings = bookings.length;
  // Mock data for other stats
  const pageViews = 1234;
  const tokenHolders = 42;
  const estimatedIncome = 580; // Assuming some off-chain calculation
  
  const recentBookings = bookings.slice(0, 5);

  if (!isConnected) {
    return (
       <Card className="w-full max-w-md mx-auto mt-10 p-8 shadow-xl">
          <CardHeader className="text-center">
            <BarChart className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Creator Analytics</CardTitle>
            <CardDescription>Connect your wallet to view your performance metrics.</CardDescription>
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
        <p className="ml-2 text-lg text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }
  
  if (error) {
     return (
       <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
     )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your performance and gain insights into your creator activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">+2 since last month (mock)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Token Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenHolders}</div>
            <p className="text-xs text-muted-foreground">Data from on-chain (mock)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Page Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Analytics integration needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires payment integration</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bookings This Week</CardTitle>
            <CardDescription>A mock overview of your booking activity for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={mockChartData}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Booking Activity</CardTitle>
            <CardDescription>Your 5 most recent bookings.</CardDescription>
          </CardHeader>
          <CardContent>
             {recentBookings.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-medium">{`${booking.clientId.slice(0, 6)}...${booking.clientId.slice(-4)}`}</TableCell>
                        <TableCell>{format(booking.startTime, 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                           <Badge variant={booking.status === 'confirmed' ? 'default' : 'destructive'} className={booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : ''}>
                                {booking.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No recent bookings to display.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
