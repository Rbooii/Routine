import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Sparkles,
  Clock,
  Bell,
  ShieldCheck,
  ArrowRight,
  Droplets,
  FlaskConical,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Droplets className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Routine</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-pink-400/15 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Your skincare, simplified
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
            Never miss a step in your{" "}
            <span className="gradient-text">skincare routine</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Complex post-clinic routines made easy. Smart scheduling, ingredient
            conflict detection, and timely reminders — so your skin gets exactly
            what it needs, when it needs it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/register">
              <Button size="xl" className="group">
                Start Your Routine
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Sound familiar?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              After visiting a beauty clinic, you walk out with a bag of products
              and a head full of complex instructions...
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FlaskConical,
                title: "Complex mixing rules",
                description:
                  "Some products must be mixed together. Others should NEVER touch. Retinol + AHA? That's a recipe for irritation.",
              },
              {
                icon: Clock,
                title: "Precise timing",
                description:
                  "Product A in the morning, Product B at night. Wait 60 seconds between layers. It's easy to forget or mix up.",
              },
              {
                icon: CalendarCheck,
                title: "Changing schedules",
                description:
                  "Post-procedure restrictions, gradual introductions, different routines for different days of the week.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">stay on track</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: CalendarCheck,
                title: "Smart Scheduling",
                description:
                  "Set AM/PM routines with exact times and days. We handle the complexity.",
              },
              {
                icon: FlaskConical,
                title: "Conflict Detection",
                description:
                  "Instant warnings when you combine incompatible ingredients like retinol + AHA.",
              },
              {
                icon: Bell,
                title: "Reminders",
                description:
                  "Email and push notifications remind you exactly when each routine is due.",
              },
              {
                icon: ShieldCheck,
                title: "Progress Tracking",
                description:
                  "Build streaks, track completion, and see your skincare adherence over time.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group text-center p-6 rounded-2xl hover:bg-muted/50 transition-colors"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/90 to-purple-600 p-10 sm:p-16 text-center text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -z-0" />

            <div className="relative z-10">
              <Droplets className="h-10 w-10 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Your skin deserves consistency
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Join Routine and never miss a step in your skincare journey
                again. Free to use, no credit card required.
              </p>
              <Link href="/register">
                <Button
                  size="xl"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 font-semibold"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Droplets className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Routine</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Routine. Your skincare, simplified.
          </p>
        </div>
      </footer>
    </div>
  );
}
