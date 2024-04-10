import { tryber } from "@src/features/database";
import { CandidateData } from "./iCandidateData";

class CandidateBhLevel implements CandidateData {
  private candidateIds: number[];
  private filters?: { bughunting?: string[] };

  private courses: Record<
    "levelone" | "leveltwo",
    { career: string; level: string }
  > = {
    levelone: { career: "Functional", level: "1" },
    leveltwo: { career: "General", level: "2" },
  };

  private _candidateData:
    | {
        id: number;
        campaigns: number;
        bugs: number;
        levelOneCourse: boolean;
        levelTwoCourse: boolean;
        highBugs: number;
        criticalBugs: number;
      }[]
    | undefined;

  constructor({
    candidateIds,
    filters,
  }: {
    candidateIds: number[];
    filters?: { bughunting?: string[] };
  }) {
    this.candidateIds = candidateIds;
    this.filters = filters;
  }

  get candidateData() {
    if (this._candidateData === undefined)
      throw new Error("CandidateProfile not initialized");
    return this._candidateData;
  }

  async init() {
    const campaignAndBugsQuery = tryber.tables.WpAppqEvdBug.do()
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_bug.wp_user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .countDistinct({ campaigns: "campaign_id" })
      .count({ bug: tryber.ref("id").withSchema("wp_appq_evd_bug") })
      .where("status_id", 2)
      .whereIn("wp_appq_evd_profile.id", this.candidateIds)
      .groupBy("wp_appq_evd_profile.id");

    const hasLevelOneCourseQuery = tryber.tables.WpAppqCourseTesterStatus.do()
      .join(
        "wp_appq_course",
        "wp_appq_course_tester_status.course_id",
        "wp_appq_course.id"
      )
      .where("wp_appq_course_tester_status.is_completed", 1)
      .where("wp_appq_course.level", this.courses.levelone.level)
      .where("wp_appq_course.career", this.courses.levelone.career)
      .whereIn("wp_appq_course_tester_status.tester_id", this.candidateIds);

    const hasLevelTwoCourseQuery = tryber.tables.WpAppqCourseTesterStatus.do()
      .join(
        "wp_appq_course",
        "wp_appq_course_tester_status.course_id",
        "wp_appq_course.id"
      )
      .where("wp_appq_course_tester_status.is_completed", 1)
      .where("wp_appq_course.level", this.courses.leveltwo.level)
      .where("wp_appq_course.career", this.courses.leveltwo.career)
      .whereIn("wp_appq_course_tester_status.tester_id", this.candidateIds);

    const bugsBySeverityQuery = tryber.tables.WpAppqEvdBug.do()
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_bug.wp_user_id",
        "wp_appq_evd_profile.wp_user_id"
      )
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile").as("tester_id"),
        "severity_id"
      )
      .where("status_id", 2)
      .whereIn("severity_id", [3, 4])
      .whereIn("wp_appq_evd_profile.id", this.candidateIds);

    const [
      campaignAndBugs,
      hasLevelOneCourse,
      hasLevelTwoCourse,
      bugsBySeverity,
    ] = await Promise.all([
      campaignAndBugsQuery,
      hasLevelOneCourseQuery,
      hasLevelTwoCourseQuery,
      bugsBySeverityQuery,
    ]);

    const criticalBugs = bugsBySeverity
      .filter((bug) => bug.severity_id === 4)
      .reduce((acc, bug) => {
        acc[bug.tester_id] = (acc[bug.tester_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    const highBugs = bugsBySeverity
      .filter((bug) => bug.severity_id === 3)
      .reduce((acc, bug) => {
        acc[bug.tester_id] = (acc[bug.tester_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    this._candidateData = campaignAndBugs.map((candidate) => {
      return {
        id: candidate.id,
        campaigns: candidate.campaigns ? Number(candidate.campaigns) : 0,
        bugs: candidate.bug ? Number(candidate.bug) : 0,
        levelOneCourse: hasLevelOneCourse.some(
          (course) => course.tester_id === candidate.id
        ),
        levelTwoCourse: hasLevelTwoCourse.some(
          (course) => course.tester_id === candidate.id
        ),
        highBugs: candidate.id in highBugs ? highBugs[candidate.id] : 0,
        criticalBugs:
          candidate.id in criticalBugs ? criticalBugs[candidate.id] : 0,
      };
    });

    return;
  }

  getCandidateData(candidate: { id: number }) {
    const candidateData = this.candidateData.find(
      (data) => data.id === candidate.id
    );

    if (!candidateData) return "No Level";

    if (
      candidateData.campaigns >= 50 &&
      candidateData.highBugs + candidateData.criticalBugs >= 50 &&
      candidateData.criticalBugs >= 10 &&
      candidateData.levelOneCourse &&
      candidateData.levelTwoCourse
    )
      return "Champion";
    if (
      candidateData.campaigns >= 30 &&
      candidateData.highBugs + candidateData.criticalBugs >= 20 &&
      candidateData.criticalBugs >= 5 &&
      candidateData.levelOneCourse &&
      candidateData.levelTwoCourse
    )
      return "Expert";
    if (
      candidateData.campaigns >= 10 &&
      candidateData.highBugs + candidateData.criticalBugs >= 10 &&
      candidateData.levelOneCourse &&
      candidateData.levelTwoCourse
    )
      return "Veteran";
    if (
      candidateData.campaigns >= 5 &&
      candidateData.bugs >= 10 &&
      candidateData.highBugs + candidateData.criticalBugs >= 5 &&
      candidateData.levelOneCourse
    )
      return "Advanced";
    if (
      candidateData.campaigns >= 1 &&
      candidateData.bugs >= 2 &&
      candidateData.levelOneCourse
    )
      return "Rookie";
    if (candidateData.campaigns >= 1) return "Newbie";
    return "No Level";
  }

  isCandidateFiltered(candidate: { id: number }): boolean {
    if (!this.filters?.bughunting) return true;

    const data = this.getCandidateData(candidate);

    return this.filters.bughunting.includes(data);
  }
}

export { CandidateBhLevel };
