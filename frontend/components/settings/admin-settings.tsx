import {
  useAdminOrgsQuery,
  useUpdateAdminOrgMutation,
} from "@/queries/queries";
import { Card } from "@/components/ui/card";
import { Organization } from "@/types/user";
import { useEffect, useRef, useCallback, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MoreHorizontal, Pencil } from "lucide-react";
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
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { DialogDescription } from "@radix-ui/react-dialog";

export default function AdminSettings() {
  // Query hooks
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminOrgsQuery();
  const updateOrgMutation = useUpdateAdminOrgMutation();

  // State
  const [open, setOpen] = useState(false);
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
              <Card key={org.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 text-xs">
                      <AvatarImage src={org.logo} alt={org.name} />
                      <AvatarFallback>
                        {org.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-medium">{org.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {org.domain}
                      </p>
                    </div>
                  </div>

                  <Dialog open={open} onOpenChange={setOpen}>
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
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                      </DialogHeader>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          updateOrgMutation.mutate(
                            {
                              orgId: org.id,
                              name: formData.get("name") as string,
                              domain: formData.get("domain") as string,
                              logo: formData.get("logo") as string,
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
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              name="name"
                              defaultValue={org.name}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input
                              id="domain"
                              name="domain"
                              defaultValue={org.domain}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                              id="logo"
                              name="logo"
                              defaultValue={org.logo}
                            />
                          </div>

                          {/* <div className="space-y-2">
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
                            />
                          </div> */}

                          <DialogFooter>
                            <Button type="submit">Save</Button>
                          </DialogFooter>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))
          )}

          <div ref={observerTarget} className="h-4" />
        </div>
      </section>
    </div>
  );
}
