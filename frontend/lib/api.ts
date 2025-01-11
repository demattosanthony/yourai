import { Model } from "@/types/model";

/**
 * ApiClient class handles all API communication with the backend server
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches the list of available AI models from the server
   * @returns Promise containing array of Model objects
   */
  async getAvailableModels(): Promise<Model[]> {
    const url = `${this.baseUrl}/models`;

    const response = await fetch(url, {
      method: "GET",
    });

    return await response.json();
  }

  /**
   * Creates a new conversation thread
   * @returns Promise containing the thread ID
   */
  async createThread(): Promise<{ id: string }> {
    const url = `${this.baseUrl}/threads`;

    const response = await fetch(url, {
      method: "POST",
    });

    return await response.json();
  }

  /**
   * Retrieves all conversation threads with their messages
   * @returns Promise containing array of thread objects with messages
   */
  async getThreads(
    page: number = 1,
    search: string = ""
  ): Promise<
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
    const url = `${
      this.baseUrl
    }/threads?page=${page}&search=${encodeURIComponent(search)}`;
    const response = await fetch(url);
    return await response.json();
  }

  /**
   * Retrieves a specific thread and its messages
   * @param threadId - ID of the thread to retrieve
   * @returns Promise containing thread object with messages
   */
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

  /**
   * Adds a new message to an existing thread
   * @param threadId - ID of the thread to add message to
   * @param role - Role of the message sender (user/assistant)
   * @param content - Array of message content objects (can include text, images, or files)
   * @returns Promise containing array of created messages
   */
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

  /**
   * Runs model inference on a thread, streaming back results
   * @param threadId - ID of the thread to run inference on
   * @param modelName - Name of the AI model to use
   * @param instructions - System instructions for the AI model
   * @param temperature - Temperature parameter for model inference
   * @param signal - AbortSignal for cancelling the stream
   * @returns AsyncGenerator yielding JSON strings containing events and data
   */
  async *runInference(
    threadId: string,
    modelName: string,
    instructions: string,
    temperature: number,
    signal: AbortSignal
  ): AsyncGenerator<string> {
    const url = `${this.baseUrl}/threads/${threadId}/inference`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ model: modelName, temperature, instructions }),
      headers: { "Content-Type": "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    if (!response.body) throw new Error("Response body is empty");

    // Set up stream reading
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        // Check for abort signal
        if (signal.aborted) {
          console.log("Signal aborted, stopping stream");
          break;
        }

        // Read chunk from stream
        let result;
        try {
          result = await reader.read();
        } catch (error) {
          if ((error as DOMException).name === "AbortError") {
            console.log("Read aborted");
            throw error;
          } else {
            throw error;
          }
        }

        const { value, done } = result;
        if (done) break;

        // Process incoming data
        buffer += decoder.decode(value, { stream: true });
        let eventEnd = buffer.indexOf("\n\n");

        // Parse SSE format and yield events
        while (eventEnd > -1) {
          const event = buffer.slice(0, eventEnd);
          buffer = buffer.slice(eventEnd + 2);

          const eventMatch = event.match(/event: (.*)/);
          const dataMatch = event.match(/data: (.*)/);

          if (eventMatch && dataMatch) {
            try {
              const jsonData = JSON.parse(dataMatch[1]);
              yield JSON.stringify({ event: eventMatch[1], data: jsonData });
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }

          eventEnd = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if ((error as DOMException).name === "AbortError") {
        console.log("Stream aborted");
        throw error;
      } else {
        throw error;
      }
    } finally {
      // Clean up resources
      if (signal.aborted) {
        await reader.cancel();
      } else {
        reader.releaseLock();
      }
    }
  }
}

// Create and export a instance of ApiClient
const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

export default api;
