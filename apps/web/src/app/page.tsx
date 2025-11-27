import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Header } from '@tpmjs/ui/Header/Header';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { DeveloperStories } from '../components/home/DeveloperStories';
import { EcosystemStats } from '../components/home/EcosystemStats';
import { HeroSection } from '../components/home/HeroSection';
import { ProblemSection } from '../components/home/ProblemSection';
import { VisionSection } from '../components/home/VisionSection';

export default function HomePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        title={
          <Link
            href="/"
            className="text-foreground hover:text-foreground text-xl md:text-2xl font-bold uppercase tracking-tight"
          >
            TPMJS
          </Link>
        }
        size="md"
        sticky={true}
        actions={
          <div className="flex items-center gap-4">
            <Link href="/playground">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Playground
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Pro
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Teams
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Pricing
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Documentation
            </Button>
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
            <Button size="sm">Sign Up</Button>
            <ThemeToggle />
          </div>
        }
      />

      <main className="flex-1">
        {/* Hero Section - Dithered Design */}
        <HeroSection />

        {/* Problem Section - The fragmented world before tpmjs */}
        <ProblemSection />

        {/* Vision Section - The dynamic ecosystem with tpmjs */}
        <VisionSection />

        {/* Ecosystem Stats - Live metrics with dithered counters */}
        <EcosystemStats />

        {/* Developer Stories - Code-first testimonials */}
        <DeveloperStories />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-surface">
        <Container size="xl" padding="lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-foreground-secondary">© 2025 TPMJS. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Privacy
              </button>
              <span className="text-border">·</span>
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Terms
              </button>
              <span className="text-border">·</span>
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Contact
              </button>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
