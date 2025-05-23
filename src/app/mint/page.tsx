
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Zap, AlertTriangle, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { createCoinCall, getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import { type Address, createPublicClient, http } from "viem";
import Link from "next/link";
import type { Token } from "@/types"; 
import { client } from "@/lib/thirdweb";


// Schema for Zora Coin creation
const mintTokenFormSchema = z.object({
  name: z.string().min(2, "Token name must be at least 2 characters.").max(50, "Token name must be at most 50 characters."),
  symbol: z.string().min(2, "Symbol must be at least 2 characters.").max(10, "Symbol must be at most 10 characters.").regex(/^[A-Z0-9]+$/, "Symbol can only contain uppercase letters and numbers."),
  uri: z.string().refine(value => {
    return value.startsWith("ipfs://") || value.startsWith("https://");
  }, "Must be a valid URL starting with ipfs:// or https://.").refine(value => {
    if (value.startsWith("ipfs://")) return value.length > "ipfs://".length;
    if (value.startsWith("https://")) return value.length > "https://".length;
    return false;
  }, "URI must not be empty after the protocol."),
});

type MintTokenFormValues = z.infer<typeof mintTokenFormSchema>;

// Create a Viem public client for Base chain to fetch transaction receipts
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'), 
});

export default function MintTokenPage() {
  const account = useActiveAccount();
  const address = account?.address as Address | undefined;
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState<string | null>(null);
  const [deployedCoinAddress, setDeployedCoinAddress] = useState<Address | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();

  const form = useForm<MintTokenFormValues>({
    resolver: zodResolver(mintTokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy", // Updated placeholder
    },
  });

  async function onSubmit(values: MintTokenFormValues) {
    if (!address || !account) { // Ensure account is also available for chain and client
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint a token.",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    setMintingStep("Preparing transaction...");
    setDeployedCoinAddress(null);
    setTransactionHash(null);

    try {
      const coinParams = {
        name: values.name,
        symbol: values.symbol,
        uri: values.uri,
        payoutRecipient: address,
        initialPurchaseWei: 0n, 
      };

      const contractCallTx = await createCoinCall(coinParams);
      
      setMintingStep("Please confirm in your wallet...");
      
      sendTransaction(
        { // Pass client and chain with the transaction object
          ...contractCallTx,
          chain: base, // Use the imported base chain from thirdweb/chains
          client: client, // Use the imported client from @/lib/thirdweb
        },
        {
          onSuccess: async (result) => {
            setTransactionHash(result.transactionHash);
            setMintingStep("Transaction sent. Waiting for confirmation...");
            toast({
              title: "Transaction Submitted",
              description: `Hash: ${result.transactionHash.slice(0,10)}...`,
            });

            try {
              const receipt = await publicClient.waitForTransactionReceipt({ hash: result.transactionHash as `0x${string}` });
              setMintingStep("Transaction confirmed. Extracting coin address...");
              
              const coinDeployment = getCoinCreateFromLogs(receipt);
              if (coinDeployment?.coin) {
                setDeployedCoinAddress(coinDeployment.coin);
                toast({
                  title: "Token Minted Successfully!",
                  description: `Coin Address: ${coinDeployment.coin}`,
                  variant: "default",
                  duration: 8000,
                  action: (
                    <Button variant="link" size="sm" asChild>
                      <Link href={`https://basescan.org/address/${coinDeployment.coin}`} target="_blank">
                        View on Basescan <ExternalLink className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )
                });
                form.reset();

                // Store in local storage for now (as per previous implementation)
                const newCoin: Token = {
                  id: coinDeployment.coin,
                  name: values.name,
                  symbol: values.symbol,
                  uri: values.uri,
                  creatorId: address,
                };
                const existingTokensString = localStorage.getItem(`userTokens_${address}`);
                const existingTokens: Token[] = existingTokensString ? JSON.parse(existingTokensString) : [];
                localStorage.setItem(`userTokens_${address}`, JSON.stringify([...existingTokens, newCoin]));


              } else {
                throw new Error("Could not extract coin address from logs.");
              }
            } catch (receiptError) {
              console.error("Error processing transaction receipt:", receiptError);
              toast({
                title: "Receipt Processing Failed",
                description: receiptError instanceof Error ? receiptError.message : "Could not get coin address.",
                variant: "destructive",
              });
            } finally {
              setIsMinting(false);
              setMintingStep(null);
            }
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            toast({
              title: "Transaction Failed",
              description: error.message || "An unknown error occurred during the transaction.",
              variant: "destructive",
            });
            setIsMinting(false);
            setMintingStep(null);
          },
        }
      );

    } catch (error) {
      console.error("Error preparing Zora coin transaction:", error);
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Check for specific "Metadata fetch failed" message
      if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' && error.message.toLowerCase().includes('metadata fetch failed')) {
        errorMessage = "Metadata fetch failed. Please ensure the URI is a valid, accessible URL pointing to your JSON metadata (e.g., ipfs://<CID> or https://.../metadata.json).";
      }

      toast({
        title: "Minting Preparation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsMinting(false);
      setMintingStep(null);
    }
  }

  if (!address) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="w-full max-w-md p-8 shadow-xl">
           <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Mint Your Time Token</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to create and launch your unique access tokens on Zora.</p>
           <div className="flex items-center justify-center p-4 mt-4 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Please connect your wallet to proceed.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-7 w-7 text-primary" />
            Mint New Zora Time Token
          </CardTitle>
          <CardDescription>
            Create your unique ERC-20 token on Zora (Base network) to represent access to your time or services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1-Hour Design Consultation" {...field} />
                    </FormControl>
                    <FormDescription>The full name of your token.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DESIGN60" {...field} />
                    </FormControl>
                    <FormDescription>A short ticker symbol (e.g., TKN). Uppercase letters and numbers only.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metadata URI</FormLabel>
                    <FormControl>
                      <Input placeholder="ipfs://<CID_of_metadata_json>" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a complete and valid link to your token's JSON metadata (e.g., `ipfs://YOUR_CID_HERE` or `https://example.com/metadata.json`).
                      This file should contain details like name, description, and image URL for your token. See the
                      <Button variant="link" asChild className="p-0 h-auto ml-1 text-accent hover:text-primary">
                         <Link href="https://docs.zora.co/docs/smart-contracts/creator-tools/metadata" target="_blank" rel="noopener noreferrer">
                            Zora Metadata Docs <ExternalLink className="h-3 w-3 ml-1" />
                         </Link>
                      </Button> for more information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full shadow-md hover:shadow-primary/30" 
                disabled={isMinting || !account}
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {mintingStep || "Minting Token..."}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" /> Mint Zora Coin
                  </>
                )}
              </Button>
            </form>
          </Form>
          {transactionHash && (
            <div className="mt-6 p-4 border rounded-md bg-muted/50">
              <h4 className="font-semibold text-md mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Transaction Progress
              </h4>
              <p className="text-sm text-muted-foreground">
                Hash: <code className="text-xs break-all">{transactionHash}</code>
                 <Button variant="link" size="sm" asChild className="ml-1 p-0 h-auto">
                    <Link href={`https://basescan.org/tx/${transactionHash}`} target="_blank">
                       <ExternalLink className="h-3 w-3" />
                    </Link>
                 </Button>
              </p>
              {deployedCoinAddress && (
                 <p className="text-sm text-muted-foreground mt-1">
                    Deployed Coin Address: <code className="text-xs break-all">{deployedCoinAddress}</code>
                     <Button variant="link" size="sm" asChild className="ml-1 p-0 h-auto">
                        <Link href={`https://basescan.org/address/${deployedCoinAddress}`} target="_blank">
                           <ExternalLink className="h-3 w-3" />
                        </Link>
                    </Button>
                 </p>
              )}
              {isMinting && mintingStep && <p className="text-sm text-primary mt-2">{mintingStep}...</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

