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
    this.setSuccess(200, {
      id: 0,
      name: "My form",
      fields: [],
    });
  }
}
