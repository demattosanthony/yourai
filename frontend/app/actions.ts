"use server";
import { Thread } from "@/types/chat";
import { User } from "@/types/user";
import { cookies } from "next/headers";

export async function me(): Promise<User | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Convert cookies array to Cookie header string
  const cookieHeader = allCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export async function getThread(threadId: string): Promise<Thread> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Convert cookies array to Cookie header string
  const cookieHeader = allCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const url = `${process.env.NEXT_PUBLIC_API_URL!}/threads/${threadId}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Cookie: cookieHeader,
    },
  });

  return await response.json();
}

export async function getThreads(): Promise<Thread[]> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Convert cookies array to Cookie header string
  const cookieHeader = allCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const url = `${process.env.NEXT_PUBLIC_API_URL!}/threads`;

  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (response.status === 401) {
      // Return empty array silently for unauthorized users
      return [];
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `Failed to fetch threads: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    // Only log errors that aren't 401
    if (error instanceof Error && !error.message.includes("401")) {
      console.error("Error fetching threads:", error);
    }

    // Return empty array for any error
    return [];
  }
}
