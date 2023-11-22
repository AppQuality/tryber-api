import { tryber } from "@src/features/database";

export default class Leaderboard {
  private leaderboard: {
    position: number;
    id: number;
    name: string;
    monthly_exp: number;
  }[];
  private level: number;
  constructor(level: number) {
    this.leaderboard = [];
    this.level = level;
  }

  private async getTesterCurrentLevels(): Promise<
    {
      tester_name: string;
      tester_surname: string;
      tester_email: string;
      tester_id: number;
      level: number;
      total_exp: number;
      monthly_exp: number;
    }[]
  > {
    const testersInLevel = await tryber.tables.WpAppqActivityLevel.do()
      .select("tester_id")
      .where("level_id", this.level)
      .groupBy("tester_id");

    const result = await tryber.tables.WpAppqEvdProfile.do()
      .select(
        "wp_appq_evd_profile.name as tester_name",
        "wp_appq_evd_profile.surname as tester_surname",
        "wp_appq_evd_profile.email as tester_email",
        "wp_appq_evd_profile.id as tester_id",
        "wp_appq_evd_profile.total_exp_pts as total_exp",
        "monthly_tester_exp.amount as monthly_exp"
      )
      .leftJoin(
        "monthly_tester_exp",
        "monthly_tester_exp.tester_id",
        "wp_appq_evd_profile.id"
      )
      .whereNot("wp_appq_evd_profile.name", "Deleted User")
      .whereIn(
        "wp_appq_evd_profile.id",
        testersInLevel.map((item) => item.tester_id)
      );
    return result.map((item) => ({
      ...item,
      level: this.level,
    }));
  }

  private getTesterName({
    tester_name,
    tester_surname,
  }: {
    tester_name: string;
    tester_surname: string;
  }) {
    return tester_name + " " + tester_surname.charAt(0) + ".";
  }

  private async populate() {
    const currentLevels = await this.getTesterCurrentLevels();

    let tempLeaderboard: (typeof this.leaderboard[0] & {
      total_exp: number;
    })[] = [];

    currentLevels.forEach((level) => {
      tempLeaderboard.push({
        position: 0,
        name: this.getTesterName(level),
        id: level.tester_id,
        monthly_exp: level.monthly_exp ?? 0,
        total_exp: level.total_exp,
      });
    });

    tempLeaderboard.sort(
      (a: typeof tempLeaderboard[0], b: typeof tempLeaderboard[0]) => {
        if (a.monthly_exp - b.monthly_exp != 0) {
          return b.monthly_exp - a.monthly_exp;
        }
        if (a.total_exp - b.total_exp != 0) {
          return b.total_exp - a.total_exp;
        }
        if (a.id - b.id != 0) {
          return a.id - b.id;
        }
        return 0;
      }
    );

    let i = 1;
    this.leaderboard = tempLeaderboard.map((item) => ({
      ...item,
      position: i++,
      total_exp: undefined,
    }));
  }

  getRankByTester(testerId: number): typeof this.leaderboard[0] | undefined {
    return this.leaderboard.find((item) => item.id === testerId);
  }

  async getLeaderboard(): Promise<typeof this.leaderboard> {
    if (this.leaderboard.length === 0) {
      await this.populate();
    }
    return this.leaderboard;
  }
}
