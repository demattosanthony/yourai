"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export const PRICING_PLANS = {
  PRO: {
    name: "Pro",
    price: "$20",
    cost: 20,
    priceDetail: undefined,
    features: [
      "Chat with all the top AI models",
      "Upload images and PDFs",
      "Unlimited messages",
      "Priority support",
      "Custom integrations",
    ],
    lookup_key: "yo-pro-plan",
  },
  TEAMS: {
    name: "Team",
    price: "$30",
    cost: 30,
    priceDetail: "per seat/month",
    features: [
      "Everything in Pro",
      "Team collaboration features",
      "Admin dashboard",
      "Centralized billing",
    ],
    lookup_key: "yo-teams-plan",
  },
} as const;

export const pricingPlanDialogOpenAtom = atomWithStorage(
  "pricingPlanDialogOpen",
  true
);

export function PricingDialog() {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [open, setOpen] = useAtom(pricingPlanDialogOpenAtom);

  const handleSubscribe = async (lookupKey: string) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [lookupKey]: true }));
      if (lookupKey === "yo-pro-plan") {
        const url = await api.createCheckoutSession(lookupKey);
        window.location.href = url;
      } else if (lookupKey === "yo-teams-plan") {
        router.push("/onboarding/orgs");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [lookupKey]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Pricing</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            Choose a Plan
          </DialogTitle>
          <DialogDescription className="text-lg">
            Select the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <div
              key={key}
              className="rounded-xl border p-6 flex flex-col hover:border-primary/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-right gap-1 flex items-end">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.priceDetail && (
                    <span className="text-sm text-muted-foreground pb-1.5">
                      {plan.priceDetail}
                    </span>
                  )}
                </div>
              </div>
              <ul className="space-y-3 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-primary"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.lookup_key && (
                <Button
                  className="w-full mt-6 py-6 text-lg font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubscribe(plan.lookup_key!);
                  }}
                  disabled={loadingStates[plan.lookup_key]}
                  variant={key === "PRO" ? "default" : "secondary"}
                >
                  {loadingStates[plan.lookup_key] ? (
                    <Loader2 className="animate-spin" />
                  ) : key === "PRO" ? (
                    "Get Pro"
                  ) : (
                    "Create Team"
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
