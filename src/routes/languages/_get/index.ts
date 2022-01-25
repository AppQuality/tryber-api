/** OPENAPI-ROUTE: get-languages */
import { Context } from "openapi-backend";

import * as db from "../../../features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const SELECT = `SELECT *`;
    const FROM = ` FROM wp_appq_employment`;
    const rows = await db.query(`
        ${SELECT}
        ${FROM}
    `);
    if (!rows.length) throw Error("No employments");

    res.status_code = 200;

    return rows.map((row: { id: string; display_name: string }) => ({
      id: row.id,
      name: row.display_name,
    }));
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }

    res.status_code = 404;
    return {
      element: "employments",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
