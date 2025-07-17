
// /src/app/api/tokens/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Coin } from '@/types';

// POST /api/tokens - Save a new coin to Firestore
export async function POST(request: NextRequest) {
  const authenticatedUserId = request.headers.get('x-user-id');

  if (!authenticatedUserId) {
    return NextResponse.json({ success: false, message: 'Authentication required (x-user-id header missing)' }, { status: 401 });
  }

  try {
    const coinData = await request.json() as Omit<Coin, 'createdAt'>;

    if (!coinData.id || !coinData.name || !coinData.symbol || !coinData.creatorId) {
      return NextResponse.json({ success: false, message: 'Missing required coin fields (id, name, symbol, creatorId)' }, { status: 400 });
    }

    if (authenticatedUserId !== coinData.creatorId) {
      return NextResponse.json({ success: false, message: 'Forbidden: Creator ID in coin data does not match authenticated user.' }, { status: 403 });
    }

    const coinDocRef = doc(db, 'coins', coinData.id); // Use coin contract address as document ID

    const dataToSet = {
      ...coinData,
      contractAddress: coinData.id, // Explicitly store contractAddress for querying if needed, matches id
      createdAt: serverTimestamp(),
    };

    await setDoc(coinDocRef, dataToSet);

    return NextResponse.json({ success: true, message: 'Coin saved successfully to Firestore.', coinId: coinData.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to save coin to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to save coin to Firestore', error: errorMessage }, { status: 500 });
  }
}

// GET /api/tokens?creatorId=... - Fetch coins for a specific creator
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'creatorId query parameter is required' }, { status: 400 });
  }

  try {
    const coinsRef = collection(db, 'coins');
    const q = query(coinsRef, where('creatorId', '==', creatorId));
    const querySnapshot = await getDocs(q);

    const fetchedCoins: Coin[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedCoins.push({
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
    fetchedCoins.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    return NextResponse.json({ success: true, coins: fetchedCoins });
  } catch (error) {
    console.error('Failed to fetch coins from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch coins from Firestore', error: errorMessage }, { status: 500 });
  }
}
