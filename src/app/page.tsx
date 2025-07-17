
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, DollarSign, HelpCircle, MessageSquare, Star, Users, Zap, Clock, Settings, ChevronRight, Users2, Briefcase, ShieldCheck, BarChart3, Brain, CalendarCheck, Palette } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Instant Coin Minting",
      description: "Effortlessly mint ERC-20 coins on Base Sepolia, representing your time and expertise.",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Seamless Scheduling",
      description: "Integrate with Google & Outlook calendars for easy booking and availability management.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Coin-Gated Access",
      description: "Enable clients to book your time by acquiring your unique creator coins, ensuring committed engagement.",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Creator Dashboard",
      description: "Manage your coins, bookings, profile, and calendar integrations all in one place.",
    },
  ];

  const howItWorksSteps = {
    creators: [
      { 
        icon: <Users2 className="h-10 w-10 text-accent" />, 
        title: "Sign Up & Connect", 
        description: "Quickly connect your wallet and set up your creator profile in minutes." 
      },
      { 
        icon: <Palette className="h-10 w-10 text-accent" />, 
        title: "Mint Your Coins", 
        description: "Define and mint unique ERC-20 coins that represent your services or time." 
      },
      { 
        icon: <CalendarCheck className="h-10 w-10 text-accent" />, 
        title: "Set Availability & Share", 
        description: "Sync your calendar, define your available slots, and share your booking page." 
      },
    ],
    clients: [
      { 
        icon: <Users className="h-10 w-10 text-primary" />, 
        title: "Discover Creators", 
        description: "Explore a marketplace of talented individuals and professionals." 
      },
      { 
        icon: <DollarSign className="h-10 w-10 text-primary" />, 
        title: "Acquire Access Coin", 
        description: "Purchase or earn the creator's specific coin required for booking." 
      },
      { 
        icon: <Clock className="h-10 w-10 text-primary" />, 
        title: "Book Your Session", 
        description: "Seamlessly book an available time slot using your coin." 
      },
    ]
  };

  const pricingTiers = [
    {
      name: "Creator Starter",
      price: "Free",
      description: "Perfect for individuals getting started.",
      features: [
        "1 Active Coin Type",
        "Basic Calendar Integration (Google)",
        "Public Profile Page",
        "Up to 10 Bookings/month",
        "Community Support",
      ],
      cta: "Get Started Free",
      href: "/dashboard",
      highlight: false,
    },
    {
      name: "Creator Pro",
      price: "$29",
      period: "/month",
      description: "For professionals scaling their services.",
      features: [
        "Unlimited Coin Types",
        "Advanced Calendar Integrations (Google & Outlook)",
        "Customizable Profile Page",
        "Unlimited Bookings",
        "Email & Chat Support",
        "Analytics (Coming Soon)",
      ],
      cta: "Choose Pro Plan",
      href: "/dashboard", // Link to a future upgrade page
      highlight: true,
    },
    {
      name: "Business Suite",
      price: "Custom",
      description: "Tailored solutions for agencies and teams.",
      features: [
        "All Pro Features",
        "Team Management Tools",
        "API Access for Integrations",
        "Dedicated Account Manager",
        "Custom Branding Options",
        "Priority Support SLA",
      ],
      cta: "Contact Sales",
      href: "mailto:sales@aion.example.com", // Example mailto link
      highlight: false,
    },
  ];

  const faqItems = [
    {
      question: "What is Aion?",
      answer: "Aion is a platform that empowers creators to tokenize their time and services using Web3 technology. Creators can mint unique ERC-20 coins, and clients can use these coins to book sessions, consultations, or access exclusive content.",
    },
    {
      question: "How does coin-gating work for bookings?",
      answer: "Creators define which specific coin (and sometimes how many) is required to book a particular service or time slot. Clients must hold this coin in their connected wallet to be able to complete a booking, ensuring genuine interest and value exchange.",
    },
    {
      question: "What blockchain does Aion use for coins?",
      answer: "Aion leverages Zora's infrastructure on the Base Sepolia testnet for minting time coins. This provides a scalable and cost-effective solution.",
    },
    {
      question: "Are there any fees for using Aion?",
      answer: "Our 'Creator Starter' plan is free. For advanced features, we offer paid plans like 'Creator Pro'. Standard blockchain transaction fees (gas fees) apply when minting coins or interacting with smart contracts.",
    },
    {
      question: "Can I integrate my existing calendar?",
      answer: "Yes! Aion supports integration with Google Calendar, allowing you to sync your availability and avoid double bookings. Outlook Calendar integration is also available. These are managed from your dashboard.",
    },
  ];

  return (
    <div className="flex flex-col items-center text-center space-y-16 md:space-y-24 py-8 md:py-16 overflow-x-hidden">
      {/* Hero Section */}
      <section className="space-y-8 max-w-4xl px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Monetize Your Expertise, <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Tokenize Your Time</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Aion empowers creators, coaches, and consultants to launch time-based access coins. Offer exclusive sessions and manage bookings seamlessly with Web3.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" asChild className="shadow-lg hover:shadow-primary/40 transform hover:scale-105 transition-transform duration-200">
            <Link href="/dashboard">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-accent/40 transform hover:scale-105 transition-transform duration-200">
            <Link href="#pricing">
              View Pricing
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full max-w-6xl px-4" id="how-it-works">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">How Aion Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold text-accent flex items-center justify-center md:justify-start gap-2"><Users2 /> For Creators</h3>
            {howItWorksSteps.creators.map((step, index) => (
              <Card key={`creator-step-${index}`} className="text-left bg-card/70 backdrop-blur-sm shadow-lg">
                <CardHeader className="flex flex-row items-start gap-4">
                  {step.icon}
                  <div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-base">{step.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold text-primary flex items-center justify-center md:justify-start gap-2"><Users /> For Clients/Fans</h3>
            {howItWorksSteps.clients.map((step, index) => (
              <Card key={`client-step-${index}`} className="text-left bg-card/70 backdrop-blur-sm shadow-lg">
                <CardHeader className="flex flex-row items-start gap-4">
                  {step.icon}
                  <div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-base">{step.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section (Existing, slightly adapted) */}
      <section className="w-full max-w-5xl px-4" id="features">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">Unlock Powerful Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/80 backdrop-blur-sm shadow-xl transform hover:scale-[1.02] transition-transform duration-300 text-left">
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                {feature.icon}
                <CardTitle className="text-xl mt-1">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full max-w-6xl px-4" id="pricing">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Flexible Plans for Every Creator</h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">Choose the plan that fits your journey, from starting out to scaling your digital presence.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`shadow-xl flex flex-col h-full ${tier.highlight ? 'border-primary border-2 relative' : 'bg-card/80'}`}>
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="text-4xl font-bold my-2">
                  {tier.price}
                  {tier.period && <span className="text-base font-normal text-muted-foreground">{tier.period}</span>}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 text-left">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button size="lg" className={`w-full ${tier.highlight ? '' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`} asChild>
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
      <section className="w-full max-w-5xl px-4">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">Loved by Creators Worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Image src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt="User avatar" width={40} height={40} className="rounded-full mr-3" />
                  <div>
                    <p className="font-semibold">User Name {i}</p>
                    <p className="text-xs text-muted-foreground">Creator Role</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"Aion has transformed how I connect with my audience. Placeholder testimonial text..."</p>
                <div className="flex mt-3">
                  {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
         <Button variant="outline" asChild className="mt-8">
            <Link href="#">Read More Stories <ChevronRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-3xl px-4" id="faq">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full text-left">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg hover:text-primary">{item.question}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      
      {/* Final CTA Section */}
      <section className="w-full max-w-4xl px-4 py-12 bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-xl shadow-2xl border border-border">
         <div className="max-w-2xl mx-auto space-y-6">
            <Brain className="h-16 w-16 text-primary mx-auto" />
            <h3 className="text-3xl font-semibold tracking-tight">
              Ready to Revolutionize Your Access?
            </h3>
            <p className="text-lg text-muted-foreground">
              Join Aion today. Connect your wallet, mint your first time coin, and start offering exclusive access to your expertise. No complex setups, just pure Web3 power.
            </p>
            <Button size="lg" asChild className="mt-4 shadow-lg hover:shadow-primary/40 transform hover:scale-105 transition-transform duration-200">
              <Link href="/dashboard">
                Launch Your Creator Profile <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
      </section>
    </div>
  );
}
