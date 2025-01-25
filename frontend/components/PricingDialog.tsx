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
import { useState } from "react";

const PRICING_PLANS = {
  BASIC: {
    name: "Basic Plan",
    price: "$10",
    features: ["Feature 1", "Feature 2", "Feature 3"],
    lookup_key: "Yo-a140f7e",
  },
} as const;

export function PricingDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const handleSubscribe = async (lookupKey: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:4000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            lookup_key: lookupKey,
          }),
        }
      );

      const data = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.url;
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
          <DialogTitle>Choose your plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <div
              key={key}
              className="rounded-lg border p-4 hover:border-primary transition-colors"
            >
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
                className="w-full"
                onClick={() => handleSubscribe(plan.lookup_key)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : `Subscribe to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
