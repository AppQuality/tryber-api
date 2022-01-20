/** OPENAPI-ROUTE: post-users-me-certifications */
import { Context } from 'openapi-backend';

import * as db from '../../../../../features/db';
import updateEmptyCerts from './updateEmptyCerts';

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
      try {
        let certificationSql = `SELECT name, area, institute
                                      FROM wp_appq_certifications_list
                                      WHERE id = ?;`;
        certification = await db.query(
          db.format(certificationSql, [req.body.certification_id])
        );
        if (!certification.length) {
          throw Error(
            `Can't find certification with id ${req.body.certification_id}`
          );
        }
        certification = { ...certification[0], id: req.body.certification_id };
      } catch (e) {
        throw e;
      }
    }

    let insertData = [
      req.user.testerId,
      req.body.achievement_date,
      req.body.certification_id,
    ];
    let insertSql = `INSERT INTO wp_appq_profile_certifications (tester_id, achievement_date, cert_id)
                       VALUES (?, ?, ?);`;
    let inserted;
    try {
      inserted = await db.query(db.format(insertSql, insertData));
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      if (
        (e as MySqlError).hasOwnProperty("code") &&
        (e as MySqlError).code == "ER_DUP_ENTRY"
      ) {
        throw Error(
          "Failed. Duplication entry. Certification already assigned to the tester."
        );
      }
      throw Error("Failed to add user Certification");
    }

    let userCertification;
    try {
      userCertification = await db.query(
        db.format(
          `SELECT CAST(achievement_date AS CHAR) AS achievement_date
                   FROM wp_appq_profile_certifications
                   WHERE id = ?;`,
          [inserted.insertId]
        )
      );
      if (!userCertification.length)
        throw Error("Can't find user Certification");
      userCertification = userCertification[0];
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      throw Error("Error on finding user Certification");
    }
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
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
