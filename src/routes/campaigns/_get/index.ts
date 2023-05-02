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
  "customer" as const,
  "customerTitle" as const,
  "project" as const,
  "visibility" as const,
  "resultType" as const,
  "status" as const,
  "type" as const,
];

type CampaignSelect = ReturnType<typeof tryber.tables.WpAppqEvdCampaign.do>;

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-campaigns"]["parameters"]["query"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private fields = ACCEPTABLE_FIELDS;
  private start: number = 0;
  private limit: number | undefined;
  private showMineOnly = false;
  private search: string | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const query = this.getQuery();
    if (query.fields) {
      this.fields = query.fields
        .split(",")
        .map((field) => (field === "name" ? "title" : field))
        .filter((field): field is typeof ACCEPTABLE_FIELDS[number] =>
          ACCEPTABLE_FIELDS.includes(field as any)
        );
    }
    if (query.mine) this.showMineOnly = true;
    if (query.search) this.search = query.search;

    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
    } else if (query.start) {
      this.limit = 10;
    }
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

    this.addFiltersTo(query);

    this.addIdTo(query);
    this.addNameTo(query);
    this.addStartDateTo(query);
    this.addEndDateTo(query);
    this.addCustomerTitleTo(query);

    this.addJoinToProject(query);
    this.addProjectTo(query);
    this.addCustomerTo(query);

    this.addCsmTo(query);
    this.addStatusTo(query);
    this.addTypeTo(query);
    this.addVisibilityTo(query);
    this.addResultTypeTo(query);

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
      customerTitle?: string;
      csm_name?: string;
      csm_surname?: string;
      csm_id?: number;
      project_id?: number;
      project_name?: string;
      customer_id?: number;
      customer_name?: string;
      status?: number;
      type_name?: string;
      type_area?: 0 | 1;
      visibility?: 0 | 1 | 2 | 3;
      resultType?: -1 | 0 | 1;
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
      customerTitle: campaign.customerTitle,
      ...(this.fields.includes("csm")
        ? {
            csm: {
              id: campaign.csm_id || 0,
              name: campaign.csm_name || "",
              surname: campaign.csm_surname || "",
            },
          }
        : {}),
      ...(this.fields.includes("project")
        ? {
            project: {
              id: campaign.project_id ?? undefined,
              name: campaign.project_name ?? "N.D.",
            },
          }
        : {}),
      ...(this.fields.includes("customer")
        ? {
            customer: {
              id: campaign.customer_id ?? undefined,
              name: campaign.customer_name ?? "N.D.",
            },
          }
        : {}),
      ...(this.fields.includes("status")
        ? {
            status: campaign.status
              ? campaign.status === 1
                ? ("running" as const)
                : ("closed" as const)
              : undefined,
          }
        : {}),
      ...(this.fields.includes("type")
        ? {
            type: {
              name: campaign.type_name || "no type",
              area: this.getArea(campaign.type_area) || "quality",
            },
          }
        : {}),
      visibility: this.getVisibilityName(campaign.visibility),
      resultType: this.getResultTypeName(campaign.resultType),
    }));
  }

  private getVisibilityName(visibility: 0 | 1 | 2 | 3 | undefined) {
    switch (visibility) {
      case 0:
        return "admin" as const;
      case 1:
        return "logged" as const;
      case 2:
        return "public" as const;
      case 3:
        return "smallgroup" as const;
      default:
        return undefined;
    }
  }

  private getResultTypeName(resultType: -1 | 0 | 1 | undefined) {
    switch (resultType) {
      case -1:
        return "no" as const;
      case 0:
        return "bug" as const;
      case 1:
        return "bugparade" as const;
      default:
        return undefined;
    }
  }

  private getArea(area: 0 | 1 | undefined) {
    switch (area) {
      case 0:
        return "quality" as const;
      case 1:
        return "experience" as const;
      default:
        return undefined;
    }
  }

  private async getTotals() {
    if (this.limit === undefined) return undefined;
    let query = tryber.tables.WpAppqEvdCampaign.do();

    this.addFiltersTo(query);

    const count = await query.count({ count: "id" });
    const totalCount = count[0].count;
    return typeof totalCount === "number" ? totalCount : 0;
  }

  private addFiltersTo(query: CampaignSelect) {
    query.modify((query) => {
      if (Array.isArray(this.accessibleCampaigns)) {
        query = query.whereIn(
          "wp_appq_evd_campaign.id",
          this.accessibleCampaigns
        );
      }

      if (this.showMineOnly) {
        query = query.where("wp_appq_evd_campaign.pm_id", this.getTesterId());
      }

      if (this.search) {
        const search = this.search.toLowerCase();
        query = query.where(function () {
          this.whereLike("wp_appq_evd_campaign.id", `%${search}%`)
            .orWhereLike("wp_appq_evd_campaign.title", `%${search}%`)
            .orWhereLike("wp_appq_evd_campaign.customer_title", `%${search}%`);
        });
      }
    });
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
        query.select(tryber.raw("CAST(start_date AS CHAR) as startDate"));
      }
    });
  }

  private addEndDateTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("endDate")) {
        query.select(tryber.raw("CAST(end_date AS CHAR) as endDate"));
      }
    });
  }

  private addCustomerTitleTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("customerTitle")) {
        query.select(tryber.ref("customer_title").as("customerTitle"));
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

  private addJoinToProject(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("project") || this.fields.includes("customer")) {
        query.leftJoin(
          "wp_appq_project",
          "wp_appq_project.id",
          "wp_appq_evd_campaign.project_id"
        );
      }
    });
  }

  private addProjectTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("project")) {
        query.select(
          tryber.ref("wp_appq_project.id").as("project_id"),
          tryber.ref("wp_appq_project.display_name").as("project_name")
        );
      }
    });
  }

  private addCustomerTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("customer")) {
        query
          .leftJoin(
            "wp_appq_customer",
            "wp_appq_customer.id",
            "wp_appq_project.customer_id"
          )
          .select(
            tryber.ref("wp_appq_customer.id").as("customer_id"),
            tryber.ref("wp_appq_customer.company").as("customer_name")
          );
      }
    });
  }
  private addStatusTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("status")) {
        query.select(tryber.ref("status_id").as("status"));
      }
    });
  }
  private addTypeTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("type")) {
        query
          .leftJoin(
            "wp_appq_campaign_type",
            "wp_appq_campaign_type.id",
            "wp_appq_evd_campaign.campaign_type_id"
          )
          .select(
            tryber.ref("wp_appq_campaign_type.name").as("type_name"),
            tryber.ref("wp_appq_campaign_type.type").as("type_area")
          );
      }
    });
  }

  private addVisibilityTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("visibility")) {
        query.select(tryber.ref("is_public").as("visibility"));
      }
    });
  }

  private addResultTypeTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("resultType")) {
        query.select(tryber.ref("campaign_type").as("resultType"));
      }
    });
  }
}

export default RouteItem;
