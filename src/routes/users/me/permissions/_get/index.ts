/** OPENAPI-CLASS: get-users-me-permissions */
import UserRoute from "@src/features/routes/UserRoute";
export default class PermissionRoute extends UserRoute<{
  response: StoplightOperations["get-users-me-permissions"]["responses"]["200"]["content"]["application/json"];
}> {
  private getOlps() {
    const olps = this.configuration.request.user.permission.admin;

    if (!olps) return {};
    return {
      appq_bug:
        typeof olps.appq_bug == "number" ? [olps.appq_bug] : olps.appq_bug,
      appq_campaign:
        typeof olps.appq_campaign == "number"
          ? [olps.appq_campaign]
          : olps.appq_campaign,
      appq_message_center:
        typeof olps.appq_message_center == "number"
          ? [olps.appq_message_center]
          : olps.appq_message_center,
      appq_prospect:
        typeof olps.appq_prospect == "number"
          ? [olps.appq_prospect]
          : olps.appq_prospect,
      appq_tester_selection:
        typeof olps.appq_tester_selection == "number"
          ? [olps.appq_tester_selection]
          : olps.appq_tester_selection,
    };
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, this.getOlps());
  }
}
