'use client';

import { siteConfig } from '@/config/site';
import { useState, useEffect } from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border/40 py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {currentYear ?? '...'} {siteConfig.name}. All rights reserved.
        </p>
        {/* Add social links or other footer content here if needed */}
        {/* <div className="flex items-center gap-4">
          {siteConfig.links.github && (
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4 text-accent hover:text-primary"
            >
              GitHub
            </a>
          )}
        </div> */}
      </div>
    </footer>
  );
}
