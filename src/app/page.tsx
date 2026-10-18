// src/app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, AlertTriangle, Droplets, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME } from "@/lib/constants";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">N.E.S.T.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Get access
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-blue-300 text-sm font-medium">Live monitoring active</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
          Your neighborhood,{" "}
          <span className="text-blue-400">safer together</span>
        </h1>
        <p className="text-slate-400 text-xl mb-10 max-w-xl leading-relaxed">
          {APP_FULL_NAME} — AI-powered civic platform for reporting issues,
          tracking emergencies, and monitoring water quality in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/register">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 h-12 text-base">
              Register as resident
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base">
              Admin sign in
            </Button>
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { icon: MessageSquare, label: "Complaint tracking", desc: "AI-classified & prioritized" },
            { icon: AlertTriangle, label: "Live alerts", desc: "Real-time notifications" },
            { icon: Droplets, label: "Water quality", desc: "Zone-by-zone monitoring" },
            { icon: Shield, label: "Emergency mgmt", desc: "Rapid incident response" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
            >
              <Icon className="w-5 h-5 text-blue-400 mb-3" />
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-slate-500 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-slate-600 text-sm border-t border-white/5">
        © {new Date().getFullYear()} N.E.S.T. — Neighborhood Emergency and Safety Tool
      </footer>
    </main>
  );
}
