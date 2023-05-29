/** OPENAPI-ROUTE: get-employments */

import { tryber } from "@src/features/database";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const rows = await tryber.tables.WpAppqEmployment.do().select(
      "id",
      tryber.ref("display_name").withSchema("wp_appq_employment").as("name")
    );

    if (!rows.length) throw Error("No employments");

    res.status_code = 200;

    return rows;
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
