/** OPENAPI-CLASS: get-users-me-permissions */
import UserRoute from "@src/features/routes/UserRoute";
export default class PermissionRoute extends UserRoute<{
  response: StoplightOperations["get-users-me-permissions"]["responses"]["200"]["content"]["application/json"];
}> {
  private getOlps() {
    const olps = this.configuration.request.user.permission.admin;

    if (!olps) return {};
    return {
      appq_bug: olps.appq_bug,
      appq_campaign: olps.appq_campaign,
      appq_message_center: olps.appq_message_center,
      appq_prospect: olps.appq_prospect,
      appq_tester_selection: olps.appq_tester_selection,
    };
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, this.getOlps());
  }
}
