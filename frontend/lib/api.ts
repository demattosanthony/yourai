import { Model } from "@/types/model";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getAvailableModels(): Promise<Model[]> {
    const url = `${this.baseUrl}/models`;

    const response = await fetch(url, {
      method: "GET",
    });

    return await response.json();
  }

  async createThread(): Promise<{ id: string }> {
    const url = `${this.baseUrl}/threads`;

    const response = await fetch(url, {
      method: "POST",
    });

    return await response.json();
  }

  async getThreads(): Promise<
    {
      id: string;
      created_at: number;
      updated_at: number;
      messages: {
        id: string;
        thread_id: string;
        role: string;
        content_type: string;
        content: string;
        created_at: number;
      }[];
    }[]
  > {
    const url = `${this.baseUrl}/threads`;

    const response = await fetch(url, {
      method: "GET",
    });

    return await response.json();
  }

  async getThread(threadId: string): Promise<{
    id: string;
    created_at: number;
    updated_at: number;
    messages: {
      id: string;
      thread_id: string;
      role: string;
      content: string;
      created_at: number;
    }[];
  }> {
    const url = `${this.baseUrl}/threads/${threadId}`;

    const response = await fetch(url, {
      method: "GET",
    });

    return await response.json();
  }

  async addMessageToThread(
    threadId: string,
    role: string,
    content: {
      type: "image" | "text" | "file";
      image?: string;
      text?: string;
      data?: string;
    }[]
  ): Promise<
    {
      id: string;
      thread_id: string;
      role: string;
      content: { type: "image" | "text"; image?: string; text?: string }[];
      created_at: number;
    }[]
  > {
    const url = `${this.baseUrl}/threads/${threadId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ role, content }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }
}

const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

export default api;
