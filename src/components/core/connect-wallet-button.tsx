
'use client';

import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserCircle, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ConnectWalletButton() {
  const { address, isConnected, connector } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow-primary/30">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://avatar.vercel.sh/${address}.png`} alt={ensName ?? address ?? ''} />
              <AvatarFallback>
                <UserCircle className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[100px]">{ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connector && <DropdownMenuItem disabled>Connected to {connector.name}</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => disconnect()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If not connected
  if (connectors.length === 0) {
    return (
      <Button disabled className="shadow-sm">
        <AlertTriangle className="mr-2 h-4 w-4" /> No Wallets Detected
      </Button>
    );
  }

  if (connectors.length === 1 && connectors[0]) {
    const singleConnector = connectors[0];
    return (
      <Button
        onClick={() => connect({ connector: singleConnector })}
        disabled={isLoading && pendingConnector?.id === singleConnector.id}
        className="shadow-sm hover:shadow-primary/30"
      >
        {isLoading && pendingConnector?.id === singleConnector.id ? (
          'Connecting...'
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" /> Connect {singleConnector.name}
          </>
        )}
      </Button>
    );
  }

  // If multiple connectors, always show the dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="shadow-sm hover:shadow-primary/30">
          <LogIn className="mr-2 h-4 w-4" /> Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => connect({ connector: c })}
            disabled={isLoading && pendingConnector?.id === c.id}
          >
            {c.name}
            {isLoading && pendingConnector?.id === c.id && ' (connecting...)'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      {error && (
        <p className="mt-2 text-xs text-destructive flex items-center">
          <AlertTriangle className="h-4 w-4 mr-1" /> {error.message}
        </p>
      )}
    </DropdownMenu>
  );
}
