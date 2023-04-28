/** OPENAPI-CLASS : get-campaigns */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

const ACCEPTABLE_FIELDS = [
  "id" as const,
  "title" as const,
  "startDate" as const,
  "endDate" as const,
  "csm" as const,
];

type CampaignSelect = ReturnType<typeof tryber.tables.WpAppqEvdCampaign.do>;

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-campaigns"]["parameters"]["query"];
}> {
  private accessibleCampaigns: true | number[] = [];
  private fields = ACCEPTABLE_FIELDS;
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
    const campaigns = this.formatCampaigns(await this.getCampaigns());

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
      query = query.whereIn(
        "wp_appq_evd_campaign.id",
        this.accessibleCampaigns
      );
    }

    this.addIdTo(query);
    this.addNameTo(query);
    this.addStartDateTo(query);
    this.addEndDateTo(query);
    this.addCsmTo(query);

    if (this.limit) {
      query.limit(this.limit);
    }

    if (this.start) {
      query.offset(this.start);
    }

    return (await query) as {
      id?: number;
      name?: string;
      startDate?: string;
      endDate?: string;
      csm_name?: string;
      csm_surname?: string;
      csm_id?: number;
    }[];
  }

  private formatCampaigns(
    campaigns: Awaited<ReturnType<typeof this.getCampaigns>>
  ) {
    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      ...(this.fields.includes("csm")
        ? {
            csm: {
              id: campaign.csm_id,
              name: campaign.csm_name,
              surname: campaign.csm_surname,
            },
          }
        : {}),
    }));
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
        query.select(tryber.ref("id").withSchema("wp_appq_evd_campaign"));
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

  private addStartDateTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("startDate")) {
        query.select(tryber.ref("start_date").as("startDate"));
      }
    });
  }

  private addEndDateTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("endDate")) {
        query.select(tryber.ref("end_date").as("endDate"));
      }
    });
  }

  private addCsmTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("csm")) {
        query
          .join(
            "wp_appq_evd_profile",
            "wp_appq_evd_profile.id",
            "wp_appq_evd_campaign.pm_id"
          )
          .select(
            tryber.ref("wp_appq_evd_profile.name").as("csm_name"),
            tryber.ref("wp_appq_evd_profile.surname").as("csm_surname"),
            tryber.ref("wp_appq_evd_profile.id").as("csm_id")
          );
      }
    });
  }
}

export default RouteItem;
