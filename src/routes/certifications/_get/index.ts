/** OPENAPI-ROUTE: get-certifications */

import * as db from "@src/features/db";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const SELECT = `SELECT *`;
    const FROM = ` FROM wp_appq_certifications_list`;
    let WHERE = ``;
    let queryData: string[] = [];

    const filter = req.query.filterBy as { [key: string]: string | string[] };

    if (filter) {
      let acceptedFilters = ["area", "institute"].filter((f) =>
        Object.keys(filter).includes(f)
      );
      //check filter
      if (acceptedFilters.length) {
        acceptedFilters = acceptedFilters.map((k) => {
          const v = filter[k];
          if (typeof v === "string") {
            queryData.push(v);
            return `${k}=?`;
          }
          const orQuery = v
            .map((el: string) => {
              queryData.push(el);
              return `${k}=?`;
            })
            .join(" OR ");
          return ` ( ${orQuery} ) `;
        });
        WHERE += " WHERE " + Object.values(acceptedFilters).join(" AND ");
      }
    }
    const rows = await db.query(
      db.format(
        `
        ${SELECT} ${FROM} ${WHERE}`,
        queryData
      )
    );
    if (!rows.length) throw Error("No certifications");

    res.status_code = 200;

    return rows.map(
      (row: { id: string; name: string; area: string; institute: string }) => ({
        id: row.id,
        name: row.name,
        area: row.area,
        institute: row.institute,
      })
    );
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }

    res.status_code = 404;
    return {
      element: "certifications",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
