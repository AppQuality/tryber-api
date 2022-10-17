import debugMessage from "@src/features/debugMessage";
import createCandidature from "./createCandidature";
import testerShouldNotBeSelected from "./testerShouldNotBeSelected";
import AdminRoute from "@src/features/routes/AdminRoute";
import Campaigns from "@src/features/db/class/Campaigns";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import TesterDevices from "@src/features/db/class/TesterDevices";

/** OPENAPI-CLASS: post-campaigns-campaign-candidates */
export default class RouteItem extends AdminRoute<{
  response:
    | StoplightOperations["post-campaigns-campaign-candidates"]["responses"]["200"]["content"]["application/json"]
    | StoplightOperations["post-campaigns-campaign-candidates"]["responses"]["207"]["content"]["application/json"];

  body: StoplightOperations["post-campaigns-campaign-candidates"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private db: {
    campaigns: Campaigns;
    profile: Profile;
    testerDevices: TesterDevices;
  };
  private campaign: number;
  private invalidTesters: number[] = [];
  private selection: { device: number | "random"; tester: number }[] = [];

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const parameters = this.getParameters();
    this.campaign = parseInt(parameters.campaign);
    const body = this.getBody();
    if (Array.isArray(body)) {
      this.selection = body.map((item) => ({
        tester: item.tester_id,
        device: item.device || 0,
      }));
    } else {
      this.selection = [{ tester: body.tester_id, device: body.device || 0 }];
    }
    this.invalidTesters = [];
    this.db = {
      campaigns: new Campaigns(),
      profile: new Profile(),
      testerDevices: new TesterDevices(),
    };
  }

  get validApplications() {
    return this.selection.filter(
      (application) => !this.invalidTesters.includes(application.tester)
    );
  }

  protected async filter(): Promise<boolean> {
    if ((await super.filter()) === false) return false;
    if ((await this.campaignExists()) === false) {
      this.setError(404, new Error("Campaign does not exist") as OpenapiError);
      return false;
    }
    for (const application of this.selection) {
      if ((await this.testerExists(application.tester)) === false) {
        this.invalidTesters.push(application.tester);
      }
    }
    for (const application of this.selection) {
      if (await this.testerIsAlreadyCandidate(application.tester)) {
        this.invalidTesters.push(application.tester);
      }
    }
    for (const application of this.selection) {
      if (!(await this.testerHasDevice(application))) {
        this.invalidTesters.push(application.tester);
      }
    }

    return true;
  }

  private async campaignExists() {
    return this.db.campaigns.exists(this.campaign);
  }
  private async testerExists(tester: number) {
    return this.db.profile.exists(tester);
  }

  private async testerIsAlreadyCandidate(tester: number) {
    try {
      await testerShouldNotBeSelected(tester, this.campaign);
      return false;
    } catch {
      return true;
    }
  }

  private async testerHasDevice(application: typeof this.selection[number]) {
    if (application.device === 0 || application.device === "random")
      return true;
    const userDevices = (
      await this.db.testerDevices.query({
        where: [{ id_profile: application.tester }],
      })
    ).map((device) => device.id);

    return userDevices.includes(application.device);
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
      device: candidature.device === 0 ? ("any" as const) : candidature.device,
    };
  }

  protected async prepare(): Promise<void> {
    if (this.validApplications.length === 0) {
      this.setError(403, new Error("Invalid testers") as OpenapiError);
      return;
    }
    try {
      let candidature: Awaited<ReturnType<typeof this.candidateTester>>[] = [];
      for (const application of this.validApplications) {
        candidature.push(
          await this.candidateTester({
            tester: await this.db.profile.get(application.tester),
            device: await this.getDeviceIdToSelect(
              application.tester,
              application.device
            ),
          })
        );
      }
      if (this.invalidTesters.length) {
        this.setSuccess(207, {
          results: candidature,
          invalidTesters: this.invalidTesters,
        });
        return;
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
