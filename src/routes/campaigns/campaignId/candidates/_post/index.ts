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

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const parameters = this.getParameters();
    this.campaign = parseInt(parameters.campaign);
    const body = this.getBody();
    this.testerToSelect = body.tester_id;
    this.deviceToSelect = body.device || 0;
    this.db = {
      campaigns: new Campaigns(),
      profile: new Profile(),
      testerDevices: new TesterDevices(),
    };
  }

  protected async filter(): Promise<boolean> {
    if ((await this.campaignExists()) === false) {
      this.setError(404, new Error("Campaign does not exist") as OpenapiError);
      return false;
    }
    if ((await this.testerExists()) === false) {
      this.setError(404, new Error("Tester does not exist") as OpenapiError);
      return false;
    }
    if (await this.testerIsAlreadyCandidate()) {
      this.setError(403, new Error("Tester does not exist") as OpenapiError);
      return false;
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

  private async getTester() {
    return this.db.profile.get(this.testerToSelect);
  }

  private async getDeviceIdToSelect(): Promise<number> {
    const userDevices = (
      await this.db.testerDevices.query({
        where: [{ id_profile: this.testerToSelect }],
      })
    ).map((device) => device.id);
    if (!userDevices.length) return 0;

    if (this.deviceToSelect === "random") {
      return userDevices[Math.floor(Math.random() * userDevices.length)];
    }
    if (this.deviceToSelect > 0) {
      if (userDevices.includes(this.deviceToSelect)) {
        return this.deviceToSelect;
      }
      throw {
        status_code: 404,
        message: "Device does not exist for this Tester",
      };
    }
    return 0;
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
    let deviceItem;
    if (candidature.device > 0) {
      deviceItem = await new Devices().getOne(candidature.device);
      if (!deviceItem) throw new Error("Device does not exist");
    } else {
      deviceItem = "any" as const;
    }
    return {
      tester_id: candidature.tester_id,
      accepted: candidature.accepted == 1,
      campaignId: candidature.campaign_id,
      status: this.getCandidatureStatus(candidature.status),
      device: deviceItem,
    };
  }

  protected async prepare(): Promise<void> {
    try {
      const candidature = await this.candidateTester({
        tester: await this.getTester(),
        device: await this.getDeviceIdToSelect(),
      });

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
