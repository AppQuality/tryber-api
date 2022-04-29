import * as db from "@src/features/db";

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
    return await db.query(`
        SELECT  exp.tester_id, SUM(exp.amount) as monthly_exp
        FROM wp_appq_exp_points exp
                JOIN wp_appq_evd_profile t ON (t.id = exp.tester_id)
        WHERE MONTH(exp.creation_date) = MONTH(NOW())
            AND YEAR(exp.creation_date) = YEAR(NOW())
            AND exp.amount != 0
            AND t.name != "Deleted User"
        GROUP BY (exp.tester_id);
  `);
  }

  private async getTesterCurrentLevels(): Promise<
    {
      tester_name: string;
      tester_surname: string;
      tester_id: number;
      level: number;
      total_exp: number;
    }[]
  > {
    const sql = db.format(
      `SELECT 
    t.name as tester_name, t.surname as tester_surname,
    lvl.tester_id   as tester_id,
    t.total_exp_pts as total_exp
  FROM wp_appq_activity_level lvl
      JOIN wp_appq_evd_profile t ON (t.id = lvl.tester_id)
  WHERE t.name <> "Deleted User"
    AND lvl.level_id = ?
  GROUP BY (lvl.tester_id);
    `,
      [this.level]
    );
    return await db.query(sql);
  }

  private getTesterName(tester: {
    tester_name: string;
    tester_surname: string;
  }) {
    return tester.tester_name + " " + tester.tester_surname.charAt(0) + ".";
  }

  private getTesterImage() {
    return "https://placekitten.com/200/200";
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
        image: this.getTesterImage(),
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

  async getLeaderboard(): Promise<
    StoplightComponents["schemas"]["RankingItem"][]
  > {
    if (this.leaderboard.length === 0) {
      await this.populate();
    }
    return this.leaderboard;
  }
}
