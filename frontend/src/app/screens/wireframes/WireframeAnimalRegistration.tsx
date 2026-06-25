import { Card } from "../../components/Card";
import { Check } from "lucide-react";

export function WireframeAnimalRegistration() {
  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header with Back Button */}
      <div className="border-2 border-dashed border-primary p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted/50 rounded" />
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto">
        <div className="border-2 border-dashed border-accent p-6 rounded-lg">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                      step === 1
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  <div className="mt-2 h-4 w-32 bg-muted rounded" />
                </div>
                {idx < 3 && <div className="h-1 flex-1 mx-4 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-secondary">
          <div className="p-6 space-y-6">
            {/* Form Title */}
            <div className="h-6 w-48 bg-muted rounded" />

            {/* Step 1: Animal Identification */}
            <div className="space-y-4 border-2 border-dashed border-primary/30 p-6 rounded-lg bg-primary/5">
              <div className="h-5 w-64 bg-primary/20 rounded mb-4" />

              {/* RFID Input */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
              </div>

              {/* Two Column Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Species Select */}
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
                </div>

                {/* Breed Input */}
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
                </div>

                {/* Sex Select */}
                <div className="space-y-2">
                  <div className="h-4 w-12 bg-muted rounded" />
                  <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
                </div>

                {/* Age Class Select */}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-10 w-full bg-input-background border-2 border-border rounded-lg" />
              </div>
            </div>

            {/* Required Fields Note */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
              <div className="w-5 h-5 bg-accent/20 rounded" />
              <div className="h-4 w-64 bg-muted rounded" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-border">
              <div className="w-32 h-10 bg-muted/50 rounded-lg border-2 border-border" />
              <div className="w-32 h-10 bg-primary/80 rounded-lg" />
            </div>
          </div>
        </Card>
      </div>

      {/* Help Section */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-dashed border-accent/50">
          <div className="p-4 space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/50 rounded" />
            <div className="h-3 w-3/4 bg-muted/50 rounded" />
          </div>
        </Card>
      </div>

      {/* Wireframe Label */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-semibold">
        WIREFRAME: Animal Registration (Step 1/4)
      </div>
    </div>
  );
}
