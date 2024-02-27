import { CandidateData } from "./iCandidateData";

class CandidateProfile implements CandidateData {
  private candidateIds: number[];
  private filters?: { id?: { include?: string[]; exclude?: string[] } };

  constructor({
    candidateIds,
    filters,
  }: {
    candidateIds: number[];
    filters?: { id?: { include?: string[]; exclude?: string[] } };
  }) {
    this.candidateIds = candidateIds;
    this.filters = filters;
  }

  async init() {
    return;
  }

  getCandidateData(candidate: { id: number }) {
    return undefined;
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (this.filters?.id?.include) {
      return this.filters.id.include.includes(candidate.id.toString());
    }
    if (this.filters?.id?.exclude) {
      return !this.filters.id.exclude.includes(candidate.id.toString());
    }
    return true;
  }
}

export { CandidateProfile };
