
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CreatorPublicProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Compass, AlertTriangle, UserSearch } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const [creators, setCreators] = useState<CreatorPublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchCreators() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/creators', { cache: 'no-store' });
        const data = await response.json();
        if (data.success) {
          setCreators(data.creators);
        } else {
          throw new Error(data.message || 'Failed to load creators.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    if (!searchTerm) return creators;
    return creators.filter(creator =>
      creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [creators, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Compass className="h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Explore Creators</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Discover talented individuals, coaches, and consultants on Aion. Find the expert you need and book a session with their time token.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, expertise, or bio..."
            className="w-full pl-10 py-6 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-xl text-muted-foreground">Loading creators...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Failed to Load Creators</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredCreators.length === 0 && (
         <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <UserSearch className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Creators Found</h2>
          <p className="text-muted-foreground">
            {searchTerm 
              ? `No creators match your search for "${searchTerm}". Try a different term.`
              : "There are no creators on the platform yet. Check back soon!"
            }
          </p>
        </div>
      )}

      {!isLoading && !error && filteredCreators.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreators.map(creator => (
            <Link key={creator.id} href={`/book/${creator.id}`} passHref>
                <Card className="h-full flex flex-col hover:border-primary hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
                    <CardHeader className="items-center text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary/50">
                            <AvatarImage src={creator.avatarUrl || `https://avatar.vercel.sh/${creator.id}.png`} alt={creator.name || 'Creator'} data-ai-hint="professional portrait"/>
                            <AvatarFallback>{creator.name ? creator.name.charAt(0).toUpperCase() : 'C'}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-xl">{creator.name || 'Aion Creator'}</CardTitle>
                        <CardDescription className="text-xs">{creator.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow text-center">
                        <p className="text-muted-foreground text-sm line-clamp-3">
                            {creator.bio || 'No bio available.'}
                        </p>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
