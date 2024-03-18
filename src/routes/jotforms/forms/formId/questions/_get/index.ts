/** OPENAPI-CLASS: get-jotforms-forms-formId-questions */

import Jotform from "@src/features/jotform";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-jotforms-forms-formId-questions"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-jotforms-forms-formId-questions"]["parameters"]["path"];
}> {
  private formId: string;
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { formId } = this.getParameters();
    this.formId = formId;
  }

  protected async filter() {
    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }
    return true;
  }

  protected async prepare() {
    const JF = new Jotform();
    const forms = await JF.getFormQuestions(this.formId);
    this.setSuccess(200, forms);
    return;
  }
}
