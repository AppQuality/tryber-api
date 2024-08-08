import { tryber } from "@src/features/database";
import countryList from "i18n-iso-countries";

export class UserTargetChecker {
  private testerId: number;

  private userLanguages: number[] = [];
  private userCountry: string = "";

  constructor({ testerId }: { testerId: number }) {
    this.testerId = testerId;
    countryList.registerLocale(require("i18n-iso-countries/langs/en.json"));
  }

  async init() {
    await this.initUserLanguages();
    await this.initUserCountries();
  }

  private async initUserLanguages() {
    this.userLanguages = await tryber.tables.WpAppqProfileHasLang.do()
      .select("language_id")
      .where("profile_id", this.testerId)
      .then((res) => res.map((r) => r.language_id));
  }

  private async initUserCountries() {
    const country = await tryber.tables.WpAppqEvdProfile.do()
      .select("country")
      .where("id", this.testerId)
      .then((res) => (res.length ? res[0].country : ""));

    const countryCode = countryList.getAlpha2Code(country, "en");
    this.userCountry = countryCode || "";
  }

  inTarget(targetRules: { languages?: number[]; countries?: string[] }) {
    if (Object.keys(targetRules).length === 0) return true;
    const { languages, countries } = targetRules;

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

    return true;
  }
}
