import Devices from "@src/features/class/Devices";
import debugMessage from "@src/features/debugMessage";
import createCandidature from "./createCandidature";
import testerShouldNotBeCandidate from "./testerShouldNotBeCandidate";
import AdminRoute from "@src/features/routes/AdminRoute";
import Campaigns from "@src/features/db/class/Campaigns";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import TesterDevices from "@src/features/db/class/TesterDevices";

/** OPENAPI-CLASS: post-campaigns-campaign-candidates */
export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["post-campaigns-campaign-candidates"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["post-campaigns-campaign-candidates"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private db: {
    campaigns: Campaigns;
    profile: Profile;
    testerDevices: TesterDevices;
  };
  private campaign: number;
  private testerToSelect: number;
  private deviceToSelect: number | "random";
  private invalidTesters: number[] = [];

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const parameters = this.getParameters();
    this.campaign = parseInt(parameters.campaign);
    const body = this.getBody();
    this.testerToSelect = body.tester_id;
    this.deviceToSelect = body.device || 0;
    this.invalidTesters = [];
    this.db = {
      campaigns: new Campaigns(),
      profile: new Profile(),
      testerDevices: new TesterDevices(),
    };
  }

  get validApplications() {
    if (this.invalidTesters.length) return [];
    return [{ tester: this.testerToSelect, device: this.deviceToSelect }];
  }

  protected async filter(): Promise<boolean> {
    if ((await this.campaignExists()) === false) {
      this.setError(404, new Error("Campaign does not exist") as OpenapiError);
      return false;
    }
    if ((await this.testerExists()) === false) {
      this.invalidTesters.push(this.testerToSelect);
    }
    if (await this.testerIsAlreadyCandidate()) {
      this.invalidTesters.push(this.testerToSelect);
    }
    if (!(await this.testerHasDevice())) {
      this.invalidTesters.push(this.testerToSelect);
    }

    return super.filter();
  }

  private async campaignExists() {
    return this.db.campaigns.exists(this.campaign);
  }
  private async testerExists() {
    return this.db.profile.exists(this.testerToSelect);
  }

  private async testerIsAlreadyCandidate() {
    try {
      await testerShouldNotBeCandidate(this.testerToSelect, this.campaign);
      return false;
    } catch {
      return true;
    }
  }

  private async testerHasDevice() {
    if (this.deviceToSelect === "random" || this.deviceToSelect === 0)
      return true;
    const userDevices = (
      await this.db.testerDevices.query({
        where: [{ id_profile: this.testerToSelect }],
      })
    ).map((device) => device.id);

    return userDevices.includes(this.deviceToSelect);
  }

  private async getDeviceIdToSelect(
    tester: number,
    device: number | "random"
  ): Promise<number> {
    const userDevices = await this.getAllTesterDevice(tester);
    if (!userDevices.length) return 0;

    if (device === "random") {
      return userDevices[Math.floor(Math.random() * userDevices.length)];
    }
    if (device > 0) {
      return device;
    }
    return 0;
  }

  private async getAllTesterDevice(tester: number) {
    return (
      await this.db.testerDevices.query({
        where: [{ id_profile: tester }],
      })
    ).map((device) => device.id);
  }

  private async candidateTester({
    tester,
    device,
  }: {
    tester: ProfileObject;
    device: number;
  }) {
    const candidature = await createCandidature(
      tester.wp_user_id,
      this.campaign,
      device
    );
    return {
      tester_id: candidature.tester_id,
      accepted: candidature.accepted == 1,
      campaignId: candidature.campaign_id,
      status: this.getCandidatureStatus(candidature.status),
      device: await this.getDeviceItem(candidature.device),
    };
  }

  private async getDeviceItem(device: number) {
    if (device === 0) return "any" as const;
    const deviceItem = await new Devices().getOne(device);
    if (!deviceItem) throw new Error("Device does not exist");
    return deviceItem;
  }

  protected async prepare(): Promise<void> {
    if (this.validApplications.length === 0) {
      this.setError(403, new Error("Invalid testers") as OpenapiError);
      return;
    }
    try {
      let candidature;
      for (const application of this.validApplications) {
        candidature = await this.candidateTester({
          tester: await this.db.profile.get(application.tester),
          device: await this.getDeviceIdToSelect(
            application.tester,
            application.device
          ),
        });
      }
      this.setSuccess(200, candidature);
    } catch (err) {
      debugMessage(err);
      this.setError(
        (err as OpenapiError).status_code || 403,
        err as OpenapiError
      );
      return;
    }
  }

  private getCandidatureStatus(status: number) {
    if (status === 0) return "ready" as const;
    if (status === -1) return "removed" as const;
    if (status === 1) return "excluded" as const;
    if (status === 2) return "in-progress" as const;
    if (status === 3) return "completed" as const;
    throw new Error("Invalid status");
  }
}
