import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DictionarySection } from "@/i18n/types";
import { privacyFeatureCards } from "@/static-data/features";

type PrivacyProps = {
  dict: DictionarySection<"privacy">;
};

/**
 * Privacy section component for the landing page
 * Emphasizes Famly's privacy-first approach
 */
export function Privacy({ dict }: PrivacyProps) {
  return (
    <section
      id="privacy"
      data-testid="privacy-section"
      className="py-20 md:py-32 bg-gradient-to-br from-secondary via-accent to-muted"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-2/10 border border-chart-2/20 mb-6">
            <Shield className="h-4 w-4 text-chart-2" />
            <span className="text-sm font-medium text-chart-2">
              {dict.badge}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
            {dict.title}
          </h2>
          <p className="text-lg text-muted-foreground text-balance">
            {dict.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
          {privacyFeatureCards.map(({ key, icon: Icon }) => {
            const card = dict.cards[key];
            return (
              <Card
                key={key}
                className="p-6 bg-card border-2 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-chart-2/10">
                    <Icon className="h-5 w-5 text-chart-2" />
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

        {/* Privacy Promise */}
        <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-br from-card to-secondary border-2">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-full bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              {dict.promise.title}
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {dict.promise.description
                .split(/(<strong>.*?<\/strong>)/)
                .map((part, index) => {
                  if (
                    part.startsWith("<strong>") &&
                    part.endsWith("</strong>")
                  ) {
                    const strongKey = `strong-${index}`;
                    return (
                      <strong key={strongKey}>
                        {part.replace(/<\/?strong>/g, "")}
                      </strong>
                    );
                  }
                  return part;
                })}
            </p>
            <div className="pt-4">
              <a
                href="/privacy-policy"
                className="text-primary font-medium hover:underline"
              >
                {dict.promise.linkLabel}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
