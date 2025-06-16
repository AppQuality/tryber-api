import { tryber } from "@src/features/database";
import countryList from "i18n-iso-countries";

export class UserTargetChecker {
  private testerId: number;

  private userLanguages: string[] = [];
  private userCountry: string = "";
  private userCufs: Record<number, string[]> = {};
  private userAge: number = -1;
  private userGender: number = -1;
  private userProvince: string = "";

  constructor({ testerId }: { testerId: number }) {
    this.testerId = testerId;
    countryList.registerLocale(require("i18n-iso-countries/langs/en.json"));
  }

  async init() {
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
    try {
      const age = await tryber.tables.WpAppqEvdProfile.do()
        .select("birth_date")
        .where("id", this.testerId);

      this.userAge =
        new Date().getFullYear() - new Date(age[0].birth_date).getFullYear();
    } catch (error) {
      this.userAge = -1;
    }
  }

  private async initUserGender() {
    const gender = await tryber.tables.WpAppqEvdProfile.do()
      .select("sex")
      .where("id", this.testerId)
      .first();

    this.userGender = !gender ? -1 : gender.sex;
  }

  inTarget(targetRules: {
    languages?: string[];
    countries?: string[];
    provinces?: string[];
    cufs?: { id: number; values: (string | number)[] }[];
    age?: { min?: number; max?: number };
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

    if (age && age.max && age.min) {
      if (this.userAge < age.min || this.userAge > age.max) return false;
    }

    if (genders && !genders.includes(this.userGender)) {
      return false;
    }

    return true;
  }
}
