/** OPENAPI-CLASS: get-campaigns-forms */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-forms"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-forms"]["parameters"]["query"];
}> {
  private limit: number | undefined;
  private start: number;
  private searchBy: ("name" | "campaign_id")[] | undefined;
  private search: string | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const query = this.getQuery();
    this.limit = parseInt(query.limit as unknown as string) || undefined;
    this.start = parseInt((query.start as unknown as string) || "0");
    if (this.start && !this.limit) this.limit = 100;
    this.searchBy = query.searchBy
      ? [...new Set(query.searchBy.split(","))].filter(
          (value: string): value is "name" | "campaign_id" => {
            if (this.isSearchByAcceptable(value) === false)
              throw new Error("Invalid field: " + value);
            return ["name", "campaign_id"].includes(value);
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
    const query = tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("id", "name", "campaign_id")
      .orderBy("id", "DESC")
      .offset(this.start);

    if (this.limit) query.limit(this.limit);
    this.applySearch(query);

    const results = await query;
    return results.map((form) => ({
      id: form.id,
      name: form.name,
      campaign: form.campaign_id !== null ? form.campaign_id : undefined,
    }));
  }

  private async getTotal() {
    if (this.limit === undefined) return undefined;
    const query = tryber.tables.WpAppqCampaignPreselectionForm.do().count({
      count: "id",
    });
    this.applySearch(query);
    const result = await query;
    const total = result[0].count as number | string;
    return typeof total === "number" ? total : parseInt(total);
  }

  private applySearch<
    T extends ReturnType<
      ReturnType<
        typeof tryber.tables.WpAppqCampaignPreselectionForm.do
      >["count"]
    >
  >(query: T) {
    if (!this.searchBy || !this.search) return;
    const search = this.search;
    query.where((builder) => {
      this.searchBy!.forEach((field) => {
        builder.orWhereLike(field, `%${search}%`);
      });
    });
  }
  private isSearchByAcceptable(searchField: string) {
    return ["name", "campaign_id"].includes(searchField);
  }
}
