'use client';

import { ConnectWallet, darkTheme } from "@thirdweb-dev/react";
import { base } from "thirdweb/chains";

export function ConnectWalletButton() {
  return (
    <ConnectWallet
      theme={darkTheme({
        colors: {
          primaryButtonBg: "hsl(var(--primary))",
          primaryButtonText: "hsl(var(--primary-foreground))",
          accentButtonBg: "hsl(var(--accent))",
          accentButtonText: "hsl(var(--accent-foreground))",
          modalBg: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
          separatorLine: "hsl(var(--border))",
          primaryText: "hsl(var(--foreground))",
          secondaryText: "hsl(var(--muted-foreground))",
          connectedButtonBg: "hsl(var(--card))",
          connectedButtonBgHover: "hsl(var(--muted))",
          walletSelectorButtonHoverBg: "hsl(var(--muted))",
          // Add other color overrides to match your theme if needed
        },
      })}
      btnTitle="Connect Wallet"
      modalTitle="Connect to Aion"
      modalSize="compact" // or "wide"
      welcomeScreen={{
        title: "Welcome to Aion",
        subtitle: "Connect your wallet to manage your time tokens and bookings.",
         // You can add an image here: img: { src: "/logo.png", width: 150, height: 150 }
      }}
      chain={base} // Default to Base chain for connection prompt
      supportedChains={[base]} // Ensure Base is listed as supported
      connectModal={{
        size: "compact",
      }}
      detailsBtn={() => {
        return (
          <div className="px-4 py-2 rounded-md text-sm font-medium bg-card hover:bg-muted text-card-foreground">
            Profile
          </div>
        );
      }}
    />
  );
}
