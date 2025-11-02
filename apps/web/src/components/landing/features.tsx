'use client';

import { Card } from '@/components/ui/card';
import { features } from '@/static-data/features';
import { Home } from 'lucide-react';

/**
 * Features section component for the landing page
 * Displays a grid of feature cards and a highlight section
 */
export function Features() {
  return (
    <section id="features" data-testid="features-section" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">Everything Your Family Needs</h2>
          <p className="text-lg text-muted-foreground text-balance">
            From daily tasks to cherished memories, Famly brings all aspects of family life together in one secure
            platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} data-testid="feature-card" className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
              <div className="flex items-center gap-3 mb-3">
                <div className={`inline-flex p-2 rounded-lg ${feature.bgColor}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Feature Highlight Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-balance">Built for Modern Families</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're coordinating schedules, sharing grocery lists, or preserving precious memories, Famly
                adapts to your family's unique needs.
              </p>
              <ul className="space-y-3">
                {[
                  'Intuitive interface for all ages',
                  'Works on all devices',
                  'Offline-first design',
                  'Customizable for your family',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary via-accent to-muted p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-6 rounded-full bg-card shadow-xl">
                    <Home className="h-16 w-16 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Your Family Hub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
