/** OPENAPI-ROUTE:post-users-me-fiscal */
import { Context } from "openapi-backend";
import * as db from "../../../../../features/db";
import checkCodiceFiscale from "../checkCodiceFiscale";
import getActiveProfile from "../getActiveProfile";
import getByUser from "../getByUser";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let fiscal;
    try {
      fiscal = await getActiveProfile(req.user.testerId);
      return Promise.reject({
        status_code: 406,
        message: "There is already a fiscal profile",
      });
    } catch (e) {}

    let tester = await db.query(
      db.format(
        `SELECT name,surname,COALESCE(CAST(birth_date as CHAR),"1970-01-01 00:00:00") as birth_date
FROM wp_appq_evd_profile 
WHERE id = ?`,
        [req.user.testerId]
      )
    );
    tester = tester[0];
    if (!tester.birth_date) {
      tester.birth_date = "";
    }
    const fiscalTypes = {
      withholding: 1,
      "witholding-extra": 2,
      other: 3,
      "non-italian": 4,
    };

    let isVerified = 1;
    if (
      [1, 2].includes(fiscalTypes[req.body.type as keyof typeof fiscalTypes])
    ) {
      isVerified = (await checkCodiceFiscale(req.body.fiscalId, {
        name: tester.name,
        surname: tester.surname,
        gender: req.body.gender === "male" ? "M" : "F",
        birthday: {
          day: parseInt(tester.birth_date.substring(0, 10).split("-")[2]),
          month: parseInt(tester.birth_date.substring(0, 10).split("-")[1]),
          year: parseInt(tester.birth_date.substring(0, 10).split("-")[0]),
        },
        birthplace: req.body.birthPlace.city,
        birthplaceProvincia: req.body.birthPlace.province,
      }))
        ? 1
        : 0;
    }

    const updateData = {
      is_active: 1,
      name: tester.name,
      surname: tester.surname,
      birth_date: tester.birth_date,
      tester_id: req.user.testerId,
      country: req.body.address.country,
      province: req.body.address.province,
      city: req.body.address.city,
      address: req.body.address.street,
      address_number: req.body.address.streetNumber,
      postal_code: req.body.address.cityCode,
      fiscal_category: fiscalTypes[req.body.type as keyof typeof fiscalTypes],
      birth_city: req.body.birthPlace.city,
      birth_province: req.body.birthPlace.province,
      fiscal_id: req.body.fiscalId,
      sex: req.body.gender == "female" ? 0 : 1,
      is_verified: isVerified,
    };

    const insertSql = `INSERT INTO wp_appq_fiscal_profile 
      (${Object.keys(updateData).join(",")}) 
      VALUES (${Object.keys(updateData)
        .map((a) => "?")
        .join(",")})`;

    await db.query(db.format(insertSql, Object.values(updateData)));

    res.status_code = 200;
    return getByUser(req.user.testerId);
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 500;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
