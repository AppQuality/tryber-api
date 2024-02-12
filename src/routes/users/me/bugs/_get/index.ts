/** OPENAPI-CLASS: get-users-me-bugs */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-users-me-bugs"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me-bugs"]["parameters"]["query"];
}> {
  private start: number = 0;
  private limit: number | undefined;

  private orderBy: NonNullable<Route["query"]>["orderBy"];
  private order: NonNullable<Route["query"]>["order"] = "DESC";

  private filterBy:
    | {
        campaign?: string;
        title?: string;
        status?: string;
        severity?: string;
        id?: string;
      }
    | false = false;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "bugs" });
    this.setId(0);
    const query = this.getQuery();
    if (query.start) this.start = Number(query.start as unknown as string);
    if (query.limit) this.limit = Number(query.limit as unknown as string);

    if (query.orderBy) this.orderBy = query.orderBy;
    if (query.order) this.order = query.order;

    this.filterBy = this.getFilterBy();
  }
  private getFilterBy() {
    const query = this.getQuery();
    if (!query.filterBy) return false;

    return {
      ...(query.filterBy?.campaign
        ? { campaign: query.filterBy.campaign as string }
        : {}),
      ...(query.filterBy?.title
        ? { title: query.filterBy.title as string }
        : {}),
      ...(query.filterBy?.status
        ? { status: query.filterBy.status as string }
        : {}),
      ...(query.filterBy?.severity
        ? { status: query.filterBy.severity as string }
        : {}),
      ...(query.filterBy?.id ? { status: query.filterBy.id as string } : {}),
    };
  }

  protected async prepare() {
    const query = this.getBugsQuery();

    this.applyFilterBy(query);
    this.applyOrderBy(query);
    this.applyLimit(query);

    const rows = await query;
    if (!rows.length) {
      this.setError(404, Error("Error on finding bugs") as OpenapiError);
      return;
    }

    this.setSuccess(200, {
      results: rows.map((bug) => {
        return {
          id: bug.id,
          severity: {
            id: bug.severityID,
            name: bug.severity,
          },
          status: {
            id: bug.statusID,
            name: bug.status,
          },
          campaign: {
            id: bug.campaign,
            name: bug.campaignTITLE,
          },
          title: bug.title,
        };
      }),
      size: rows.length,
      start: this.start,
      limit: this.limit,
      total: this.limit ? await this.getCount() : undefined,
    });
  }

  private applyFilterBy(query: any) {
    if (this.filterBy) {
      if (this.filterBy?.campaign) {
        query
          .where("wp_appq_evd_campaign.id", this.filterBy.campaign)
          .orWhere("wp_appq_evd_campaign.title", this.filterBy.campaign);
      }
      if (this.filterBy?.title) {
        query.where("wp_appq_evd_bug.title", this.filterBy.title);
      }
      if (this.filterBy?.status) {
        query
          .where("wp_appq_evd_bug_status.name", this.filterBy.status)
          .orWhere("wp_appq_evd_bug_status.id", this.filterBy.status);
      }
      if (this.filterBy?.severity) {
        query
          .where("wp_appq_evd_severity.name", this.filterBy.severity)
          .orWhere("wp_appq_evd_severity.id", this.filterBy.severity);
      }
    }
  }

  private applyOrderBy(query: any) {
    if (this.orderBy) {
      switch (this.orderBy) {
        case "campaign":
          query.orderBy("wp_appq_evd_campaign.id", this.order);
          break;
        case "status":
          query.orderBy("wp_appq_evd_bug_status.id", this.order);
          break;
        case "title":
          query.orderBy("wp_appq_evd_bug.message", this.order);
          break;
        default:
          query.orderBy("wp_appq_evd_bug.id", this.order);
      }
    }
  }

  private applyLimit(query: any) {
    if (this.limit) {
      query.limit(this.limit);
      if (this.start) {
        query.offset(this.start);
      }
    }
  }

  private getBugsQuery() {
    const query = tryber.tables.WpAppqEvdBug.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_bug"),
        tryber
          .ref("severity_id")
          .withSchema("wp_appq_evd_bug")
          .as("severityID"),
        tryber.ref("status_id").withSchema("wp_appq_evd_bug").as("statusID"),
        tryber.ref("message").withSchema("wp_appq_evd_bug").as("title"),
        tryber.ref("campaign_id").withSchema("wp_appq_evd_bug").as("campaign")
      )
      .join(
        "wp_appq_evd_bug_status",
        "wp_appq_evd_bug.status_id",
        "wp_appq_evd_bug_status.id"
      )
      .select(
        tryber.ref("name").withSchema("wp_appq_evd_bug_status").as("status")
      )
      .join(
        "wp_appq_evd_severity",
        "wp_appq_evd_bug.severity_id",
        "wp_appq_evd_severity.id"
      )
      .select(
        tryber.ref("name").withSchema("wp_appq_evd_severity").as("severity")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_bug.campaign_id",
        "wp_appq_evd_campaign.id"
      )
      .select(
        tryber
          .ref("title")
          .withSchema("wp_appq_evd_campaign")
          .as("campaignTITLE")
      )
      .where("wp_appq_evd_bug.profile_id", this.getTesterId());

    return query;
  }

  private async getCount() {
    const query = tryber.tables.WpAppqEvdBug.do()
      .count({
        total: tryber.ref("id").withSchema("wp_appq_evd_bug"),
      })
      .join(
        "wp_appq_evd_bug_status",
        "wp_appq_evd_bug.status_id",
        "wp_appq_evd_bug_status.id"
      )
      .join(
        "wp_appq_evd_severity",
        "wp_appq_evd_bug.severity_id",
        "wp_appq_evd_severity.id"
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_bug.campaign_id",
        "wp_appq_evd_campaign.id"
      )
      .where("wp_appq_evd_bug.profile_id", this.getTesterId());

    this.applyFilterBy(query);

    const countRows = await query;
    if (!countRows.length) {
      throw Error("Error on finding bugs total");
    }
    return Number(countRows[0].total);
  }
}
