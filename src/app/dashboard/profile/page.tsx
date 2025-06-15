
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
import { UserCircle, Save, Loader2, AlertTriangle, UploadCloud, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import type { CreatorProfileData } from "@/types";
import { storage } from "@/lib/firebase"; // Import Firebase storage
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be at most 50 characters."),
  bio: z.string().max(300, "Bio must be at most 300 characters.").optional().or(z.literal('')),
  avatarUrl: z.string().url("Must be a valid URL for the avatar.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const account = useActiveAccount();
  const address = account?.address;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (data.profile.avatarUrl) {
              setImagePreview(data.profile.avatarUrl); // Show current avatar
            }
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    // Clean up object URL from file preview
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  async function onSubmit(values: ProfileFormValues) {
    if (!address) {
      toast({ title: "Error", description: "Please connect your wallet.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    setSavingStep("Preparing to save...");

    let finalAvatarUrl = values.avatarUrl;

    if (selectedFile) {
      setSavingStep("Uploading avatar...");
      try {
        // Create a unique path for the avatar in Firebase Storage
        const filePath = `avatars/${address}/${Date.now()}_${selectedFile.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        
        await uploadBytes(fileStorageRef, selectedFile);
        finalAvatarUrl = await getDownloadURL(fileStorageRef);
        form.setValue('avatarUrl', finalAvatarUrl); // Update form value with the new URL
        toast({ title: "Avatar Uploaded", description: "Your new avatar has been uploaded."});
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast({ title: "Avatar Upload Failed", description: "Could not upload your new avatar. Please try again.", variant: "destructive" });
        setIsSaving(false);
        setSavingStep(null);
        return;
      }
    }
    
    setSavingStep("Saving profile data...");
    // Prepare data for API, ensuring avatarUrl is the potentially updated one
    const dataToSave: ProfileFormValues = {
        ...values,
        avatarUrl: finalAvatarUrl,
    };

    try {
      const response = await fetch(`/api/creators/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': address },
        body: JSON.stringify(dataToSave),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Profile Saved!", description: "Your profile has been updated." });
        if (result.profile) {
            form.reset(result.profile); // Reset form with data from server
            setImagePreview(result.profile.avatarUrl || null); // Update preview to new or cleared avatar
        }
        setSelectedFile(null); // Clear selected file after successful save
      } else {
        throw new Error(result.message || "Failed to save profile.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
      setSavingStep(null);
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
              
              <FormItem>
                <FormLabel>Avatar Image</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/20">
                      {imagePreview ? (
                        <Image src={imagePreview} alt="Avatar preview" layout="fill" objectFit="cover" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/70" />
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="w-full sm:w-auto"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      {selectedFile ? "Change Image" : "Upload Image"}
                    </Button>
                    <Input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      disabled={isSaving}
                    />
                     {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
                     {!selectedFile && form.getValues("avatarUrl") && <p className="text-xs text-muted-foreground">Current avatar is set via URL.</p>}
                  </div>
                </FormControl>
                <FormDescription>Upload a PNG, JPG, GIF, or WEBP file. Max 2MB recommended.</FormDescription>
                <FormMessage>{form.formState.errors.avatarUrl?.message}</FormMessage>
              </FormItem>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSaving || isLoading}
              >
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSaving ? (savingStep || "Saving...") : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Profile data is stored in Firestore and avatar images in Firebase Storage.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
