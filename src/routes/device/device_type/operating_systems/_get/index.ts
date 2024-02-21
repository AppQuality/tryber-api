import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-devices-operating-systems */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let device_type = 1;
    if (typeof c.request.params.device_type == "string") {
      device_type = parseInt(c.request.params.device_type);
    }
    const filter =
      req.query && req.query.filterBy
        ? (req.query.filterBy as { [key: string]: string | string[] })
        : false;

    let fallbackSql = `SELECT DISTINCT id, name FROM wp_appq_evd_platform WHERE form_factor = ?`;
    fallbackSql = db.format(fallbackSql, [device_type]);
    let sql = `SELECT DISTINCT id, name FROM wp_appq_evd_platform `;
    let subQuery = `SELECT DISTINCT platform_id 
      FROM wp_dc_appq_devices
      `;
    let subWhere = ` device_type=? `;
    let subQueryData: (string | number)[] = [device_type];

    let acceptedFilters = ["manufacturer", "model"].filter((f) =>
      Object.keys(filter).includes(f)
    );

    if (acceptedFilters.length && filter) {
      acceptedFilters = acceptedFilters.map((k) => {
        const filterItem = filter[k];
        if (typeof filterItem === "string") {
          subQueryData.push(filterItem);
          return `${k}=?`;
        }
        const orQuery = filterItem
          .map((el) => {
            subQueryData.push(el);
            return `${k}=?`;
          })
          .join(" OR ");
        return ` ( ${orQuery} ) `;
      });
      subWhere += " AND " + Object.values(acceptedFilters).join(" AND ");
    }

    subQuery += ` WHERE ${subWhere}`;
    sql += ` WHERE id IN (${subQuery})`;
    sql = db.format(sql, subQueryData);

    const results = await db.query(sql);

    if (!results.length) {
      const fallbackResults = await db.query(fallbackSql);
      if (!fallbackResults.length) throw Error("Error on finding devices");
      res.status_code = 200;
      return fallbackResults.map((row: { id: string; name: string }) => {
        return {
          id: row.id,
          name: row.name,
        };
      });
    }

    res.status_code = 200;
    return results.map((row: { id: string; name: string }) => {
      return {
        id: row.id,
        name: row.name,
      };
    });
  } catch (error) {
    res.status_code = 404;
    return {
      element: "devices",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
