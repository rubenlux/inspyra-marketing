// Thin HTTP client that every tool uses to call the Inspyra API.
// Never touches PostgreSQL directly — always goes through the REST API.

export type ApiData = Record<string, unknown>;

const BASE_URL = process.env.INSPYRA_API_URL ?? 'http://localhost:3001/api/v1';

export class InspyraClient {
  constructor(
    private readonly token: string,
    private readonly agentId: string,
  ) {}

  async get(path: string, params?: Record<string, string | number | boolean>): Promise<ApiData> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    return this.request('GET', url.toString());
  }

  async post(path: string, body: unknown): Promise<ApiData> {
    return this.request('POST', `${BASE_URL}${path}`, body);
  }

  async patch(path: string, body: unknown): Promise<ApiData> {
    return this.request('PATCH', `${BASE_URL}${path}`, body);
  }

  private async request(method: string, url: string, body?: unknown): Promise<ApiData> {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'X-Agent-Id': this.agentId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json()) as { success: boolean; data: ApiData; error?: { message: string } };

    if (!res.ok || !json.success) {
      throw new Error(json.error?.message ?? `API error ${res.status}`);
    }

    return json.data ?? {};
  }
}
