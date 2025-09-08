/** OPENAPI-CLASS: get-users-me-campaign-campaignId-forms */

import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import PreselectionFormFields from "@src/features/db/class/PreselectionFormFields";
import PreselectionForms from "@src/features/db/class/PreselectionForms";
import UserRoute from "@src/features/routes/UserRoute";
import QuestionFactory from "../QuestionFactory";

type SuccessType =
  StoplightOperations["get-users-me-campaign-campaignId-forms"]["responses"]["200"]["content"]["application/json"];
class RouteItem extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["get-users-me-campaign-campaignId-forms"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private form: { id: number } | false = false;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
    preselectionForms: PreselectionForms;
    preselectionFormsFields: PreselectionFormFields;
  };

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
      pageAccess: new PageAccess(),
      preselectionForms: new PreselectionForms(),
      preselectionFormsFields: new PreselectionFormFields(),
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
    return await campaign.testerHasAccess(this.getTesterId());
  }

  private async getCampaign() {
    if (!this.campaign) {
      try {
        const campaign = await this.db.campaigns.get(this.campaignId);
        if ((await campaign.isApplicationAvailable()) === false) {
          throw new Error("Campaign not available");
        }
        this.campaign = campaign;
      } catch (e) {
        this.campaign = false;
      }
    }
    return this.campaign;
  }

  private async retrieveCampaign() {
    const results = await this.db.campaigns.query({
      where: [
        { id: this.campaignId },
        { start_date: new Date().toISOString(), isGreaterEqual: true },
      ],
    });
    if (results.length === 0) {
      throw new Error("Campaign not found");
    }
    return results[0];
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
    const questions = await this.getFormQuestions();
    this.setSuccess(200, questions);
  }

  private async getFormQuestions() {
    const form = await this.getForm();
    if (!form) return [];
    const questions = await this.db.preselectionFormsFields.query({
      where: [{ form_id: form.id }],
    });
    let questionItems: SuccessType = [];
    for (const question of questions) {
      const questionItem = await QuestionFactory.create(
        question,
        this.getTesterId()
      );
      if (questionItem) {
        const questionData = await questionItem.getItem();
        questionItems.push(questionData);
      }
    }
    return questionItems;
  }
}

export default RouteItem;
