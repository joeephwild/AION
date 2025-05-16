import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Clock, Zap, Users, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Instant Token Minting",
      description: "Effortlessly mint ERC-20 tokens on Zora representing your time and expertise.",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Seamless Scheduling",
      description: "Integrate with Google & Outlook calendars for easy booking and availability management.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Token-Gated Access",
      description: "Enable clients to book your time by acquiring your unique creator tokens.",
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Creator Dashboard",
      description: "Manage your tokens, bookings, and calendar integrations all in one place.",
    },
  ];

  return (
    <div className="flex flex-col items-center text-center space-y-12 py-8 md:py-16">
      <section className="space-y-6 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Unlock Your Time with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Aion</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Monetize your availability and expertise. Aion empowers creators to mint time-based access tokens, allowing clients to book sessions seamlessly using Web3 technology.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="shadow-lg hover:shadow-primary/40 transform hover:scale-105 transition-transform duration-200">
            <Link href="/dashboard">
              Become a Creator <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-accent/40 transform hover:scale-105 transition-transform duration-200">
            <Link href="#features">
              Learn More
            </Link>
          </Button>
        </div>
      </section>

      <section className="w-full max-w-5xl" id="features">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Why Aion?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/80 backdrop-blur-sm shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {feature.icon}
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      <section className="w-full max-w-4xl">
         <Card className="overflow-hidden shadow-2xl bg-gradient-to-br from-card/50 to-background">
          <CardContent className="p-0 md:flex md:items-center">
            <div className="p-6 md:p-8 md:w-1/2 space-y-4 text-left">
              <h3 className="text-2xl font-semibold tracking-tight text-primary">
                Ready to Redefine Access?
              </h3>
              <p className="text-muted-foreground">
                Join the Aion platform today. Connect your wallet, mint your first time token, and start offering exclusive access to your expertise.
              </p>
              <Button size="lg" asChild className="mt-4 shadow-lg hover:shadow-primary/40">
                <Link href="/mint">
                  Get Started Now <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="md:w-1/2 h-64 md:h-auto relative">
              <Image
                src="https://placehold.co/600x400.png"
                alt="Abstract representation of time and tokens"
                layout="fill"
                objectFit="cover"
                data-ai-hint="futuristic abstract"
                className="opacity-70 md:opacity-100"
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
