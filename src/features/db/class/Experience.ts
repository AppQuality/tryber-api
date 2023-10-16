import Database from "./Database";

type ExperienceType = {
  id: number;
  tester_id: number;
  amount: number;
  creation_date: string;
  activity_id: number;
  reason: string;
  campaign_id: number;
  pm_id: number;
};

class Experience extends Database<{
  fields: ExperienceType;
}> {
  constructor(fields?: Experience["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_exp_points",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "tester_id",
            "amount",
            "creation_date",
            "activity_id",
            "reason",
            "campaign_id",
            "pm_id",
          ],
    });
  }
}
export default Experience;
