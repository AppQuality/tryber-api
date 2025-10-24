/** OPENAPI-CLASS: post-users-me-payments */

import { tryber } from "@src/features/database";
import debugMessage from "@src/features/debugMessage";
import { sendTemplate } from "@src/features/mail/sendTemplate";
import UserRoute from "@src/features/routes/UserRoute";
import getCrowdOption from "@src/features/wp/getCrowdOption";
import checkProcessingPayment from "./checkProcessingPayment";

export default class Route extends UserRoute<{
  response: StoplightOperations["post-users-me-payments"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-users-me-payments"]["requestBody"]["content"]["application/json"];
}> {
  private booty = 0;
  private inpsContribution = 1.16;
  private _fiscalProfile:
    | {
        id: number;
        fiscal_category_name: string;
        address: string;
        address_number: string;
        postal_code: string;
        city: string;
        province: string;
        fiscal_id: string;
      }
    | undefined;

  protected async init() {
    await super.init();

    try {
      this.booty = await this.checkBooty();
    } catch (err) {
      this.setError(403, err as OpenapiError);
      throw err;
    }

    try {
      this._fiscalProfile = await this.checkFiscalProfile();
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

  private async checkBooty() {
    const testerId = this.getTesterId();
    const attributions = await tryber.tables.WpAppqPayment.do()
      .sum("amount", { as: "total" })
      .where("tester_id", testerId)
      .where("is_paid", 0)
      .where("is_requested", 0)
      .where("is_expired", 0)
      .first();

    if (!attributions || !attributions.total) {
      throw new Error("You don't have any booty to pay");
    }
    const threshold = await getCrowdOption("minimum_payout");
    if (threshold && attributions.total < parseFloat(threshold)) {
      throw new Error(`You need to have at least ${threshold} booty to pay`);
    }
    return attributions.total;
  }

  private async checkFiscalProfile() {
    const fiscalProfile = await this.retrieveFiscalProfile();

    if (!fiscalProfile) {
      throw new Error("You don't have a fiscal profile");
    }

    if (
      ["witholding-extra", "vat", "company", "internal"].includes(
        fiscalProfile.fiscal_category_name
      ) &&
      this.getBody().method.type === "paypal"
    ) {
      throw new Error("Your fiscal profile doesn't match the requirements");
    }
    return fiscalProfile;
  }

  private async retrieveFiscalProfile() {
    const result = await tryber.tables.WpAppqFiscalProfile.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("fiscal_category").withSchema("wp_appq_fiscal_profile"),
        tryber
          .ref("name")
          .withSchema("fiscal_category")
          .as("fiscal_category_name"),
        tryber.ref("address").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("address_number").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("postal_code").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("city").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("province").withSchema("wp_appq_fiscal_profile"),
        tryber.ref("fiscal_id").withSchema("wp_appq_fiscal_profile")
      )
      .join(
        "fiscal_category",
        "fiscal_category.id",
        "wp_appq_fiscal_profile.fiscal_category"
      )
      .where("tester_id", this.getTesterId())
      .where("is_active", 1)
      .where("is_verified", 1)
      .first();
    return result;
  }

  get fiscalProfile() {
    if (!this._fiscalProfile) {
      throw new Error("You don't have a fiscal profile");
    }
    return this._fiscalProfile;
  }

  get isStampRequired() {
    const fiscalData = this.calculateFiscalData();
    switch (this.fiscalProfile.fiscal_category_name) {
      case "vat": {
        const net_multiplier =
          "net_multiplier" in fiscalData ? fiscalData.net_multiplier : 1;
        return this.booty * net_multiplier >= 77.47;
      }
      case "company":
        return 0;
      case "witholding-extra":
        return this.booty / this.inpsContribution >= 77.47;
      case "withholding":
      default:
        return this.booty >= 77.47;
    }
  }

  protected async prepare() {
    const { requestId } = await this.createRequest();

    await this.updatePayments(requestId);

    await this.sendMail(requestId);
    this.setSuccess(200, {
      id: requestId,
    });
  }

  private async createRequest() {
    const body = this.getBody();
    const fiscalData = this.calculateFiscalData();

    let paypalEmail = null;
    let iban = null;
    let accountHolderName = null;
    if (body.method.type === "paypal") {
      paypalEmail = body.method.email;
    } else if (body.method.type === "iban") {
      iban = body.method.iban;
      accountHolderName = body.method.accountHolderName;
    }
    const request = await tryber.tables.WpAppqPaymentRequest.do()
      .insert({
        tester_id: this.getTesterId(),
        amount: fiscalData.net,
        is_paid: 0,
        fiscal_profile_id: this.fiscalProfile.id,
        amount_gross: this.booty,
        amount_withholding: parseFloat(fiscalData.witholding.toFixed(2)),
        paypal_email: paypalEmail ? paypalEmail : undefined,
        stamp_required: this.isStampRequired ? 1 : 0,
        withholding_tax_percentage: fiscalData.tax_percent,
        iban: iban ? iban : undefined,
        under_threshold: 0,
        ...("net_multiplier" in fiscalData
          ? { net_multiplier: fiscalData.net_multiplier }
          : {}),
        account_holder_name: accountHolderName ? accountHolderName : undefined,
      })
      .returning("id");

    const requestId = request[0].id ?? request[0];
    return { requestId };
  }

  private calculateFiscalData() {
    switch (this.fiscalProfile.fiscal_category_name) {
      case "withholding":
        return this.calculateFiscalDataWithholding();
      case "witholding-extra":
        return this.calculateFiscalDataWithholdingExtra();
      case "vat":
        return {
          tax_percent: 0,
          net: this.booty,
          witholding: 0,
          net_multiplier: 1.04,
        };
      case "company":
        return {
          tax_percent: 0,
          net: this.booty,
          witholding: 0,
          net_multiplier: 1.02,
        };
      default:
        return {
          tax_percent: 0,
          net: this.booty,
          witholding: 0,
        };
    }
  }

  private calculateFiscalDataWithholding() {
    return {
      tax_percent: 20,
      net: Math.round((this.booty + Number.EPSILON) * 80) / 100,
      witholding: Math.round((this.booty + Number.EPSILON) * 20) / 100,
    };
  }

  private calculateFiscalDataWithholdingExtra() {
    const net = parseFloat(
      (0.72 * ((this.booty + Number.EPSILON) / this.inpsContribution)).toFixed(
        2
      )
    );
    const witholding = this.booty - net;
    return {
      tax_percent:
        100 - parseFloat(((100 * 0.72) / this.inpsContribution).toFixed(2)),
      net,
      witholding,
    };
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
        is_expired: 0,
      });
  }

  private async sendMail(requestId: number) {
    const template = this.getTemplate();
    if (!template) return;

    await this.sendConfirmationMail({ template, requestId });
  }

  private getTemplate() {
    if (
      ["withholding", "non-italian"].includes(
        this.fiscalProfile.fiscal_category_name
      ) &&
      process.env.PAYMENT_REQUESTED_EMAIL
    )
      return process.env.PAYMENT_REQUESTED_EMAIL;
    else if (
      this.fiscalProfile.fiscal_category_name === "witholding-extra" &&
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA
    ) {
      return process.env.PAYMENT_INVOICE_RECAP_EMAIL_WITHOLDING_EXTRA;
    } else if (
      this.fiscalProfile.fiscal_category_name === "vat" &&
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_VAT
    ) {
      return process.env.PAYMENT_INVOICE_RECAP_EMAIL_VAT;
    } else if (
      this.fiscalProfile.fiscal_category_name === "company" &&
      process.env.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY
    ) {
      return process.env.PAYMENT_INVOICE_RECAP_EMAIL_COMPANY;
    }
  }

  private getSubject(requestId: number) {
    if (this.fiscalProfile.fiscal_category_name === "witholding-extra") {
      return `[Tryber] T${this.getTesterId()} - Crea la tua ritenuta d'acconto con questi dati | R${requestId}`;
    } else if (
      ["vat", "company"].includes(this.fiscalProfile.fiscal_category_name)
    ) {
      return `[Tryber] T${this.getTesterId()} - Crea la tua fattura con questi dati | R${requestId}`;
    } else {
      return `[Tryber] T${this.getTesterId()} - Payout Request | R${requestId}`;
    }
  }

  private adjustedNetAmount() {
    const fiscalData = this.calculateFiscalData();
    const stampReimbourse =
      ["witholding-extra", "vat", "company"].includes(
        this.fiscalProfile.fiscal_category_name
      ) && this.isStampRequired
        ? 2
        : 0;
    return (
      fiscalData.net *
        ("net_multiplier" in fiscalData ? fiscalData.net_multiplier : 1) +
      stampReimbourse
    ).toFixed(2);
  }

  private async sendConfirmationMail({
    template,
    requestId,
  }: {
    template: string;
    requestId: number;
  }) {
    const body = this.getBody();
    try {
      const tester = await tryber.tables.WpAppqEvdProfile.do()
        .select("name", "email")
        .where({ id: this.getTesterId() });
      const fiscalData = this.calculateFiscalData();
      const now = new Date();
      await sendTemplate({
        email: tester[0].email,
        subject: this.getSubject(requestId),
        ...(["vat", "witholding-extra", "company"].includes(
          this.fiscalProfile.fiscal_category_name
        ) && process.env.PAYMENT_INVOICE_RECAP_CC_EMAIL
          ? { cc: process.env.PAYMENT_INVOICE_RECAP_CC_EMAIL }
          : {}),
        template: template,
        optionalFields: {
          "{Profile.name}": tester[0].name,
          "{Payment.amount}": this.adjustedNetAmount(),
          "{Payment.amountGross}": this.booty.toFixed(2),
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
          "{Payment.grossINPS}": (this.booty / this.inpsContribution).toFixed(
            2
          ),
          "{Payment.address}": `${this.fiscalProfile.address}, ${this.fiscalProfile.address_number}, ${this.fiscalProfile.postal_code} ${this.fiscalProfile.city} (${this.fiscalProfile.province})`,
          "{Payment.fiscalType}": this.fiscalProfile.fiscal_category_name,
          "{Profile.identificationNumber}": this.fiscalProfile.fiscal_id,
          "{Profile.bankAccountName}":
            body.method.type === "iban" ? body.method.accountHolderName : "",
          "{Payment.stamp}": this.isStampRequired ? "2.00€" : "-",
          "{Payment.tax8INPS}": (
            (this.booty / this.inpsContribution) *
            0.08
          ).toFixed(2),
          "{Payment.taxWitholdingExtra}": (
            (this.booty / this.inpsContribution) *
            0.2
          ).toFixed(2),
          "{Payment.tax4INPS}": (this.booty * 0.04).toFixed(2),
          "{Payment.taxWitholdingCompany}": (this.booty * 0.2).toFixed(2),
          "{Payment.taxCompany}": (this.booty * 0.22).toFixed(2),
        },
      });
    } catch (err) {
      debugMessage(err);
    }
  }
}
