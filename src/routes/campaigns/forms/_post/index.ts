/** OPENAPI-CLASS: post-campaigns-forms */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import FieldCreator from "../FieldCreator";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-campaigns-forms"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-campaigns-forms"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number | undefined;

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const body = this.getBody();
    if (body.campaign) {
      this.campaignId = body.campaign;
    }
  }
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(403, new OpenapiError(`You are not authorized to do this`));
      return false;
    }
    if (await this.isCampaignIdAlreadyAssigned()) {
      this.setError(
        406,
        new OpenapiError("A form is already assigned to this campaign_id"),
        "CAMPAIGN_ID_ALREADY_ASSIGNED"
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    try {
      const form = await this.createForm();

      if (!form) {
        throw new Error("Something went wrong while creating the form");
      }

      const fields = await this.createFields(form.id);
      this.setSuccess(201, {
        ...form,
        fields: fields,
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async createForm() {
    const body = this.getBody();

    const form = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .insert({
        name: body.name,
        author: this.getTesterId(),
        campaign_id: this.campaignId,
        show_on_preview: 1,
        ...(body.creationDate && { creation_date: body.creationDate }),
      })
      .returning("id");

    return await this.getForm(form[0].id ?? form[0]);
  }

  private async getCampaign(cp_id: number) {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id", "title")
      .where({
        id: cp_id,
      })
      .first();

    if (!campaign) return undefined;

    return {
      id: campaign.id,
      name: campaign.title,
    };
  }

  private async getForm(id: number) {
    const form = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select()
      .where({ id })
      .first();

    if (!form) return false;

    const result = {
      id: form.id,
      name: form.name,
    };

    if (form.campaign_id) {
      const campaign = await this.getCampaign(form.campaign_id);
      return {
        ...result,
        campaign: campaign,
      };
    }
    return result;
  }

  private async isCampaignIdAlreadyAssigned(): Promise<boolean> {
    if (!this.campaignId) return false;

    const formWithCurrentCampaignId =
      await tryber.tables.WpAppqCampaignPreselectionForm.do()
        .select("id")
        .where({
          campaign_id: this.campaignId,
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
        options:
          "options" in field && field.options
            ? field.options.map((o) => o.value)
            : undefined,
        invalid_options:
          "options" in field && field.options
            ? field.options.filter((o) => o.isInvalid).map((o) => o.value)
            : undefined,
        priority: i++,
      });
      try {
        const result = await item.create();
        results.push({
          ...result,
          options: result.options
            ? result.options.map((o: number | string) => ({ value: o }))
            : undefined,
        });
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
