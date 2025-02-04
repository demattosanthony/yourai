"use server";

import ModelSelector from "./ModelSelector";
import { Button } from "./ui/button";
import Link from "next/link";
import { me } from "@/app/actions";
import { SidebarTrigger } from "./ui/sidebar";
import HeaderActions from "./HeaderActions";

export default async function Header() {
  const user = await me();

  return (
    <header className="absolute inset-x-0 top-0 z-[5] flex h-14 items-center bg-background/50 px-4 backdrop-blur-xl transition-all">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 justify-between w-full md:justify-start">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>

          <HeaderActions>
            <div className="order-1 md:order-none">
              <ModelSelector />
            </div>
          </HeaderActions>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
