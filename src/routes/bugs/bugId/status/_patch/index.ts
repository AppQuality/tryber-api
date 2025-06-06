/** OPENAPI-CLASS : patch-bugs-bugId-status */

import OpenapiError from "@src/features/OpenapiError";
import BugRoute from "@src/features/routes/BugRoute";

class PatchBugStatusRoute extends BugRoute<{
  response: StoplightOperations["patch-bugs-bugId-status"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["patch-bugs-bugId-status"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["patch-bugs-bugId-status"]["parameters"]["path"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (await this.bugStatusIsNotValid()) {
      this.setError(403, new OpenapiError("Invalid Bug status"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {});
  }

  private async bugStatusIsNotValid() {
    const statuses = await this.getStatuses();
    const { status_id } = this.getBody();

    return statuses.find((status) => status.id === status_id) === undefined;
  }
}

export default PatchBugStatusRoute;
