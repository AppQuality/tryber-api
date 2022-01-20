/** OPENAPI-ROUTE: get-users-me-bugs */
import { Context } from "openapi-backend";
import * as db from "../../../../../features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const sqlCountFields = `SELECT count(b.id) as total`;
    const sqlSelectFields = `SELECT 
       b.id as id, s.id as severityID, s.name as severity, 
       st.id as statusID, st.name as status, 
       c.title as campaignTITLE, c.id as campaign, b.message as title`;

    let fromSql = `
    FROM wp_appq_evd_bug b
             JOIN wp_appq_evd_campaign c ON (c.id = b.campaign_id)
             JOIN wp_appq_evd_severity s ON (s.id = b.severity_id)
             JOIN wp_appq_evd_bug_status st ON (st.id = b.status_id)
 WHERE b.wp_user_id  = ?`;

    let limits = "";
    const data = [req.user.ID];
    const accepted = {
      title: ["b.message"],
      campaign: ["c.id", "c.title"],
      status: ["st.name", "st.id"],
      severity: ["s.id", "s.name"],
      id: ["b.id"],
    };

    if (req.query.filterBy) {
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
    }

    if (req.query.orderBy) {
      let orderBy = "b.id";
      if (req.query.orderBy == "id") orderBy = "b.id";
      if (req.query.orderBy == "campaign") orderBy = "c.id";
      if (req.query.orderBy == "status") orderBy = "st.id";
      if (req.query.orderBy == "title") orderBy = "b.message";
      fromSql += ` ORDER BY ?? ${req.query.order || "DESC"}`;
      data.push(orderBy);
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

    const getBugsSql = sqlSelectFields + fromSql + limits;
    let getBugsQuery = db.format(getBugsSql, data);
    getBugsQuery = db.format(getBugsQuery, limitData);

    const rows = await db.query(getBugsQuery);
    if (!rows.length) {
      throw Error("Error on finding bugs");
    }

    let bugList = rows.map(mapQueryToObject);
    let start = 0;
    if (req.query.start && typeof req.query.start === "string") {
      start = parseInt(req.query.start);
    }

    const results: {
      results: typeof bugList;
      size: number;
      total?: number;
      start: number;
      limit?: number;
    } = {
      results: bugList,
      size: rows.length,
      start: start,
    };
    if (req.query.limit && typeof req.query.limit === "string") {
      results.limit = parseInt(req.query.limit);
      const getBugsCountSql = sqlCountFields + fromSql;
      const getBugsCountQuery = db.format(getBugsCountSql, data);

      const countRows = await db.query(getBugsCountQuery);
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
      element: "bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};

const mapQueryToObject = (bug: {
  id: string;
  severityID: string;
  severity: string;
  statusID: string;
  status: string;
  campaignTITLE: string;
  campaign: string;
  title: string;
}) => {
  return {
    id: bug.id,
    severity: {
      id: bug.severityID,
      name: bug.severity,
    },
    status: {
      id: bug.statusID,
      name: bug.status,
    },
    campaign: {
      id: bug.campaign,
      name: bug.campaignTITLE,
    },
    title: bug.title,
  };
};
