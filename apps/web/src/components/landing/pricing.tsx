import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cloudFeatures, selfHostedFeatures } from '@/static-data/features';
import { Check, Server, Cloud, Heart } from 'lucide-react';

/**
 * Pricing section component for the landing page
 * Displays self-hosted and cloud hosting options
 */
export function Pricing() {
  return (
    <section id="pricing" data-testid="pricing-section" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">Choose Your Path</h2>
          <p className="text-lg text-muted-foreground text-balance">
            Whether you prefer complete control or hassle-free convenience, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Self-Hosted Option */}
          <Card data-testid="pricing-self-hosted" className="p-8 border-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-chart-3/10 rounded-bl-full" />
            <div className="relative">
              <div className="inline-flex p-3 rounded-lg bg-chart-3/10 mb-4">
                <Server className="h-8 w-8 text-chart-3" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Self-Hosted</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold">Free</div>
                <p className="text-muted-foreground">Forever</p>
              </div>
              <ul className="space-y-3 mb-8">
                {selfHostedFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-chart-3 hover:bg-chart-3/90 text-primary-foreground" size="lg">
                Get Docker Setup
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">Requires your own server or NAS</p>
            </div>
          </Card>

          {/* Cloud Hosted Option */}
          <Card data-testid="pricing-cloud" className="p-8 border-2 border-primary/20 hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card to-secondary">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              BETA
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
            <div className="relative">
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Cloud Hosted</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">€5</span>
                  <span className="text-muted-foreground">per member/month</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">Billed monthly</p>
              </div>
              <ul className="space-y-3 mb-8">
                {cloudFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                Start Free Trial
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                14-day free trial • No credit card required
              </p>
            </div>
          </Card>
        </div>

        {/* Comparison Note */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <Card className="p-6 bg-muted/50">
            <div className="flex items-start gap-4">
              <div className="h-6 w-6 text-primary shrink-0 mt-1">
                <Heart className="h-6 w-6 fill-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-2">Same Features, Different Hosting</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Both options include all Famly features. The only difference is who manages the infrastructure.
                  Self-hosting gives you complete control, while cloud hosting offers convenience. You can even start
                  with cloud and migrate to self-hosted later!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
