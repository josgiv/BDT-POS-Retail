'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Wifi, ShieldCheck, Server, Database, User, Menu, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Mock check connection (in real app, call API)
const checkSystemStatus = async () => {
  // Simulate API call
  return {
    local: true,
    cloud: navigator.onLine,
    auth: navigator.onLine
  };
};

export default function LandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState({ local: false, cloud: false, auth: false });
  const [selectedBranch, setSelectedBranch] = useState('JKT-001');

  useEffect(() => {
    const init = async () => {
      const s = await checkSystemStatus();
      setStatus(s);
      const savedBranch = localStorage.getItem('branch_code');
      if (savedBranch) setSelectedBranch(savedBranch);
    };
    init();
    const interval = setInterval(async () => {
      const s = await checkSystemStatus();
      setStatus(s);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBranchChange = (code: string) => {
    setSelectedBranch(code);
    localStorage.setItem('branch_code', code);
    toast.success(`Branch switched to ${code}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-yellow-200 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-yellow-500">BAHLIL</span>MART
            <span className="text-neutral-400 text-sm font-normal ml-2 hidden md:inline-block">Distributed Retail System</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#" className="hover:text-yellow-600 transition-colors">Solutions</a>
            <a href="#" className="hover:text-yellow-600 transition-colors">Hardware</a>
            <a href="#" className="hover:text-yellow-600 transition-colors">Developers</a>
            <a href="#" className="hover:text-yellow-600 transition-colors">Support</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden md:flex">Contact Sales</Button>
            <Button onClick={() => router.push('/login')} className="bg-blue-700 hover:bg-blue-800 text-white">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative overflow-hidden bg-white border-b border-neutral-200">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
          <div className="container mx-auto px-6 py-20 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8 max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  All Systems Operational
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
                  Retail Intelligence <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-600">
                    Reimagined.
                  </span>
                </h1>
                <p className="text-xl text-neutral-600 leading-relaxed max-w-lg">
                  Enterprise-grade Point of Sale with offline-first architecture.
                  Built for high-volume retail environments where downtime is not an option.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20 rounded-full transition-all hover:scale-105"
                    onClick={() => router.push('/login')}
                  >
                    <User className="mr-2 h-5 w-5" />
                    Launch POS Terminal
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg border-2 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 rounded-full"
                  >
                    View Documentation
                  </Button>
                </div>
              </motion.div>

              {/* Status Widget */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="w-full max-w-md"
              >
                <Card className="bg-white/80 backdrop-blur-xl border-neutral-200 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5">
                  <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Server className="h-5 w-5 text-blue-600" />
                      Infrastructure Health
                    </CardTitle>
                    <CardDescription>Live monitoring of distributed nodes</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                      <StatusRow
                        label="Local Database (PostgreSQL)"
                        status={status.local}
                        icon={Database}
                        detail="Connected (Latency: <1ms)"
                      />
                      <StatusRow
                        label="Cloud Sync (TiDB)"
                        status={status.cloud}
                        icon={Wifi}
                        detail="Connected (Latency: 45ms)"
                      />
                      <StatusRow
                        label="Identity Service (Supabase)"
                        status={status.auth}
                        icon={ShieldCheck}
                        detail="Authenticated (Secure)"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-neutral-50/80 border-t border-neutral-100 p-4">
                    <div className="w-full space-y-3">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Branch Configuration</label>
                      <div className="grid grid-cols-2 gap-2">
                        <BranchButton
                          code="JKT-001"
                          name="Jakarta Timur"
                          active={selectedBranch === 'JKT-001'}
                          onClick={() => handleBranchChange('JKT-001')}
                        />
                        <BranchButton
                          code="BDG-001"
                          name="Bandung Kota"
                          active={selectedBranch === 'BDG-001'}
                          onClick={() => handleBranchChange('BDG-001')}
                        />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="container mx-auto px-6 py-24">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Engineered for the Modern Retailer
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                A distributed system architecture that ensures your business never stops, regardless of network conditions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Offline-First Core"
                desc="Continue transactions seamlessly even when internet connectivity is lost. Data syncs automatically upon reconnection."
                icon="⚡"
                delay={0.2}
              />
              <FeatureCard
                title="Distributed Sync"
                desc="Advanced conflict resolution and background synchronization engine powered by TiDB Cloud."
                icon="🔄"
                delay={0.4}
              />
              <FeatureCard
                title="Enterprise Security"
                desc="Role-based access control and encrypted local storage ensuring data integrity at edge locations."
                icon="🛡️"
                delay={0.6}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-neutral-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-blue-600">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-600">Community</a></li>
                <li><a href="#" className="hover:text-blue-600">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-neutral-500">
              © 2024 Alfamart Retail System. All rights reserved.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-400 hover:text-neutral-600"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-neutral-400 hover:text-neutral-600"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-neutral-400 hover:text-neutral-600"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-neutral-400 hover:text-neutral-600"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatusRow({ label, status, icon: Icon, detail }: any) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm text-neutral-900">{label}</p>
          <p className="text-xs text-neutral-500 font-mono">{detail}</p>
        </div>
      </div>
      <Badge variant={status ? "default" : "destructive"} className={cn("rounded-lg px-2 py-1", status ? "bg-green-500 hover:bg-green-600" : "")}>
        {status ? "ONLINE" : "OFFLINE"}
      </Badge>
    </div>
  );
}

function BranchButton({ code, name, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200",
        active
          ? "border-blue-600 bg-blue-50/50 text-blue-700"
          : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600"
      )}
    >
      <span className="text-xs font-bold uppercase tracking-wider">{code}</span>
      <span className="text-sm font-medium truncate w-full text-left">{name}</span>
    </button>
  );
}

function FeatureCard({ title, desc, icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: delay || 0 }}
      className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
