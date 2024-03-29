/** OPENAPI-ROUTE: get-users-me-popups-popup */

import * as db from "@src/features/db";
import { Context } from "openapi-backend";
import getByUser from "../../../getByUser";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const popups = await getByUser(req.user.ID);
    const popupId =
      typeof c.request.params.popup === "string"
        ? parseInt(c.request.params.popup)
        : 0;
    const popup = popups.find((p) => p.id == popupId);
    if (!popup) throw Error("Invalid popup");

    await db.query(
      `INSERT 
          INTO wp_appq_popups_read_status (tester_id,popup_id) 
          VALUES ( 
             ${req.user.testerId},
             ${popupId}
           )`
    );
    res.status_code = 200;
    return popup;
  } catch (error) {
    res.status_code = 404;
    return {
      element: "popups",
      id: c.request.params.popupId,
      message: (error as OpenapiError).message,
    };
  }
};
