/** OPENAPI-CLASS: get-campaigns-single-bug-ai-review */
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class Route extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-single-bug-ai-review"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-single-bug-ai-review"]["parameters"]["path"];
}> {
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const params = this.getParameters();
    this.bug_id = parseInt(params.bugId);
    if (isNaN(this.bug_id)) {
      this.setError(400, new OpenapiError("Invalid bug id"));
      throw new Error("Invalid bug id");
    }
  }
  protected bug_id: number;

  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    return true;
  }

  protected async prepare(): Promise<void> {
    const bugAiReview = await this.getBugAiReview();
    if (!bugAiReview) {
      this.setError(404, new OpenapiError("Bug AI review not found"));
      throw new Error("Bug AI review not found");
    }

    this.setSuccess(200, bugAiReview);
  }

  protected async getBugAiReview() {
    return await tryber.tables.WpAppqEvdBug.do()
      .select("ai_status", "ai_reason", "ai_notes", "score_percentage")
      .from("ai_bug_review")
      .where("campaign_id", this.cp_id)
      .where("bug_id", this.bug_id)
      .first();
  }
}
