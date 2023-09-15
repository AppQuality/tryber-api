/** OPENAPI-CLASS: post-users-me-payments */

import { tryber } from "@src/features/database";
import debugMessage from "@src/features/debugMessage";
import { sendTemplate } from "@src/features/mail/sendTemplate";
import UserRoute from "@src/features/routes/UserRoute";
import checkBooty from "./checkBooty";
import checkFiscalProfile from "./checkFiscalProfile";
import checkProcessingPayment from "./checkProcessingPayment";

export default class Route extends UserRoute<{
  response: StoplightOperations["post-users-me-payments"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-users-me-payments"]["requestBody"]["content"]["application/json"];
}> {
  private booty = 0;
  private _fiscalProfile: { id: number; fiscal_category: number } | undefined;

  protected async init() {
    await super.init();

    try {
      this.booty = await checkBooty(this.getTesterId());
    } catch (err) {
      this.setError(403, err as OpenapiError);
      throw err;
    }

    try {
      this._fiscalProfile = await checkFiscalProfile(this.getTesterId());
    } catch (err) {
      this.setError(403, err as OpenapiError);
      throw err;
    }

    try {
      await checkProcessingPayment(this.getTesterId());
    } catch (err) {
      this.setError(403, err as OpenapiError);
      throw err;
    }
  }

  get fiscalProfile() {
    if (!this._fiscalProfile) {
      throw new Error("You don't have a fiscal profile");
    }
    return this._fiscalProfile;
  }

  protected async prepare() {
    const { requestId } = await this.createRequest();

    await this.updatePayments(requestId);

    await this.sendMail(this.booty);
    this.setSuccess(200, {
      id: requestId,
    });
  }

  private async createRequest() {
    const body = this.getBody();
    const fiscalData = {
      tax_percent: 0,
      gross: this.booty,
      witholding: 0,
    };
    if (this.fiscalProfile.fiscal_category === 1) {
      fiscalData.tax_percent = 20;
      fiscalData.gross = Math.round((this.booty + Number.EPSILON) * 125) / 100;
      fiscalData.witholding =
        Math.round((this.booty + Number.EPSILON) * 25) / 100;
    }

    let paypalEmail = null;
    let iban = null;
    let accountHolderName = null;
    if (body.method.type === "paypal") {
      paypalEmail = body.method.email;
    } else if (body.method.type === "iban") {
      iban = body.method.iban;
      accountHolderName = body.method.accountHolderName;
    }

    const isStampRequired = fiscalData.gross > 77.47;
    const request = await tryber.tables.WpAppqPaymentRequest.do()
      .insert({
        tester_id: this.getTesterId(),
        amount: this.booty,
        is_paid: 0,
        fiscal_profile_id: this.fiscalProfile.id,
        amount_gross: fiscalData.gross,
        amount_withholding: fiscalData.witholding,
        paypal_email: paypalEmail ? paypalEmail : undefined,
        stamp_required: isStampRequired ? 1 : 0,
        withholding_tax_percentage: fiscalData.tax_percent,
        iban: iban ? iban : undefined,
        under_threshold: 0,
        account_holder_name: accountHolderName ? accountHolderName : undefined,
      })
      .returning("id");

    const requestId = request[0].id ?? request[0];
    return { requestId };
  }

  private async updatePayments(requestId: number) {
    await tryber.tables.WpAppqPayment.do()
      .update({
        is_requested: 1,
        request_id: requestId,
      })
      .where({
        tester_id: this.getTesterId(),
        is_requested: 0,
      });
  }

  private async sendMail(booty: number) {
    const body = this.getBody();
    try {
      if (process.env.PAYMENT_REQUESTED_EMAIL) {
        const tester = await tryber.tables.WpAppqEvdProfile.do()
          .select("name", "email")
          .where({ id: this.getTesterId() });

        const now = new Date();

        await sendTemplate({
          email: tester[0].email,
          subject: "[Tryber] Payout Request",
          template: process.env.PAYMENT_REQUESTED_EMAIL,
          optionalFields: {
            "{Profile.name}": tester[0].name,
            "{Payment.amount}": booty,
            "{Payment.requestDate}": now.toLocaleString("it", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
            "{Payment.methodLabel}":
              body.method.type === "paypal" ? "PayPal Email" : "IBAN",
            "{Payment.method}":
              body.method.type === "paypal"
                ? body.method.email
                : body.method.iban,
          },
        });
      }
    } catch (err) {
      debugMessage(err);
    }
  }
}
