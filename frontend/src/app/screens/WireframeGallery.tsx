import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { WireframeDashboard } from "./wireframes/WireframeDashboard";
import { WireframeAnimalRegistration } from "./wireframes/WireframeAnimalRegistration";
import { WireframeMarketplace } from "./wireframes/WireframeMarketplace";
import { WireframeAnimalProfile } from "./wireframes/WireframeAnimalProfile";
import { WireframeHealthRecord } from "./wireframes/WireframeHealthRecord";
import { WireframeDVSPermit } from "./wireframes/WireframeDVSPermit";
import { Layout, FileText, Store, User, Heart, CheckSquare, X } from "lucide-react";

export function WireframeGallery() {
  const [selectedWireframe, setSelectedWireframe] = useState<string | null>(null);

  const wireframes = [
    {
      id: "dashboard",
      title: "Home Dashboard",
      description: "Overview with KPIs, charts, and recent activity feeds",
      icon: Layout,
      component: WireframeDashboard,
      actor: "All Users",
    },
    {
      id: "registration",
      title: "Animal Registration",
      description: "Multi-step wizard for registering new animals",
      icon: FileText,
      component: WireframeAnimalRegistration,
      actor: "Farmer/Owner",
    },
    {
      id: "marketplace",
      title: "Marketplace Listing",
      description: "Grid view of animals for sale with filters",
      icon: Store,
      component: WireframeMarketplace,
      actor: "Buyer/Trader",
    },
    {
      id: "profile",
      title: "Animal Profile",
      description: "Detailed animal information with tabbed interface",
      icon: User,
      component: WireframeAnimalProfile,
      actor: "All Users",
    },
    {
      id: "health",
      title: "Health Record Entry",
      description: "Form for recording health events and vaccinations",
      icon: Heart,
      component: WireframeHealthRecord,
      actor: "Animal Health Worker",
    },
    {
      id: "permit",
      title: "DVS Permit Review",
      description: "Government permit approval workflow",
      icon: CheckSquare,
      component: WireframeDVSPermit,
      actor: "Government/Administrator",
    },
  ];

  if (selectedWireframe) {
    const wireframe = wireframes.find(w => w.id === selectedWireframe);
    if (wireframe) {
      const Component = wireframe.component;
      return (
        <div className="relative">
          <Component />
          <button
            onClick={() => setSelectedWireframe(null)}
            className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2">Wireframe Gallery</h1>
        <p className="text-muted-foreground">
          Core actor journeys covering the main workflows in CattleTrace
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wireframes.map((wireframe) => {
          const Icon = wireframe.icon;
          return (
            <Card
              key={wireframe.id}
              className="border-2 border-dashed border-primary hover:border-primary hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedWireframe(wireframe.id)}
            >
              <div className="p-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{wireframe.title}</h3>
                  <p className="text-muted-foreground mb-3">{wireframe.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-secondary/10 rounded text-secondary">
                      {wireframe.actor}
                    </div>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Wireframe
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-primary">
        <div className="p-6 space-y-4">
          <h3 className="font-semibold">About These Wireframes</h3>
          <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Purpose</h4>
              <p>
                These wireframes demonstrate the core user journeys and information architecture
                for the CattleTrace platform across different actor roles.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Coverage</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Dashboard overview and KPIs</li>
                <li>Animal registration workflow</li>
                <li>Marketplace browsing</li>
                <li>Profile and traceability</li>
                <li>Health record management</li>
                <li>Government permit review</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
