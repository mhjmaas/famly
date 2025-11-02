"use client";

import { Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DictionarySection } from "@/i18n/types";
import {
  type FeatureHighlightBulletKey,
  featureCards,
  featureHighlightBulletKeys,
} from "@/static-data/features";

type FeaturesProps = {
  dict: DictionarySection<"features">;
};

const bulletOrder: FeatureHighlightBulletKey[] = [
  ...featureHighlightBulletKeys,
];

/**
 * Features section component for the landing page
 * Displays a grid of feature cards and a highlight section
 */
export function Features({ dict }: FeaturesProps) {
  return (
    <section
      id="features"
      data-testid="features-section"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {featureCards.map(({ key, icon: Icon, color, bgColor }) => {
            const card = dict.cards[key];
            return (
              <Card
                key={key}
                data-testid="feature-card"
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`inline-flex p-2 rounded-lg ${bgColor}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlight Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-balance">
                {dict.highlight.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {dict.highlight.description}
              </p>
              <ul className="space-y-3">
                {bulletOrder.map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">
                      {dict.highlight.bullets[key]}
                    </span>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    {dict.highlight.badge}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
