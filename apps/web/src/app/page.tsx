import { Navigation } from '@/components/landing/navigation';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Privacy } from '@/components/landing/privacy';
import { Pricing } from '@/components/landing/pricing';
import { Footer } from '@/components/landing/footer';

/**
 * Landing page for Famly
 * Showcases features, privacy, and pricing
 */
export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Privacy />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
