import { Model } from "@/types/model";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getAvailableModels(): Promise<Model[]> {
    const url = `${this.baseUrl}/models`;
    console.log(url);

    const response = await fetch(url, {
      method: "GET",
    });

    return await response.json();
  }
}

const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

export default api;
