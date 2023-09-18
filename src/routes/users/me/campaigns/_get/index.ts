import * as db from "@src/features/db";
import UserRoute from "@src/features/routes/UserRoute";
import Campaigns from "@src/features/db/class/Campaigns";

import resolvePermalinks from "../../../../../features/wp/resolvePermalinks";
import { tryber } from "@src/features/database";

/** OPENAPI-CLASS: get-users-me-campaigns */

type TranslatablePage = StoplightComponents["schemas"]["TranslatablePage"];

type CampaignType = {
  id: number;
  title: string;
  page_preview_id: number;
  page_manual_id: number;
  start_date: string;
  end_date: string;
  close_date: string;
  campaign_type?: string;
  campaign_type_id: number;
};

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-users-me-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me-campaigns"]["parameters"]["query"];
}> {
  private filterBy: {
    accepted?: "0" | "1";
    completed?: "0" | "1";
    statusId?: "1" | "2";
  } = {};
  private orderBy: "start_date" | "end_date" | "close_date" | undefined;
  private order: NonNullable<RouteItem["query"]>["order"] | undefined;

  private start: NonNullable<NonNullable<RouteItem["query"]>["start"]> = 0;
  private limit: NonNullable<NonNullable<RouteItem["query"]>["limit"]> = 10;
  private hasLimit: boolean = false;

  private db: {
    campaigns: Campaigns;
  };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    this.filterBy = query.filterBy || {};
    if (
      query.orderBy &&
      ["start_date", "end_date", "close_date"].includes(query.orderBy)
    ) {
      this.orderBy = query.orderBy as RouteItem["orderBy"];
    }
    if (query.order && ["ASC", "DESC"].includes(query.order)) {
      this.order = query.order;
    }
    if (query.start) {
      this.start = parseInt(query.start as unknown as string);
    }
    if (query.limit) {
      this.hasLimit = true;
      this.limit = parseInt(query.limit as unknown as string);
    }

    this.db = {
      campaigns: new Campaigns(["*"]),
    };
  }

  protected async prepare() {
    try {
      let campaigns = await this.getCampaigns();

      if (!this.hasLimit) {
        this.setSuccess(200, {
          results: campaigns,
          size: campaigns.length,
          start: this.start,
        });
      }
      let total = campaigns.length || 0;
      campaigns = campaigns.slice(this.start, this.limit + this.start);

      this.setSuccess(200, {
        results: campaigns,
        size: campaigns.length,
        limit: this.limit,
        total: total,
        start: this.start,
      });
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      this.setError(404, e as OpenapiError);
    }
  }

  private async getCampaigns() {
    const query = await this.getCampaignsQuery();

    const results = await query;
    if (!results.length) {
      throw Error("no data found");
    }

    const enhancedCampaigns = (await this.enhanceCampaigns(results)).map(
      (cp) => ({
        id: cp.id,
        name: cp.title,
        dates: {
          start: cp.start_date.toString(),
          end: cp.end_date.toString(),
          close: cp.close_date.toString(),
        },
        campaign_type: cp.campaign_type
          ? cp.campaign_type
          : cp.campaign_type_id,
        manual_link: cp.manual_link,
        preview_link: cp.preview_link,
        applied: cp.applied == 1,
      })
    );

    if (!this.filterByAccepted()) {
      return enhancedCampaigns.filter(
        (item: { preview_link: TranslatablePage }) =>
          this.campaignHasAllPreviewPublished(item)
      );
    }

    return enhancedCampaigns;
  }

  private async getCampaignsQuery() {
    const query = tryber.tables.WpAppqEvdCampaign.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_campaign"),
        "title",
        "page_preview_id",
        "page_manual_id",
        "start_date",
        "end_date",
        "close_date",
        "campaign_type_id",
        tryber
          .ref("name")
          .withSchema("wp_appq_campaign_type")
          .as("campaign_type")
      )
      .leftJoin(
        "wp_appq_campaign_type",
        "wp_appq_campaign_type.id",
        "wp_appq_evd_campaign.campaign_type_id"
      );

    if (!this.filterByAccepted()) {
      const pageAccess = await this.getPageAccess();

      query.where((q) => {
        q.whereIn("is_public", [1, 2]);
        if (pageAccess.length) {
          q.orWhereIn("page_preview_id", pageAccess);
        }
      });
    }
    if (this.filterByCompleted()) {
      query.where("end_date", "<", tryber.fn.now());
    }
    if (this.filterByRunning()) {
      query.where("end_date", ">=", tryber.fn.now());
    }
    if (this.filterByClosed()) {
      query.where("status_id", 2);
    }
    if (this.filterByOpen()) {
      query.where("status_id", 1);
    }

    query.orderBy(
      this.orderBy || "wp_appq_evd_campaign.id",
      this.orderBy ? this.order || "DESC" : "ASC"
    );

    return query;
  }

  private async enhanceCampaigns(campaigns: CampaignType[]): Promise<
    (CampaignType & {
      preview_link: TranslatablePage;
      manual_link: TranslatablePage;
      campaign_type?: string;
      applied?: 0 | 1;
    })[]
  > {
    const applications = await this.getCampaignApplications(campaigns);

    if (this.filterByAccepted()) {
      campaigns = campaigns.filter((r) => {
        const application = applications.find((a) => a.campaign_id == r.id);
        return application ? application.accepted === 1 : false;
      });
    } else {
      campaigns = campaigns.filter((r) => {
        const application = applications.find((a) => a.campaign_id == r.id);
        return application ? application.accepted === 0 : true;
      });
    }

    const linkedPages = await this.getLinkedPages(campaigns);
    const types = await this.getListOfCampaignTypes(campaigns);

    let results = campaigns.map((campaign) => {
      const type = types.find((t) => t.id == campaign.campaign_type_id);

      return {
        ...campaign,
        preview_link: linkedPages[campaign.page_preview_id]
          ? linkedPages[campaign.page_preview_id]
          : {},
        manual_link: linkedPages[campaign.page_manual_id]
          ? linkedPages[campaign.page_manual_id]
          : {},
        campaign_type: type ? type.name : undefined,
        applied: applications.find((a) => a.campaign_id == campaign.id)
          ? (1 as 1)
          : (0 as 0),
      };
    });
    return results;
  }

  private async getListOfCampaignTypes(
    campaigns: CampaignType[]
  ): Promise<{ id: number; name: string }[]> {
    if (!campaigns.length) return [];
    return await db.query(
      `SELECT id,name FROM wp_appq_campaign_type WHERE id IN (${campaigns
        .map((c) => db.format("?", [c.campaign_type_id]))
        .join(",")})`
    );
  }

  private async getLinkedPages(rows: CampaignType[]) {
    const pageIds = rows.reduce(
      (accumulator: number[], r) =>
        [r.page_preview_id, r.page_manual_id].concat(accumulator),
      []
    );
    const pageLinks = await resolvePermalinks(pageIds);
    return pageLinks;
  }

  private campaignHasAllPreviewPublished(campaign: {
    preview_link: TranslatablePage;
  }) {
    if (Object.keys(campaign.preview_link).length === 0) return false;
    if (
      !campaign.preview_link.hasOwnProperty("en") ||
      campaign.preview_link["en"] === "#"
    )
      return false;
    if (
      !campaign.preview_link.hasOwnProperty("es") ||
      campaign.preview_link["es"] === "#"
    )
      return false;
    if (
      !campaign.preview_link.hasOwnProperty("it") ||
      campaign.preview_link["it"] === "#"
    )
      return false;

    return true;
  }

  private getCampaignApplications(
    campaigns: CampaignType[]
  ): Promise<{ campaign_id: number; accepted: number }[]> {
    return db.query(
      `SELECT campaign_id,accepted  
      FROM wp_crowd_appq_has_candidate 
      WHERE campaign_id IN (${campaigns
        .map((c) => db.format("?", [c.id]))
        .join(",")}) AND user_id = ${this.getWordpressId()}`
    );
  }

  private async getPageAccess(): Promise<number[]> {
    return (
      await db.query(
        `SELECT view_id FROM wp_appq_lc_access WHERE tester_id = ${this.getTesterId()}`
      )
    ).map((row: { view_id: number }) => db.format("?", [row.view_id]));
  }

  private filterByAccepted() {
    if (typeof this.filterBy?.accepted === "undefined") return false;
    if (parseInt(this.filterBy.accepted) === 1) return true;
    return false;
  }
  private filterByCompleted() {
    if (typeof this.filterBy?.completed === "undefined") return false;
    if (parseInt(this.filterBy.completed) === 1) return true;
    return false;
  }
  private filterByRunning() {
    if (typeof this.filterBy?.completed === "undefined") return false;
    if (parseInt(this.filterBy.completed) === 0) return true;
    return false;
  }
  private filterByClosed() {
    if (typeof this.filterBy?.statusId === "undefined") return false;
    if (parseInt(this.filterBy.statusId) === 2) return true;
    return false;
  }
  private filterByOpen() {
    if (typeof this.filterBy?.statusId === "undefined") return false;
    if (parseInt(this.filterBy.statusId) === 1) return true;
    return false;
  }
}

export default RouteItem;
