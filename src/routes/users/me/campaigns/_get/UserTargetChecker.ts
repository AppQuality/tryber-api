import { tryber } from "@src/features/database";
import countryList from "i18n-iso-countries";

export class UserTargetChecker {
  private testerId: number;

  private userLanguages: string[] = [];
  private userCountry: string = "";
  private userCufs: Record<number, string[]> = {};

  constructor({ testerId }: { testerId: number }) {
    this.testerId = testerId;
    countryList.registerLocale(require("i18n-iso-countries/langs/en.json"));
  }

  async init() {
    await this.initUserLanguages();
    await this.initUserCountries();
    await this.initUserCufs();
  }

  private async initUserLanguages() {
    this.userLanguages = await tryber.tables.WpAppqProfileHasLang.do()
      .select("language_name")
      .where("profile_id", this.testerId)
      .then((res) => res.map((r) => r.language_name));
  }

  private async initUserCountries() {
    const country = await tryber.tables.WpAppqEvdProfile.do()
      .select("country")
      .where("id", this.testerId)
      .then((res) => (res.length ? res[0].country : ""));

    const countryCode = countryList.getAlpha2Code(country, "en");
    this.userCountry = countryCode || "";
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

  inTarget(targetRules: {
    languages?: string[];
    countries?: string[];
    cufs?: { id: number; values: (string | number)[] }[];
  }) {
    if (Object.keys(targetRules).length === 0) return true;
    const { languages, countries, cufs } = targetRules;

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

    return true;
  }
}
