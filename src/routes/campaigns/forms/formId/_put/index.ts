/** OPENAPI-CLASS: put-campaigns-forms-formId */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import FieldCreator from "../../FieldCreator";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-campaigns-forms-formId"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["put-campaigns-forms-formId"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["put-campaigns-forms-formId"]["parameters"]["path"];
}> {
  private campaignId: number | undefined;
  private newCampaignId: number | undefined;

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const body = this.getBody();
    this.newCampaignId = body.campaign;
  }

  protected async init() {
    const { formId } = this.getParameters();
    this.setId(parseInt(formId));

    const form = await this.initForm();

    if (!form) {
      this.setError(
        404,
        new OpenapiError(`Form ${this.getId()} doesn't exist`)
      );
      throw new Error("Form doesn't exist");
    }

    const { campaign_id } = form;
    this.campaignId = campaign_id ? campaign_id : undefined;
  }

  private async initForm() {
    const form = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select()
      .where({ id: this.getId() })
      .first();

    if (!form) return false;

    return form;
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasCapability("manage_preselection_forms") === false) {
      return this.setUnauthorizedError("NO_CAPABILITY");
    }
    if (this.campaignId && !this.hasAccessToCampaign(this.campaignId)) {
      return this.setUnauthorizedError("NO_ACCESS_TO_CAMPAIGN");
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

  private setUnauthorizedError(code?: string) {
    this.setError(
      403,
      new OpenapiError(`You are not authorized to do this`),
      code
    );
    return false;
  }

  protected async prepare() {
    try {
      await this.editForm();
      await this.editFields();
      const form = await this.getForm();

      if (!form) {
        this.setError(
          404,
          new OpenapiError(`Form ${this.getId()} doesn't exist`)
        );
        throw new Error("Form doesn't exist");
      }

      this.setSuccess(200, {
        ...form,
        id: this.getId(),
        fields: [],
      });
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async editForm() {
    const { name } = this.getBody();

    await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .update({
        name,
        campaign_id: this.newCampaignId,
        author: this.getTesterId(),
      })
      .where({
        id: this.getId(),
      });
  }

  private async editFields() {
    const { fields } = this.getBody();
    await this.clearFields();
    let i = 1;
    for (const field of fields) {
      const fieldCreator = new FieldCreator({
        ...field,
        formId: this.getId(),
        invalid_options:
          "invalidOptions" in field ? field.invalidOptions : undefined,
        priority: i++,
      });
      await fieldCreator.create();
    }
  }

  private async clearFields() {
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
      .delete()
      .where({
        form_id: this.getId(),
      });
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

  private async getForm() {
    const form = await this.initForm();
    if (!form) return undefined;

    const campaign = await this.getCampaign(form.campaign_id);

    return {
      name: form.name,
      fields: [],
      campaign: campaign,
    };
  }

  private async isCampaignIdAlreadyAssigned(): Promise<boolean> {
    if (this.newCampaignId === undefined) return false;
    if (this.newCampaignId === this.campaignId) return false;

    const formWithCurrentCampaignId =
      await tryber.tables.WpAppqCampaignPreselectionForm.do()
        .select("id")
        .where({
          campaign_id: this.newCampaignId,
        });

    return formWithCurrentCampaignId.length !== 0;
  }
}
