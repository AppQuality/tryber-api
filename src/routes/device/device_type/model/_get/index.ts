/** OPENAPI-ROUTE: get-devices-devices-type-model */
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

    let sql = `SELECT id,
                      manufacturer,
                      model
               FROM wp_dc_appq_devices`;
    let where = "device_type = ? ";
    let queryData = [];
    queryData.push(device_type);

    let acceptedFilters = ["manufacturer", "model"].filter((f) =>
      Object.keys(filter).includes(f)
    );

    if (acceptedFilters.length && filter) {
      filter;
      acceptedFilters = acceptedFilters.map((k) => {
        const filterItem = filter[k];
        if (typeof filterItem === "string") {
          queryData.push(filter[k]);
          return `${k}=?`;
        }
        const orQuery = filterItem
          .map((el) => {
            queryData.push(el);
            return `${k}=?`;
          })
          .join(" OR ");
        return ` ( ${orQuery} ) `;
      });
      where += " AND " + Object.values(acceptedFilters).join(" AND ");
    }

    sql += " WHERE " + where + " ORDER BY  manufacturer ASC, model ASC";
    sql = db.format(sql, queryData);
    const results = await db.query(sql);

    if (!results.length) throw Error("Error on finding devices");

    const models: {
      manufacturer: string;
      models: { id: string; name: string }[];
    }[] = [];
    results.forEach(
      (r: { manufacturer: string; id: string; model: string }) => {
        let currentModel = models.findIndex(
          (m) => m.manufacturer === r.manufacturer
        );
        if (currentModel === -1) {
          models.push({
            manufacturer: r.manufacturer,
            models: [],
          });
          currentModel = models.length - 1;
        }
        models[currentModel].models.push({
          id: r.id,
          name: r.model,
        });
      }
    );

    res.status_code = 200;
    return models;
  } catch (error) {
    res.status_code = 404;
    return {
      element: "devices",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
