'use client';

import type { ReactNode } from 'react';
import { ThirdwebProvider as Provider } from '@thirdweb-dev/react';
import { client, supportedChains } from '@/lib/thirdweb';
import { base } from 'thirdweb/chains';


export function ThirdwebProvider({ children }: { children: ReactNode }) {
  return (
    <Provider
      client={client}
      supportedChains={supportedChains}
      activeChain={base} // Set Base as the default active chain
    >
      {children}
    </Provider>
  );
}
