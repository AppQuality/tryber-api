import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-education */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const SELECT = `SELECT *`;
    const FROM = ` FROM wp_appq_education`;
    const rows = await db.query(`
        ${SELECT}
        ${FROM}
    `);
    if (!rows.length) throw Error("No education levels");

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
      element: "education",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
