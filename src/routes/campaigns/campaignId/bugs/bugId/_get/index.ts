/** OPENAPI-CLASS: get-campaigns-single-bug */
import { getPresignedUrl } from "./../../../../../../features/s3/presignUrl/index";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class Route extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-single-bug"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-single-bug"]["parameters"]["path"];
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
    const bug = await this.getBug();
    if (!bug) {
      this.setError(404, new OpenapiError("Bug not found"));
      throw new Error("Bug not found");
    }

    this.setSuccess(200, {
      id: bug.id,
      title: bug.title || "",
      description: bug.description || "",
      actual_result: bug.current_result || "",
      expected_result: bug.expected_result || "",
      severity: {
        id: bug.severity_id,
        name: bug.severity || "",
      },
      replicability: {
        id: bug.bug_replicability_id,
        name: bug.replicability || "",
      },
      type: {
        id: bug.bug_type_id,
        name: bug.type || "",
      },
      status: {
        id: bug.status_id,
        name: bug.status_name || "",
        description: bug.status_description || "",
      },
      note: bug.note || "",
      reason: bug.status_reason || "",
      usecase: {
        id: bug.uc_id || 0,
        title: bug.uc_title || "",
        description: bug.uc_content || "",
      },
      media: (await this.getMedia()) ?? [],
      status_history: await this.getStatusHistory(),
    });
  }

  protected async getBug() {
    return await tryber.tables.WpAppqEvdBug.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_bug"),
        tryber.ref("message").withSchema("wp_appq_evd_bug").as("title"),
        tryber.ref("description").withSchema("wp_appq_evd_bug"),
        tryber.ref("expected_result").withSchema("wp_appq_evd_bug"),
        tryber.ref("current_result").withSchema("wp_appq_evd_bug"),
        tryber.ref("status_id").withSchema("wp_appq_evd_bug"),
        tryber
          .ref("description")
          .withSchema("wp_appq_evd_bug_status")
          .as("status_description"),
        tryber.ref("note").withSchema("wp_appq_evd_bug"),
        tryber.ref("status_reason").withSchema("wp_appq_evd_bug"),
        tryber.ref("bug_replicability_id").withSchema("wp_appq_evd_bug"),
        tryber.ref("bug_type_id").withSchema("wp_appq_evd_bug"),
        tryber.ref("severity_id").withSchema("wp_appq_evd_bug"),
        tryber
          .ref("name")
          .withSchema("wp_appq_evd_bug_status")
          .as("status_name"),
        tryber.ref("name").withSchema("wp_appq_evd_severity").as("severity"),
        tryber.ref("name").withSchema("wp_appq_evd_bug_type").as("type"),
        tryber
          .ref("name")
          .withSchema("wp_appq_evd_bug_replicability")
          .as("replicability"),
        tryber.ref("title").withSchema("wp_appq_campaign_task").as("uc_title"),
        tryber
          .ref("content")
          .withSchema("wp_appq_campaign_task")
          .as("uc_content"),
        tryber.ref("id").withSchema("wp_appq_campaign_task").as("uc_id")
      )
      .join(
        "wp_appq_evd_bug_status",
        "wp_appq_evd_bug.status_id",
        "wp_appq_evd_bug_status.id"
      )
      .join(
        "wp_appq_evd_severity",
        "wp_appq_evd_bug.severity_id",
        "wp_appq_evd_severity.id"
      )
      .join(
        "wp_appq_evd_bug_type",
        "wp_appq_evd_bug.bug_type_id",
        "wp_appq_evd_bug_type.id"
      )
      .join(
        "wp_appq_evd_bug_replicability",
        "wp_appq_evd_bug.bug_replicability_id",
        "wp_appq_evd_bug_replicability.id"
      )
      .leftJoin(
        "wp_appq_campaign_task",
        "wp_appq_evd_bug.application_section_id",
        "wp_appq_campaign_task.id"
      )
      .where("wp_appq_evd_bug.campaign_id", this.cp_id)
      .where("wp_appq_evd_bug.id", this.bug_id)
      .first();
  }

  protected async getMedia() {
    const media = await tryber.tables.WpAppqEvdBugMedia.do()
      .select("id", "location", "type")
      .where("bug_id", this.bug_id);

    return await Promise.all(
      media.map(async (item) => ({
        id: item.id,
        url: (await getPresignedUrl(item.location)) || "",
      }))
    );
  }

  protected async getStatusHistory() {
    const statuses = await tryber.tables.WpAppqEvdBugRev.do()
      .select(
        tryber.ref("status_reason").withSchema("wp_appq_evd_bug_rev"),
        tryber.ref("bug_rev_creation").withSchema("wp_appq_evd_bug_rev"),
        tryber.ref("name").withSchema("wp_appq_evd_bug_status")
      )
      .join(
        "wp_appq_evd_bug_status",
        "wp_appq_evd_bug_rev.status_id",
        "wp_appq_evd_bug_status.id"
      )
      .where("bug_id", this.bug_id);

    return !statuses.length
      ? []
      : statuses.map((data) => ({
          status: data.name || "",
          reason: data.status_reason || "",
          date: data.bug_rev_creation.toString() || "",
        }));
  }
}
