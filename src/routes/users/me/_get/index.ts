/** OPENAPI-CLASS: get-users-me */

import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import { unserialize } from "php-unserialize";
import { gravatarUrl } from "avatar-initials";

type UserSelect = ReturnType<typeof tryber.tables.WpAppqEvdProfile.do>;
export default class RouteUsersMe extends UserRoute<{
  response: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me"]["parameters"]["query"];
}> {
  private fiscalCategory: number = 0;
  private queryFields: string[];
  private basicFields = [
    "name",
    "surname",
    "email",
    "is_verified",
    "username",
    "wp_user_id",
  ];
  private acceptedFields = [
    ...this.basicFields,
    "role",
    "gender",
    "phone",
    "birthDate",
    "total_exp_pts",
    "country",
    "city",
    "onboarding_completed",
    "image",
    "booty",

    "rank",
    "approved_bugs",
    "attended_cp",
    "booty_threshold",
    "pending_booty",
    "languages",
    "additional",
    "education",
    "profession",
    "certifications",
    "completionPercent",
  ];
  private isComplete = false;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    if (query?.fields && query.fields.includes("all")) {
      this.queryFields = this.acceptedFields;
      this.isComplete = true;
    } else if (query === undefined || query?.fields === undefined) {
      this.queryFields = this.basicFields;
    } else {
      this.queryFields = query?.fields
        ? query.fields.split(",").filter((f) => this.acceptedFields.includes(f))
        : [];
    }
    if (this.queryFields.length === 0) {
      this.queryFields = ["id", "role"];
    }
  }

  protected async prepare(): Promise<void> {
    try {
      this.fiscalCategory = await this.getFiscalCategory();
    } catch (e) {}
    try {
      await this.updateLastActivity();
    } catch (e) {}

    try {
      let user = await this.getUserData();
      user.role = this.configuration.request.user
        ? this.configuration.request.user.role
        : "tester";
      return this.setSuccess(200, user);
    } catch (e) {
      this.setError(404, new OpenapiError("Error on finding User"));

      throw new Error("Error on finding User");
    }
  }

  private async updateLastActivity() {
    try {
      await tryber.tables.WpAppqEvdProfile.do()
        .update({
          last_activity: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
        })
        .where({
          id: this.getTesterId(),
        });
    } catch (e) {
      throw new Error("Error on update last activity");
    }
  }
  private async getUserData() {
    let data: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"] =
      { id: this.getTesterId(), role: this.configuration.request.user.role };

    try {
      data = { ...data, ...(await this.getProfileData()) };
    } catch (e) {
      console.log("Error:", e);
      this.setError(404, new OpenapiError("Error on finding Profile data"));
    }
    if (this.queryFields.includes("booty")) {
      try {
        data = { ...data, ...(await this.getBootyData()) };
      } catch (e) {
        console.log(e);
        this.setError(404, new OpenapiError("Error on finding Booty data"));
      }
    }
    if (this.queryFields.includes("pending_booty")) {
      try {
        data = { ...data, ...(await this.getPendingBootyData()) };
      } catch (e) {
        console.log(e);
        this.setError(
          404,
          new OpenapiError("Error on finding Pending Booty data")
        );
      }
    }
    if (this.queryFields.includes("booty_threshold")) {
      try {
        data = { ...data, ...(await this.evaluateBootyThreshold()) };
      } catch (e) {
        console.log(e);
        this.setError(
          404,
          new OpenapiError("Error on finding Booty Threshold data")
        );
      }
    }
    if (this.queryFields.includes("certifications")) {
      try {
        data = { ...data, ...(await this.getCertificationsData()) };
      } catch (e) {
        console.log(e);
        this.setError(
          404,
          new OpenapiError("Error on finding Certifications data")
        );
      }
    }

    if (this.queryFields.includes("languages")) {
      try {
        data = { ...data, ...(await this.getLanguagesData()) };
      } catch (e) {
        console.log(e);
        this.setError(404, new OpenapiError("Error on finding Languages data"));
      }
    }

    // if (this.queryFields.includes("rank")) {
    //   try {
    //     data = { ...data, rank: "0" };
    //   } catch (e) {}
    // }

    // if (this.queryFields.includes("approved_bugs")) {
    //   try {
    //     data = { ...data, ...(await getApprovedBugsData(id)) };
    //   } catch {}
    // }

    // if (this.queryFields.includes("attended_cp")) {
    //   try {
    //     data = { ...data, ...(await getAttendedCpData(id)) };
    //   } catch {}
    // }

    // if (this.queryFields.includes("profession")) {
    //   try {
    //     data = { ...data, ...(await getProfessionData(id)) };
    //   } catch {}
    // }

    // if (this.queryFields.includes("education")) {
    //   try {
    //     data = { ...data, ...(await getEducationData(id)) };
    //   } catch {}
    // }

    // if (this.queryFields.includes("additional")) {
    //   try {
    //     data = { ...data, ...(await getAdditionalData(id)) };
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }

    if (!Object.keys(data).length) throw Error("Invalid data");

    Object.keys(data).forEach((k) => {
      if (data[k as keyof typeof data] === null)
        delete data[k as keyof typeof data];
    });

    if (this.isComplete && this.queryFields) {
      data = {
        ...data,
        completionPercent:
          (100 * (Object.keys(data).length + 1)) / this.queryFields.length,
      };
    }
    return data;
  }
  private async getProfileData() {
    let query = tryber.tables.WpAppqEvdProfile.do();

    this.addIdTo(query); //id and role are always added
    this.addNameTo(query);
    this.addSurnameTo(query);
    this.addEmailTo(query);
    this.addWordpressIdTo(query);
    this.addIsVerifiedTo(query);
    this.addUsernameTo(query);
    this.addGenderTo(query);
    this.addPhoneNumberTo(query);
    this.addBirthDateTo(query);
    this.addOnboardingStatusTo(query);
    this.addTotalExpPtsTo(query);
    this.addCountryTo(query);
    this.addCityTo(query);

    query
      .select()
      .join("wp_users", "wp_users.ID", "wp_appq_evd_profile.wp_user_id")
      .where("wp_appq_evd_profile.id", this.getTesterId());

    const user = await query;
    if (!user.length) throw Error("User not found");
    let res = user[0] as {
      name?: string;
      surname?: string;
      email?: string;
      wp_user_id?: number;
      username?: string;
      is_verified?: number;
      sex?: number;
      birthDate?: string;
      total_exp_pts?: number;
      country?: string;
      city?: string;
      image?: string;
      onboarding_complete?: number;
      phone_number?: string;
    };
    if (this.queryFields.includes("image")) {
      res.image = this.evaluateImage(
        user[0].name,
        user[0].surname,
        user[0].email
      );
      // when fields contains "image" to evaluate gravatar need name, surname and email also
      // in that case we add name, surname and email to the query
      // but we don't want to return name, surname and email if they are not requested
      // so we delete them from the user object
      if (!this.queryFields.includes("name")) delete res.name;
      if (!this.queryFields.includes("surname")) delete res.surname;
      if (!this.queryFields.includes("email")) delete res.email;
    }

    return {
      name: res.name,
      surname: res.surname,
      email: res.email,
      wp_user_id: res.wp_user_id,
      is_verified:
        res.is_verified !== undefined
          ? res.is_verified
            ? true
            : false
          : undefined,
      username: res.username,
      gender: res.sex ? this.evaluateGender(res.sex) : undefined,
      phone: res.phone_number,
      birthDate: res.birthDate,
      total_exp_pts: res.total_exp_pts,
      country: res.country,
      city: res.city,
      onboarding_completed:
        res.onboarding_complete !== undefined
          ? res.onboarding_complete
            ? true
            : false
          : undefined,
      image: res.image,
    };
  }
  private addIdTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("id")) {
        query.select(tryber.ref("id").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addNameTo(query: UserSelect) {
    query.modify((query) => {
      if (
        this.queryFields.includes("name") ||
        this.queryFields.includes("image")
      ) {
        query.select(tryber.ref("name").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addSurnameTo(query: UserSelect) {
    query.modify((query) => {
      if (
        this.queryFields.includes("surname") ||
        this.queryFields.includes("image")
      ) {
        query.select(tryber.ref("surname").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addEmailTo(query: UserSelect) {
    query.modify((query) => {
      if (
        this.queryFields.includes("email") ||
        this.queryFields.includes("image")
      ) {
        query.select(tryber.ref("email").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addWordpressIdTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("wp_user_id")) {
        query.select(
          tryber.ref("wp_user_id").withSchema("wp_appq_evd_profile")
        );
      }
    });
  }
  private addIsVerifiedTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("is_verified")) {
        query.select(
          tryber.ref("is_verified").withSchema("wp_appq_evd_profile")
        );
      }
    });
  }
  private addUsernameTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("username")) {
        query.select(
          tryber.ref("user_login").withSchema("wp_users").as("username")
        );
      }
    });
  }
  private addGenderTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("gender")) {
        query.select(tryber.ref("sex").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addPhoneNumberTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("phone")) {
        query.select(
          tryber.ref("phone_number").withSchema("wp_appq_evd_profile")
        );
      }
    });
  }
  private addBirthDateTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("birthDate")) {
        query.select(tryber.raw("CAST(birth_date AS CHAR) as birthDate"));
      }
    });
  }
  private addOnboardingStatusTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("onboarding_completed")) {
        query.select(
          tryber.ref("onboarding_complete").withSchema("wp_appq_evd_profile")
        );
      }
    });
  }
  private addTotalExpPtsTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("total_exp_pts")) {
        query.select(
          tryber.ref("total_exp_pts").withSchema("wp_appq_evd_profile")
        );
      }
    });
  }
  private addCountryTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("country")) {
        query.select(tryber.ref("country").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private addCityTo(query: UserSelect) {
    query.modify((query) => {
      if (this.queryFields.includes("city")) {
        query.select(tryber.ref("city").withSchema("wp_appq_evd_profile"));
      }
    });
  }
  private evaluateGender(sex: number) {
    return sex == 0
      ? ("female" as const)
      : sex == 1
      ? ("male" as const)
      : sex == 2
      ? ("other" as const)
      : ("not-specified" as const);
  }
  private evaluateImage(name: string, surname: string, email: string) {
    const nameSlug = name.toLowerCase().replace(/[\W_ ]+/g, "");
    const surnameSlug = surname.toLowerCase().replace(/[\W_ ]+/g, "");
    const initials = `${nameSlug[0] || "?"}+${surnameSlug[0] || "?"}`;
    return gravatarUrl({
      fallback: `https://eu.ui-avatars.com/api/${initials}/132`,
      email: email,
      size: 132,
    }) as string;
  }
  private async getFiscalCategory() {
    const fiscal = await tryber.tables.WpAppqFiscalProfile.do()
      .select("fiscal_category")
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_fiscal_profile.tester_id"
      )
      .where("wp_appq_fiscal_profile.is_active", 1)
      .andWhere("wp_appq_evd_profile.id", this.getTesterId())
      .first();
    return fiscal?.fiscal_category ?? 0;
  }
  private async getBootyData() {
    const res = (await tryber.tables.WpAppqPaymentRequest.do()
      .select(tryber.raw("SUM(amount_gross) as gross"))
      .select(tryber.raw("SUM(amount) as net"))
      .where("is_paid", 1)
      .andWhere("tester_id", this.getTesterId())
      .first()) as unknown as { gross: number; net: number } | undefined;

    return {
      booty: {
        // all users fiscal profile !== 1 (<5000) can see only gross booty
        gross: {
          value: res && res.gross !== null ? res.gross : 0,
          currency: "EUR",
        },
        // all users fiscal profile === 1 (<5000) can see gross and net booty
        ...(this.fiscalCategory === 1 && {
          net: {
            value: res && res.net !== null ? res.net : 0,
            currency: "EUR",
          },
        }),
      },
    };
  }
  private async getPendingBootyData() {
    const res = (await tryber.tables.WpAppqPayment.do()
      .sum("amount as gross")
      .where("is_requested", 0)
      .andWhere("tester_id", this.getTesterId())
      .first()) as unknown as { gross: number } | undefined;

    return {
      pending_booty: {
        // all users fiscal profile !== 1 (<5000) can see only gross booty
        gross: {
          value: res && res.gross !== null ? res.gross : 0,
          currency: "EUR",
        },
        // all users fiscal profile === 1 (<5000) can see gross and net booty
        ...(this.fiscalCategory === 1 && {
          net: {
            value: res && res.gross !== null ? res.gross * 0.8 : 0,
            currency: "EUR",
          },
        }),
      },
    };
  }
  private async evaluateBootyThreshold() {
    let bootyThreshold: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["booty_threshold"] =
      { value: 0, isOver: false };

    const trbPendingBooty = (await this.getPendingBootyData()).pending_booty
      .gross.value;
    const bootyThresholdVal = await this.getCrowdOption("minimum_payout");
    if (bootyThresholdVal) {
      bootyThreshold.value = parseFloat(bootyThresholdVal);
      if (trbPendingBooty >= bootyThreshold.value) {
        bootyThreshold.isOver = true;
      }
    }
    return { booty_threshold: bootyThreshold };
  }
  private async getCrowdOption(key: string) {
    const results = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where({ option_name: "crowd_options_option_name" })
      .first();

    if (!results) {
      throw new Error(`Option crowd_options_option_name not found`);
    }
    const option = unserialize(results.option_value);
    let value: false | string = false;
    if (option[key]) {
      value = option[key];
    }

    return value;
  }
  private async getCertificationsData() {
    const certifications = await tryber.tables.WpAppqProfileCertifications.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_certifications_list"),
        tryber.ref("name").withSchema("wp_appq_certifications_list"),
        tryber.ref("area").withSchema("wp_appq_certifications_list"),
        tryber.ref("institute").withSchema("wp_appq_certifications_list"),
        tryber
          .ref("achievement_date")
          .withSchema("wp_appq_profile_certifications")
      )
      .join(
        "wp_appq_certifications_list",
        "wp_appq_certifications_list.id",
        "wp_appq_profile_certifications.cert_id"
      )
      .where("wp_appq_profile_certifications.tester_id", this.getTesterId());

    if (!certifications.length) {
      const emptyCerts = await tryber.tables.WpUsermeta.do()
        .select("meta_value")
        .where({
          user_id: this.getWordpressId(),
          meta_key: "emptyCerts",
        })
        .first();
      return { certifications: false };
    }
    return {
      certifications: certifications.map((d) => {
        const item = {
          ...d,
          achievement_date: new Date(d.achievement_date)
            .toISOString()
            .substring(0, 10),
        };
        return item;
      }),
    };
  }
  private async getLanguagesData() {
    const languages = await tryber.tables.WpAppqProfileHasLang.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_lang"),
        tryber.ref("display_name").withSchema("wp_appq_lang").as("name")
      )
      .join(
        "wp_appq_lang",
        "wp_appq_lang.id",
        "wp_appq_profile_has_lang.language_id"
      );
    return [];
    //     let sql = `SELECT l.display_name as language, l.id as id
    //     FROM wp_appq_profile_has_lang pl
    //         JOIN wp_appq_evd_profile p
    //     on pl.profile_id = p.id
    //         JOIN wp_appq_lang l ON (pl.language_id = l.id)
    //     WHERE wp_user_id = ?;
    // ;
    // `;

    //     return db
    //       .query(db.format(sql, [id]))
    //       .then((data) => {
    //         if (!data.length) return Promise.reject(Error("Invalid language data"));
    //         return {
    //           languages: data.map((l: { id: string; language: string }) => ({
    //             id: l.id,
    //             name: l.language,
    //           })),
    //         };
    //       })
    //       .catch((e) => Promise.reject(Error(e)));
  }
}
