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
      .select("id", "sex", tryber.fn.charDate("birth_date"))
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
    };
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (this.filters?.id?.include) {
      return this.filters.id.include.includes(candidate.id.toString());
    }
    if (this.filters?.id?.exclude) {
      return !this.filters.id.exclude.includes(candidate.id.toString());
    }
    if (this.filters?.gender) {
      const data = this.getCandidateData(candidate);
      if (!data.gender) return false;
      return this.filters.gender.includes(data.gender);
    }
    if (this.filters?.age) {
      const data = this.getCandidateData(candidate);
      if (!data) return false;
      return (
        (!this.filters.age.min || data.age >= this.filters.age.min) &&
        (!this.filters.age.max || data.age <= this.filters.age.max)
      );
    }
    return true;
  }
}

export { CandidateProfile };
