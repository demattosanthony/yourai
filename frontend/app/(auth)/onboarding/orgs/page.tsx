"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMeQuery } from "@/queries/queries";
import AIOrbScene from "@/components/AiOrbScene";

export default function CreateOrgPage() {
  const { data: user, isLoading } = useMeQuery();

  const router = useRouter();
  const [step, setStep] = React.useState<"org" | "saml">("org");

  // Org details
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [org, setOrg] = React.useState<{ id: string; slug: string } | null>(
    null
  );
  const [logo, setLogo] = React.useState<File | null>(null);

  // SAML config
  const [entryPoint, setEntryPoint] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [cert, setCert] = React.useState("");

  const handleCreateOrg = async () => {
    try {
      let fileKey = undefined;
      // If logo is provided, upload it first
      if (logo) {
        const { url, file_metadata } = await api.getPresignedUrl(
          logo.name,
          logo.type,
          logo.size
        );

        const res = await fetch(url, {
          method: "PUT",
          body: logo,
        });

        if (!res.ok) {
          throw new Error("Failed to upload logo");
        }

        fileKey = file_metadata.file_key;
      }

      const org = await api.createOrganization({
        name,
        domain,
        logo: fileKey,
      });
      setOrg(org);
      setStep("saml");
      return org;
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfigureSaml = async () => {
    try {
      if (!org) {
        return;
      }

      console.log(org);

      const res = await api.updateOrganization(org.id, {
        saml: {
          entryPoint,
          issuer,
          cert,
        },
      });

      if (res) {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Only for super admins right now
  if (user?.systemRole !== "super_admin" && !isLoading) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 h-full">
      <div className="absolute top-1 left-1">
        <Button
          onClick={() => {
            if (step === "saml") {
              setStep("org");
            } else {
              router.back();
            }
          }}
          size={"icon"}
          variant={"ghost"}
        >
          <ArrowLeft size={24} />
        </Button>
      </div>

      <main className="flex flex-col gap-6 items-center w-full justify-center h-[75%]">
        <div className="flex flex-col items-center">
          <AIOrbScene height="75px" width="75px" />

          <div className="flex flex-col items-center w-[400px] gap-2 mt-4">
            <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
              {step === "org" ? "Create Organization" : "Configure SSO"}
            </h3>
            <p className="text-base text-muted-foreground text-center">
              {step === "org"
                ? "Set up your organization for team collaboration"
                : "Configure SAML single sign-on for your organization"}
            </p>
          </div>
        </div>

        {step === "org" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateOrg();
            }}
            className="flex flex-col gap-4 w-[320px]"
          >
            <div className="flex items-center justify-center">
              <label className="relative w-14 h-14 rounded-full bg-accent flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-200 transition-colors">
                {logo ? (
                  <Image
                    src={URL.createObjectURL(logo)}
                    alt="Organization logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-gray-400">
                    <Camera size={24} />
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogo(file);
                    }
                  }}
                />
              </label>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="h-[50px]"
              autoFocus
              required
            />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Domain (e.g., company.com)"
              className="h-[50px]"
              required
            />
            <Button
              type="submit"
              className="font-semibold w-full flex justify-center h-[50px]"
              disabled={!name || !domain}
            >
              Create Organization
              <ArrowRight size={24} className="ml-1" />
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4 w-[320px]"
            onSubmit={(e) => {
              e.preventDefault();
              handleConfigureSaml();
            }}
          >
            <Input
              value={entryPoint}
              onChange={(e) => setEntryPoint(e.target.value)}
              placeholder="SAML Entry Point URL"
              className="h-[50px]"
              autoFocus
              required
            />
            <Input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Issuer"
              className="h-[50px]"
              required
            />
            <Textarea
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              placeholder="Paste SAML Certificate"
              className="h-[100px] resize-none"
              required
            />
            <Button
              type="submit"
              className="font-semibold w-full flex justify-center h-[50px]"
              disabled={!entryPoint || !issuer || !cert}
            >
              Configure SSO
              <ArrowRight size={24} className="ml-1" />
            </Button>
          </form>
        )}

        {step === "saml" && (
          <div className="text-sm text-muted-foreground text-center">
            Your callback URL will be:
            <br />
            <code className="text-xs">
              {api.baseUrl}/auth/saml/
              {name.toLowerCase().replace(/[^a-z0-9]/g, "-")}/callback
            </code>
          </div>
        )}
      </main>
    </div>
  );
}
