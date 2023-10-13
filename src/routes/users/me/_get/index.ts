/**  OPENAPI-CLASS : get-users-me */

import UserRoute from "@src/features/routes/UserRoute";
import getProfessionData from "./getProfessionData";
import getEducationData from "./getEducationData";
import getLanguagesData from "./getLanguagesData";
import getAdditionalData from "./getAdditionalData";
import getCrowdOption from "@src/features/wp/getCrowdOption";
import debugMessage from "@src/features/debugMessage";
import { tryber } from "@src/features/database";
import { gravatarUrl } from "avatar-initials";

const basicFields = [
  "email" as const,
  "is_verified" as const,
  "name" as const,
  "surname" as const,
  "username" as const,
  "wp_user_id" as const,
];
const acceptedFields = [
  ...basicFields,
  "additional" as const,
  "all" as const,
  "approved_bugs" as const,
  "attended_cp" as const,
  "birthDate" as const,
  "booty" as const,
  "booty_threshold" as const,
  "certifications" as const,
  "city" as const,
  "completionPercent" as const,
  "country" as const,
  "education" as const,
  "gender" as const,
  "image" as const,
  "languages" as const,
  "onboarding_completed" as const,
  "pending_booty" as const,
  "phone" as const,
  "profession" as const,
  "rank" as const,
  "role" as const,
  "total_exp_pts" as const,
];
type AcceptableValues = typeof acceptedFields[number];

export default class UsersMe extends UserRoute<{
  response: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-users-me"]["parameters"]["query"];
}> {
  private fields: AcceptableValues[] | undefined = undefined;
  private isComplete: boolean = false;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "users-me" });
    type AcceptedField = typeof acceptedFields[number];
    const query = this.getQuery();

    if (query && query.fields) {
      this.fields = query.fields
        .split(",")
        .filter((f) =>
          acceptedFields.includes(f as AcceptedField)
        ) as AcceptedField[];

      if (!this.fields) this.fields = basicFields;
      if (this.fields.includes("all")) {
        this.fields = acceptedFields.filter((f) => f !== "all");
        this.isComplete = true;
      }
    }
  }

  protected async prepare() {
    await this.updateLastActivity();

    this.setSuccess(200, await this.getUserData());
  }

  protected async updateLastActivity() {
    try {
      await tryber.tables.WpAppqEvdProfile.do()
        .update({ last_activity: tryber.fn.now() })
        .where({ id: this.getTesterId() });
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 404,
        err as OpenapiError
      );
    }
  }

  protected async getUserData() {
    const wpId = this.getWordpressId().toString();

    try {
      const validFields = this.fields ? this.fields : basicFields;

      let data: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"] =
        { id: this.getTesterId(), role: this.configuration.request.user.role };

      data = { ...data, ...(await this.getProfileData()) };

      if (validFields.includes("pending_booty")) {
        try {
          data = { ...data, ...(await this.getPendingBootyData()) };
        } catch (e) {}
      }

      if (validFields.includes("booty")) {
        try {
          data = { ...data, ...(await this.getBootyData()) };
        } catch (e) {}
      }

      if (validFields.includes("rank")) {
        try {
          data = { ...data, rank: "0" };
        } catch (e) {}
      }

      if (validFields.includes("approved_bugs")) {
        try {
          data = { ...data, ...(await this.getApprovedBugsData()) };
        } catch {}
      }

      if (validFields.includes("attended_cp")) {
        try {
          data = { ...data, ...(await this.getAttendedCpData()) };
        } catch {}
      }

      if (validFields.includes("certifications")) {
        try {
          data = { ...data, ...(await this.getCertificationsData()) };
        } catch {}
      }

      if (validFields.includes("profession")) {
        try {
          data = { ...data, ...(await getProfessionData(wpId)) };
        } catch {}
      }

      if (validFields.includes("education")) {
        try {
          data = { ...data, ...(await getEducationData(wpId)) };
        } catch {}
      }

      if (validFields.includes("languages")) {
        try {
          data = { ...data, ...(await getLanguagesData(wpId)) };
        } catch {}
      }

      if (validFields.includes("additional")) {
        try {
          data = { ...data, ...(await getAdditionalData(wpId)) };
        } catch (e) {
          console.log(e);
        }
      }
      if (validFields.includes("booty_threshold")) {
        try {
          let bootyThreshold: StoplightOperations["get-users-me"]["responses"]["200"]["content"]["application/json"]["booty_threshold"] =
            { value: 0, isOver: false };

          let trbPendingBooty = (await this.getPendingBootyData())
            .pending_booty;
          const bootyThresholdVal = await getCrowdOption("minimum_payout");
          if (bootyThresholdVal) {
            bootyThreshold.value = parseFloat(bootyThresholdVal);
            if (trbPendingBooty.gross.value >= bootyThreshold.value) {
              bootyThreshold.isOver = true;
            }
          }

          data = { ...data, ...{ booty_threshold: bootyThreshold } };
        } catch (e) {
          console.log(e);
        }
      }

      if (!Object.keys(data).length) throw Error("Invalid data");

      Object.keys(data).forEach((k) => {
        if (data[k as keyof typeof data] === null)
          delete data[k as keyof typeof data];
      });

      if (this.isComplete) {
        data = {
          ...data,
          completionPercent:
            (100 * (Object.keys(data).length + 1)) / validFields.length,
        };
      }
      return data;
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      throw e;
    }
  }

  protected async getProfileData() {
    let query = tryber.tables.WpAppqEvdProfile.do();
    query
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .where("wp_user_id", this.getWordpressId());
    if (this.fields) {
      if (this.fields.includes("name") || this.fields.includes("image"))
        query.select(tryber.ref("name").withSchema("wp_appq_evd_profile"));

      if (this.fields.includes("surname") || this.fields.includes("image"))
        query.select(tryber.ref("surname").withSchema("wp_appq_evd_profile"));

      if (this.fields.includes("email") || this.fields.includes("image"))
        query.select(tryber.ref("email").withSchema("wp_appq_evd_profile"));
      if (this.fields.includes("wp_user_id"))
        query.select(
          tryber.ref("wp_user_id").withSchema("wp_appq_evd_profile")
        );
      if (this.fields.includes("is_verified"))
        query.select(
          tryber.ref("is_verified").withSchema("wp_appq_evd_profile")
        );
      if (this.fields.includes("username"))
        query.select(
          tryber.ref("user_login").withSchema("wp_users").as("username")
        );
      if (this.fields.includes("total_exp_pts"))
        query.select(
          tryber.ref("total_exp_pts").withSchema("wp_appq_evd_profile")
        );
      if (this.fields.includes("birthDate"))
        query.select(tryber.raw("CAST(birth_date as CHAR) as birthDate"));
      if (this.fields.includes("phone"))
        query.select(
          tryber
            .ref("phone_number")
            .withSchema("wp_appq_evd_profile")
            .as("phone")
        );
      if (this.fields.includes("gender"))
        query.select(
          tryber.ref("sex").withSchema("wp_appq_evd_profile").as("gender")
        );
      if (this.fields.includes("country"))
        query.select(tryber.ref("country").withSchema("wp_appq_evd_profile"));
      if (this.fields.includes("city"))
        query.select(tryber.ref("city").withSchema("wp_appq_evd_profile"));
      if (this.fields.includes("onboarding_completed"))
        query.select(
          tryber
            .ref("onboarding_complete")
            .withSchema("wp_appq_evd_profile")
            .as("onboarding_completed")
        );
    }

    try {
      const data = await query.first();

      if (!data) {
        console.log("No user");
        throw Error("No user");
      }

      let user: any = data;
      if (
        this.fields &&
        this.fields.includes("image") &&
        user.name &&
        user.surname
      ) {
        const nameSlug = user.name.toLowerCase().replace(/[\W_ ]+/g, "");
        const surnameSlug = user.surname.toLowerCase().replace(/[\W_ ]+/g, "");
        const initials = `${nameSlug[0] || "?"}+${surnameSlug[0] || "?"}`;
        user.image = gravatarUrl({
          fallback: `https://eu.ui-avatars.com/api/${initials}/132`,
          email: user.email,
          size: 132,
        });
      }
      if (this.fields && !this.fields.includes("name")) delete user.name;
      if (this.fields && !this.fields.includes("surname")) delete user.surname;
      if (this.fields && !this.fields.includes("email")) delete user.email;
      if (
        this.fields &&
        this.fields.includes("is_verified") &&
        typeof user.is_verified !== "undefined"
      ) {
        user.is_verified = user.is_verified !== 0;
      }
      if (
        this.fields &&
        this.fields.includes("onboarding_completed") &&
        typeof user.onboarding_completed !== "undefined"
      ) {
        user.onboarding_completed = user.onboarding_completed !== 0;
      }

      if (user.hasOwnProperty("birthDate") && user.birthDate) {
        let d = new Date(user.birthDate);
        d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        user.birthDate = d.toISOString().substring(0, 10);
      }
      if (user.hasOwnProperty("gender"))
        user.gender =
          user.gender == 0
            ? "female"
            : user.gender == 1
            ? "male"
            : user.gender == 2
            ? "other"
            : "not-specified";
      return user;
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      return Promise.reject(e);
    }
  }

  protected async getPendingBootyData() {
    let fiscalCategory = 0;

    const fiscal = (await tryber.tables.WpAppqFiscalProfile.do()
      .select(
        tryber.ref("fiscal_category").withSchema("wp_appq_fiscal_profile")
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_fiscal_profile.tester_id"
      )
      .where("wp_appq_evd_profile.id", this.getTesterId())
      .andWhere("wp_appq_fiscal_profile.is_active", 1)
      .first()) as unknown as { fiscal_category: string };

    fiscalCategory = Number(fiscal.fiscal_category);
    const res = (await tryber.tables.WpAppqPayment.do()
      .sum({ total: "amount" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_payment.tester_id"
      )
      .where("wp_appq_evd_profile.id", this.getTesterId())
      .andWhere("is_paid", 0)
      .andWhere("is_requested", 0)
      .first()) as unknown as { total: number };

    if (!res) {
      Promise.reject(Error("Invalid pending booty data"));
    }

    return {
      pending_booty: {
        gross: {
          value: res.total ? Number(res.total.toFixed(2)) : 0,
          currency: "EUR",
        },
        ...(fiscal &&
          fiscalCategory === 1 && {
            net: {
              value: res.total
                ? Number(parseFloat(`${res.total * 0.8}`).toFixed(2))
                : 0,
              currency: "EUR",
            },
          }),
      },
    };
  }

  protected async getBootyData() {
    try {
      let fiscalCategory = 0;

      const fiscalQuery = (await tryber.tables.WpAppqFiscalProfile.do()
        .select(
          tryber.ref("fiscal_category").withSchema("wp_appq_fiscal_profile")
        )
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_fiscal_profile.tester_id"
        )
        .where("wp_appq_evd_profile.id", this.getTesterId())
        .andWhere("wp_appq_fiscal_profile.is_active", 1)
        .first()) as unknown as { fiscal_category: string };

      fiscalCategory = Number(fiscalQuery.fiscal_category);

      const res = (await tryber.tables.WpAppqPaymentRequest.do()
        .sum({ gross: "amount_gross", net: "amount" })
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_payment_request.tester_id"
        )
        .where("wp_appq_evd_profile.id", this.getTesterId())
        .andWhere("is_paid", 1)
        .first()) as unknown as { gross: string; net: string };

      if (!res) Promise.reject(Error("Invalid pending booty data"));

      return {
        booty: {
          gross: {
            value: res.gross ? Number(parseFloat(res.gross).toFixed(2)) : 0,
            currency: "EUR",
          },
          ...(fiscalQuery &&
            fiscalCategory === 1 && {
              net: {
                value: res.net ? Number(parseFloat(res.net).toFixed(2)) : 0,
                currency: "EUR",
              },
            }),
        },
      };
    } catch (e) {
      throw e;
    }
  }

  protected async getApprovedBugsData() {
    try {
      const data = await tryber.tables.WpAppqEvdBug.do()
        .count("id")
        .where("profile_id", this.getTesterId())
        .andWhere("status_id", 2)
        .first();

      if (!data) return Promise.reject(Error("Invalid bugs data"));

      return { approved_bugs: Number(Object.values(data)[0]) };
    } catch (e) {
      if (process.env && process.env.NODE_ENV === "development") console.log(e);
      return Promise.reject(e);
    }
  }

  protected async getAttendedCpData() {
    try {
      const query = tryber.tables.WpAppqExpPoints.do()
        .select(tryber.raw("COUNT(DISTINCT campaign_id) AS attended_cp"))
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_exp_points.tester_id"
        )
        .where("wp_appq_exp_points.activity_id", 1)
        .andWhere("wp_appq_exp_points.amount", ">", 0)
        .andWhere("wp_appq_evd_profile.id", this.getTesterId())
        .first();

      const data = (await query) as unknown as { attended_cp: number };
      if (!data) return Promise.reject(Error("Invalid cp data"));
      return { attended_cp: Number(data.attended_cp) };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  protected async getCertificationsData() {
    try {
      const data = await tryber.tables.WpAppqProfileCertifications.do()
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
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_profile_certifications.tester_id"
        )
        .join(
          "wp_appq_certifications_list",
          "wp_appq_certifications_list.id",
          "wp_appq_profile_certifications.cert_id"
        )
        .where("wp_appq_evd_profile.id", this.getTesterId());

      if (!data.length) {
        const emptyCerts = await tryber.tables.WpUsermeta.do()
          .select()
          .where("user_id", this.getWordpressId())
          .andWhere("meta_key", "emptyCerts")
          .andWhere("meta_value", "true");

        if (!emptyCerts.length) {
          return Promise.reject(Error("Invalid certification data"));
        }
        return { certifications: false };
      }
      return {
        certifications: data.map((d) => {
          const item = {
            ...d,
            achievement_date: new Date(d.achievement_date)
              .toISOString()
              .substring(0, 10),
          };
          return item;
        }),
      };
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(e);
    }
  }
}
