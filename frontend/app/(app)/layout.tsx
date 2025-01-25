import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { LoginOverlay } from "@/components/LoginOverlay";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="h-full w-full flex flex-col max-h-[-webkit-fill-available] relative">
          <LoginOverlay />
          <Header />

          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
