/** OPENAPI-CLASS: patch-users-me */

import * as db from "@src/features/db";
import { CheckPassword, HashPassword } from "wordpress-hash-node";
import escapeCharacters from "../../../../features/escapeCharacters";
import UserData from "../../../../features/class/UserData";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";

const acceptedFields = [
  "name" as const,
  "surname" as const,
  "onboarding_completed" as const,
  "email" as const,
  "gender" as const,
  "birthDate" as const,
  "phone" as const,
  "education" as const,
  "profession" as const,
  "country" as const,
  "city" as const,
  "password" as const,
  "oldPassword" as const,
];
type AcceptableValues = typeof acceptedFields[number];

export default class PatchUsersMe extends UserRoute<{
  response: StoplightOperations["patch-users-me"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["patch-users-me"]["requestBody"]["content"]["application/json"];
}> {
  private validFields: StoplightOperations["patch-users-me"]["requestBody"]["content"]["application/json"] =
    {};

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "patch-users-me" });
    this.setValidFields();
  }

  private setValidFields() {
    const body = this.getBody();
    if (!body) throw Error("No body");

    this.validFields = (Object.keys(body) as AcceptableValues[])
      .filter((key) => acceptedFields.includes(key))
      .reduce(
        (
          obj: { [key: AcceptableValues[number]]: string },
          key: AcceptableValues
        ) => {
          obj[key] = body[key] as string;
          return obj as { [key: AcceptableValues[number]]: string };
        },
        {}
      );
  }
  protected async prepare() {
    const profileSets = [];
    const profileUpdateData = [];
    const wpDataSets = [];
    const wpDataUpdateData = [];

    if (this.validFields.email) {
      try {
        const emailAlreadyExists = await db.query(
          db.format(
            `SELECT user_email FROM wp_users WHERE user_email = ? AND ID != ?`,
            [this.validFields.email, this.getWordpressId()]
          )
        );

        if (emailAlreadyExists.length) {
          this.setError(
            412,
            new OpenapiError(`Email ${this.validFields.email} already exists`)
          );
          return;
        }
      } catch (e) {
        const err = e as OpenapiError;
        if (err.status_code === 412) throw e;
        throw Error("Error while trying to check email");
      }
      profileSets.push("email = ?");
      profileUpdateData.push(this.validFields.email);
      profileSets.push("is_verified = 0");
      wpDataSets.push("user_email = ?");
      wpDataUpdateData.push(this.validFields.email);
    }
    if (this.validFields.name) {
      if (this.nameIsValid(this.validFields.name) === false) {
        this.setError(400, new OpenapiError(`Name is not valid`));
        return;
      }
      profileSets.push("name = ?");
      profileUpdateData.push(escapeCharacters(this.validFields.name));
    }
    if (this.validFields.surname) {
      if (this.nameIsValid(this.validFields.surname) === false) {
        this.setError(400, new OpenapiError(`Surname is not valid`));
        return;
      }
      profileSets.push("surname = ?");
      profileUpdateData.push(escapeCharacters(this.validFields.surname));
    }
    if (this.validFields.onboarding_completed) {
      profileSets.push("onboarding_complete = ?");
      profileUpdateData.push(1);
    }
    if (this.validFields.gender) {
      profileSets.push("sex = ?");
      profileUpdateData.push(
        this.validFields.gender === "other"
          ? 2
          : this.validFields.gender === "male"
          ? 1
          : this.validFields.gender === "female"
          ? 0
          : -1
      );
    }
    if (this.validFields.birthDate) {
      profileSets.push("birth_date = ?");
      const d = new Date(this.validFields.birthDate);
      profileUpdateData.push(d.toISOString().split(".")[0].replace("T", " "));
    }
    if (this.validFields.phone) {
      profileSets.push("phone_number = ?");
      profileUpdateData.push(this.validFields.phone);
    }
    if (this.validFields.education) {
      profileSets.push("education_id = ?");
      profileUpdateData.push(this.validFields.education);
    }
    if (this.validFields.profession) {
      profileSets.push("employment_id = ?");
      profileUpdateData.push(this.validFields.profession);
    }
    if (this.validFields.country) {
      profileSets.push("country = ?");
      profileUpdateData.push(escapeCharacters(this.validFields.country));
    }
    if (this.validFields.city) {
      profileSets.push("city = ?");
      profileUpdateData.push(escapeCharacters(this.validFields.city));
    }
    try {
      if (this.validFields.password) {
        if (!this.validFields.oldPassword) {
          throw Error("You need to specify your old password");
        }
        try {
          const oldPassword = await db.query(
            db.format(`SELECT user_pass FROM wp_users WHERE ID = ?`, [
              this.getWordpressId(),
            ])
          );
          if (!oldPassword.length) throw Error("Can't find your password");
          // eslint-disable-next-line new-cap
          const passwordMatches = CheckPassword(
            this.validFields.oldPassword,
            oldPassword[0].user_pass
          );
          if (!passwordMatches) {
            console.log("suca");
            this.setError(
              417,
              new OpenapiError("Your old password is not correct")
            );
            return;
          }
        } catch (e) {
          throw e;
        }

        wpDataSets.push("user_pass = ?");
        // eslint-disable-next-line new-cap
        const hash = HashPassword(this.validFields.password);
        wpDataUpdateData.push(hash);
      }

      if (profileSets.length) {
        try {
          let profileSql = `UPDATE wp_appq_evd_profile
                  SET ${profileSets.join(",")}
                  WHERE id = ${this.getTesterId()};`;
          const profileData = await db.query(
            db.format(profileSql, [...profileUpdateData])
          );
          const update = await profileData;
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
            db.format(wpSql, [...wpDataUpdateData, this.getWordpressId()])
          );
        } catch (e) {
          console.log(e);
          throw Error(
            `Failed to update${this.validFields.password ? " password" : ""}${
              this.validFields.email ? " email" : ""
            }`
          );
        }
      }

      const userFields = [
        "email",
        "is_verified",
        "name",
        "surname",
        "username",
        "wp_user_id",
        "additional",
        "all",
        "approved_bugs",
        "attended_cp",
        "birthDate",
        "booty",
        "booty_threshold",
        "certifications",
        "city",
        "country",
        "education",
        "gender",
        "image",
        "languages",
        "onboarding_completed",
        "pending_booty",
        "phone",
        "profession",
        "rank",
        "role",
        "total_exp_pts",
      ];
      const user = new UserData(this.getTesterId(), userFields);

      this.setSuccess(200, {
        ...(await user.getData()),
        role: this.configuration.request.user.role,
      });
    } catch (err) {
      console.log(this.configuration.response.status_code);
      this.setError(
        400,
        new OpenapiError((err as { message: string }).message)
      );
    }
  }
  protected nameIsValid(name: string) {
    return escapeCharacters(name) !== "";
  }
}
