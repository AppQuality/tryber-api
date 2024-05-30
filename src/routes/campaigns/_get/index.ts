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
  "phase" as const,
  "roles" as const,
];

type CampaignSelect = ReturnType<typeof tryber.tables.WpAppqEvdCampaign.do>;
type Roles = NonNullable<
  NonNullable<
    StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"]["items"]
  >[0]["roles"]
>;

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
  private search: string | undefined;
  private order: StoplightOperations["get-campaigns"]["parameters"]["query"]["order"] =
    "DESC";
  private orderBy:
    | "wp_appq_evd_campaign.id"
    | "wp_appq_evd_campaign.start_date"
    | "wp_appq_evd_campaign.end_date" = "wp_appq_evd_campaign.id";
  private filterBy: {
    customer?: number[];
    type?: number[];
    status?: "closed" | "running" | "incoming";
    csm?: number;
    roles?: {
      id: number;
      value: number[] | "empty";
    }[];
    phase?: number[];
  } = {};

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
    if (query.search) this.search = query.search;

    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
    } else if (query.start) {
      this.limit = 10;
    }

    if (query.order) this.order = query.order;
    if (query.orderBy) {
      switch (query.orderBy) {
        case "id":
          this.orderBy = "wp_appq_evd_campaign.id";
          break;
        case "startDate":
          this.orderBy = "wp_appq_evd_campaign.start_date";
          break;
        case "endDate":
          this.orderBy = "wp_appq_evd_campaign.end_date";
          break;
      }
    }

    if (query.filterBy) {
      if ((query.filterBy as any).customer) {
        this.filterBy.customer = (query.filterBy as any).customer
          .split(",")
          .map((id: string) => parseInt(id));
      }
      if ((query.filterBy as any).type) {
        this.filterBy.type = (query.filterBy as any).type
          .split(",")
          .map((id: string) => parseInt(id));
      }
      if ((query.filterBy as any).status) {
        const status = (query.filterBy as any).status;
        if (status === "closed") this.filterBy.status = "closed" as const;
        if (status === "running") this.filterBy.status = "running" as const;
        if (status === "incoming") this.filterBy.status = "incoming" as const;
      }
      if ((query.filterBy as any).csm) {
        const csmId = (query.filterBy as any).csm;
        this.filterBy.csm = Number(csmId);
      }
      const roles = Object.entries(
        query.filterBy as { [key: string]: string }
      ).filter(([key]) => key.startsWith("role_"));
      if (roles.length) {
        this.filterBy.roles = roles.map(([key, value]) => ({
          id: parseInt(key.split("_")[1]),
          value:
            value === "empty"
              ? "empty"
              : value.split(",").map((id: string) => parseInt(id)),
        }));
      }

      if ((query.filterBy as any).phase) {
        const phaseIds = (query.filterBy as any).phase.split(",").map(Number);
        this.filterBy.phase = phaseIds;
      }
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

    this.addJoinToProject(query);

    this.addFiltersTo(query);

    this.addIdTo(query);
    this.addNameTo(query);
    this.addStartDateTo(query);
    this.addEndDateTo(query);
    this.addCustomerTitleTo(query);

    this.addProjectTo(query);
    this.addCustomerTo(query);

    this.addCsmTo(query);
    this.addStatusTo(query);
    this.addTypeTo(query);
    this.addVisibilityTo(query);
    this.addResultTypeTo(query);
    this.addPhaseTo(query);

    if (this.limit) {
      query.limit(this.limit);
    }

    if (this.start) {
      query.offset(this.start);
    }

    query.orderBy(this.orderBy, this.order);

    const results: {
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
      phase_id?: number;
      phase_name?: string;
    }[] = await query;

    const withRoles = this.addRoles(results);

    return withRoles;
  }

  private async addRoles<T extends { id?: number }>(
    campaigns: T[]
  ): Promise<(T & { roles?: Roles })[]> {
    if (!this.fields.includes("roles")) return campaigns;
    const roles = await tryber.tables.CampaignCustomRoles.do()
      .select(
        "campaign_id",
        "custom_role_id",
        tryber.ref("name").withSchema("custom_roles").as("custom_role_name"),
        "tester_id",
        tryber.ref("name").withSchema("wp_appq_evd_profile").as("tester_name"),
        tryber
          .ref("surname")
          .withSchema("wp_appq_evd_profile")
          .as("tester_surname")
      )
      .join(
        "custom_roles",
        "custom_roles.id",
        "campaign_custom_roles.custom_role_id"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "campaign_custom_roles.tester_id"
      )
      .whereIn(
        "campaign_id",
        campaigns.map((result) => result.id || 0)
      );

    return campaigns.map((campaign) => {
      const rolesForCampaign = roles.filter(
        (role) => role.campaign_id === campaign.id
      );
      const results = rolesForCampaign.map((role) => ({
        role: {
          id: role.custom_role_id,
          name: role.custom_role_name,
        },
        user: {
          id: role.tester_id,
          name: role.tester_name,
          surname: role.tester_surname,
        },
      }));

      return {
        ...campaign,
        roles: results,
      };
    });
  }

  private formatCampaigns(
    campaigns: Awaited<ReturnType<typeof this.getCampaigns>>
  ) {
    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      ...(this.fields.includes("startDate")
        ? { startDate: campaign.startDate }
        : {}),
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
            status: this.getStatusName(campaign.startDate, campaign.status),
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
      ...(this.fields.includes("phase") &&
      campaign.phase_id &&
      campaign.phase_name
        ? {
            phase: {
              id: campaign.phase_id,
              name: campaign.phase_name,
            },
          }
        : {}),
      visibility: this.getVisibilityName(campaign.visibility),
      resultType: this.getResultTypeName(campaign.resultType),

      ...(this.fields.includes("roles") && {
        roles: campaign.roles,
      }),
    }));
  }

  private getStatusName(
    startDate: string | undefined,
    status: number | undefined
  ) {
    if (!startDate || !status) return undefined;
    if (status === 1) {
      if (new Date(startDate) > new Date()) return "incoming" as const;
      return "running" as const;
    }

    return "closed" as const;
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

    this.addJoinToProject(query);
    this.addFiltersTo(query);

    const count = await query.count({ count: "wp_appq_evd_campaign.id" });
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

      if (this.filterBy.csm) {
        query = query.where("wp_appq_evd_campaign.pm_id", this.filterBy.csm);
      }

      if (this.search) {
        const search = this.search.toLowerCase();
        query = query.where(function () {
          this.where("wp_appq_evd_campaign.id", "like", `%${search}%`)
            .orWhere("wp_appq_evd_campaign.title", "like", `%${search}%`)
            .orWhere(
              "wp_appq_evd_campaign.customer_title",
              "like",
              `%${search}%`
            );
        });
      }

      if (this.filterBy.customer) {
        query = query.whereIn(
          "wp_appq_project.customer_id",
          this.filterBy.customer
        );
      }
      if (this.filterBy.type) {
        query = query.whereIn(
          "wp_appq_evd_campaign.campaign_type_id",
          this.filterBy.type
        );
      }
      if (this.filterBy.status) {
        if (this.filterBy.status === "closed") {
          query = query.where("wp_appq_evd_campaign.status_id", 2);
        }
        if (this.filterBy.status === "running") {
          query = query
            .where("wp_appq_evd_campaign.status_id", 1)
            .where("wp_appq_evd_campaign.start_date", "<=", tryber.fn.now());
        }
        if (this.filterBy.status === "incoming") {
          query = query
            .where("wp_appq_evd_campaign.status_id", 1)
            .where("wp_appq_evd_campaign.start_date", ">", tryber.fn.now());
        }
      }

      if (this.filterBy.roles) {
        this.filterBy.roles.forEach((role) => {
          if (role.value === "empty") {
            query = query.whereNotIn(
              "wp_appq_evd_campaign.id",
              tryber.tables.CampaignCustomRoles.do()
                .select("campaign_id")
                .where("custom_role_id", role.id)
            );
          } else {
            query = query.whereIn(
              "wp_appq_evd_campaign.id",
              tryber.tables.CampaignCustomRoles.do()
                .select("campaign_id")
                .where("custom_role_id", role.id)
                .whereIn("tester_id", role.value)
            );
          }
        });
      }

      if (this.filterBy.phase) {
        query = query.whereIn(
          "wp_appq_evd_campaign.phase_id",
          this.filterBy.phase
        );
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
      if (this.fields.includes("startDate") || this.fields.includes("status")) {
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
      if (
        this.fields.includes("project") ||
        this.fields.includes("customer") ||
        this.filterBy.customer
      ) {
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

  private addPhaseTo(query: CampaignSelect) {
    query.modify((query) => {
      if (this.fields.includes("phase")) {
        query
          .leftJoin(
            "campaign_phase",
            "campaign_phase.id",
            "wp_appq_evd_campaign.phase_id"
          )
          .select(
            tryber.ref("campaign_phase.id").as("phase_id"),
            tryber.ref("campaign_phase.name").as("phase_name")
          );
      }
    });
  }
}

export default RouteItem;
