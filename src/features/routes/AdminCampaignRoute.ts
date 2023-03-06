import UserRoute from "./UserRoute";
import * as db from "@src/features/db";
import OpenapiError from "../OpenapiError";

type CampaignRouteParameters = { campaign: string };

export type { CampaignRouteParameters };

export default class AdminCampaignRoute<
  T extends RouteClassTypes & {
    parameters: T["parameters"] & CampaignRouteParameters;
  }
> extends UserRoute<T> {
  protected cp_id: number;
  protected projectId: number | undefined;
  protected showNeedReview: boolean = false;
  protected baseBugInternalId: string = "";

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);

    const params = this.getParameters();

    if (!params.campaign) throw new Error("Missing campaign id");

    this.cp_id = parseInt(params.campaign);
  }

  protected async init(): Promise<void> {
    await super.init();

    if (isNaN(this.cp_id)) {
      this.setError(400, new OpenapiError("Invalid campaign id"));

      throw new Error("Invalid campaign id");
    }

    const campaign = await this.initCampaign();

    if (!campaign) {
      this.setError(400, new OpenapiError("Campaign not found"));

      throw new Error("Campaign not found");
    }

    this.baseBugInternalId = campaign.base_bug_internal_id;
  }

  private async initCampaign() {
    const campaigns: {
      base_bug_internal_id: string;
    }[] = await db.query(`
      SELECT base_bug_internal_id
      FROM wp_appq_evd_campaign 
      WHERE id = ${this.cp_id}`);
    if (!campaigns.length) return false;
    return campaigns[0];
  }

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!(await this.hasAccessToBugs(this.cp_id))) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }

    return true;
  }

  protected async getTags(): Promise<
    Array<{
      tag_id: number;
      tag_name: string;
      bug_id: number;
    }>
  > {
    return await db.query(`
      SELECT
        tag_id,
        display_name as tag_name,
        bug_id
      FROM wp_appq_bug_taxonomy
      WHERE campaign_id = ${this.cp_id} and is_public=1
    `);
  }

  protected shouldShowNeedReview(): boolean {
    return this.showNeedReview;
  }
}
