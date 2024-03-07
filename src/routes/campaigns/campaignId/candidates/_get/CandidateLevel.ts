import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

class CandidateLevels implements CandidateData {
  private candidateIds: number[];
  private filters?: { metal?: string[] };
  private levelDefinitions:
    | {
        id: number;
        name: string;
      }[] = [];

  private _candidateLevels:
    | {
        id: number;
        level_id: number;
      }[]
    | undefined;

  constructor({
    candidateIds,
    filters,
  }: {
    candidateIds: number[];
    filters?: { metal?: string[] };
  }) {
    this.candidateIds = candidateIds;
    this.filters = filters;
  }

  get candidateLevels() {
    if (!this._candidateLevels) throw new Error("Levels not initialized");
    return this._candidateLevels;
  }

  async init() {
    this.levelDefinitions =
      await tryber.tables.WpAppqActivityLevelDefinition.do().select(
        "id",
        "name"
      );
    this._candidateLevels = await tryber.tables.WpAppqActivityLevel.do()
      .select(
        tryber.ref("tester_id").withSchema("wp_appq_activity_level").as("id"),
        "level_id"
      )
      .whereIn("tester_id", this.candidateIds);
    return;
  }

  getCandidateData(candidate: { id: number }) {
    const level = this.levelDefinitions.find((level) => {
      const level_id = this.candidateLevels.find(
        (level) => level.id === candidate.id
      );
      if (!level_id) return false;
      return level.id === level_id.level_id;
    });
    return level ? level.name : "No level";
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (!this.filters?.metal) return true;

    const data = this.getCandidateData(candidate);

    return this.filters.metal.includes(data);
  }
}

export { CandidateLevels };
