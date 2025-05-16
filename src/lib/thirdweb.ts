import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";

const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;


export const client = createThirdwebClient({
  clientId: CLIENT_ID,
});

export const supportedChains = [base];
