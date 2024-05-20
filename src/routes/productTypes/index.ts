/** OPENAPI-CLASS: get-productTypes */

import { tryber } from "@src/features/database";
import Route from "@src/features/routes/Route";

export default class Browsers extends Route<{
  response: StoplightOperations["get-productTypes"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async prepare(): Promise<void> {
    const productTypes = await tryber.tables.ProductTypes.do().select();
    this.setSuccess(200, {
      results: productTypes,
    });
  }
}
