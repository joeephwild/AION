
'use client';

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { base } from "thirdweb/chains";
import { siteConfig } from "@/config/site";

// Define custom theme properties for the ConnectButton based on globals.css
const customTheme = {
  colors: {
    accentText: "hsl(var(--accent-foreground))",
    accentButtonBg: "hsl(var(--accent))",
    accentButtonText: "hsl(var(--accent-foreground))",
    primaryButtonBg: "hsl(var(--primary))",
    primaryButtonText: "hsl(var(--primary-foreground))",
    modalBg: "hsl(var(--card))",
    dropdownBg: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    separatorLine: "hsl(var(--border))",
    secondaryText: "hsl(var(--muted-foreground))",
    primaryText: "hsl(var(--foreground))",
    connectedButtonBg: "hsl(var(--card))",
    connectedButtonBgHover: "hsl(var(--muted))",
    walletSelectorButtonHoverBg: "hsl(var(--muted))",
    // Add other color overrides to match your theme if needed
  },
  fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif", // Match body font
  // You can also customize specific components like modal, button, etc.
  // modal: {
  //   titleFontFamily: "var(--font-geist-sans)",
  // },
  // button: {
  //  fontFamily: "var(--font-geist-sans)",
  // },
};


export function ConnectWalletButton() {
  return (
    <ConnectButton
      client={client}
      chain={base} // Default to Base chain for connection prompt
      supportedChains={[base]} // Ensure Base is listed as supported
      appMetadata={{
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        logoUrl: `${siteConfig.url}/icon.png` // Assuming you have an icon at public/icon.png
      }}
      theme={customTheme as any} // Cast to any if Theme type from thirdweb is too strict for HSL vars
      connectModal={{
        size: "compact", // "compact" or "wide"
        title: `Connect to ${siteConfig.name}`,
        titleIconUrl: `${siteConfig.url}/icon.png`,
        welcomeScreen: {
          title: `Welcome to ${siteConfig.name}`,
          subtitle: siteConfig.description,
          // img: { src: `${siteConfig.url}/og.png`, width: 200, height: 100 } // Optional image
        },
      }}
      detailsButton={{
        // displayBalanceToken: { [base.id]: "0x..." }, // Optional: Display balance of a specific token on Base
        // chains: [base] // Show details only for Base
      }}
      
    />
  );
}
