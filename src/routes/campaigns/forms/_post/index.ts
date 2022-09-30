/** OPENAPI-CLASS: post-campaigns-forms */
import UserRoute from "@src/features/routes/UserRoute";
import FieldCreator from "../FieldCreator";
import PreselectionForms from "@src/features/db/class/PreselectionForms";
import Campaigns from "@src/features/db/class/Campaigns";
import { IoTThingsGraph } from "aws-sdk";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-campaigns-forms"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-campaigns-forms"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number | undefined;
  private db: {
    forms: PreselectionForms;
    campaigns: Campaigns;
  };

  constructor(options: RouteItem["configuration"]) {
    super(options);
    this.db = {
      forms: new PreselectionForms(),
      campaigns: new Campaigns(),
    };
    const body = this.getBody();
    if (body.campaign) {
      this.campaignId = body.campaign;
    }
  }
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(
        403,
        new Error(`You are not authorized to do this`) as OpenapiError
      );
      return false;
    }
    if (await this.isCampaignIdAlreadyAssigned()) {
      this.setError(
        406,
        new Error(
          "A form is already assigned to this campaign_id"
        ) as OpenapiError
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    try {
      const form = await this.createForm();
      const fields = await this.createFields(form.id);
      this.setSuccess(201, {
        ...form,
        fields,
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async createForm() {
    const body = this.getBody();

    const result = await this.db.forms.insert({
      name: body.name,
      author: this.getTesterId(),
      campaign_id: this.campaignId,
    });

    return await this.getForm(result.insertId);
  }

  private async getForm(id: number) {
    const form = await this.db.forms.get(id);
    const result = {
      id: form.id,
      name: form.name,
    };
    if (form.campaign_id) {
      const campaign = await this.db.campaigns.get(form.campaign_id);
      return {
        ...result,
        campaign: {
          id: campaign.id,
          name: campaign.title,
        },
      };
    }
    return result;
  }

  private async isCampaignIdAlreadyAssigned(): Promise<boolean> {
    if (!this.campaignId) return false;
    const formWithCurrentCampaignId = await this.db.forms.query({
      where: [{ campaign_id: this.campaignId }],
    });
    return formWithCurrentCampaignId.length !== 0;
  }

  private async createFields(formId: number) {
    const body = this.getBody();
    const results = [];
    let i = 1;
    for (const field of body.fields) {
      const item = new FieldCreator({
        formId: formId,
        question: field.question,
        short_name: field.short_name,
        type: field.type,
        options: field.hasOwnProperty("options") ? field.options : undefined,
        priority: i++,
      });
      try {
        results.push(await item.create());
      } catch (e) {
        throw {
          status_code: 406,
          message: (e as OpenapiError).message,
        };
      }
    }
    return results;
  }
}
