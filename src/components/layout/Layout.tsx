import { ReactNode } from "react";
import { Link } from "wouter";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border py-10 mt-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="max-w-md">
              <div className="text-xl font-bold text-foreground mb-2">ForexBonusWhale 🐋</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compare Top Forex Bonuses. We track the best no deposit bonuses, deposit bonuses, and trading contests from regulated forex brokers.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">Quick Links</div>
              <Link href="/no-deposit" className="text-sm text-muted-foreground hover:text-primary transition-colors">No Deposit Bonus</Link>
              <Link href="/deposit" className="text-sm text-muted-foreground hover:text-primary transition-colors">Deposit Bonus</Link>
              <Link href="/contests" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contest</Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} ForexBonusWhale. All rights reserved.</span>
            <span>
              Have a broker bonus to list or found incorrect information?{" "}
              <a href="mailto:forexbonuswhale@gmail.com" className="text-primary hover:underline">
                forexbonuswhale@gmail.com
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
