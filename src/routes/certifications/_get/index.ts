/** OPENAPI-CLASS: get-certifications */
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-certifications"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-certifications"]["parameters"]["query"];
}> {
  private filterBy: PartialRecord<"area" | "institute", string | string[]>;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "certifications" });
    this.setId(0);
    const { filterBy } = this.getQuery();
    this.filterBy = {
      ...(filterBy?.area ? { area: filterBy?.area as string | string[] } : {}),
      ...(filterBy?.institute
        ? { institute: filterBy?.institute as string | string[] }
        : {}),
    };
  }

  protected async prepare(): Promise<void> {
    let query = tryber.tables.WpAppqCertificationsList.do().select([
      "area",
      "id",
      "institute",
      "name",
    ]);

    for (const f in this.filterBy) {
      const key = f as keyof typeof this.filterBy;
      if (typeof this.filterBy[key] === "string") {
        query = query.where(key, this.filterBy[key]);
      } else {
        query = query.whereIn(key, this.filterBy[key] as string[]);
      }
    }

    const rows = await query;
    if (!rows.length) {
      return this.setError(404, new OpenapiError("No certifications found"));
    }

    this.setSuccess(200, await query);
  }
}
