/** OPENAPI-CLASS: get-campaigns-forms */
import UserRoute from "@src/features/routes/UserRoute";
import PreselectionForms from "@src/features/db/class/PreselectionForms";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-forms"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-forms"]["parameters"]["query"];
}> {
  private db: { forms: PreselectionForms };
  private limit: number | undefined;
  private start: number;
  private searchBy: ("id" | "name" | "campaign_id")[] | undefined;
  private search: string | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    this.db = { forms: new PreselectionForms(["id", "name", "campaign_id"]) };
    const query = this.getQuery();
    this.limit = parseInt(query.limit as unknown as string) || undefined;
    this.start = parseInt((query.start as unknown as string) || "0");
    this.searchBy = query.searchBy
      ? [...new Set(query.searchBy.split(","))].filter(
          (value: string): value is "id" | "name" | "campaign_id" => {
            return ["id", "name", "campaign_id"].includes(value);
          }
        )
      : undefined;
    this.search = query.search ? query.search : undefined;
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
      start: this.start,
      size: (await this.getForms()).length,
      limit: this.limit,
      total: await this.getTotal(),
    });
  }

  private async getForms() {
    const results = await this.db.forms.query({
      limit: this.limit,
      where: this.getWhere(),
    });
    return results.map((form) => {
      return {
        id: form.id,
        name: form.name,
        campaign: form.campaign_id !== null ? form.campaign_id : undefined,
      };
    });
  }

  private async getTotal() {
    const results = await this.db.forms.query({ where: this.getWhere() });
    return this.limit ? results.length : undefined;
  }

  private getWhere() {
    if (!this.searchBy || !this.search) return undefined;
    let orQuery: PreselectionForms["where"][number] = [];
    for (const el of this.searchBy) {
      switch (el) {
        case "name":
          orQuery.push({ name: "%" + this.search + "%", isLike: true });
          break;
        case "id":
        case "campaign_id":
          orQuery.push({ [el]: parseInt(this.search) });
          break;
        default:
          break;
      }
    }
    return [orQuery];
  }
}
