/** OPENAPI-CLASS: get-campaigns-cid-groups */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class ProspectRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-cid-groups"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-cid-groups"]["parameters"]["path"];
}> {
  protected async filter() {
    if (!(await super.filter())) return false;
    if (
      !this.hasAccessToCampaign(this.cp_id) &&
      !this.hasAccessTesterSelection(this.cp_id)
    ) {
      this.setError(
        403,
        new OpenapiError("You don't have access to this campaign")
      );
      return false;
    }
    return true;
  }

  protected async prepare() {
    const groups = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("group_id")
      .where({
        campaign_id: this.cp_id,
      })
      .groupBy("group_id")
      .orderBy("group_id", "asc");

    this.setSuccess(
      200,
      groups.map((group) => ({
        id: group.group_id,
        name: `Group ${group.group_id}`,
      }))
    );
  }
}
