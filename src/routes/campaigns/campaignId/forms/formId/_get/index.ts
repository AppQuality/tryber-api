import AdminRoute from "@src/features/routes/AdminRoute";
import * as db from "@src/features/db";
/** OPENAPI-CLASS: get-campaigns-campaignId-forms */

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["get-campaigns-campaignId-forms"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaignId-forms"]["parameters"]["path"];
}> {
  private campaignId: number;
  private id: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { campaignId, formId } = this.getParameters();
    this.campaignId = parseInt(campaignId);
    this.id = parseInt(formId);
    this.setId(this.id);
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if ((await this.campaignExists()) === false) {
      this.setError(
        404,
        new Error(`Campaign ${this.campaignId} doesn't exist`) as OpenapiError
      );
      return false;
    }
    if ((await this.formExists()) === false) {
      this.setError(
        404,
        new Error(`Form ${this.id} doesn't exist`) as OpenapiError
      );
      return false;
    }
    return true;
  }

  private async campaignExists() {
    const sql = `SELECT id FROM wp_appq_evd_campaign WHERE id = ?`;
    const results = await db.query(db.format(sql, [this.campaignId]));
    return results.length !== 0;
  }

  private async formExists() {
    const sql = `SELECT id FROM wp_appq_campaign_preselection_form WHERE id = ? AND campaign_id = ?`;
    const results = await db.query(db.format(sql, [this.id, this.campaignId]));
    return results.length !== 0;
  }

  protected async prepare() {
    const form = await this.getForm();
    this.setSuccess(200, {
      id: this.id,
      name: form.name,
      fields: form.fields,
    });
  }

  private async getForm(): Promise<{ name: string; fields: any[] }> {
    const sql = `SELECT name 
        FROM wp_appq_campaign_preselection_form 
        WHERE id = ? AND campaign_id = ? 
        LIMIT 1`;
    const results = await db.query(db.format(sql, [this.id, this.campaignId]));
    const form = results.pop();
    form.fields = await this.getFormFields();
    return form;
  }

  private async getFormFields() {
    const sql = `SELECT id, type, question, options
        FROM wp_appq_campaign_preselection_form_fields
        WHERE form_id = ?`;
    const results: {
      id: number;
      type: string;
      question: string;
      options?: string;
    }[] = await db.query(db.format(sql, [this.id]));
    return results.map((item) => {
      if (isFieldTypeWithOptions(item.type)) {
        item.options = JSON.parse(item.options || "");
      }
      if (item.options === "") delete item.options;
      return item;
    });

    function isFieldTypeWithOptions(type: string) {
      return (
        ["select", "multiselect", "radio"].includes(type) ||
        type.match("^cuf_[0-9]*$")
      );
    }
  }
}
