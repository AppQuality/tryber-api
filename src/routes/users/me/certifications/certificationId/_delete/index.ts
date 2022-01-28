import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: delete-users-me-certifications-certificationId */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const certificationId = Array.isArray(c.request.params.certificationId)
      ? c.request.params.certificationId.join(",")
      : c.request.params.certificationId;
    let existsCertQuery = `SELECT id FROM wp_appq_profile_certifications WHERE cert_id=? AND tester_id=?;`;
    let existsCert = await db.query(
      db.format(existsCertQuery, [certificationId, req.user.testerId])
    );
    if (!existsCert.length) {
      throw {
        status_code: 404,
        message: "This tester has not this Certification.",
      };
    }

    let deleteSql = `DELETE FROM wp_appq_profile_certifications WHERE cert_id=? AND tester_id=?;`;
    let deleted;
    try {
      deleted = await db.query(
        db.format(deleteSql, [certificationId, req.user.testerId])
      );
      res.status_code = 200;
      return { message: "Certification successfully removed" };
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error("Failed to remove user Certification");
    }
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "certifications",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
