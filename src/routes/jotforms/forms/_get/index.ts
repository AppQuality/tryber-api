/** OPENAPI-CLASS: get-jotforms */

import Jotform from "@src/features/jotform";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-jotforms"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async filter() {
    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }
    return true;
  }

  protected async prepare() {
    const JF = new Jotform();
    const forms = await JF.getForms();
    this.setSuccess(200, forms);
    return;
  }
}
