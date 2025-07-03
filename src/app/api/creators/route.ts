
// /src/app/api/creators/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { CreatorProfileData, CreatorPublicProfile } from '@/types';

// GET /api/creators - Fetch all creator profiles
export async function GET() {
  try {
    const creatorsRef = collection(db, 'creators');
    const querySnapshot = await getDocs(creatorsRef);

    const creators: CreatorPublicProfile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as CreatorProfileData;
      creators.push({
        id: doc.id,
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      });
    });

    return NextResponse.json({ success: true, creators });
  } catch (error) {
    console.error('Failed to fetch creators:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch creators', error: errorMessage }, { status: 500 });
  }
}
