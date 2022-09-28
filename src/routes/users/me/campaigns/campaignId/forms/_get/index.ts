/** OPENAPI-CLASS: get-users-me-campaign-campaignId-forms */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import PreselectionForms from "@src/features/db/class/PreselectionForms";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-users-me-campaign-campaignId-forms"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-users-me-campaign-campaignId-forms"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private form: {} | false = false;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
    preselectionForms: PreselectionForms;
  };

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
      pageAccess: new PageAccess(),
      preselectionForms: new PreselectionForms(),
    };
  }

  protected async filter() {
    const campaign = await this.getCampaign();
    if (!campaign) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.hasAccess()) === false) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    const form = await this.getForm();
    if (!form) {
      this.setError(404, new Error("Form not found") as OpenapiError);
      return false;
    }

    return true;
  }

  private async hasAccess() {
    const campaign = await this.getCampaign();
    if (!campaign) return false;
    if (!campaign.isPublic) {
      const pageAccess = await this.db.pageAccess.query({
        where: [
          {
            view_id: parseInt(campaign.page_preview_id),
            tester_id: this.getTesterId(),
          },
        ],
      });
      if (pageAccess.length === 0) {
        return false;
      }
    }
    return true;
  }

  private async getCampaign() {
    if (!this.campaign) {
      try {
        const campaigns = await this.db.campaigns.query({
          where: [
            { id: this.campaignId },
            { start_date: new Date().toISOString(), isLower: true },
          ],
        });
        if (campaigns.length === 0) {
          this.campaign = false;
        }
        this.campaign = campaigns[0];
      } catch (e) {
        this.campaign = false;
      }
    }
    return this.campaign;
  }

  private async getForm() {
    if (!this.form) {
      const form = await this.db.preselectionForms.query({
        where: [{ campaign_id: this.campaignId }],
      });
      if (!form.length) this.form = false;
      this.form = form[0];
    }

    return this.form;
  }

  protected async prepare() {
    this.setSuccess(200, []);
  }
}

export default RouteItem;
