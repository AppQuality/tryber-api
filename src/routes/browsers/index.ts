/** OPENAPI-CLASS: get-browsers */

import { tryber } from "@src/features/database";
import Route from "@src/features/routes/Route";

export default class Browsers extends Route<{
  response: StoplightOperations["get-browsers"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async prepare(): Promise<void> {
    const browsers = await tryber.tables.Browsers.do().select();
    this.setSuccess(200, {
      results: browsers,
    });
  }
}
