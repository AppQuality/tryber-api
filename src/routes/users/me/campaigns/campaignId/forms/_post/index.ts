import { CampaignObject } from "@src/features/db/class/Campaigns";
import UserRoute from "@src/features/routes/UserRoute";
import Campaigns from "@src/features/db/class/Campaigns";
import TesterDevices, {
  TesterDeviceObject,
} from "@src/features/db/class/TesterDevices";
import PreseselectionFormFields from "@src/features/db/class/PreselectionFormFields";
import PreseselectionFormData from "@src/features/db/class/PreselectionFormData";
import QuestionFactory from "../QuestionFactory";
import Question from "../QuestionFactory/Questions";
import CampaignApplications from "@src/features/db/class/CampaignApplications";

/** OPENAPI-CLASS: post-users-me-campaigns-campaignId-forms */

class RouteItem extends UserRoute<{
  response: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["responses"]["200"];
  parameters: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["parameters"]["path"];
  body: StoplightOperations["post-users-me-campaigns-campaignId-forms"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private deviceId: number[] | false;
  private device: TesterDeviceObject[] | false = false;
  private form: NonNullable<
    StoplightOperations["post-users-me-campaigns-campaignId-forms"]["requestBody"]["content"]["application/json"]["form"]
  >;

  private db: {
    campaigns: Campaigns;
    devices: TesterDevices;
    fields: PreseselectionFormFields;
    data: PreseselectionFormData;
    applications: CampaignApplications;
  };

  constructor(options: RouteItem["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    const body = this.getBody();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
      devices: new TesterDevices(),
      fields: new PreseselectionFormFields(),
      data: new PreseselectionFormData(),
      applications: new CampaignApplications(),
    };
    this.deviceId = body.device || false;
    this.form = body.form || [];
  }

  protected async filter() {
    if ((await this.campaignExist()) === false) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.applicationIsAvailable()) === false) {
      this.setError(403, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.testerCanApply()) === false) {
      this.setError(403, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if (this.deviceId === false) {
      this.setError(406, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.isDeviceAcceptable()) === false) {
      this.setError(403, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    return true;
  }

  private async campaignExist() {
    try {
      await this.getCampaign();
      return true;
    } catch (e) {
      return false;
    }
  }

  private async applicationIsAvailable() {
    return (await this.getCampaign()).isApplicationAvailable();
  }

  private async testerCanApply() {
    return (await this.getCampaign()).testerHasAccess(this.getTesterId());
  }

  private async isDeviceAcceptable() {
    try {
      return await this.getDeviceForApplication();
    } catch (e) {
      return false;
    }
  }

  private async getCampaign() {
    if (this.campaign === false) {
      this.campaign = await this.db.campaigns.get(this.campaignId);
    }
    return this.campaign;
  }

  private async getDeviceForApplication() {
    if (this.device === false) {
      if (this.deviceId === false) throw new Error("Device not accepted");
      const devices = await this.db.devices.query({
        where: [{ id: this.deviceId }],
      });
      const campaign = await this.getCampaign();
      for (const device of devices) {
        if (!campaign.isOsAccepted(device.platform_id)) {
          throw new Error("Device not accepted");
        }
      }
      this.device = devices;
    }
    return this.device;
  }

  protected async prepare(): Promise<void> {
    try {
      await this.handleForm();
      await this.applyToCampaign();
    } catch (e) {
      this.setError(403, e as OpenapiError);
      return;
    }
    this.setSuccess(200, {});
  }

  private async applyToCampaign() {
    await this.db.applications.insert({
      campaign_id: this.campaignId,
      user_id: this.getWordpressId(),
      devices: this.deviceId.toString(),
    });
  }

  private async handleForm() {
    const questionItems = await this.getQuestionItems();
    await this.checkQuestionValidity(questionItems);
    for (const field of this.form) {
      if (questionItems.hasOwnProperty(field.question)) {
        const question = questionItems[field.question];
        await question.insertData({
          campaignId: this.campaignId,
          data: field,
        });
      }
    }
  }

  private async checkQuestionValidity(questionItems: {
    [key: number]: Question<any>;
  }) {
    for (const field of this.form) {
      if (questionItems.hasOwnProperty(field.question)) {
        const question = questionItems[field.question];
        if (
          !(await question.isDataInsertable({
            campaignId: this.campaignId,
            data: field,
          }))
        ) {
          throw {
            status_code: 403,
            message:
              "Data for question id:" +
              (await question.getItem()).id +
              " is not insertable",
          } as OpenapiError;
        }
      }
    }
  }

  private async getQuestionItems() {
    const questionItems: { [key: number]: Question<any> } = {};
    for (const field of this.form) {
      const question = await QuestionFactory.create(
        await this.db.fields.get(field.question),
        this.getTesterId()
      );
      if (question) {
        questionItems[field.question] = question;
      }
    }
    return questionItems;
  }
}

export default RouteItem;
