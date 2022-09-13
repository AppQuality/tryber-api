/** OPENAPI-CLASS: get-campaigns-forms */
import UserRoute from "@src/features/routes/UserRoute";
import PreselectionForms from "@src/features/db/class/PreselectionForms";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-forms"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-forms"]["parameters"]["query"];
}> {
  private db: { forms: PreselectionForms };
  private limit: number | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.db = { forms: new PreselectionForms(["id", "name", "campaign_id"]) };
    const query = this.getQuery();
    this.limit = parseInt(query.limit as unknown as string) || undefined;
  }

  protected async filter() {
    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }
    return true;
  }

  protected async prepare() {
    this.setSuccess(200, {
      results: await this.getForms(),
      start: 0,
      size: 0,
      limit: this.limit,
      total: await this.getTotal(),
    });
  }

  private async getForms() {
    const results = await this.db.forms.query({ limit: this.limit });

    return results.map((form) => {
      return {
        id: form.id,
        name: form.name,
        campaign: form.campaign_id !== null ? form.campaign_id : undefined,
      };
    });
  }
  private async getTotal() {
    const results = await this.db.forms.query({});
    return this.limit ? results.length : undefined;
  }
}
