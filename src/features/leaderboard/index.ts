import { tryber } from "@src/features/database";
import { gravatarUrl } from "avatar-initials";

export default class Leaderboard {
  private leaderboard: StoplightComponents["schemas"]["RankingItem"][];
  private level: number;
  constructor(level: number) {
    this.leaderboard = [];
    this.level = level;
  }

  private async getTesterMonthlyExperience(): Promise<
    {
      tester_id: number;
      monthly_exp: number;
    }[]
  > {
    console.log("such");
    const sql = tryber.tables.WpAppqExpPoints.do()
      .select("tester_id")
      .sum("amount", { as: "monthly_exp" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_exp_points.tester_id"
      )
      .whereNot("wp_appq_evd_profile.name", "Deleted User")
      .whereNot("wp_appq_exp_points.amount", 0)
      .whereRaw(
        `${tryber.fn.month(
          "wp_appq_exp_points.creation_date"
        )} = ${tryber.fn.month(tryber.fn.now())}`
      )
      .whereRaw(
        `${tryber.fn.year(
          "wp_appq_exp_points.creation_date"
        )} = ${tryber.fn.year(tryber.fn.now())}`
      )
      .groupBy("tester_id");
    console.log(sql.toString());
    const res = await sql;
    console.log(res);
    return await sql;
  }

  private async getTesterCurrentLevels(): Promise<
    {
      tester_name: string;
      tester_surname: string;
      tester_email: string;
      tester_id: number;
      level: number;
      total_exp: number;
    }[]
  > {
    return await tryber.tables.WpAppqActivityLevel.do()
      .select(
        "wp_appq_evd_profile.name as tester_name",
        "wp_appq_evd_profile.surname as tester_surname",
        "wp_appq_evd_profile.email as tester_email",
        "wp_appq_activity_level.tester_id as tester_id",
        "wp_appq_activity_level.level_id as level",
        "wp_appq_evd_profile.total_exp_pts as total_exp"
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_activity_level.tester_id"
      )
      .whereNot("wp_appq_evd_profile.name", "Deleted User")
      .where("wp_appq_activity_level.level_id", this.level)
      .groupBy("wp_appq_activity_level.tester_id");
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

  private getTesterImage(tester: {
    tester_name: string;
    tester_surname: string;
    tester_email: string;
  }) {
    const nameSlug = tester.tester_name
      .toLowerCase()
      .replace(/[\W_]+/g, " ")
      .replace(" ", "-");
    const surnameSlug = tester.tester_surname
      .toLowerCase()
      .replace(/[\W_]+/g, " ")
      .replace(" ", "-")
      .charAt(0);
    return gravatarUrl({
      fallback: `https://eu.ui-avatars.com/api/${nameSlug}+${surnameSlug}/132`,
      email: tester.tester_email,
      size: 132,
    });
  }

  private async populate() {
    const exp = await this.getTesterMonthlyExperience();
    const currentLevels = await this.getTesterCurrentLevels();

    let tempLeaderboard: (typeof this.leaderboard[0] & {
      total_exp: number;
    })[] = [];

    currentLevels.forEach((level) => {
      const testerExp = exp.find((e) => e.tester_id === level.tester_id);
      tempLeaderboard.push({
        position: 0,
        name: this.getTesterName(level),
        id: level.tester_id,
        image: this.getTesterImage(level),
        monthly_exp: testerExp ? testerExp.monthly_exp : 0,
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

  async getLeaderboard(): Promise<
    StoplightComponents["schemas"]["RankingItem"][]
  > {
    if (this.leaderboard.length === 0) {
      await this.populate();
    }
    return this.leaderboard;
  }
}
