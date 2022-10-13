/** OPENAPI-CLASS: get-campaigns-campaign-forms */
import UserRoute from "@src/features/routes/UserRoute";
import PreselectionFormFields, {
  PreselectionFormFieldsObject,
} from "@src/features/db/class/PreselectionFormFields";
import OpenapiError from "@src/features/OpenapiError";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-forms"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-forms"]["parameters"]["path"];
}> {
  private db: { questions: PreselectionFormFields };
  private campaign_id: number;
  private questions: PreselectionFormFieldsObject[] | false = false;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    this.db = {
      questions: new PreselectionFormFields(["id", "question", "short_name"]),
    };
  }
  protected async init() {
    this.questions = await this.db.questions.query({
      orderBy: [{ field: "priority" }],
    });
    if (this.questions.length === 0) {
      this.questions = false;
    }
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
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
        short_name:
          question.short_name !== null ? question.short_name : undefined,
        question: question.question,
      };
    });
  }
}
