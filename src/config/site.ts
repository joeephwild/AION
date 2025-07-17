
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter?: string;
    github?: string;
  };
  mainNav: NavItem[];
};

export const siteConfig: SiteConfig = {
  name: "Aion",
  description: "Mint ERC-20 coins for time-based access and book sessions with creators.",
  url: "https://aion.example.com", // Replace with actual URL
  ogImage: "https://aion.example.com/og.png", // Replace with actual OG image
  links: {
    // Add social links if needed
  },
  mainNav: [
    {
      title: "Explore",
      href: "/explore",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
    },
    {
      title: "My Bookings",
      href: "/dashboard/bookings",
    },
    {
      title: "My Profile",
      href: "/dashboard/profile",
    },
    {
      title: "Mint Coin",
      href: "/mint",
    },
  ],
};
