"use server";

import { getThreads } from "@/app/actions";
import ThreadsList from "@/components/threads/threads-list";
import ThreadSearch from "@/components/threads/threads-search";

export default async function ThreadsPage() {
  const initialThreads = await getThreads();

  return (
    <main className="flex-1 max-w-2xl mx-auto p-4 pt-14 w-full">
      <h1 className="text-2xl font-bold mb-6">Threads</h1>
      <ThreadSearch />
      <ThreadsList initialThreads={initialThreads} />
    </main>
  );
}
