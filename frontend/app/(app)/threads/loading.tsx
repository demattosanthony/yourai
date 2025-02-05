import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ThreadsLoadingPage() {
  return (
    <main className="flex-1 max-w-2xl mx-auto p-4 pt-14 w-full">
      <h1 className="text-2xl font-bold mb-6">Threads</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4" />
        <Input
          type="search"
          placeholder="Search conversations..."
          className="w-full pl-9 py-2 border-none bg-accent"
          disabled
        />
      </div>

      {/* Threads List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="mb-2 p-4 rounded-lg">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 mb-2 bg-accent rounded" />
                <div className="h-4 w-3/4 mb-2 bg-accent rounded" />
                <div className="h-3 w-20 bg-accent rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
