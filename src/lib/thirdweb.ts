
import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains"; // Changed from base to baseSepolia

const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;


export const client = createThirdwebClient({
  clientId: CLIENT_ID,
});

export const supportedChains = [baseSepolia]; // Changed to baseSepolia
