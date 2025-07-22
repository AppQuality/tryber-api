import { tryber } from "@src/features/database";
import countryList from "i18n-iso-countries";

export class UserTargetChecker {
  private testerId: number = 0;

  private userLanguages: string[] = [];
  private userCountry: string = "";
  private userCufs: Record<number, string[]> = {};
  private userAge: number = -1;
  private userGender: number = -1;
  private userProvince: string = "";

  constructor() {
    countryList.registerLocale(require("i18n-iso-countries/langs/en.json"));
  }

  async initUser({ testerId }: { testerId: number }) {
    this.testerId = testerId;
    await this.initUserLanguages();
    await this.initUserProfileData();
    await this.initUserCufs();
    await this.initUserAge();
    await this.initUserGender();
  }

  private async initUserLanguages() {
    this.userLanguages = await tryber.tables.WpAppqProfileHasLang.do()
      .select("language_name")
      .where("profile_id", this.testerId)
      .then((res) => res.map((r) => r.language_name));
  }

  private async initUserProfileData() {
    const profile = await tryber.tables.WpAppqEvdProfile.do()
      .select("country", "province")
      .where("id", this.testerId)
      .first();

    const countryCode = countryList.getAlpha2Code(profile?.country || "", "en");
    this.userCountry = countryCode || "";
    this.userProvince = profile?.province || "";
  }

  private async initUserCufs() {
    const cufs = await tryber.tables.WpAppqCustomUserFieldData.do()
      .select("custom_user_field_id", "value")
      .where("profile_id", this.testerId);

    this.userCufs = {};
    cufs.forEach(
      (cuf: { custom_user_field_id: number; value: string | number }) => {
        const id = cuf.custom_user_field_id;
        const value = String(cuf.value);
        if (!this.userCufs[id]) this.userCufs[id] = [];
        this.userCufs[id].push(value);
      }
    );
  }

  private async initUserAge() {
    const profile = await tryber.tables.WpAppqEvdProfile.do()
      .select("birth_date")
      .where("id", this.testerId)
      .first();
    if (!profile) return;

    const birthdate = new Date(profile.birth_date);
    const today = new Date();
    if (isNaN(birthdate.getTime()) || birthdate > today) return;

    const msPerYear = 1000 * 60 * 60 * 24 * 365.2425;
    this.userAge = Math.floor(
      (today.getTime() - birthdate.getTime()) / msPerYear
    );
  }

  private async initUserGender() {
    const gender = await tryber.tables.WpAppqEvdProfile.do()
      .select("sex")
      .where("id", this.testerId)
      .first();

    this.userGender = !gender ? -1 : gender.sex;
  }

  public async enhanceCampaignsWithTargetRules<
    T extends { visibility_type: number; id: number }
  >({ campaigns }: { campaigns: T[] }) {
    const campaignsWithTarget = campaigns.filter(
      (c) => c.visibility_type === 4
    );
    if (!campaignsWithTarget.length)
      return campaigns.map((c) => ({
        ...c,
        targetRules: undefined,
      }));

    const allowedLanguages =
      await tryber.tables.CampaignDossierDataLanguages.do()
        .select("campaign_id", "language_name")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_languages.campaign_dossier_data_id"
        )
        .whereIn(
          "campaign_dossier_data.campaign_id",
          campaignsWithTarget.map((c) => c.id)
        );

    const allowedCountries =
      await tryber.tables.CampaignDossierDataCountries.do()
        .select("campaign_id", "country_code")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_countries.campaign_dossier_data_id"
        )
        .whereIn(
          "campaign_dossier_data.campaign_id",
          campaignsWithTarget.map((c) => c.id)
        );

    const allowedProvinces =
      await tryber.tables.CampaignDossierDataProvince.do()
        .select("campaign_id", "province")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data.id",
          "campaign_dossier_data_province.campaign_dossier_data_id"
        )
        .whereIn(
          "campaign_dossier_data.campaign_id",
          campaignsWithTarget.map((c) => c.id)
        );

    const allowedCufs = await tryber.tables.CampaignDossierDataCuf.do()
      .select("campaign_id", "cuf_id", "cuf_value_id")
      .join(
        "campaign_dossier_data",
        "campaign_dossier_data.id",
        "campaign_dossier_data_cuf.campaign_dossier_data_id"
      )
      .whereIn(
        "campaign_dossier_data.campaign_id",
        campaignsWithTarget.map((c) => c.id)
      );

    const allowedAges = await tryber.tables.CampaignDossierDataAge.do()
      .select("campaign_id", "min", "max")
      .join(
        "campaign_dossier_data",
        "campaign_dossier_data.id",
        "campaign_dossier_data_age.campaign_dossier_data_id"
      )
      .whereIn(
        "campaign_dossier_data.campaign_id",
        campaignsWithTarget.map((c) => c.id)
      );

    const allowedGenders = await tryber.tables.CampaignDossierDataGender.do()
      .select("campaign_id", "gender")
      .join(
        "campaign_dossier_data",
        "campaign_dossier_data.id",
        "campaign_dossier_data_gender.campaign_dossier_data_id"
      )
      .whereIn(
        "campaign_dossier_data.campaign_id",
        campaignsWithTarget.map((c) => c.id)
      );

    const ages = allowedAges.reduce(
      (acc: Record<number, { min: number; max: number }[]>, cur) => {
        if (!acc[cur.campaign_id]) acc[cur.campaign_id] = [];
        acc[cur.campaign_id].push({ min: cur.min, max: cur.max });
        return acc;
      },
      {}
    );

    return campaigns.map((campaign) => {
      return {
        ...campaign,
        targetRules: getTargetRules(),
      };
      function getTargetRules() {
        if (campaign.visibility_type !== 4) return undefined;

        const provinces = allowedProvinces
          .filter((l) => l.campaign_id === campaign.id)
          .map((l) => l.province);
        const languages = allowedLanguages
          .filter((l) => l.campaign_id === campaign.id)
          .map((l) => l.language_name);
        const countries = allowedCountries
          .filter((l) => l.campaign_id === campaign.id)
          .map((l) => l.country_code);
        const cufs = allowedCufs
          .filter((l) => l.campaign_id === campaign.id)
          .reduce((acc: Record<number, number[]>, cur) => {
            if (!acc[cur.cuf_id]) acc[cur.cuf_id] = [];
            acc[cur.cuf_id].push(cur.cuf_value_id);
            return acc;
          }, {});

        const age = campaign.id in ages ? ages[campaign.id] : undefined;

        const genders =
          allowedGenders.length > 0
            ? allowedGenders.reduce((acc, g) => {
                if (g.campaign_id === campaign.id) {
                  acc.push(g.gender);
                }
                return acc;
              }, [] as number[])
            : [1, 0, -1, 2];

        return {
          ...(languages.length ? { languages } : {}),
          ...(countries.length ? { countries } : {}),
          ...(provinces.length ? { provinces } : {}),
          ...(age ? { age } : {}),
          ...(genders.length ? { genders } : {}),
          ...(Object.keys(cufs).length
            ? {
                cufs: Object.keys(cufs).map((id) => ({
                  id: parseInt(id),
                  values: cufs[parseInt(id)],
                })),
              }
            : {}),
        };
      }
    });
  }

  inTarget(targetRules: {
    languages?: string[];
    countries?: string[];
    provinces?: string[];
    cufs?: { id: number; values: (string | number)[] }[];
    age?: { min?: number; max?: number }[];
    genders?: number[];
  }) {
    if (Object.keys(targetRules).length === 0) return true;
    const { languages, countries, cufs, age, genders, provinces } = targetRules;

    if (
      languages &&
      languages.length &&
      !languages.some((l) => this.userLanguages.includes(l))
    ) {
      return false;
    }

    if (
      countries &&
      countries.length &&
      !countries.includes(this.userCountry)
    ) {
      return false;
    }

    if (
      provinces &&
      provinces.length &&
      !provinces.includes(this.userProvince)
    ) {
      return false;
    }

    if (cufs && cufs.length) {
      for (const cuf of cufs) {
        const userValues = this.userCufs[cuf.id] || [];
        if (!userValues.length) return false;
        if (
          cuf.values.length &&
          !cuf.values.some((v) => userValues.includes(String(v)))
        ) {
          return false;
        }
      }
    }

    if (age && age.length) {
      if (
        !age.some((ageRule) => {
          if (!ageRule.min && !ageRule.max) return true;
          const min = ageRule.min ?? -Infinity;
          const max = ageRule.max ?? Infinity;
          return this.userAge >= min && this.userAge <= max;
        })
      ) {
        return false;
      }
    }

    if (genders && !genders.includes(this.userGender)) {
      return false;
    }

    return true;
  }

  async countAvailableTesters({ campaignId }: { campaignId: number }) {
    const campaigns = await this.enhanceCampaignsWithTargetRules({
      campaigns: [
        {
          id: campaignId,
          visibility_type: 4,
        },
      ],
    });

    if (!campaigns.length || !campaigns[0].targetRules) {
      return 0;
    }

    const targetRules = campaigns[0].targetRules;

    const testerIds = await this.filterTesterByCufs({
      testerIds: await this.filterTesterByLanguages({
        testerIds: await this.filterTesterByAge({
          testerIds: await this.getFilteredProfileQuery({
            targetRules,
          }),
          targetRules,
        }),
        targetRules,
      }),
      targetRules,
    });

    return testerIds.length;
  }

  private getFilteredProfileQuery({
    targetRules,
  }: {
    targetRules: {
      genders?: number[];
      countries?: string[];
      provinces?: string[];
    };
  }) {
    let query = tryber.tables.WpAppqEvdProfile.do()
      .select(tryber.ref("id").withSchema("wp_appq_evd_profile"))
      .where("wp_appq_evd_profile.blacklisted", 0)
      .whereNot("wp_appq_evd_profile.name", "Deleted User");

    if (targetRules.genders) {
      query = query.whereIn("wp_appq_evd_profile.sex", targetRules.genders);
    }

    if (targetRules.countries) {
      const validCountryNames = targetRules.countries
        .map((country) => countryList.getName(country, "en"))
        .filter((name): name is NonNullable<typeof name> => name !== undefined);

      query = query.whereIn("wp_appq_evd_profile.country", validCountryNames);
    }

    if (targetRules.provinces) {
      query = query.whereIn(
        "wp_appq_evd_profile.province",
        targetRules.provinces
      );
    }

    return query;
  }

  private async filterTesterByAge({
    testerIds,
    targetRules,
  }: {
    testerIds: { id: number; birth_date?: string }[];
    targetRules: { age?: { min?: number; max?: number }[] };
  }) {
    if (!targetRules.age || !targetRules.age.length) return testerIds;

    if (!testerIds.length) return [];

    const testerIdsWithBirthDate = await tryber.tables.WpAppqEvdProfile.do()
      .select("id", "birth_date")
      .whereIn(
        "id",
        testerIds.map((t) => t.id)
      );
    return testerIdsWithBirthDate.filter((tester) => {
      const targetAge = targetRules.age as NonNullable<typeof targetRules.age>;
      const birthDate = new Date(tester.birth_date);
      if (isNaN(birthDate.getTime())) return false; // Invalid date

      const today = new Date();
      const age = Math.floor(
        (today.getTime() - birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.2425)
      );

      return targetAge.some((ageRule) => {
        const min = ageRule.min ?? -Infinity;
        const max = ageRule.max ?? Infinity;
        return age >= min && age <= max;
      });
    });
  }

  private async filterTesterByLanguages({
    testerIds,
    targetRules,
  }: {
    testerIds: { id: number }[];
    targetRules: { languages?: string[] };
  }) {
    if (!targetRules.languages || !targetRules.languages.length)
      return testerIds;

    if (!testerIds.length) return [];
    return await tryber.tables.WpAppqProfileHasLang.do()
      .select(
        tryber.ref("profile_id").withSchema("wp_appq_profile_has_lang").as("id")
      )
      .whereIn(
        "profile_id",
        testerIds.map((t) => t.id)
      )
      .whereIn("language_name", targetRules.languages);
  }

  private async filterTesterByCufs({
    testerIds,
    targetRules,
  }: {
    testerIds: { id: number }[];
    targetRules: { cufs?: { id: number; values: (string | number)[] }[] };
  }) {
    if (!targetRules.cufs || !targetRules.cufs.length) return testerIds;

    if (!testerIds.length) return [];
    const cufRules = targetRules.cufs.reduce((acc, cuf) => {
      acc[cuf.id] = cuf.values.map((v) => String(v));
      return acc;
    }, {} as Record<number, string[]>);

    let validTesterIds = testerIds;

    for (const [cuf_id, cuf_values] of Object.entries(cufRules)) {
      if (!cuf_values.length) continue;
      if (!validTesterIds.length) return [];

      validTesterIds = await tryber.tables.WpAppqCustomUserFieldData.do()
        .select(
          tryber
            .ref("profile_id")
            .withSchema("wp_appq_custom_user_field_data")
            .as("id")
        )
        .where("custom_user_field_id", parseInt(cuf_id))
        .whereIn("value", cuf_values)
        .whereIn(
          "profile_id",
          validTesterIds.map((t) => t.id)
        );
    }

    return validTesterIds;
  }
}
