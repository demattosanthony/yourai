"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMeQuery } from "@/queries/queries";

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
  const [logo, setLogo] = React.useState("");

  // SAML config
  const [entryPoint, setEntryPoint] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [cert, setCert] = React.useState("");

  const handleCreateOrg = async () => {
    try {
      const org = await api.adminCreateOrganization(name, domain);
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

      const res = await api.organizationConfigureSaml(
        { id: org.id, slug: org.slug },
        entryPoint,
        issuer,
        cert
      );

      if (res.ok) {
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

      <main className="flex flex-col gap-8 items-center w-full justify-center h-[75%]">
        <Image src="/yo-blob.png" alt="logo" height={75} width={75} />

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

        {step === "org" ? (
          <div className="flex flex-col gap-4 w-[320px]">
            <div className="flex items-center justify-center">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setLogo(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="h-[50px] w-[50px] rounded-full text-center"
              />
              {logo && (
                <div className="ml-2">
                  <Image
                    src={logo}
                    alt="Organization logo preview"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>
              )}
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="h-[50px]"
              autoFocus
            />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Domain (e.g., company.com)"
              className="h-[50px]"
            />
            <Button
              className="font-semibold w-full flex justify-center h-[50px]"
              onClick={handleCreateOrg}
              disabled={!name || !domain}
            >
              Create Organization
              <ArrowRight size={24} className="ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-[320px]">
            <Input
              value={entryPoint}
              onChange={(e) => setEntryPoint(e.target.value)}
              placeholder="SAML Entry Point URL"
              className="h-[50px]"
              autoFocus
            />
            <Input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Issuer"
              className="h-[50px]"
            />
            <Textarea
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              placeholder="Paste SAML Certificate"
              className="h-[100px] resize-none"
            />
            <Button
              className="font-semibold w-full flex justify-center h-[50px]"
              onClick={handleConfigureSaml}
              disabled={!entryPoint || !issuer || !cert}
            >
              Configure SSO
              <ArrowRight size={24} className="ml-1" />
            </Button>
          </div>
        )}
      </main>

      {step === "saml" && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Your callback URL will be:
          <br />
          <code className="text-xs">
            {api.baseUrl}/auth/saml/
            {name.toLowerCase().replace(/[^a-z0-9]/g, "-")}/callback
          </code>
        </div>
      )}
    </div>
  );
}
