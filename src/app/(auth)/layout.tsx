import { Droplets } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-background to-muted/30">
      {/* Background decoration */}
      <div className="absolute top-20 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl -z-10" />

      <Link
        href="/"
        className="flex items-center gap-2 mb-8 group"
      >
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
          <Droplets className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold">Routine</span>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Routine. Your skincare, simplified.
      </p>
    </div>
  );
}
