import { Card } from '@/components/ui/card';
import { privacyFeatures } from '@/static-data/features';
import { Shield } from 'lucide-react';

/**
 * Privacy section component for the landing page
 * Emphasizes Famly's privacy-first approach
 */
export function Privacy() {
  return (
    <section id="privacy" data-testid="privacy-section" className="py-20 md:py-32 bg-gradient-to-br from-secondary via-accent to-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chart-2/10 border border-chart-2/20 mb-6">
            <Shield className="h-4 w-4 text-chart-2" />
            <span className="text-sm font-medium text-chart-2">Privacy Guaranteed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">Privacy Isn't Optional</h2>
          <p className="text-lg text-muted-foreground text-balance">
            In a world where your data is constantly harvested, we take a different approach. Your family's privacy is
            our top priority—not an afterthought.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
          {privacyFeatures.map((feature, index) => (
            <Card key={index} className="p-6 bg-card border-2 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-chart-2/10">
                  <feature.icon className="h-5 w-5 text-chart-2" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Privacy Promise */}
        <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-br from-card to-secondary border-2">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-full bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">Our Privacy Promise</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We will <strong>never</strong> sell your data. We will <strong>never</strong> use it for advertising. We
              will <strong>never</strong> share it with third parties. Your family's information is sacred, and we treat
              it that way. This isn't just a policy—it's our core principle.
            </p>
            <div className="pt-4">
              <a href="/privacy-policy" className="text-primary font-medium hover:underline">
                Read our full privacy policy →
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
