/** OPENAPI-ROUTE: get-employments */

import * as db from "@src/features/db";
import { Context } from "openapi-backend";

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
      element: "languages",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
