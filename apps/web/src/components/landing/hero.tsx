'use client';

import { useEffect, useState } from 'react';
import { Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DictionarySection } from '@/i18n/types';

type HeroProps = {
  dict: DictionarySection<'hero'>;
};

const trustIndicatorOrder = ['encrypted', 'selfHosted', 'familyFirst'] as const;

/**
 * Hero section component for the landing page
 * Features animated entrance effects and orbital background elements
 */
export function Hero({ dict }: HeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-muted" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted &&
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-orbit"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 20}%`,
                width: `${30 + (i % 3) * 15}px`,
                height: `${30 + (i % 3) * 15}px`,
                background:
                  i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-chart-2)' : 'var(--color-chart-3)',
                opacity: 0.15,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${6 + i * 0.7}s`,
              }}
            />
          ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{dict.badge}</span>
          </div>

          {/* Main Heading */}
          <h1
            data-testid="hero-heading"
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {dict.heading.leading}{' '}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              {dict.heading.highlight}
            </span>
          </h1>

          {/* Subheading */}
          <p
            data-testid="hero-subheading"
            className={`text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {dict.subheading}
          </p>

          {/* CTA Buttons */}
          <div
            data-testid="hero-cta"
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base shadow-lg shadow-primary/25"
            >
              {dict.primaryCta}
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 text-base border-2 bg-transparent">
              {dict.secondaryCta}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div
            className={`flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {trustIndicatorOrder.map((key) => {
              if (key === 'encrypted') {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-chart-2" />
                    <span>{dict.trustIndicators.encrypted}</span>
                  </div>
                );
              }
              if (key === 'selfHosted') {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-chart-3" />
                    <span>{dict.trustIndicators.selfHosted}</span>
                  </div>
                );
              }
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="relative w-4 h-4">
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-chart-2" />
                  </div>
                  <span>{dict.trustIndicators.familyFirst}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
