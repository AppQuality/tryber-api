/** OPENAPI-CLASS: get-campaigns-campaign-forms */
import UserRoute from "@src/features/routes/UserRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-forms"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-forms"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private form_id: number = 0;
  private questions:
    | {
        id: number;
        question: string;
        short_name: string | null;
      }[]
    | false = false;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
  }
  protected async init() {
    const form = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("id")
      .where("campaign_id", this.campaign_id)
      .first();

    this.form_id = form ? form.id : 0;

    this.questions =
      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .select("id", "question", "short_name")
        .where("form_id", this.form_id)
        .orderBy("priority");
    if (this.questions.length === 0) {
      this.questions = false;
    }
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }
    if (this.form_id === 0) {
      this.setError(
        404,
        new Error("No form for this campaign.") as OpenapiError
      );
    }
    return true;
  }

  protected async prepare() {
    if (this.getQuestions().length === 0) {
      return this.setError(404, new OpenapiError("No data found"));
    }
    this.setSuccess(200, this.getQuestions());
  }

  private getQuestions() {
    if (this.questions === false) return [];
    return this.questions.map((question) => {
      return {
        id: question.id,
        shortName:
          question.short_name !== null ? question.short_name : undefined,
        question: question.question,
      };
    });
  }
}
