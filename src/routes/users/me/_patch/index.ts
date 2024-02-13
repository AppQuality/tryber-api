/** OPENAPI-CLASS: patch-users-me */

import { CheckPassword, HashPassword } from "wordpress-hash-node";
import escapeCharacters from "../../../../features/escapeCharacters";
import UserData from "../../../../features/class/UserData";
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";

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
    let profileDataCounter = 0;
    let profileUpdate = tryber.tables.WpAppqEvdProfile.do().where({
      id: this.getTesterId(),
    });
    let wpDataCounter = 0;
    let wpUserUpdate = tryber.tables.WpUsers.do().where({
      ID: this.getWordpressId(),
    });

    if (this.validFields.email) {
      try {
        const emailAlreadyExists = await tryber.tables.WpUsers.do()
          .select("user_email")
          .where({
            user_email: this.validFields.email,
          })
          .andWhereNot("ID", this.getWordpressId());

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
      profileUpdate = profileUpdate
        .update({ email: this.validFields.email })
        .update({ is_verified: 0 });
      profileDataCounter++;

      wpUserUpdate = wpUserUpdate.update({
        user_email: this.validFields.email,
      });
      wpDataCounter++;
    }
    if (this.validFields.name) {
      if (this.nameIsValid(this.validFields.name) === false) {
        this.setError(400, new OpenapiError(`Name is not valid`));
        return;
      }
      profileUpdate = profileUpdate.update({
        name: escapeCharacters(this.validFields.name),
      });
      profileDataCounter++;
    }
    if (this.validFields.surname) {
      if (this.nameIsValid(this.validFields.surname) === false) {
        this.setError(400, new OpenapiError(`Surname is not valid`));
        return;
      }
      profileUpdate = profileUpdate.update({
        surname: escapeCharacters(this.validFields.surname),
      });
      profileDataCounter++;
    }
    if (this.validFields.onboarding_completed) {
      profileUpdate = profileUpdate.update({ onboarding_complete: 1 });
      profileDataCounter++;
    }
    if (this.validFields.gender) {
      profileUpdate = profileUpdate.update({
        sex:
          this.validFields.gender === "other"
            ? 2
            : this.validFields.gender === "male"
            ? 1
            : this.validFields.gender === "female"
            ? 0
            : -1,
      });
      profileDataCounter++;
    }
    if (this.validFields.birthDate) {
      const d = new Date(this.validFields.birthDate);
      profileUpdate = profileUpdate.update({
        birth_date: d.toISOString().split(".")[0].replace("T", " "),
      });
      profileDataCounter++;
    }
    if (this.validFields.phone) {
      profileUpdate = profileUpdate.update({
        phone_number: this.validFields.phone,
      });
      profileDataCounter++;
    }
    if (this.validFields.education) {
      profileUpdate = profileUpdate.update({
        education_id: this.validFields.education,
      });
      profileDataCounter++;
    }
    if (this.validFields.profession) {
      profileUpdate = profileUpdate.update({
        employment_id: this.validFields.profession,
      });
      profileDataCounter++;
    }
    if (this.validFields.country) {
      profileUpdate = profileUpdate.update({
        country: escapeCharacters(this.validFields.country),
      });
      profileDataCounter++;
    }
    if (this.validFields.city) {
      profileUpdate = profileUpdate.update({
        city: escapeCharacters(this.validFields.city),
      });
      profileDataCounter++;
    }
    try {
      if (this.validFields.password) {
        if (!this.validFields.oldPassword) {
          throw Error("You need to specify your old password");
        }
        try {
          const oldPassword = await tryber.tables.WpUsers.do()
            .select("user_pass")
            .where({ ID: this.getWordpressId() })
            .first();
          if (!oldPassword) throw Error("Can't find your password");
          const passwordMatches = CheckPassword(
            this.validFields.oldPassword,
            oldPassword.user_pass
          );
          if (!passwordMatches) {
            this.setError(
              417,
              new OpenapiError("Your old password is not correct")
            );
            return;
          }
        } catch (e) {
          throw e;
        }

        const hash = HashPassword(this.validFields.password);
        wpUserUpdate = wpUserUpdate.update({ user_pass: hash });
        wpDataCounter++;
      }

      if (profileDataCounter > 0) {
        try {
          const update = await profileUpdate;
        } catch (e) {
          console.log(e);
          throw Error("Failed to update profile");
        }
      }

      if (wpDataCounter > 0) {
        try {
          const update = await wpUserUpdate;
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
