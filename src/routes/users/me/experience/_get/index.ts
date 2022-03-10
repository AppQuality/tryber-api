import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-experience */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const sqlCountFields = `SELECT count(e.id) as total`;
    const sqlSelectFields = `SELECT 
       e.id as id, e.activity_id as activityId, e.reason as note, 
       e.creation_date as date, e.amount, e.campaign_id as campaignId, c.title as campaignTITLE `;

    let fromSql = `
    FROM wp_appq_exp_points e 
    LEFT JOIN wp_appq_evd_campaign c ON (c.id = e.campaign_id)
    JOIN wp_appq_evd_profile p ON (p.id = e.tester_id)
    WHERE p.wp_user_id  = ?`;

    let limits = "";
    const data = [req.user.ID];
    const accepted = {
      amount: ["e.amount"],
      campaign: ["e.campaign_id", "c.title"],
      note: ["e.reason"],
      activity: ["e.activity_id"],
      id: ["e.id"],
    };

    if (req.query.filterBy && typeof req.query.filterBy !== "string") {
      for (const [key, value] of Object.entries(req.query.filterBy)) {
        if (Object.keys(accepted).includes(key)) {
          fromSql += " AND (";
          const orQuery = accepted[key as keyof typeof accepted].map((el) => {
            data.push(el, value);
            return "?? = ? ";
          });
          fromSql += orQuery.join(" OR ");
          fromSql += ") ";
        }
      }
      if (Object.keys(req.query.filterBy).includes("date")) {
        fromSql += " AND ( e.creation_date LIKE ? )";
        data.push("%" + req.query.filterBy["date"] + "%");
      }
    }

    if (
      req.query.search &&
      req.query.searchBy &&
      typeof req.query.searchBy === "string"
    ) {
      for (const key of req.query.searchBy.split(",")) {
        if (Object.keys(accepted).includes(key) || key === "date") {
          fromSql += " AND (";
          const orQuery = accepted[key as keyof typeof accepted].map((el) => {
            data.push(el, "%" + req.query.search + "%");
            return "?? LIKE ? ";
          });
          fromSql += orQuery.join(" OR ");
          fromSql += ") ";
        }
      }
    }

    if (
      (req.query.orderBy &&
        typeof req.query.orderBy === "string" &&
        Object.keys(accepted).includes(req.query.orderBy)) ||
      req.query.orderBy === "date"
    ) {
      fromSql += ` ORDER BY ?? ${req.query.order || "ASC"}`;
      if (req.query.orderBy === "date") {
        data.push("e.creation_date");
      } else {
        data.push(accepted[req.query.orderBy as keyof typeof accepted][0]);
      }
    }

    const limitData: number[] = [];
    if (req.query.limit && typeof req.query.limit === "string") {
      limits += " LIMIT ? ";
      limitData.push(parseInt(req.query.limit));
      if (req.query.start && typeof req.query.start === "string") {
        limits += " OFFSET ? ";
        limitData.push(parseInt(req.query.start));
      }
    }

    const getExpSql = sqlSelectFields + fromSql + limits;
    let getExpQuery = db.format(getExpSql, data);
    getExpQuery = db.format(getExpQuery, limitData);

    const rows = await db.query(getExpQuery);
    if (!rows.length) {
      throw Error("Error on finding experience points");
    }

    let expList = rows.map(mapQueryToObject);
    let start = 0;
    if (req.query.start && typeof req.query.start === "string") {
      start = parseInt(req.query.start);
    }

    const results: {
      results: typeof expList;
      size: number;
      total?: number;
      start: number;
      limit?: number;
      sum?: number;
    } = {
      results: expList,
      size: rows.length,
      start: start,
    };

    const getExpSumQuery = `SELECT sum(a.amount) as sum FROM (${getExpQuery}) a`;
    const sum = await db.query(getExpSumQuery);
    if (!sum.length) {
      throw Error("Error on finding experience sum");
    }

    results.sum = sum[0].sum;

    if (req.query.limit && typeof req.query.limit === "string") {
      results.limit = parseInt(req.query.limit);
      const getExpCountSql = sqlCountFields + fromSql;
      const getExpCountQuery = db.format(getExpCountSql, data);

      const countRows = await db.query(getExpCountQuery);
      if (!countRows.length) {
        throw Error("Error on finding bugs total");
      }
      results.total = countRows[0].total;
    }
    res.status_code = 200;
    return results;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = 404;
    return {
      element: "experience",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};

const mapQueryToObject = (experience: {
  id: number;
  activityId: number;
  note: string;
  date: Date;
  amount: number;
  campaignId: number;
  campaignTITLE: string;
}) => {
  const campaign: { id: number; title?: string } = {
    id: experience.campaignId,
  };
  if (experience.campaignTITLE) campaign.title = experience.campaignTITLE;
  return {
    id: experience.id,
    activity: {
      id: experience.activityId,
    },
    campaign: campaign,
    date: new Date(experience.date).toISOString().substr(0, 10),
    amount: experience.amount,
    note: experience.note,
  };
};
