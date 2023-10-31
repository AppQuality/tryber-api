/** OPENAPI-CLASS: patch-users-me */

import * as db from "@src/features/db";
import { CheckPassword, HashPassword } from "wordpress-hash-node";
import escapeCharacters from "../../../../features/escapeCharacters";
import UserData from "../../UserData";
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
  private _fields: AcceptableValues[] | undefined = undefined;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "patch-users-me" });
    //this.setValidFields();
  }

  // private setValidFields() {
  //   const query = this.getQuery();
  //   const body = this.getBody();
  //   this._fields = basicFields;

  //   if (query && query.fields) {
  //     this._fields = query.fields
  //       .split(",")
  //       .filter((f) =>
  //         acceptedFields.includes(f as AcceptableValues)
  //       ) as AcceptableValues[];

  //     if (this._fields.includes("all")) {
  //       this._fields = acceptedFields.filter((f) => f !== "all");
  //     }
  //   }
  // }
  protected async prepare() {
    const body = this.getBody();
    if (!body) throw Error("No body");

    const validData = (Object.keys(body) as AcceptableValues[])
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
    const profileSets = [];
    const profileUpdateData = [];
    const wpDataSets = [];
    const wpDataUpdateData = [];

    if (Object.keys(validData).includes("email")) {
      try {
        const emailAlreadyExists = await db.query(
          db.format(
            `SELECT user_email FROM wp_users WHERE user_email = ? AND ID != ?`,
            [validData.email, this.getWordpressId()]
          )
        );

        if (emailAlreadyExists.length) {
          this.setError(
            412,
            new OpenapiError(`Email ${validData.email} already exists`)
          );
          return;
        }
      } catch (e) {
        const err = e as OpenapiError;
        if (err.status_code === 412) throw e;
        throw Error("Error while trying to check email");
      }
      profileSets.push("email = ?");
      profileUpdateData.push(validData.email);
      profileSets.push("is_verified = 0");
      wpDataSets.push("user_email = ?");
      wpDataUpdateData.push(validData.email);
    }
    if (Object.keys(validData).includes("name")) {
      if (this.nameIsValid(validData.name) === false) {
        this.setError(400, new OpenapiError(`Name is not valid`));
        return;
      }
      profileSets.push("name = ?");
      profileUpdateData.push(escapeCharacters(validData.name));
    }
    if (Object.keys(validData).includes("surname")) {
      if (this.nameIsValid(validData.surname) === false) {
        this.setError(400, new OpenapiError(`Surname is not valid`));
        return;
      }
      profileSets.push("surname = ?");
      profileUpdateData.push(escapeCharacters(validData.surname));
    }
    if (validData.onboarding_completed) {
      profileSets.push("onboarding_complete = ?");
      profileUpdateData.push(1);
    }
    if (Object.keys(validData).includes("gender")) {
      profileSets.push("sex = ?");
      profileUpdateData.push(
        validData.gender === "other"
          ? 2
          : validData.gender === "male"
          ? 1
          : validData.gender === "female"
          ? 0
          : -1
      );
    }
    if (Object.keys(validData).includes("birthDate")) {
      profileSets.push("birth_date = ?");
      const d = new Date(validData.birthDate);
      profileUpdateData.push(d.toISOString().split(".")[0].replace("T", " "));
    }
    if (Object.keys(validData).includes("phone")) {
      profileSets.push("phone_number = ?");
      profileUpdateData.push(validData.phone);
    }
    if (Object.keys(validData).includes("education")) {
      profileSets.push("education_id = ?");
      profileUpdateData.push(validData.education);
    }
    if (Object.keys(validData).includes("profession")) {
      profileSets.push("employment_id = ?");
      profileUpdateData.push(validData.profession);
    }
    if (Object.keys(validData).includes("country")) {
      profileSets.push("country = ?");
      profileUpdateData.push(escapeCharacters(validData.country));
    }
    if (Object.keys(validData).includes("city")) {
      profileSets.push("city = ?");
      profileUpdateData.push(escapeCharacters(validData.city));
    }
    try {
      if (Object.keys(validData).includes("password")) {
        if (!Object.keys(validData).includes("oldPassword")) {
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
            validData.oldPassword,
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
        const hash = HashPassword(validData.password);
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
            `Failed to update${
              Object.keys(validData).includes("password") ? " password" : ""
            }${Object.keys(validData).includes("email") ? " email" : ""}`
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
