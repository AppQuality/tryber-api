/** OPENAPI-CLASS : patch-bugs-bugId-status */

import OpenapiError from "@src/features/OpenapiError";
import BugRoute from "@src/features/routes/BugRoute";

class PatchBugStatusRoute extends BugRoute<{
  response: StoplightOperations["patch-bugs-bugId-status"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["patch-bugs-bugId-status"]["parameters"]["path"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    return true;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {});
  }
}

export default PatchBugStatusRoute;
