/** OPENAPI-CLASS: post-campaigns-campaign-tasks-usecase-survey-jotform */

import { tryber } from "@src/features/database";
import Jotform from "@src/features/jotform";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class Route extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-tasks-usecase-survey-jotform"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-tasks-usecase-survey-jotform"]["parameters"]["path"];
  body: StoplightOperations["post-campaigns-campaign-tasks-usecase-survey-jotform"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private usecaseId: number;
  private formId: string;
  private testerIdColumn: string;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { campaign, usecase } = this.getParameters();
    this.campaignId = Number(campaign);
    this.usecaseId = Number(usecase);
    const { jotformId, testerQuestionId } = this.getBody();
    this.formId = jotformId;
    this.testerIdColumn = testerQuestionId;
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(
        403,
        new OpenapiError("User not allowed to manage surveys")
      );
      return false;
    }
    return true;
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
              await tryber.tables.UsecaseSurveyResponses.do().insert({
                campaign_task_id: this.usecaseId,
                survey_id: formId,
                question_id: questionIds[question],
                value: a,
                tester_id: testerId,
                submission_date: submission.date,
              });
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
        const result = await tryber.tables.UsecaseSurveyQuestions.do()
          .insert({
            survey_id: formId,
            question_text: question.title.replace(/(<([^>]+)>)/gi, ""),
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
    const result = await tryber.tables.UsecaseSurveys.do()
      .insert({
        campaign_task_id: this.usecaseId,
        name: `[Imported from jotform] CP${this.campaignId} UC${this.usecaseId} - ${this.formId}`,
        creation_date: createdAt,
        author: this.getTesterId(),
      })
      .returning("id");

    const formId = result[0].id ?? result[0];
    return formId;
  }

  private async clearExistingForm() {
    const existingForm = await tryber.tables.UsecaseSurveys.do()
      .select("id")
      .where("campaign_task_id", this.usecaseId)
      .first();

    if (existingForm) {
      await tryber.tables.UsecaseSurveys.do()
        .delete()
        .where({ id: existingForm.id });

      await tryber.tables.UsecaseSurveyQuestions.do()
        .delete()
        .where("survey_id", existingForm.id);

      await tryber.tables.UsecaseSurveyResponses.do()
        .delete()
        .where({ survey_id: existingForm.id });
    }
  }
}
