
// /src/app/api/creators/[creatorId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CreatorProfileData, CreatorPublicProfile } from '@/types';

// GET /api/creators/[creatorId]
export async function GET(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  const creatorId = params.creatorId;

  if (!creatorId) {
    return NextResponse.json({ success: false, message: 'Creator ID is required' }, { status: 400 });
  }

  try {
    const creatorDocRef = doc(db, 'creators', creatorId);
    const creatorDocSnap = await getDoc(creatorDocRef);

    if (creatorDocSnap.exists()) {
      const profileData = creatorDocSnap.data() as CreatorProfileData;
      const publicProfile: CreatorPublicProfile = {
        id: creatorId,
        name: profileData.name,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl,
      };
      return NextResponse.json({ success: true, profile: publicProfile });
    } else {
      // Return a default structure or indicate not found, client can handle defaults
      const defaultProfile: CreatorPublicProfile = {
        id: creatorId,
        name: 'Aion Creator', // Default name
        bio: 'This creator has not set up their profile yet.',
        avatarUrl: `https://avatar.vercel.sh/${creatorId}.png`, // Default Vercel avatar
      };
      return NextResponse.json({ success: true, profile: defaultProfile, message: 'Creator profile not found, returning defaults.' });
    }
  } catch (error) {
    console.error('Failed to fetch creator profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to fetch creator profile', error: errorMessage }, { status: 500 });
  }
}

// PUT /api/creators/[creatorId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  const authenticatedUserId = request.headers.get('x-user-id');
  const targetCreatorId = params.creatorId;

  if (!authenticatedUserId) {
    return NextResponse.json({ success: false, message: 'Authentication required (x-user-id header missing)' }, { status: 401 });
  }

  if (authenticatedUserId !== targetCreatorId) {
    return NextResponse.json({ success: false, message: 'Forbidden: You can only update your own profile.' }, { status: 403 });
  }

  try {
    const profileDataToSave = await request.json() as Partial<CreatorProfileData>;

    if (!profileDataToSave.name && typeof profileDataToSave.name !== 'undefined') { // Allow clearing other fields but name must be non-empty if provided
        return NextResponse.json({ success: false, message: 'Profile name cannot be empty if provided.' }, { status: 400 });
    }
    
    const creatorDocRef = doc(db, 'creators', targetCreatorId);
    
    const dataToSet: Partial<CreatorProfileData & { updatedAt: any }> = { ...profileDataToSave };
    if (dataToSet.name === null || typeof dataToSet.name === 'undefined') { // If name is not being set or explicitly nulled, remove it from update to avoid error
      const currentSnap = await getDoc(creatorDocRef);
      if (!currentSnap.exists() || !currentSnap.data()?.name) { // If no existing name, and not providing one, it's an error
         return NextResponse.json({ success: false, message: 'Profile name is required for new profiles.' }, { status: 400 });
      }
    }


    await setDoc(creatorDocRef, { ...profileDataToSave, updatedAt: serverTimestamp() }, { merge: true });

    // Fetch the updated document to return it
    const updatedDocSnap = await getDoc(creatorDocRef);
    const updatedProfileData = updatedDocSnap.data() as CreatorProfileData;
     const publicProfile: CreatorPublicProfile = {
        id: targetCreatorId,
        name: updatedProfileData.name,
        bio: updatedProfileData.bio,
        avatarUrl: updatedProfileData.avatarUrl,
      };

    return NextResponse.json({ success: true, message: 'Creator profile updated successfully.', profile: publicProfile });
  } catch (error) {
    console.error('Failed to update creator profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to update creator profile', error: errorMessage }, { status: 500 });
  }
}
