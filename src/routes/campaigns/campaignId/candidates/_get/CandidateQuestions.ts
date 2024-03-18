import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

type Filters = Record<number, string[]>;

class CandidateQuestions implements CandidateData {
  private candidateIds: number[];
  private questionIds: number[];
  private campaignId: number;

  private _questions: {
    id: number;
    question: string;
    short_name: string;
  }[] = [];

  private _candidateQuestions:
    | {
        id: number;
        tester_id: number;
        question: string;
        short_name: string;
        value: string;
      }[]
    | undefined = [];

  private filters: Filters | undefined;

  constructor({
    campaignId,
    candidateIds,
    questionIds,
    filters,
  }: {
    campaignId: number;
    candidateIds: number[];
    questionIds: number[];
    filters?: Filters;
  }) {
    this.candidateIds = candidateIds;
    this.questionIds = questionIds;
    this.campaignId = campaignId;
    this.filters = filters;
  }

  get candidateQuestions() {
    if (!this._candidateQuestions)
      throw new Error("Candidate questions not initialized");
    return this._candidateQuestions;
  }

  get questions() {
    return this._questions;
  }

  async init() {
    this._candidateQuestions =
      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .join(
          "wp_appq_campaign_preselection_form_data",
          "wp_appq_campaign_preselection_form_fields.id",
          "wp_appq_campaign_preselection_form_data.field_id"
        )
        .select(
          tryber
            .ref("id")
            .withSchema("wp_appq_campaign_preselection_form_fields"),
          "tester_id",
          "question",
          "short_name",
          "value"
        )
        .where("campaign_id", this.campaignId)
        .whereIn("tester_id", this.candidateIds);

    this._questions =
      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .join(
          "wp_appq_campaign_preselection_form",
          "wp_appq_campaign_preselection_form.id",
          "wp_appq_campaign_preselection_form_fields.form_id"
        )
        .select(
          tryber
            .ref("id")
            .withSchema("wp_appq_campaign_preselection_form_fields"),
          "question",
          "short_name"
        )
        .where("campaign_id", this.campaignId);
    return;
  }

  getCandidateData(
    candidate: { id: number },
    options: { showAllQuestions: boolean } = { showAllQuestions: false }
  ) {
    return this.questions
      .filter(
        (question) =>
          options.showAllQuestions || this.questionIds.includes(question.id)
      )
      .map((question) => {
        const candidateQuestion = this.candidateQuestions.filter(
          (candidateQuestion) =>
            candidateQuestion.tester_id === candidate.id &&
            candidateQuestion.id === question.id
        );
        return {
          id: question.id,
          title: question.short_name ? question.short_name : question.question,
          value: candidateQuestion.length
            ? candidateQuestion.map((q) => q.value).join(", ")
            : "-",
        };
      });
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (!this.filters) return true;
    const data = this.getCandidateData(candidate, { showAllQuestions: true });

    for (const [questionId, filterValue] of Object.entries(this.filters)) {
      const question = data.find(
        (question) => question.id === Number(questionId)
      );
      if (!question) return false;

      if (
        !filterValue.some((v) =>
          question.value.toLowerCase().includes(v.toLowerCase())
        )
      )
        return false;
    }

    return true;
  }
}

export { CandidateQuestions };
