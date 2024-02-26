import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

class CandidateQuestions implements CandidateData {
  private candidateIds: number[];
  private questionIds: number[];

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

  constructor({
    candidateIds,
    questionIds,
  }: {
    candidateIds: number[];
    questionIds: number[];
  }) {
    this.candidateIds = candidateIds;
    this.questionIds = questionIds;
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
    if (this.questionIds.length === 0) return;

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
        .whereIn("tester_id", this.candidateIds)
        .whereIn(
          "wp_appq_campaign_preselection_form_fields.id",
          this.questionIds
        );

    this._questions =
      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .select(
          tryber
            .ref("id")
            .withSchema("wp_appq_campaign_preselection_form_fields"),
          "question",
          "short_name"
        )
        .whereIn("id", this.questionIds);
    return;
  }

  getCandidateData(candidate: { id: number }) {
    return this.questions.map((question) => {
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
    return true;
  }
}

export { CandidateQuestions };
