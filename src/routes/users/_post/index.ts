/** OPENAPI-CLASS: post-users */

import { tryber } from "@src/features/database";
import { send } from "@src/features/mail/send";
import Route from "@src/features/routes/Route";
import createWordpressUser, {
  EmailAlreadyRegisteredError,
} from "@src/features/wp/createWordpressUser";

export default class UserPostRoute extends Route<{
  response: StoplightOperations["post-users"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-users"]["requestBody"]["content"]["application/json"];
}> {
  private userData: {
    name: string;
    surname: string;
    email: string;
    password: string;
    username: string;
    birthDate: string;
    country: string;
  };
  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const body = this.getBody();

    const nameSlug = this.slugify(body.name);
    const surnameSlug = this.slugify(body.surname);
    const username = `${nameSlug}-${surnameSlug}`;

    const d = new Date(body.birthDate);
    this.userData = {
      name: this.removeSpecialCharacter(body.name),
      surname: this.removeSpecialCharacter(body.surname),
      email: body.email,
      password: body.password,
      username: username,
      country: body.country,
      birthDate: d.toISOString().split(".")[0].replace("T", " "),
    };
  }

  private removeSpecialCharacter(str: string) {
    return str
      .replace(/\s\s+/, " ")
      .replace(/[^A-Za-zÀ-ÿ' ]/gm, " ")
      .trim();
  }

  private slugify(str: string) {
    return str
      .toLowerCase()
      .replace(/'/g, "+")
      .replace(/[^a-zA-Z0-9_+]+/g, " ")
      .replace(/ /g, "-");
  }

  protected async prepare() {
    try {
      const testerId = await this.createTester();

      await this.sendWelcomeMail(testerId);
      await this.saveReferral(testerId);

      const result = await this.getTester(testerId);
      this.setSuccess(201, result);
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        return this.setError(412, err as OpenapiError);
      }
      this.setError(
        (err as OpenapiError).status_code || 400,
        err as OpenapiError
      );
    }
  }

  private async createTester() {
    const userId = await createWordpressUser(
      this.userData.username,
      this.userData.email,
      this.userData.password
    );

    const result = await tryber.tables.WpAppqEvdProfile.do()
      .insert({
        name: this.userData.name,
        surname: this.userData.surname,
        country: this.userData.country,
        birth_date: this.userData.birthDate,
        email: this.userData.email,
        wp_user_id: userId,
        employment_id: 0,
        education_id: 0,
      })
      .returning("id");
    const testerId = result[0].id ?? result[0];

    return testerId;
  }

  private async getTester(testerId: number) {
    let tester = await tryber.tables.WpAppqEvdProfile.do()
      .select("id")
      .where("id", testerId)
      .first();
    return tester;
  }

  private async sendWelcomeMail(testerId: number) {
    const mailTemplate = await tryber.tables.WpAppqUnlayerMailTemplate.do()
      .select("html_body")
      .join(
        "wp_appq_event_transactional_mail",
        "wp_appq_event_transactional_mail.template_id",
        "wp_appq_unlayer_mail_template.id"
      )
      .where(
        "wp_appq_event_transactional_mail.event_name",
        this.userData.country == "Italy" ? "welcome_mail_it" : "welcome_mail_en"
      )
      .first();

    if (!mailTemplate) return;
    let welcomeTemplate = mailTemplate.html_body;
    const optionalFields = {
      "{Profile.id}": `T${testerId}`,
      "{Profile.name}": this.userData.name,
      "{Profile.surname}": this.userData.surname,
      "{Profile.email}": this.userData.email,
      "{Profile.country}": this.userData.country,
      "{Profile.birth}": this.userData.birthDate,
    };

    for (const key in optionalFields) {
      if (welcomeTemplate.includes(key)) {
        welcomeTemplate = welcomeTemplate.replace(
          key,
          optionalFields[key as keyof typeof optionalFields]
        );
      }
    }

    send({
      to: this.userData.email,
      subject: "Thank you for joining Tryber Community!",
      html: welcomeTemplate,
    });
  }

  private async saveReferral(testerId: number) {
    const { referral } = this.getBody();
    if (!referral || referral.match(/^[0-9]+-[0-9]+$/) === null) return;

    const referralData = referral.split("-");
    if (referralData.length !== 2) return;
    const [referralId, campaignId] = referralData;

    await tryber.tables.WpAppqReferralData.do().insert({
      referrer_id: parseInt(referralId),
      tester_id: testerId,
      campaign_id: parseInt(campaignId),
    });
  }
}
