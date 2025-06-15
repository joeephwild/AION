
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Save, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import type { CreatorProfileData } from "@/types";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be at most 50 characters."),
  bio: z.string().max(300, "Bio must be at most 300 characters.").optional().or(z.literal('')),
  avatarUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      if (address) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/creators/${address}`);
          const data = await response.json();
          if (data.success && data.profile) {
            form.reset({
              name: data.profile.name || "",
              bio: data.profile.bio || "",
              avatarUrl: data.profile.avatarUrl || "",
            });
          } else if (!data.success) {
             toast({ title: "Error", description: data.message || "Could not load profile.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // Not connected
      }
    }
    fetchProfile();
  }, [address, form, toast]);

  async function onSubmit(values: ProfileFormValues) {
    if (!address) {
      toast({ title: "Error", description: "Please connect your wallet.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/creators/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Profile Saved!", description: "Your profile has been updated." });
        if (result.profile) {
            form.reset(result.profile); // Reset form with data from server to ensure consistency
        }
      } else {
        throw new Error(result.message || "Failed to save profile.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <UserCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Edit Your Profile</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to manage your public creator profile.</p>
           <div className="flex items-center justify-center p-4 mt-4 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Please connect your wallet to proceed.
          </div>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-7 w-7 text-primary" />
            Edit Your Creator Profile
          </CardTitle>
          <CardDescription>
            This information will be displayed publicly on your booking page.
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
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your public name" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio / Short Introduction</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell clients a bit about yourself and your services." {...field} rows={4} disabled={isSaving} />
                    </FormControl>
                    <FormDescription>Max 300 characters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/your-avatar.png" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormDescription>Link to your profile picture. Leave blank for default.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSaving || isLoading}
              >
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Profile data is stored in Firestore and linked to your wallet address.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
