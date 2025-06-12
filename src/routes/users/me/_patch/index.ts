/** OPENAPI-ROUTE: patch-users-me */

import * as db from "@src/features/db";
import { CITIES_ATTRIBUTES } from "comuni-province-regioni/lib/city";
import { Context } from "openapi-backend";
import { CheckPassword, HashPassword } from "wordpress-hash-node";
import escapeCharacters from "../../../../features/escapeCharacters";
import getUserData from "../_get/getUserData";

const acceptedFields = [
  "name",
  "surname",
  "onboarding_completed",
  "email",
  "gender",
  "birthDate",
  "phone",
  "education",
  "profession",
  "country",
  "city",
  "password",
];

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const validData = Object.keys(req.body)
      .filter((key) => acceptedFields.includes(key))
      .reduce((obj: { [key: string]: string }, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const profileSets = [];
    const profileUpdateData = [];
    const wpDataSets = [];
    const wpDataUpdateData = [];

    if (Object.keys(req.body).includes("email")) {
      try {
        const emailAlreadyExists = await db.query(
          db.format(
            `SELECT user_email FROM wp_users WHERE user_email = ? AND ID != ?`,
            [req.body.email, req.user.ID]
          )
        );

        if (emailAlreadyExists.length)
          throw {
            status_code: 412,
            message: `Email ${req.body.email} already exists`,
          };
      } catch (e) {
        const err = e as OpenapiError;
        if (err.status_code === 412) throw e;
        throw Error("Error while trying to check email");
      }
      profileSets.push("email = ?");
      profileUpdateData.push(req.body.email);
      profileSets.push("is_verified = 0");
      wpDataSets.push("user_email = ?");
      wpDataUpdateData.push(req.body.email);
    }
    if (Object.keys(req.body).includes("name")) {
      if (nameIsValid(req.body.name) === false) {
        throw {
          status_code: 400,
          message: `Name is not valid`,
        };
      }
      profileSets.push("name = ?");
      profileUpdateData.push(escapeCharacters(req.body.name));
    }
    if (Object.keys(req.body).includes("surname")) {
      if (nameIsValid(req.body.surname) === false) {
        throw {
          status_code: 400,
          message: `Surname is not valid`,
        };
      }
      profileSets.push("surname = ?");
      profileUpdateData.push(escapeCharacters(req.body.surname));
    }
    if (req.body.onboarding_completed) {
      profileSets.push("onboarding_complete = ?");
      profileUpdateData.push(1);
    }
    if (Object.keys(req.body).includes("gender")) {
      profileSets.push("sex = ?");
      profileUpdateData.push(
        req.body.gender === "other"
          ? 2
          : req.body.gender === "male"
          ? 1
          : req.body.gender === "female"
          ? 0
          : -1
      );
    }
    if (Object.keys(req.body).includes("birthDate")) {
      profileSets.push("birth_date = ?");
      const d = new Date(req.body.birthDate);
      profileUpdateData.push(d.toISOString().split(".")[0].replace("T", " "));
    }
    if (Object.keys(req.body).includes("phone")) {
      profileSets.push("phone_number = ?");
      profileUpdateData.push(req.body.phone);
    }
    if (Object.keys(req.body).includes("education")) {
      profileSets.push("education_id = ?");
      profileUpdateData.push(req.body.education);
    }
    if (Object.keys(req.body).includes("profession")) {
      profileSets.push("employment_id = ?");
      profileUpdateData.push(req.body.profession);
    }
    if (Object.keys(req.body).includes("country")) {
      profileSets.push("country = ?");
      profileUpdateData.push(escapeCharacters(req.body.country));
    }
    if (Object.keys(req.body).includes("city")) {
      profileSets.push("city = ?");
      profileUpdateData.push(escapeCharacters(req.body.city));
      const cityAttributes = Object.values(CITIES_ATTRIBUTES).find(
        (c) =>
          req.body.city && c.name.toLowerCase() === req.body.city.toLowerCase()
      );
      if (cityAttributes) {
        profileSets.push("province = ?");
        profileUpdateData.push(cityAttributes.province);
      }
    }
    if (Object.keys(req.body).includes("password")) {
      if (!Object.keys(req.body).includes("oldPassword")) {
        throw Error("You need to specify your old password");
      }
      try {
        const oldPassword = await db.query(
          db.format(`SELECT user_pass FROM wp_users WHERE ID = ?`, [
            req.user.ID,
          ])
        );
        if (!oldPassword.length) throw Error("Can't find your password");
        // eslint-disable-next-line new-cap
        const passwordMatches = CheckPassword(
          req.body.oldPassword,
          oldPassword[0].user_pass
        );
        if (!passwordMatches)
          throw {
            status_code: 417,
            message: "Your old password is not correct",
          };
      } catch (e) {
        throw e;
      }

      wpDataSets.push("user_pass = ?");
      // eslint-disable-next-line new-cap
      const hash = HashPassword(req.body.password);
      wpDataUpdateData.push(hash);
    }

    if (profileSets.length) {
      try {
        let profileSql = `UPDATE wp_appq_evd_profile
                SET ${profileSets.join(",")}
                WHERE wp_user_id = ?;`;
        const profileData = await db.query(
          db.format(profileSql, [...profileUpdateData, req.user.ID])
        );
      } catch (e) {
        console.log(e);
        throw Error("Failed to update profile");
      }
    }

    if (wpDataSets.length) {
      try {
        let wpSql = `UPDATE wp_users
			SET ${wpDataSets.join(",")}
			WHERE ID = ?;`;
        const wpData = await db.query(
          db.format(wpSql, [...wpDataUpdateData, req.user.ID])
        );
      } catch (e) {
        console.log(e);
        throw Error(
          `Failed to update${
            Object.keys(req.body).includes("password") ? " password" : ""
          }${Object.keys(req.body).includes("email") ? " email" : ""}`
        );
      }
    }
    res.status_code = 200;
    return await getUserData(req.user.ID, ["all"]);
  } catch (err) {
    res.status_code = (err as OpenapiError).status_code || 400;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (err as OpenapiError).message,
    };
  }
  function nameIsValid(name: string) {
    return escapeCharacters(name) !== "";
  }
};
