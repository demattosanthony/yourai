import { Organization } from "@/types/user";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";

export default function OrgManageSeats({
  org,
  members,
}: {
  org: Organization;
  members:
    | {
        user: {
          id: string;
          email: string;
          name: string;
          profilePicture: string;
        };
        role: "owner" | "member";
      }[]
    | undefined;
}) {
  const [seats, setSeats] = useState(org.seats);
  const hasChanges = seats !== org.seats;

  return (
    <section className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Seats</h2>
            <p className="text-sm text-muted-foreground">
              Manage your organization's seat allocation
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span></span>
              <span>
                {members?.length || 0} of {org.seats} seats used
              </span>
            </div>

            <div className="h-2 bg-secondary rounded-full overflow-hidden w-[225px]">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${((members?.length || 0) / org.seats) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7"
                  onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <Input
                  value={seats}
                  onChange={(e) =>
                    setSeats(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-8 h-7 text-center p-0"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7"
                  onClick={() => setSeats((prev) => prev + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {hasChanges && (
              <div className="flex justify-end mt-4">
                <Button>Save Changes</Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
