/** OPENAPI-ROUTE: get-devices-os-versions */
import { Context } from "openapi-backend";

import * as db from "../../../../../features/db";

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

    let sql = `SELECT id, CONCAT(display_name, ' (', version_number, ')') as name FROM wp_appq_os `;

    let subQuery = `SELECT DISTINCT id FROM wp_appq_evd_platform `;
    let subWhere = ` form_factor=? `;
    let subQueryData: (string | number)[] = [device_type];

    let acceptedFilters = ["platform"].filter((f) =>
      Object.keys(filter).includes(f)
    );

    if (acceptedFilters.length && filter) {
      acceptedFilters = acceptedFilters.map((k) => {
        const key = k === "platform" ? "name" : k;
        const filterItem = filter[k];
        if (typeof filterItem === "string") {
          subQueryData.push(filterItem);
          return `${key}=?`;
        }
        const orQuery = filterItem
          .map((el) => {
            subQueryData.push(el);
            return `${key}=?`;
          })
          .join(" OR ");
        return ` ( ${orQuery} ) `;
      });
      subWhere += " AND " + Object.values(acceptedFilters).join(" AND ");
    }

    subQuery += ` WHERE ${subWhere}`;
    sql += ` WHERE platform_id IN (${subQuery}) ORDER BY version_family DESC, version_number DESC`;
    sql = db.format(sql, subQueryData);
    const results = await db.query(sql);

    if (!results.length) throw Error("Error on finding versions");

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
