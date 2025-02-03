import { AppSidebar } from "@/components/AppSidebar";
import { DragAndDropProvider } from "@/components/DragDropProvider";
import Header from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <div className="h-full w-full flex flex-col max-h-[-webkit-fill-available] relative">
          <DragAndDropProvider>
            <Header />

            {children}
          </DragAndDropProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
