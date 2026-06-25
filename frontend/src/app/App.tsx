import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { LandingPage } from "./screens/LandingPage";
import { Dashboard } from "./screens/Dashboard";
import { AnimalRegistry } from "./screens/AnimalRegistry";
import { AnimalProfile } from "./screens/AnimalProfile";
import { Holdings } from "./screens/Holdings";
import { Marketplace } from "./screens/Marketplace";
import { MarketplaceDetail } from "./screens/MarketplaceDetail";
import { HealthRecords } from "./screens/HealthRecords";
import { Reports } from "./screens/Reports";
import { RegisterAnimal } from "./screens/RegisterAnimal";
import { Movements } from "./screens/Movements";
import { Transactions } from "./screens/Transactions";
import { Abattoirs } from "./screens/Abattoirs";
import { Notifications } from "./screens/Notifications";
import { Settings } from "./screens/Settings";
import { TraceabilityTimeline } from "./screens/TraceabilityTimeline";
import { WireframeGallery } from "./screens/WireframeGallery";

type Page =
  | "landing"
  | "dashboard"
  | "animals"
  | "animal-profile"
  | "register-animal"
  | "traceability-timeline"
  | "holdings"
  | "marketplace"
  | "marketplace-detail"
  | "movements"
  | "health"
  | "transactions"
  | "abattoirs"
  | "reports"
  | "notifications"
  | "settings"
  | "profile"
  | "wireframes";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleViewAnimal = (id: string) => {
    setSelectedAnimalId(id);
    setCurrentPage("animal-profile");
  };

  const handleViewListing = (id: string) => {
    setSelectedListingId(id);
    setCurrentPage("marketplace-detail");
  };

  const handleRegisterAnimal = () => {
    setCurrentPage("register-animal");
  };

  const handleRegistrationComplete = () => {
    setCurrentPage("animals");
  };

  if (currentPage === "landing") {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === "animal-profile" && selectedAnimalId) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar currentPage="animals" onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <AnimalProfile
              animalId={selectedAnimalId}
              onBack={() => setCurrentPage("animals")}
            />
          </main>
        </div>
      </div>
    );
  }

  if (currentPage === "register-animal") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar currentPage="animals" onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <RegisterAnimal
              onBack={() => setCurrentPage("animals")}
              onComplete={handleRegistrationComplete}
            />
          </main>
        </div>
      </div>
    );
  }

  if (currentPage === "marketplace-detail" && selectedListingId) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar currentPage="marketplace" onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <MarketplaceDetail
              listingId={selectedListingId}
              onBack={() => setCurrentPage("marketplace")}
            />
          </main>
        </div>
      </div>
    );
  }

  if (currentPage === "traceability-timeline" && selectedAnimalId) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar currentPage="animals" onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <TraceabilityTimeline
              animalId={selectedAnimalId}
              onBack={() => setCurrentPage("animals")}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 ml-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "animals" && (
            <AnimalRegistry
              onViewAnimal={handleViewAnimal}
              onRegisterAnimal={handleRegisterAnimal}
            />
          )}
          {currentPage === "holdings" && <Holdings />}
          {currentPage === "marketplace" && (
            <Marketplace onViewListing={handleViewListing} />
          )}
          {currentPage === "health" && <HealthRecords />}
          {currentPage === "reports" && <Reports />}
          {currentPage === "movements" && <Movements />}
          {currentPage === "transactions" && <Transactions />}
          {currentPage === "abattoirs" && <Abattoirs />}
          {currentPage === "notifications" && <Notifications />}
          {currentPage === "settings" && <Settings />}
          {currentPage === "profile" && <Settings />}
          {currentPage === "wireframes" && <WireframeGallery />}
        </main>
      </div>
    </div>
  );
}