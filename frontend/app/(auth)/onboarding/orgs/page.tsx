"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useMeQuery } from "@/queries/queries";
import { CreateOrgForm } from "@/components/organizations/create-org-form";

export default function CreateOrgPage() {
  const { data: user, isLoading } = useMeQuery();
  const router = useRouter();

  // Only for super admins right now
  if (user?.systemRole !== "super_admin" && !isLoading) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 h-full">
      <div className="absolute top-1 left-1">
        <Button onClick={() => router.back()} size={"icon"} variant={"ghost"}>
          <ArrowLeft size={24} />
        </Button>
      </div>

      <CreateOrgForm
        onComplete={() => router.push("/")}
        showBackButton={false}
      />
    </div>
  );
}
