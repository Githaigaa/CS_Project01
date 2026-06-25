import { ArrowRight, Shield, TrendingUp, Heart, FileCheck, Users, Map } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-semibold">CattleTrace</span>
          </div>
          <Button onClick={() => onNavigate("dashboard")}>
            Enter Platform
          </Button>
        </div>
      </header>

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-semibold mb-6 text-foreground">
                End-to-End Animal Traceability & Livestock Marketplace
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Track, verify, trade, and monitor livestock throughout its entire lifecycle with complete transparency and compliance.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => onNavigate("animals")}
                >
                  Register Animal <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate("marketplace")}
                >
                  Explore Marketplace
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => onNavigate("wireframes")}
                >
                  View Wireframes
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1498191923457-88552caeccb3"
                  alt="Livestock herd"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">98% Traceability</div>
                    <div className="text-muted-foreground">Industry Leading</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">Platform Features</h2>
            <p className="text-muted-foreground">Comprehensive livestock management in one platform</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card hover>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Complete Traceability</h3>
              <p className="text-muted-foreground">Track every animal from birth to processing with RFID technology</p>
            </Card>
            <Card hover>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Health Management</h3>
              <p className="text-muted-foreground">Record vaccinations, treatments, and monitor disease outbreaks</p>
            </Card>
            <Card hover>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Livestock Marketplace</h3>
              <p className="text-muted-foreground">Buy and sell livestock with verified traceability records</p>
            </Card>
            <Card hover>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Movement Tracking</h3>
              <p className="text-muted-foreground">Monitor livestock movements with GPS and permit management</p>
            </Card>
            <Card hover>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Regulatory Compliance</h3>
              <p className="text-muted-foreground">Meet government requirements with automated reporting</p>
            </Card>
            <Card hover>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Role Access</h3>
              <p className="text-muted-foreground">Farmers, traders, vets, and regulators in one platform</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">How Traceability Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Registration", desc: "Register animal with RFID tag" },
              { step: "2", title: "Health Records", desc: "Track vaccinations and treatments" },
              { step: "3", title: "Movement Tracking", desc: "Monitor location changes" },
              { step: "4", title: "Processing", desc: "Complete chain of custody" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-semibold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-6">Ready to Transform Your Livestock Management?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of farmers, traders, and regulators using CattleTrace</p>
          <Button
            variant="accent"
            size="lg"
            onClick={() => onNavigate("dashboard")}
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 CattleTrace Kenya. National Livestock Traceability Platform - In partnership with DVS Kenya.</p>
        </div>
      </footer>
    </div>
  );
}
