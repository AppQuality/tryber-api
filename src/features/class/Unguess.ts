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
      throw new Error("Failed to authenticate: " + response.statusText);
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
      throw new Error(`Failed to post to ${path}: ${response.statusText}`);
    }

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
      result: result,
    };
  }
}

export default Unguess;
