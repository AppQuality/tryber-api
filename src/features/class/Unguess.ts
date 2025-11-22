import config from "@src/config";

class Unguess {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    const { basePath, username, password } = config.unguessApi || {};
    this.baseUrl = basePath || "";
    this.username = username || "";
    this.password = password || "";
  }

  /**
   * Private method to fetch a token for API requests
   */
  private async getToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      let errorBody: unknown = undefined;
      try {
        const text = await response.text();
        try {
          errorBody = text ? JSON.parse(text) : text;
        } catch {
          errorBody = text;
        }
      } catch {
        // ignore
      }

      const error: any = new Error(
        `Failed to authenticate: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorBody,
      };
      throw error;
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Authentication failed: Token not found");
    }

    return data.token;
  }

  /**
   * Private method to perform authenticated POST requests
   */
  private async authPost(
    path: string,
    body: Record<string, any>
  ): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorBody: unknown = undefined;

      try {
        const text = await response.text();
        try {
          errorBody = text ? JSON.parse(text) : text;
        } catch {
          errorBody = text;
        }
      } catch {}

      const error: any = new Error(
        `Failed to post to ${path}: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorBody,
      };

      throw error;
    }

    // Se ok, ritorniamo il JSON come prima
    return response.json();
  }

  /**
   * Public method to post a new customer
   */
  public async postCustomer({
    userId,
    name,
  }: {
    userId: number;
    name: string;
  }): Promise<{ id: number; name: string }> {
    const body = {
      company: name,
      pm_id: userId,
    };
    const result = await this.authPost("/workspaces", body);
    return {
      id: result.id,
      name: result.name,
    };
  }

  /**
   * Public method to post campaign watchers
   */
  public async postCampaignWatchers({
    profileIds,
    campaignId,
  }: {
    profileIds: { users: { id: number }[] };
    campaignId: number;
  }): Promise<{ result: any }> {
    const body = {
      ...profileIds,
    };
    const result = await this.authPost(
      `/campaigns/${campaignId.toString()}/watchers`,
      body
    );
    console.warn("postCampaignWatchers result:", result);
    return {
      result,
    };
  }
}

export default Unguess;
