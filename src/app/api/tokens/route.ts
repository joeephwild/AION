
// /src/app/api/tokens/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Token } from '@/types';

// POST /api/tokens - Save a new token to Firestore
export async function POST(request: NextRequest) {
  const authenticatedUserId = request.headers.get('x-user-id');

  if (!authenticatedUserId) {
    return NextResponse.json({ success: false, message: 'Authentication required (x-user-id header missing)' }, { status: 401 });
  }

  try {
    const tokenData = await request.json() as Omit<Token, 'createdAt'>;

    if (!tokenData.id || !tokenData.name || !tokenData.symbol || !tokenData.creatorId) {
      return NextResponse.json({ success: false, message: 'Missing required token fields (id, name, symbol, creatorId)' }, { status: 400 });
    }

    if (authenticatedUserId !== tokenData.creatorId) {
      return NextResponse.json({ success: false, message: 'Forbidden: Creator ID in token data does not match authenticated user.' }, { status: 403 });
    }

    const tokenDocRef = doc(db, 'tokens', tokenData.id); // Use token contract address as document ID

    const dataToSet = {
      ...tokenData,
      contractAddress: tokenData.id, // Explicitly store contractAddress for querying if needed, matches id
      createdAt: serverTimestamp(),
    };

    await setDoc(tokenDocRef, dataToSet);

    return NextResponse.json({ success: true, message: 'Token saved successfully to Firestore.', tokenId: tokenData.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to save token to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to save token to Firestore', error: errorMessage }, { status: 500 });
  }
}

// GET /api/tokens?creatorId=... - Fetch tokens for a specific creator
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'creatorId query parameter is required' }, { status: 400 });
  }

  try {
    const tokensRef = collection(db, 'tokens');
    const q = query(tokensRef, where('creatorId', '==', creatorId));
    const querySnapshot = await getDocs(q);

    const fetchedTokens: Token[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedTokens.push({
        id: docSnap.id, // This is the contract address (document ID)
        name: data.name,
        symbol: data.symbol,
        creatorId: data.creatorId,
        uri: data.uri,
        // totalSupply and imageUrl will be fetched on-chain by the client
        // Convert Firestore Timestamp to JS Date for createdAt if it exists
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
      });
    });

    // Optionally sort by createdAt, newest first
    fetchedTokens.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    return NextResponse.json({ success: true, tokens: fetchedTokens });
  } catch (error) {
    console.error('Failed to fetch tokens from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch tokens from Firestore', error: errorMessage }, { status: 500 });
  }
}
