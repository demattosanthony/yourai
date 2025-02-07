"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateOrgForm } from "@/components/organizations/create-org-form";
import api from "@/lib/api";

export default function CreateOrgPage() {
  const router = useRouter();

  const handleCreateOrgComplete = async (org: { id: string }) => {
    // go to checkout for the org
    const url = await api.createCheckoutSession("yo-teams-plan", 1, org.id);
    window.location.href = url;
  };

  return (
    <div className="h-screen flex flex-col items-center px-4 py-12">
      <div className="absolute top-1 left-1">
        <Button onClick={() => router.back()} size={"icon"} variant={"ghost"}>
          <ArrowLeft size={24} />
        </Button>
      </div>
      <div className="flex justify-center w-full h-[75%] items-center">
        <CreateOrgForm
          onComplete={handleCreateOrgComplete}
          showBackButton={false}
          includeSamlSetup={false}
        />
      </div>
    </div>
  );
}
