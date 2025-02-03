import {
  useAdminDeleteOrgMutation,
  useAdminOrgsQuery,
  useUpdateAdminOrgMutation,
} from "@/queries/queries";
import { Card } from "@/components/ui/card";
import { Organization } from "@/types/user";
import { useEffect, useRef, useCallback, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Camera,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import api from "@/lib/api";
import { Textarea } from "../ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export default function AdminSettings() {
  // Query hooks
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminOrgsQuery();
  const deleteOrgMutation = useAdminDeleteOrgMutation();

  // State
  const observerTarget = useRef(null);

  // Infinite scroll handling
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const handleDelete = useCallback(
    (orgId: string) => {
      deleteOrgMutation.mutate(orgId, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["adminOrgs"],
          });
        },
      });
    },
    [deleteOrgMutation, queryClient]
  );

  useEffect(() => {
    const element = observerTarget.current;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
    });

    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  return (
    <div className="space-y-6">
      <section>
        <div className="grid gap-4">
          {data?.pages.map((page) =>
            page.organizations?.map((org: Organization) => (
              <OrganizationCard
                key={org.id}
                org={org}
                onDelete={handleDelete}
              />
            ))
          )}

          <div ref={observerTarget} className="h-4" />
        </div>
      </section>
    </div>
  );
}

function OrganizationCard({
  org,
  onDelete,
}: {
  org: Organization;
  onDelete: (orgId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    org.logoUrl || null
  );
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  const queryClient = useQueryClient();
  const updateOrgMutation = useUpdateAdminOrgMutation();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 text-xs">
            <AvatarImage src={org.logoUrl} alt={org.name} />
            <AvatarFallback>
              {org.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-medium">{org.name}</h3>
            <p className="text-sm text-muted-foreground">{org.domain}</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={(newOpen) => setOpen(newOpen)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </DropdownMenuItem>
              </DialogTrigger>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600 hover:text-red-700"
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the organization and all
                      associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(org.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                // If new logo is uploaded, need to store it in s3 first
                let file_key = undefined;
                if (newLogoFile) {
                  const file = formData.get("logo") as File;
                  // Store file in s3
                  const { url, file_metadata } = await api.getPresignedUrl(
                    file.name,
                    file.type,
                    file.size
                  );

                  const res = await fetch(url, {
                    method: "PUT",
                    body: file,
                  });

                  if (!res.ok) {
                    throw new Error("Failed to upload logo");
                  }

                  file_key = file_metadata.file_key;
                }

                updateOrgMutation.mutate(
                  {
                    orgId: org.id,
                    name: formData.get("name") as string,
                    domain: formData.get("domain") as string,
                    ...(file_key && { logo: file_key }),
                    saml: {
                      ...(formData.get("entryPoint") && {
                        entryPoint: formData.get("entryPoint") as string,
                      }),
                      ...(formData.get("issuer") && {
                        issuer: formData.get("issuer") as string,
                      }),
                      ...(formData.get("cert") && {
                        cert: formData.get("cert") as string,
                      }),
                    },
                  },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({
                        queryKey: ["adminOrgs"],
                      });
                      setOpen(false);
                    },
                  }
                );
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <label className="relative w-14 h-14 rounded-full bg-accent flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-200 transition-colors">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
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
                      name="logo"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewLogoFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={org.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" name="domain" defaultValue={org.domain} />
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      Advanced Settings
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryPoint">SAML Entry Point</Label>
                      <Input
                        id="entryPoint"
                        name="entryPoint"
                        defaultValue={org.samlConfig?.entryPoint}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issuer">SAML Issuer</Label>
                      <Input
                        id="issuer"
                        name="issuer"
                        defaultValue={org.samlConfig?.issuer}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cert">SAML Certificate</Label>
                      <Textarea
                        id="cert"
                        name="cert"
                        defaultValue={org.samlConfig?.cert}
                        className="h-[100px]"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
