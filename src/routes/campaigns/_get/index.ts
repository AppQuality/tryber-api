/** OPENAPI-CLASS : get-campaigns */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

const ACCEPTABLE_FIELDS = ["id" as const, "title" as const];

type CampaignSelect = ReturnType<typeof tryber.tables.WpAppqEvdCampaign.do>;

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-campaigns"]["parameters"]["query"];
}> {
  private accessibleCampaigns: true | number[] = [];
  private fields: typeof ACCEPTABLE_FIELDS = ["id" as const, "title" as const];
  private start: number = 0;
  private limit: number | undefined;

  protected async init() {
    if (this.campaignOlps) this.accessibleCampaigns = this.campaignOlps;

    const query = this.getQuery();
    if (query.fields) {
      this.fields = query.fields
        .split(",")
        .map((field) => (field === "name" ? "title" : field))
        .filter((field): field is typeof ACCEPTABLE_FIELDS[number] =>
          ACCEPTABLE_FIELDS.includes(field as any)
        );
    }

    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
    } else if (query.start) this.limit = 10;
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    return (
      this.accessibleCampaigns !== true && this.accessibleCampaigns.length === 0
    );
  }

  protected async prepare(): Promise<void> {
    const campaigns = await this.getCampaigns();

    return this.setSuccess(200, {
      items: campaigns,
      start: this.start,
      limit: this.limit ? this.limit : undefined,
      total: await this.getTotals(),
      size: campaigns.length,
    });
  }

  private async getCampaigns() {
    let query = tryber.tables.WpAppqEvdCampaign.do();
    if (Array.isArray(this.accessibleCampaigns)) {
      query = query.whereIn("id", this.accessibleCampaigns);
    }

    this.addIdTo(query);
    this.addNameTo(query);

    if (this.limit) {
      query.limit(this.limit);
    }

    if (this.start) {
      query.offset(this.start);
    }

    return await query;
  }

  private async getTotals() {
    if (this.limit === undefined) return undefined;
    let query = tryber.tables.WpAppqEvdCampaign.do();

    if (Array.isArray(this.accessibleCampaigns)) {
      query = query.whereIn("id", this.accessibleCampaigns);
    }

    const count = await query.count({ count: "id" });
    const totalCount = count[0].count;
    return typeof totalCount === "number" ? totalCount : 0;
  }

  private addIdTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("id")) {
        query.select("id");
      }
    });
  }

  private addNameTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("title")) {
        query.select(tryber.ref("title").as("name"));
      }
    });
  }
}

export default RouteItem;
