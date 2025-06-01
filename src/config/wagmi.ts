
'use client';

import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, baseSepolia } from 'wagmi/chains'; // Added baseSepolia, removed base
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not be available.");
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, baseSepolia], // Changed base to baseSepolia
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Aion' }),
    ...(projectId ? [walletConnect({ projectId, metadata: { name: 'Aion', description: 'Aion - Time-Based Access Tokens', url: 'https://aion.example.com', icons: ['https://aion.example.com/icon.png']}})] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http('https://sepolia.base.org'), // Added transport for baseSepolia
  },
  ssr: true, // Enable SSR for Wagmi
});
