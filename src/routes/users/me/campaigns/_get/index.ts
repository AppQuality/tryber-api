import UserRoute from "@src/features/routes/UserRoute";

import { tryber } from "@src/features/database";
import resolvePermalinks from "../../../../../features/wp/resolvePermalinks";
import { UserTargetChecker } from "./UserTargetChecker";

/** OPENAPI-CLASS: get-users-me-campaigns */

type TranslatablePage = StoplightComponents["schemas"]["TranslatablePage"];

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
  private limit: NonNullable<RouteItem["query"]>["limit"];

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    this.setOrderBy();
    this.setOrder();
    if (query.start) this.start = parseInt(query.start as unknown as string);
    if (query.limit) this.limit = parseInt(query.limit as unknown as string);
    this.filterBy = query.filterBy || {};
  }

  private getVisibility(campaign: {
    applied: boolean;
    start_date: string;
    freeSpots?: number;
  }): "candidate" | "unavailable" | "available" {
    if (campaign.applied) return "candidate";
    if (new Date(campaign.start_date) > new Date() || campaign.freeSpots === 0)
      return "unavailable";
    return "available";
  }

  private setOrderBy() {
    const { orderBy } = this.getQuery();
    if (!orderBy) return;
    if (orderBy === "start_date") this.orderBy = "start_date";
    if (orderBy === "end_date") this.orderBy = "end_date";
    if (orderBy === "close_date") this.orderBy = "close_date";
  }

  private setOrder() {
    const { order } = this.getQuery();
    if (!order) return;
    if (order === "ASC") this.order = "ASC";
    if (order === "DESC") this.order = "DESC";
  }

  protected async prepare() {
    try {
      const campaigns = await this.getCampaigns();
      const total = campaigns.length || 0;
      const results = this.limit
        ? campaigns.slice(this.start, this.limit + this.start)
        : campaigns;

      this.setSuccess(200, {
        results,
        size: results.length,
        ...(this.limit ? { limit: this.limit, total } : {}),
        start: this.start,
      });
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      this.setError(404, e as OpenapiError);
    }
  }

  private async getCampaigns() {
    const results = await this.getCampaignsQuery();

    if (!results.length) {
      throw Error("no data found");
    }

    const items = await this.filterByTargetRules(
      await this.enhanceWithFreeSpots(
        await this.enhanceWithTargetRules(
          await this.enhanceWithLinkedPages(
            await this.enhanceWithCampaignType(
              await this.enhanceCampaignsWithApplication(results)
            )
          )
        )
      )
    );

    if (!items.length) {
      throw Error("no data found");
    }

    return items
      .filter((campaign) => {
        if (this.filterByAccepted()) return campaign.accepted;
        else
          return (
            !campaign.accepted && this.campaignHasAllPreviewPublished(campaign)
          );
      })
      .map((cp) => ({
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
        visibility: {
          type: this.getVisibility({
            applied: cp.applied == 1,
            start_date: cp.start_date,
            freeSpots: cp.freeSpots,
          }),
          ...(cp.freeSpots !== undefined ? { freeSpots: cp.freeSpots } : {}),
          ...(cp.totalSpots !== undefined ? { totalSpots: cp.totalSpots } : {}),
        },
      }));
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
          .ref("is_public")
          .withSchema("wp_appq_evd_campaign")
          .as("visibility_type"),
        tryber
          .ref("name")
          .withSchema("wp_appq_campaign_type")
          .as("campaign_type")
      )
      .leftJoin(
        "wp_appq_campaign_type",
        "wp_appq_campaign_type.id",
        "wp_appq_evd_campaign.campaign_type_id"
      )
      .join(
        "campaign_phase",
        "campaign_phase.id",
        "wp_appq_evd_campaign.phase_id"
      )
      .join(
        "campaign_phase_type",
        "campaign_phase_type.id",
        "campaign_phase.type_id"
      )
      .whereNot("campaign_phase_type.name", "unavailable");

    if (!this.filterByAccepted()) {
      const pageAccess = await this.getPageAccess();

      query.where((q) => {
        q.whereIn("is_public", [1, 2, 4]);
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

  private async enhanceCampaignsWithApplication<T>(
    campaigns: (T & { id: number })[]
  ) {
    const applications = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("campaign_id", "accepted")
      .whereIn(
        "campaign_id",
        campaigns.map((c) => c.id)
      )
      .andWhere("user_id", this.getWordpressId());

    return campaigns.map((campaign) => {
      const application = applications.find(
        (a) => a.campaign_id == campaign.id
      );

      return {
        ...campaign,
        applied: applications.find((a) => a.campaign_id == campaign.id)
          ? (1 as const)
          : (0 as const),
        accepted: application ? application.accepted === 1 : false,
      };
    });
  }

  private async enhanceWithLinkedPages<T>(
    campaigns: (T & {
      page_manual_id: number;
      page_preview_id: number;
    })[]
  ) {
    const pageIds = campaigns.reduce(
      (accumulator: number[], r) =>
        [r.page_preview_id, r.page_manual_id].concat(accumulator),
      []
    );
    const linkedPages = await resolvePermalinks(pageIds);

    return campaigns.map((campaign) => {
      return {
        ...campaign,
        preview_link: linkedPages[campaign.page_preview_id]
          ? linkedPages[campaign.page_preview_id]
          : {},
        manual_link: linkedPages[campaign.page_manual_id]
          ? linkedPages[campaign.page_manual_id]
          : {},
      };
    });
  }

  private async enhanceWithCampaignType<T>(
    campaigns: (T & { campaign_type_id: number })[]
  ) {
    if (!campaigns.length) return [];
    const types = await tryber.tables.WpAppqCampaignType.do()
      .select("id", "name")
      .whereIn(
        "id",
        campaigns.map((c) => c.campaign_type_id)
      );

    return campaigns.map((campaign) => {
      const type = types.find((t) => t.id == campaign.campaign_type_id);

      return {
        ...campaign,
        campaign_type: type ? type.name : undefined,
      };
    });
  }

  private async enhanceWithTargetRules<T>(
    campaigns: (T & { id: number; visibility_type: number })[]
  ) {
    const campaignsWithTarget = campaigns.filter(
      (c) => c.visibility_type === 4
    );
    if (!campaignsWithTarget.length) return campaigns;

    const allowedLanguages =
      await tryber.tables.CampaignDossierDataLanguages.do()
        .select("campaign_id", "language_id")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_languages.campaign_dossier_data_id"
        )
        .whereIn(
          "campaign_dossier_data.campaign_id",
          campaignsWithTarget.map((c) => c.id)
        );

    const allowedCountries =
      await tryber.tables.CampaignDossierDataCountries.do()
        .select("campaign_id", "country_code")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_countries.campaign_dossier_data_id"
        )
        .whereIn(
          "campaign_dossier_data.campaign_id",
          campaignsWithTarget.map((c) => c.id)
        );

    return campaigns.map((campaign) => {
      if (campaign.visibility_type !== 4) return campaign;

      const languages = allowedLanguages
        .filter((l) => l.campaign_id === campaign.id)
        .map((l) => l.language_id);
      const countries = allowedCountries
        .filter((l) => l.campaign_id === campaign.id)
        .map((l) => l.country_code);

      return {
        ...campaign,
        targetRules: {
          ...(languages.length ? { languages } : {}),
          ...(countries.length ? { countries } : {}),
        },
      };
    });
  }

  private async enhanceWithFreeSpots<T>(
    campaigns: (T & { id: number; visibility_type: number })[]
  ) {
    const campaignsWithTarget = campaigns.filter(
      (c) => c.visibility_type === 4
    );
    if (!campaignsWithTarget.length)
      return campaigns.map((c) => ({
        ...c,
        freeSpots: undefined,
        totalSpots: undefined,
      }));

    const applicationSpots = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        "id",
        tryber
          .ref("desired_number_of_testers")
          .withSchema("wp_appq_evd_campaign")
          .as("cap")
      )
      .whereIn(
        "id",
        campaignsWithTarget.map((c) => c.id)
      );

    const validApplications = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("campaign_id")
      .count({
        count: "user_id",
      })
      .whereNot("accepted", -1)
      .whereIn(
        "campaign_id",
        campaignsWithTarget.map((c) => c.id)
      )
      .groupBy("campaign_id")
      .then((res) =>
        res.map((r) => ({
          campaign_id: r.campaign_id,
          count: typeof r.count === "number" ? r.count : 0,
        }))
      );

    return campaigns.map((campaign) => {
      const applicationSpot = applicationSpots.find(
        (c) => c.id === campaign.id
      );
      const validApplicationsCount = validApplications.find(
        (c) => c.campaign_id === campaign.id
      );
      return {
        ...campaign,
        ...(applicationSpot
          ? {
              freeSpots:
                applicationSpot.cap - (validApplicationsCount?.count || 0),
              totalSpots: applicationSpot.cap,
            }
          : {}),
      };
    });
  }

  private async filterByTargetRules<T>(
    campaigns: (T & {
      targetRules?: {
        languages?: number[];
        countries?: string[];
      };
    })[]
  ) {
    const userTargetChecker = new UserTargetChecker({
      testerId: this.getTesterId(),
    });
    await userTargetChecker.init();
    return campaigns.filter((campaign) => {
      if (!campaign.targetRules) {
        return true;
      } else {
        return userTargetChecker.inTarget(campaign.targetRules);
      }
    });
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

  private async getPageAccess() {
    return await tryber.tables.WpAppqLcAccess.do()
      .select("view_id")
      .where("tester_id", this.getTesterId())
      .then((rows) => rows.map((row) => row.view_id));
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
