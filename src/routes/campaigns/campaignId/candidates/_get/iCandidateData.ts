interface CandidateData {
  init(): Promise<void>;

  getCandidateData(candidate: { id: number }): any;
  isCandidateFiltered(candidate: { id: number }): boolean;
}

export type { CandidateData };
