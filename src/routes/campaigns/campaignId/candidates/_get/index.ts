/** OPENAPI-CLASS: get-campaigns-campaign-candidates */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import { CandidateDevices } from "./CandidateDevices";
import { CandidateLevels } from "./CandidateLevels";
import { CandidateProfile } from "./CandidateProfile";
import { CandidateQuestions } from "./CandidateQuestions";
import { Candidates } from "./Candidates";

type filterBy =
  | { os?: string[] | string; testerIds?: string[] | string }
  | undefined;
export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["query"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private start: number;
  private limit: number;
  private hasLimit: boolean = false;
  private fields: { type: "question"; id: number }[] = [];
  private filters:
    | {
        os?: string[];
        ids?: {
          include?: number[];
          exclude?: number[];
        };
      }
    | undefined;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    const query = this.getQuery();
    this.start = parseInt(query.start as unknown as string) || 0;
    this.limit = 10;
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      this.hasLimit = true;
    }

    if (query.fields) {
      query.fields.split(",").map((field) => {
        const match = field.match(/^question_(\d+)$/);
        if (match) {
          this.fields.push({ type: "question", id: parseInt(match[1]) });
        }
      });
    }

    this.filters = { ...this.filters, ...this.getOsFilter() };
    this.filters = {
      ...this.filters,
      ids: { ...this?.filters.ids, exclude: this.getExcludeIds() },
    };
    this.filters = {
      ...this.filters,
      ids: { ...this?.filters.ids, include: this.getIncludeIds() },
    };
  }

  private getIncludeIds() {
    const query = this.getQuery();
    const filterByInclude = query.filterByInclude as filterBy;
    if (!filterByInclude) return undefined;
    if ("testerIds" in filterByInclude === false) return undefined;
    if (filterByInclude.testerIds === undefined) return undefined;

    const ids = Array.isArray(filterByInclude.testerIds)
      ? filterByInclude.testerIds.flatMap((ids) => ids.split(","))
      : filterByInclude.testerIds.split(",");

    return ids
      .map((id) => id.replace(/\D/g, ""))
      .map(Number)
      .filter((num) => !isNaN(num));
  }

  private getExcludeIds() {
    const query = this.getQuery();
    const filterByExclude = query.filterByExclude as filterBy;
    if (!filterByExclude) return undefined;
    if ("testerIds" in filterByExclude === false) return undefined;
    if (filterByExclude.testerIds === undefined) return undefined;

    const ids = Array.isArray(filterByExclude.testerIds)
      ? filterByExclude.testerIds.flatMap((ids) => ids.split(","))
      : filterByExclude.testerIds.split(",");

    return ids
      .map((id) => id.replace(/\D/g, ""))
      .map(Number)
      .filter((num) => !isNaN(num));
  }

  private getOsFilter() {
    const query = this.getQuery();
    const filterByInclude = query.filterByInclude as filterBy;

    if (!filterByInclude) return {};
    if ("os" in filterByInclude === false) return {};
    if (filterByInclude.os === undefined) return {};

    return {
      os: Array.isArray(filterByInclude.os)
        ? filterByInclude.os
        : [filterByInclude.os],
    };
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    if ((await this.campaignExists()) === false) {
      this.setError(404, new OpenapiError("Campaign does not exists."));
      return false;
    }
    if (await this.invalidQuestions()) {
      this.setError(403, new OpenapiError("Invalid question."));
      return false;
    }
    return true;
  }

  private async campaignExists() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({ id: this.campaign_id })
      .first();
    return !!campaign;
  }

  private async invalidQuestions() {
    if (this.fields.length === 0) return false;

    const questions =
      await tryber.tables.WpAppqCampaignPreselectionFormFields.do()
        .join(
          "wp_appq_campaign_preselection_form",
          "wp_appq_campaign_preselection_form_fields.form_id",
          "wp_appq_campaign_preselection_form.id"
        )
        .select(
          tryber
            .ref("id")
            .withSchema("wp_appq_campaign_preselection_form_fields")
            .as("id"),
          "campaign_id"
        )
        .whereIn(
          "wp_appq_campaign_preselection_form_fields.id",
          this.fields.map((field) => field.id)
        );

    if (
      questions.some((question) => question.campaign_id !== this.campaign_id)
    ) {
      return true;
    }

    return false;
  }

  protected async prepare() {
    const { candidates, total } = await this.getCandidates();

    this.setSuccess(200, {
      results: candidates.map((candidate) => {
        return {
          id: candidate.id,
          name: candidate.name,
          surname: candidate.surname,
          experience: candidate.total_exp_pts,
          level: candidate.level,
          devices: candidate.devices,
          questions: candidate.questions,
        };
      }),
      size: candidates.length,
      start: this.start,
      limit: this.hasLimit ? this.limit : undefined,
      total: this.hasLimit ? total : undefined,
    });
  }

  private async getCandidates() {
    const candidatesRetriever = new Candidates({
      campaign_id: this.campaign_id,
    });
    const candidates = await candidatesRetriever.get();

    const deviceGetter = new CandidateDevices({
      candidateIds: candidates.map((candidate) => candidate.id),
      ...(this.filters?.os && { filters: { os: this.filters?.os } }),
    });
    await deviceGetter.init();

    const levelGetter = new CandidateLevels({
      candidateIds: candidates.map((candidate) => candidate.id),
    });
    await levelGetter.init();

    const questionGetter = new CandidateQuestions({
      candidateIds: candidates.map((candidate) => candidate.id),
      questionIds: this.fields.map((field) => field.id),
    });
    await questionGetter.init();

    const profileGetter = new CandidateProfile({
      candidateIds: candidates.map((candidate) => candidate.id),
      filters: {
        id: {
          include: this.filters?.ids?.include?.map((id) => id.toString()),
          exclude: this.filters?.ids?.exclude?.map((id) => id.toString()),
        },
      },
    });
    await profileGetter.init();

    const result = candidates
      .map((candidate) => {
        return {
          ...candidate,
          level: levelGetter.getCandidateData(candidate),
          devices: deviceGetter.getCandidateData(candidate),
          questions: questionGetter.getCandidateData(candidate),
        };
      })
      .filter(
        (candidate) =>
          deviceGetter.isCandidateFiltered(candidate) &&
          questionGetter.isCandidateFiltered(candidate) &&
          levelGetter.isCandidateFiltered(candidate) &&
          profileGetter.isCandidateFiltered(candidate)
      );

    return {
      candidates: result.slice(this.start, this.start + this.limit),
      total: result.length,
    };
  }
}
