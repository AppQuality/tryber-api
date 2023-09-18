/** OPENAPI-ROUTE: post-users-me-certifications */

import { tryber } from "@src/features/database";
import * as db from "@src/features/db";
import { Context } from "openapi-backend";
import updateEmptyCerts from "./updateEmptyCerts";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let certification;
    if (req.body.hasOwnProperty("certifications") && !req.body.certifications) {
      //delete all certifications
      let deleteAllSql =
        "DELETE FROM wp_appq_profile_certifications WHERE tester_id = ?;";
      try {
        let deleted = await db.query(
          db.format(deleteAllSql, [req.user.testerId])
        );
      } catch (e) {
        if (process.env && process.env.DEBUG) console.log(e);
        throw Error("Failed to delete user Certifications");
      }
      //check if extist usermeta row with emptyCert is true
      try {
        await updateEmptyCerts(req.user.ID, "true");
      } catch (e) {
        throw e;
      }

      return {
        message: `Operation completed`,
      };
    } else {
      certification = await getCertification(req.body.certification_id);
    }

    let inserted = await assignCertification(
      req.user.testerId,
      req.body.certification_id,
      req.body.achievement_date
    );

    let userCertification = await getUserCertification(inserted);

    try {
      await updateEmptyCerts(req.user.ID, "false");
      res.status_code = 201;
      return {
        ...certification,
        achievement_date: userCertification.achievement_date.substr(0, 10),
      };
    } catch (e) {
      throw e;
    }
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "certifications",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};

async function getCertification(certification_id: number) {
  let certification;
  let certificationSql = `SELECT name, area, institute
                                  FROM wp_appq_certifications_list
                                  WHERE id = ?;`;
  certification = await db.query(
    db.format(certificationSql, [certification_id])
  );
  if (!certification.length) {
    throw Error(`Can't find certification with id ${certification_id}`);
  }
  return { ...certification[0], id: certification_id };
}

async function assignCertification(
  tester_id: number,
  certification_id: number,
  achievement_date: string
) {
  const alreadyExists = await tryber.tables.WpAppqProfileCertifications.do()
    .select("id")
    .where({
      tester_id: tester_id,
      cert_id: certification_id,
    });
  if (alreadyExists.length) {
    throw Error(
      "Failed. Duplication entry. Certification already assigned to the tester."
    );
  }
  try {
    const res = await tryber.tables.WpAppqProfileCertifications.do()
      .insert({
        tester_id: tester_id,
        cert_id: certification_id,
        achievement_date: achievement_date,
      })
      .returning("id");
    return { insertId: res[0].id ?? res[0] };
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    throw Error("Failed to add user Certification");
  }
}
async function getUserCertification(inserted: { insertId: number }) {
  try {
    const userCertification =
      await tryber.tables.WpAppqProfileCertifications.do()
        .select("achievement_date", "achievement_date")
        .where("id", inserted.insertId);
    if (!userCertification.length) throw Error("Can't find user Certification");
    return userCertification[0];
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    throw Error("Error on finding user Certification");
  }
}
