import { Check, Cloud, Heart, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DictionarySection } from "@/i18n/types";
import {
  cloudFeatureKeys,
  selfHostedFeatureKeys,
} from "@/static-data/features";

type PricingProps = {
  dict: DictionarySection<"pricing">;
};

/**
 * Pricing section component for the landing page
 * Displays self-hosted and cloud hosting options
 */
export function Pricing({ dict }: PricingProps) {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="py-20 md:py-32 bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
            {dict.title}
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            {dict.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Self-Hosted Option */}
          <Card
            data-testid="pricing-self-hosted"
            className="p-8 border-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-chart-3/10 rounded-bl-full" />
            <div className="relative">
              <div className="inline-flex p-3 rounded-lg bg-chart-3/10 mb-4">
                <Server className="h-8 w-8 text-chart-3" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {dict.selfHosted.title}
              </h3>
              <div className="mb-6">
                <div className="text-4xl font-bold">
                  {dict.selfHosted.price.amount}
                </div>
                <p className="text-muted-foreground">
                  {dict.selfHosted.price.note}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {selfHostedFeatureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {dict.selfHosted.features[key]}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-chart-3 hover:bg-chart-3/90 text-primary-foreground"
                size="lg"
              >
                {dict.selfHosted.cta}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                {dict.selfHosted.disclaimer}
              </p>
            </div>
          </Card>

          {/* Cloud Hosted Option */}
          <Card
            data-testid="pricing-cloud"
            className="p-8 border-2 border-primary/20 hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card to-secondary"
          >
            {dict.cloud.badge ? (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {dict.cloud.badge}
              </div>
            ) : null}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
            <div className="relative">
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{dict.cloud.title}</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {dict.cloud.price.amount}
                  </span>
                  <span className="text-muted-foreground">
                    {dict.cloud.price.interval}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {dict.cloud.price.note}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {cloudFeatureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {dict.cloud.features[key]}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {dict.cloud.cta}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                {dict.cloud.disclaimer}
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
                <h4 className="font-semibold mb-2">{dict.featureNote.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dict.featureNote.description}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
