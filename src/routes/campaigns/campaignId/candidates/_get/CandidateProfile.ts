import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

type Filters = {
  id?: { include?: string[]; exclude?: string[] };
  gender?: StoplightComponents["schemas"]["Gender"][];
  age?: { min?: number; max?: number };
};

class CandidateProfile implements CandidateData {
  private candidateIds: number[];
  private filters?: Filters;

  private _candidateData:
    | {
        id: number;
        gender: StoplightComponents["schemas"]["Gender"];
        age: number;
        experience: number;
      }[]
    | undefined;

  get candidateData() {
    if (this._candidateData === undefined)
      throw new Error("CandidateProfile not initialized");
    return this._candidateData;
  }

  constructor({
    candidateIds,
    filters,
  }: {
    candidateIds: number[];
    filters?: Filters;
  }) {
    this.candidateIds = candidateIds;
    this.filters = filters;
  }

  async init() {
    const result = await tryber.tables.WpAppqEvdProfile.do()
      .select("id", "sex", tryber.fn.charDate("birth_date"), "total_exp_pts")
      .whereIn("id", this.candidateIds);
    this._candidateData = result.map((candidate) => {
      const gender =
        candidate.sex === 2
          ? "other"
          : candidate.sex === 0
          ? "female"
          : candidate.sex === 1
          ? "male"
          : "not-specified";

      return {
        id: candidate.id,
        experience: candidate.total_exp_pts,
        gender,
        age:
          new Date().getFullYear() -
          new Date(candidate.birth_date).getFullYear(),
      };
    });
    return;
  }

  getCandidateData(candidate: { id: number }) {
    const data = this.candidateData.find(
      (candidateData) => candidateData.id === candidate.id
    );
    if (!data) throw new Error("Candidate not found");
    return {
      gender: data.gender,
      age: data.age,
      experience: data.experience,
    };
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (this.isCandidateFilteredByIncludeId(candidate)) return false;
    if (this.isCandidateFilteredByExcludeId(candidate)) return false;
    if (this.isCandidateFilteredByGender(candidate)) return false;
    if (this.isCandidateFilteredByAge(candidate)) return false;
    return true;
  }

  private isCandidateFilteredByGender(candidate: { id: number }): boolean {
    if (!this.filters?.gender) return false;
    const data = this.getCandidateData(candidate);
    if (!data.gender) return false;
    return this.filters.gender.includes(data.gender) === false;
  }

  private isCandidateFilteredByExcludeId(candidate: { id: number }): boolean {
    if (!this.filters?.id?.exclude) return false;
    return this.filters.id.exclude.includes(candidate.id.toString());
  }
  private isCandidateFilteredByIncludeId(candidate: { id: number }): boolean {
    if (!this.filters?.id?.include) return false;
    return this.filters.id.include.includes(candidate.id.toString()) === false;
  }

  private isCandidateFilteredByAge(candidate: { id: number }): boolean {
    if (!this.filters?.age) return false;
    const data = this.getCandidateData(candidate);
    if (!data) return true;
    if (this.filters.age.min && data.age < this.filters.age.min) return true;
    if (this.filters.age.max && data.age > this.filters.age.max) return true;
    return false;
  }
}

export { CandidateProfile };
