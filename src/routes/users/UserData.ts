import { tryber } from "@src/features/database";
import getCrowdOption from "@src/features/wp/getCrowdOption";
import { components } from "@src/schema";

import { gravatarUrl } from "avatar-initials";

export default class UserData {
  private _data: {
    id: number;
    username?: string;
    name?: string;
    surname?: string;
    email?: string;
    image?: string;
    wp_user_id?: number;
    role?: string;
    is_verified?: boolean;
    rank?: string;
    total_exp_pts?: number;
    booty?: {
      net?: components["schemas"]["Currency"];
      gross: components["schemas"]["Currency"];
    };
    pending_booty?: {
      net?: components["schemas"]["Currency"];
      gross: components["schemas"]["Currency"];
    };
    languages?: {
      id?: number;
      name?: string;
    }[];
    onboarding_completed?: boolean;
    additional?: components["schemas"]["AdditionalField"][];
    gender?: components["schemas"]["Gender"];
    birthDate?: string;
    phone?: string;
    education?: {
      id: number;
      name: string;
    };
    profession?: {
      id: number;
      name: string;
    };
    certifications?: components["schemas"]["Certification"][] | boolean;
    country?: string;
    city?: string;
    attended_cp?: number;
    approved_bugs?: number;
    booty_threshold?: {
      value: number;
      isOver: boolean;
    };
  } = { id: this.profileId };

  get data() {
    return this._data;
  }
  constructor(
    private profileId: number,
    private fields: string[] | undefined
  ) {}

  public async getData(): Promise<typeof UserData.prototype._data> {
    let data = {
      ...this._data,
      ...(await this.getProfileData()),
    };

    if (this.fields) {
      if (this.fields.includes("pending_booty")) {
        try {
          data = { ...data, ...(await this.getPendingBootyData()) };
        } catch (e) {
          console.log(e);
        }
      }
      if (this.fields.includes("booty")) {
        try {
          data = { ...data, ...(await this.getBootyData()) };
        } catch (e) {
          console.log(e);
        }
      }
      if (this.fields.includes("rank")) {
        try {
          data = { ...data, rank: "0" };
        } catch (e) {}
      }

      if (this.fields.includes("approved_bugs")) {
        try {
          data = { ...data, ...(await this.getApprovedBugsData()) };
        } catch {}
      }
      if (this.fields.includes("attended_cp")) {
        try {
          data = { ...data, ...(await this.getAttendedCpData()) };
        } catch {}
      }
      if (this.fields.includes("certifications")) {
        try {
          data = {
            ...data,
            ...(await this.getCertificationsData()),
          };
        } catch {}
      }
      if (this.fields.includes("profession")) {
        try {
          data = { ...data, ...(await this.getProfessionData()) };
        } catch {}
      }
      if (this.fields.includes("education")) {
        try {
          data = { ...data, ...(await this.getEducationData()) };
        } catch {}
      }

      if (this.fields.includes("languages")) {
        try {
          data = { ...data, ...(await this.getLanguagesData()) };
        } catch {}
      }

      if (this.fields.includes("additional")) {
        try {
          data = { ...data, ...(await this.getAdditionalData()) };
        } catch (e) {
          console.log(e);
        }
      }
      if (this.fields.includes("booty_threshold")) {
        try {
          let bootyThreshold = { value: 0, isOver: false };

          let trbPendingBooty = (await this.getPendingBootyData())
            .pending_booty;
          const bootyThresholdVal = await getCrowdOption("minimum_payout");
          if (bootyThresholdVal) {
            bootyThreshold.value = parseFloat(bootyThresholdVal);
            if (trbPendingBooty.gross.value >= bootyThreshold.value) {
              bootyThreshold.isOver = true;
            }
          }

          data = {
            ...data,
            ...{ booty_threshold: bootyThreshold },
          };
        } catch (e) {
          console.log(e);
        }
      }
      // if (!Object.keys(data).length) throw Error("Invalid data");

      // Object.keys(data).forEach((k) => {
      //   if (data[k as keyof typeof data] === null)
      //     delete data[k as keyof typeof data];
      // });
    }
    return data;
  }

  protected async getWordpressId() {
    try {
      const user = await tryber.tables.WpAppqEvdProfile.do()
        .select(tryber.ref("wp_user_id"))
        .where("id", this.profileId)
        .first();
      if (!user || !user.wp_user_id) {
        return Promise.reject(Error("Invalid user"));
      }
      return user.wp_user_id as number;
    } catch (e) {
      console.log(e);
    }
  }
  protected async getProfileData() {
    let query = tryber.tables.WpAppqEvdProfile.do();
    query
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .where("wp_appq_evd_profile.id", this.profileId);
    if (this.fields) {
      if (this.fields.includes("username"))
        query.join("wp_users", "wp_users.ID", "wp_appq_evd_profile.wp_user_id");

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
      console.log("error");
      console.log(e);
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
      .where("wp_appq_evd_profile.id", this.profileId)
      .andWhere("wp_appq_fiscal_profile.is_active", 1)
      .first()) as unknown as { fiscal_category: string };

    fiscalCategory = Number(fiscal?.fiscal_category);
    const res = (await tryber.tables.WpAppqPayment.do()
      .sum({ total: "amount" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_payment.tester_id"
      )
      .where("wp_appq_evd_profile.id", this.profileId)
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
        .where("wp_appq_evd_profile.id", this.profileId)
        .andWhere("wp_appq_fiscal_profile.is_active", 1)
        .first()) as unknown as { fiscal_category: string };

      fiscalCategory = Number(fiscalQuery?.fiscal_category);

      const res = (await tryber.tables.WpAppqPaymentRequest.do()
        .sum({ gross: "amount_gross", net: "amount" })
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_payment_request.tester_id"
        )
        .where("wp_appq_evd_profile.id", this.profileId)
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
        .where("profile_id", this.profileId)
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
        .andWhere("wp_appq_evd_profile.id", this.profileId)
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
        .where("wp_appq_evd_profile.id", this.profileId);

      if (!data.length) {
        const emptyCerts = await tryber.tables.WpUsermeta.do()
          .select()
          .where("user_id", await this.getWordpressId())
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

  protected async getProfessionData() {
    try {
      const data = await tryber.tables.WpAppqEvdProfile.do()
        .select(
          tryber.ref("id").withSchema("wp_appq_employment"),
          tryber.ref("display_name").withSchema("wp_appq_employment").as("name")
        )
        .join(
          "wp_appq_employment",
          "wp_appq_employment.id",
          "wp_appq_evd_profile.employment_id"
        )
        .where("wp_appq_evd_profile.id", this.profileId);

      if (!data.length) throw Error("Invalid employement data");
      return { profession: data[0] };
    } catch (e) {
      throw e;
    }
  }

  protected async getEducationData() {
    try {
      const data = await tryber.tables.WpAppqEvdProfile.do()
        .select(
          tryber.ref("id").withSchema("wp_appq_education"),
          tryber.ref("display_name").withSchema("wp_appq_education").as("name")
        )
        .join(
          "wp_appq_education",
          "wp_appq_education.id",
          "wp_appq_evd_profile.education_id"
        )
        .where("wp_appq_evd_profile.id", this.profileId);

      if (!data.length) return Promise.reject(Error("Invalid education data"));
      return { education: data[0] };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  protected async getLanguagesData() {
    const data = await tryber.tables.WpAppqProfileHasLang.do()
      .select(
        tryber.ref("display_name").withSchema("wp_appq_lang").as("language"),
        tryber.ref("id").withSchema("wp_appq_lang")
      )
      .as("id")
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_profile_has_lang.profile_id"
      )
      .join(
        "wp_appq_lang",
        "wp_appq_lang.id",
        "wp_appq_profile_has_lang.language_id"
      )
      .where("wp_appq_evd_profile.id", this.profileId);

    try {
      if (!data.length) return Promise.reject(Error("Invalid language data"));
      return {
        languages: data.map((l: { id: number; language: string }) => ({
          id: l.id,
          name: l.language,
        })),
      };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  protected async getAdditionalData(fieldId: false | string = false) {
    let data: {
      id: string;
      field_id: number;
      type: "text" | "select" | "multiselect";
      is_candidate: boolean;
      candidate: boolean;
      text: string;
      value: string;
      name: string;
    }[];

    let additional: typeof data = [];
    try {
      let newData = tryber.tables.WpAppqCustomUserFieldData.do()
        .select(
          tryber.ref("id").withSchema("wp_appq_custom_user_field_data"),
          tryber
            .ref("id")
            .withSchema("wp_appq_custom_user_field")
            .as("field_id"),
          tryber.ref("name").withSchema("wp_appq_custom_user_field"),
          tryber.ref("type").withSchema("wp_appq_custom_user_field"),
          tryber.ref("value").withSchema("wp_appq_custom_user_field_data")
        )
        .join(
          "wp_appq_custom_user_field",
          "wp_appq_custom_user_field.id",
          "wp_appq_custom_user_field_data.custom_user_field_id"
        )
        .join(
          "wp_appq_evd_profile",
          "wp_appq_evd_profile.id",
          "wp_appq_custom_user_field_data.profile_id"
        )
        .where("wp_user_id", await this.getWordpressId())
        .andWhere("wp_appq_custom_user_field.enabled", 1);
      if (fieldId) {
        newData = newData.andWhere("wp_appq_custom_user_field.id", fieldId);
      }
      data = (await newData) as unknown as typeof data;
      if (!data.length)
        return Promise.reject({
          status_code: 404,
          message: "There are no data for this field",
        });
    } catch (e) {
      return Promise.reject(e);
    }

    let textes: typeof data = data.filter(
      (i) => !["select", "multiselect"].includes(i.type)
    );

    textes = textes.map((t) => {
      t.text = t.value;
      return t;
    });

    let selects: typeof data = [];

    const selectsIds = data
      .filter((i) => ["select", "multiselect"].includes(i.type))
      .map((i) => parseInt(i.id));

    if (selectsIds.length) {
      const newSelects = await tryber.tables.WpAppqCustomUserFieldData.do()
        .select(
          tryber.ref("id").withSchema("wp_appq_custom_user_field_data"),
          tryber.raw(
            "COALESCE(wp_appq_custom_user_field_extras.name, wp_appq_custom_user_field_data.value) as name"
          ),
          tryber.raw(
            "COALESCE(wp_appq_custom_user_field_extras.id, wp_appq_custom_user_field_data.value) as value"
          ),
          tryber.ref("candidate").withSchema("wp_appq_custom_user_field_data")
        )
        .leftJoin(
          "wp_appq_custom_user_field_extras",
          "wp_appq_custom_user_field_data.value",
          "wp_appq_custom_user_field_extras.id"
        )
        .whereIn("wp_appq_custom_user_field_data.id", selectsIds)
        .andWhere(function () {
          this.where("wp_appq_custom_user_field_data.candidate", 1),
            this.orWhereNotNull("wp_appq_custom_user_field_extras.name");
        });

      try {
        const selectsData: typeof data = newSelects as unknown as typeof data;

        selectsData.forEach((s) => {
          let select = data.find((d) => d.id === s.id);
          if (select) {
            select.text = s.name;
            select.value = s.value.toString();
            if (s.candidate) select.is_candidate = true;
            selects.push(select);
          }
        });
        additional = [...selects, ...textes];
      } catch (e) {
        if (process.env && process.env.NODE_ENV === "development") {
          console.log(e);
        }
      }
    } else {
      additional = textes;
    }
    const results = additional.map((a) => {
      let { id, type, ...rest } = a;
      return rest;
    });
    return { additional: results };
  }
}
