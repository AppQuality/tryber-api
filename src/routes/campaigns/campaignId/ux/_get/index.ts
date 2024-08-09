/** OPENAPI-CLASS: get-campaigns-campaign-ux */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import { getSignedCookie } from "@src/features/s3/cookieSign";
import UxData from "../UxData";
export default class Route extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-ux"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-ux"]["parameters"]["path"];
}> {
  private campaignId: number;
  private _draft: UxData | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.campaignId = Number(this.getParameters().campaign);
  }

  get draft() {
    if (!this._draft) throw new Error("Draft not initialized");
    return this._draft;
  }

  protected async init(): Promise<void> {
    await super.init();
    const item = new UxData(this.campaignId);
    await item.getLast();

    this._draft = item;
  }

  protected async filter() {
    if (!(await this.campaignExists())) {
      return this.setNoAccessError();
    }

    if (!this.hasAccessToCampaign(this.campaignId)) {
      return this.setNoAccessError();
    }

    if (!(await this.uxDataExists())) {
      return this.setNoDataError();
    }

    return true;
  }

  private setNoAccessError() {
    this.setError(
      403,
      new OpenapiError("You don't have access to this campaign")
    );
    return false;
  }

  private setNoDataError() {
    this.setError(404, new OpenapiError("There are no data for this campaign"));
    return false;
  }

  private async campaignExists() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    return !!campaign;
  }

  private async uxDataExists() {
    return this.draft?.data;
  }

  protected async prepare(): Promise<void> {
    await this.addCookieSign();

    this.setSuccess(200, {
      visible: this.draft.data?.visible || 0,
      goal: this.draft.data?.goal || "",
      usersNumber: this.draft.data?.users || 0,
      methodology: {
        name: await this.getCampaignType(),
        description: this.draft.data?.methodology_description as string,
        type: this.draft.data?.methodology_type as
          | "qualitative"
          | "quantitative"
          | "quali-quantitative",
      },
      sentiments: this.draft.data?.sentiments || [],
      questions: this.draft.data?.questions || [],
    });
  }

  private async addCookieSign() {
    const signedCookies = await getSignedCookie({
      url: `https://media*.tryber.me/CP${this.campaignId}/*`,
    });
    this.setCookie("CloudFront-Policy", signedCookies["CloudFront-Policy"], {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      domain: ".tryber.me",
    });
    this.setCookie(
      "CloudFront-Signature",
      signedCookies["CloudFront-Signature"],
      {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        domain: ".tryber.me",
      }
    );
    this.setCookie(
      "CloudFront-Key-Pair-Id",
      signedCookies["CloudFront-Key-Pair-Id"],
      {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        domain: ".tryber.me",
      }
    );
  }

  private async getCampaignType() {
    const campaignType = await tryber.tables.WpAppqCampaignType.do()
      .select(tryber.ref("name").withSchema("wp_appq_campaign_type"))
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.campaign_type_id",
        "wp_appq_campaign_type.id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    if (!campaignType) throw new Error("Error on finding methodology Name");

    return campaignType.name;
  }
}
