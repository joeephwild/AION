'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccount, useWalletClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { Zap, AlertTriangle } from "lucide-react";
// import { createERC20 } from '@zoralabs/protocol-sdk'; // Example import
// import { type WalletClient, type PublicClient } from 'viem'; // Example import
// import { usePublicClient } from 'wagmi'; // Example import

const mintTokenFormSchema = z.object({
  name: z.string().min(2, "Token name must be at least 2 characters.").max(50, "Token name must be at most 50 characters."),
  symbol: z.string().min(2, "Symbol must be at least 2 characters.").max(10, "Symbol must be at most 10 characters.").regex(/^[A-Z0-9]+$/, "Symbol can only contain uppercase letters and numbers."),
  description: z.string().max(500, "Description must be at most 500 characters.").optional(),
  initialSupply: z.coerce.number().int().positive("Initial supply must be a positive integer."),
  // Add more fields if needed, e.g., price, URI for metadata
});

type MintTokenFormValues = z.infer<typeof mintTokenFormSchema>;

export default function MintTokenPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  // const publicClient = usePublicClient(); // For read operations or if SDK needs it
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);

  const form = useForm<MintTokenFormValues>({
    resolver: zodResolver(mintTokenFormSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      initialSupply: 100,
    },
  });

  async function onSubmit(values: MintTokenFormValues) {
    if (!isConnected || !address || !walletClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to mint a token.",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    toast({
      title: "Minting Token...",
      description: "Please confirm the transaction in your wallet.",
    });

    try {
      // --- ZORA SDK INTEGRATION ---
      // This is where you'd use the Zora Coin SDK.
      // Example structure (actual implementation depends on Zora SDK specifics):
      // const txHash = await createERC20({
      //   tokenName: values.name,
      //   tokenSymbol: values.symbol,
      //   initialSupply: BigInt(values.initialSupply),
      //   // Potentially other parameters like defaultAdmin, metadataURI
      //   // Provide walletClient for signing
      //   // Provide publicClient for chain interaction if needed by SDK
      //   walletClient: walletClient as WalletClient, 
      //   publicClient: publicClient as PublicClient,
      // });
      // console.log("Transaction Hash:", txHash);

      // Mock successful minting for now
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      console.log("Token minting requested:", values);
      toast({
        title: "Token Minted Successfully!",
        description: `Your token ${values.name} (${values.symbol}) has been minted. (This is a mock response)`,
      });
      form.reset();
    } catch (error) {
      console.error("Minting error:", error);
      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="w-full max-w-md p-8 shadow-xl">
           <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Mint Your Time Token</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to create and launch your unique access tokens.</p>
          {/* ConnectWalletButton is in Header */}
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
            Mint New Time Token
          </CardTitle>
          <CardDescription>
            Create your unique ERC-20 token to represent access to your time or services.
            This token will be minted on the Zora network.
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
                name="initialSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Supply</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormDescription>The number of tokens to mint initially.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this token grants access to..." {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormDescription>A brief description of your token and its utility.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full shadow-md hover:shadow-primary/30" disabled={isMinting}>
                {isMinting ? "Minting Token..." : (
                  <>
                    <Zap className="mr-2 h-5 w-5" /> Mint Token via Zora
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Need to add useState for isMinting
import { useState } from "react";
