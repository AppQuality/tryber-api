import * as db from "@src/features/db";
import UserRoute from "@src/features/routes/UserRoute";

import resolvePermalinks from "../../../../../features/wp/resolvePermalinks";

/** OPENAPI-CLASS: get-users-me-campaigns */

type TranslatablePage = StoplightComponents["schemas"]["TranslatablePage"];

type Campaign = {
  id: number;
  title: string;
  page_preview_id: string;
  page_manual_id: string;
  start_date: Date;
  end_date: Date;
  close_date: Date;
  campaign_type?: string;
  campaign_type_id: number;
  applied: 1 | 0;
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
  private orderBy: NonNullable<RouteItem["query"]>["orderBy"] | undefined;
  private order: NonNullable<RouteItem["query"]>["order"] | undefined;

  private start: NonNullable<NonNullable<RouteItem["query"]>["start"]> = 0;
  private limit: NonNullable<NonNullable<RouteItem["query"]>["limit"]> = 10;
  private hasLimit: boolean = false;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    this.filterBy = query.filterBy || {};
    if (
      query.orderBy &&
      ["start_date", "end_date", "close_date"].includes(query.orderBy)
    ) {
      this.orderBy = query.orderBy;
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
    let results: Campaign[] = await db.query(`
    SELECT cp.id,
           cp.title,
           cp.customer_title,
           cp.campaign_type_id,
           cp.campaign_type as bugform,
           cp.os,
           cp.start_date,
           cp.end_date,
           cp.close_date,
           cp.pm_id,
           cp.is_public,
           cp.page_preview_id,
           cp.page_manual_id,
           IF(c.accepted IS NULL, 0, 1) as applied,
           t.name as campaign_type
    ${this.getFrom()}
    GROUP BY (cp.id)
    ${this.orderBy ? `ORDER BY ${this.orderBy} ${this.order || "DESC"}` : ""}
    `);
    if (!results.length) {
      throw Error("no data found");
    }

    results = await this.enhanceCampaignsWithLinkedPages(results);

    const enhancedCampaigns = (
      await this.enhanceCampaignsWithLinkedPages(results)
    ).map((cp) => ({
      id: cp.id,
      name: cp.title,
      dates: {
        start: cp.start_date.toString(),
        end: cp.end_date.toString(),
        close: cp.close_date.toString(),
      },
      campaign_type: cp.campaign_type ? cp.campaign_type : cp.campaign_type_id,
      manual_link: cp.manual_link || {},
      preview_link: cp.preview_link || {},
      applied: cp.applied == 1,
    }));

    if (!this.filterByAccepted()) {
      return enhancedCampaigns.filter(
        (item: { preview_link: TranslatablePage }) =>
          this.campaignHasAllPreviewPublished(item)
      );
    }

    return enhancedCampaigns;
  }

  private async enhanceCampaignsWithLinkedPages(campaigns: Campaign[]): Promise<
    (Campaign & {
      preview_link: TranslatablePage;
      manual_link: TranslatablePage;
    })[]
  > {
    const pageLinks = await this.getLinkedPages(campaigns);

    return campaigns.map((r) => {
      return {
        ...r,
        preview_link: pageLinks[r.page_preview_id]
          ? pageLinks[r.page_preview_id]
          : {},
        manual_link: pageLinks[r.page_manual_id]
          ? pageLinks[r.page_manual_id]
          : {},
      };
    });
  }

  private async getLinkedPages(rows: Campaign[]) {
    const pageIds = rows.reduce(
      (accumulator: string[], r) =>
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

  private getFrom() {
    let FROM = `
    FROM wp_appq_evd_campaign cp
    LEFT JOIN wp_crowd_appq_has_candidate c 
      ON (c.campaign_id = cp.id AND c.user_id = ${this.getWordpressId()})
    JOIN wp_appq_campaign_type t ON (cp.campaign_type_id = t.id) 
  `;

    if (this.filterByAccepted()) {
      FROM += `WHERE c.accepted = 1`;
    } else {
      FROM += `
    WHERE ((cp.is_public = 1 OR cp.is_public = 2) OR page_preview_id IN (SELECT view_id
    FROM wp_appq_lc_access a
    WHERE a.tester_id = ${this.getTesterId()}))
    AND (c.accepted != 1 OR c.accepted IS NULL)
  `;
    }

    // optionally filtering by completed
    if (this.filterByCompleted()) {
      FROM += `
        AND DATEDIFF(cp.end_date, NOW()) < 0
      `;
    }
    if (this.filterByRunning()) {
      FROM += `
        AND DATEDIFF(cp.end_date, NOW()) >= 0
      `;
    }

    if (this.filterByClosed()) {
      FROM += `
        AND cp.status_id = 2
      `;
    }
    if (this.filterByOpen()) {
      FROM += `
        AND cp.status_id = 1
      `;
    }
    return FROM;
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
