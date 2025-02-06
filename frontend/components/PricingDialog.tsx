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

const PRICING_PLANS = {
  BASIC: {
    name: "Pro Plan",
    price: "$20",
    features: [
      "Chat with all the top AI models",
      "Upload images and PDFs",
      "Unlimited messages",
      "Priority support",
      "Custom integrations",
    ],
    lookup_key: "yo-pro-plan",
  },
} as const;

export const pricingPlanDialogOpenAtom = atomWithStorage(
  "pricingPlanDialogOpen",
  true
);

export function PricingDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useAtom(pricingPlanDialogOpenAtom);

  const handleSubscribe = async (lookupKey: string) => {
    try {
      setIsLoading(true);
      const url = await api.createCheckoutSession(lookupKey);

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Pricing</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            You are currently on the free plan. Upgrade to access these
            features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 bg-card">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <div key={key} className="rounded-lg border p-4 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <span className="text-xl font-bold">{plan.price}/mo</span>
              </div>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-2"
                onClick={() => handleSubscribe(plan.lookup_key)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : `Upgrade to Pro Plan`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
