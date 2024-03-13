/** OPENAPI-CLASS: post-jotforms-campaignId */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import Jotform from "@src/features/jotform";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["post-jotforms-campaignId"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-jotforms-campaignId"]["parameters"]["path"];
  body: StoplightOperations["post-jotforms-campaignId"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private formId: string;
  private testerIdColumn: string;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { campaign } = this.getParameters();
    this.campaignId = Number(campaign);
    const { formId, testerIdColumn } = this.getBody();
    this.formId = formId;
    this.testerIdColumn = testerIdColumn;
  }

  protected async filter() {
    if (this.hasCapability("manage_preselection_forms") === false) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    return true;
  }

  private async campaignExists() {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({ id: this.campaignId });
    return result.length > 0;
  }

  protected async prepare(): Promise<void> {
    const JF = new Jotform();

    const { questions, submissions, createdAt } = await JF.getForm(this.formId);

    await this.clearExistingForm();

    const formId = await this.createForm(createdAt);

    const questionIds = await this.createQuestions(
      questions.filter((q) => q.name !== this.testerIdColumn),
      formId
    );

    for (const submission of submissions) {
      const testerId = this.getTesterIdValue(submission);
      if (testerId) {
        for (const [question, data] of Object.entries(submission.answers)) {
          if (Object.keys(questionIds).includes(question)) {
            const answer = Array.isArray((data as any).answer)
              ? (data as any).answer
              : [(data as any).answer];

            const questionData = questions.find((q) => q.name === question);
            const questionType = questionData ? questionData.type : undefined;

            const answerList =
              answer.length > 0 && typeof answer[0] === "object"
                ? Object.values(answer[0])
                : answer;

            for (const a of answerList) {
              const value =
                questionType === "control_yesno" ? a.replace("YES", "SÌ") : a;

              await tryber.tables.WpAppqCampaignPreselectionFormData.do().insert(
                {
                  campaign_id: this.campaignId,
                  field_id: questionIds[question],
                  value,
                  tester_id: testerId,
                  submission_date: submission.date,
                }
              );
            }
          }
        }
      }
    }

    this.setSuccess(200, {});
  }

  private getTesterIdValue(submission: {
    id: string;
    answers: any;
    date: string;
  }) {
    if (!(this.testerIdColumn in submission.answers)) return null;
    return Number(
      submission.answers[this.testerIdColumn].answer.replace(/\D/g, "")
    );
  }

  private async createQuestions(
    questions: {
      id: string;
      type: string;
      title: string;
      name: string;
      options?: string[] | undefined;
    }[],
    formId: number
  ) {
    const questionIds: Record<string, number> = {};
    for (const question of questions) {
      const questionType = mapQuestionType(question.type);
      if (questionType) {
        const result =
          await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
            .insert({
              form_id: formId,
              question: question.title.replace(/(<([^>]+)>)/gi, ""),
              type: questionType,
              options: question.options
                ? JSON.stringify(question.options)
                : undefined,
            })
            .returning("id");
        const questionId = result[0].id ?? result[0];
        questionIds[question.name] = questionId;
      }
    }
    return questionIds;

    function mapQuestionType(type: string) {
      if (["control_textbox", "control_email", "control_number"].includes(type))
        return "text";
      if (["control_radio", "control_yesno"].includes(type)) return "select";
      if (type === "control_checkbox") return "multiselect";
      return undefined;
    }
  }

  private async createForm(createdAt: string) {
    const result = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .insert({
        campaign_id: this.campaignId,
        name: `[Imported from jotform] CP${this.campaignId} - ${this.formId}`,
        creation_date: createdAt,
      })
      .returning("id");

    const formId = result[0].id ?? result[0];
    return formId;
  }

  private async clearExistingForm() {
    const existingForm = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("id")
      .where({ campaign_id: this.campaignId })
      .first();

    if (existingForm) {
      await tryber.tables.WpAppqCampaignPreselectionForm.do()
        .delete()
        .where({ id: existingForm.id });

      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .delete()
        .where({ form_id: existingForm.id });

      await tryber.tables.WpAppqCampaignPreselectionFormData.do()
        .delete()
        .where({ campaign_id: this.campaignId });
    }
  }
}
