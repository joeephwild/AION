import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";

// Replace with your client ID and secret key
// Ensure your secret key is handled securely and not exposed in client-side bundles if not intended.
// For most client-side use cases, only clientId is needed. 
// If using features like embedded wallets that require a secret key on the client, 
// be aware of the security implications or use a backend proxy.
const CLIENT_ID = "66f712c4669cea1f7aebb871f8812f7d";
// const SECRET_KEY = "Bv-ppMNuOyf94DbUB9JFp44rXC3t_YIrDd_CVfpbdzqojuWF-V9dfc5UR62nTPuXFxjx66ZJqoDny0yT8kWKNA";


export const client = createThirdwebClient({
  clientId: CLIENT_ID,
  // secretKey: SECRET_KEY, // Add secretKey if specific thirdweb features requiring it on the client are used
});

export const supportedChains = [base]; // Add other chains here if needed
