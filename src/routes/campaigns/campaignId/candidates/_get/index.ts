/** OPENAPI-CLASS: get-campaigns-campaign-candidates */
import UserRoute from "@src/features/routes/UserRoute";
import OpenapiError from "@src/features/OpenapiError";
import Campaigns from "@src/features/db/class/Campaigns";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import CampaignApplications, {
  CampaignApplicationObject,
} from "@src/features/db/class/CampaignApplications";
import Level from "@src/features/db/class/Level";
import UserLevel from "@src/features/db/class/UserLevel";
import TesterDevices, {
  TesterDeviceObject,
} from "@src/features/db/class/TesterDevices";
import Os from "@src/features/db/class/Os";
import OsVersion from "@src/features/db/class/OsVersion";
import { application } from "express";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"];
  query: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["query"];
  parameters: StoplightOperations["get-campaigns-campaign-candidates"]["parameters"]["path"];
}> {
  private campaign_id: number;
  private db: {
    campaigns: Campaigns;
    applications: CampaignApplications;
    profile: Profile;
    userLevel: UserLevel;
    level: Level;
    devices: TesterDevices;
    os: Os;
    osVersion: OsVersion;
  };
  private applicationUsers: { [key: number]: ProfileObject } = {};
  private applications: CampaignApplicationObject[] | false = false;
  private userLevels: { [key: number]: { id: number; name: string } } = {};
  private testerDevices: { [key: number]: TesterDeviceObject[] } = {};
  private start: number;
  private limit: number;
  private hasLimit: boolean = false;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
    this.db = {
      campaigns: new Campaigns(),
      applications: new CampaignApplications(["user_id", "devices"]),
      profile: new Profile([
        "id",
        "name",
        "surname",
        "wp_user_id",
        "total_exp_pts",
      ]),
      userLevel: new UserLevel(),
      level: new Level(),
      devices: new TesterDevices(),
      os: new Os(),
      osVersion: new OsVersion(),
    };

    const query = this.getQuery();
    this.start = parseInt(query.start as unknown as string) || 0;
    this.limit = 10;
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      this.hasLimit = true;
    }
  }

  protected async init(): Promise<void> {
    const applications = await this.getApplications();
    const profiles = await this.initApplicationUsers(applications);
    this.filterInvalidUsersFromApplications(profiles);
    await this.initUserLevels(profiles);
    await this.initUserDevices(applications, profiles);
  }

  private filterInvalidUsersFromApplications(profiles: {
    [key: number]: ProfileObject;
  }) {
    if (!this.applications) throw new Error("Applications not initialized");
    this.applications = this.applications.filter((application) => {
      if (!profiles[application.user_id]) return false;
      const profile = profiles[application.user_id];
      if (profile.wp_user_id === null) return false;
      if (profile.isDeletedUser()) return false;
      return true;
    });
  }

  private async initUserDevices(
    applications: CampaignApplicationObject[],
    profiles: { [key: number]: ProfileObject }
  ) {
    const where = [];
    for (const application of applications) {
      if (application.devices) {
        if (application.devices === "0") {
          where.push(`(id_profile = ${profiles[application.user_id].id})`);
        } else {
          where.push(
            `(id_profile = ${
              profiles[application.user_id].id
            } AND id IN (${application.devices
              .split(",")
              .map((d) => parseInt(d))}))`
          );
        }
      }
    }
    if (where.length > 0) {
      const devices = await this.db.devices.queryWithCustomWhere({
        where: "WHERE " + where.join(" OR "),
      });
      for (const device of devices) {
        if (device.id_profile) {
          if (this.testerDevices[device.id_profile] === undefined) {
            this.testerDevices[device.id_profile] = [];
          }
          this.testerDevices[device.id_profile].push(device);
        }
      }
    }
  }

  private async initUserLevels(profiles: { [key: number]: ProfileObject }) {
    const levels = await this.getLevelDefinitions();
    const userLevels = await this.db.userLevel.query({
      where: [{ tester_id: Object.values(profiles).map((p) => p.id) }],
    });

    for (const userLevel of userLevels) {
      if (userLevel.tester_id && userLevel.level_id) {
        if (levels[userLevel.level_id]) {
          this.userLevels[userLevel.tester_id] = {
            id: userLevel.level_id,
            name: levels[userLevel.level_id],
          };
        }
      }
    }
  }

  private async getLevelDefinitions() {
    const levels: { [key: number]: string } = {};
    const levelData = await this.db.level.query({});
    for (const level of levelData) {
      if (level.id && level.name) {
        levels[level.id] = level.name;
      }
    }
    return levels;
  }

  private async initApplicationUsers(
    applications: CampaignApplicationObject[]
  ) {
    const applicationWpUserIds = applications.map(
      (application) => application.user_id
    );
    const profiles = await this.db.profile.query({
      where: [{ wp_user_id: applicationWpUserIds }],
    });
    for (const profile of profiles) {
      if (profile.wp_user_id && profile.id) {
        this.applicationUsers[profile.wp_user_id] = profile;
      }
    }
    return this.applicationUsers;
  }

  protected async filter() {
    if (this.hasAccessTesterSelection(this.campaign_id) === false) {
      this.setError(403, new OpenapiError("You are not authorized."));
      return false;
    }
    if ((await this.campaignExists()) === false) {
      this.setError(404, new OpenapiError("Campaign does not exists."));
      return false;
    }
    return true;
  }

  private async campaignExists() {
    return await this.db.campaigns.exists(this.campaign_id);
  }

  protected async prepare() {
    const applications = await this.getApplications();
    const applicationsWithProfile = this.addProfileTo(applications);
    const sortedApplications = this.sortApplications(applicationsWithProfile);
    const paginatedApplications = this.paginateApplications(sortedApplications);
    const formattedApplications = await this.formatApplications(
      paginatedApplications
    );

    this.setSuccess(200, {
      results: formattedApplications,
      size: paginatedApplications.length,
      start: this.start,
      limit: this.hasLimit ? this.limit : undefined,
      total: this.hasLimit ? applications.length : undefined,
    });
  }

  private async formatApplications(
    applications: ReturnType<typeof this.addProfileTo>
  ) {
    let results = [];
    for (const application of applications) {
      let devices = await this.getTesterDevices(application.id);

      results.push({
        id: application.id,
        name: application.name,
        surname: application.surname,
        experience: application.experience,
        level: this.getLevel(application.id),
        devices: devices,
      });
    }

    return results;
  }

  private paginateApplications(
    applications: ReturnType<typeof this.addProfileTo>
  ) {
    return applications.slice(this.start, this.start + this.limit);
  }

  private addProfileTo(applications: CampaignApplicationObject[]) {
    return applications.map((a) => {
      const profile = this.getProfile(a.user_id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      return {
        ...a,
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
        experience: profile.experience,
      };
    });
  }

  private sortApplications(applications: ReturnType<typeof this.addProfileTo>) {
    return applications.sort((a, b) => {
      const aId = a.id;
      const bId = b.id;
      const aLevelId = this.userLevels[aId] ? this.userLevels[aId].id : 0;
      const bLevelId = this.userLevels[bId] ? this.userLevels[bId].id : 0;
      return bLevelId - aLevelId;
    });
  }

  private async getTesterDevices(profileId: number) {
    const testerDevices = this.testerDevices[profileId];

    let devices: NonNullable<
      StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"]["results"]
    >[number]["devices"] = [];
    for (const testerDevice of testerDevices) {
      if (testerDevice.id) {
        const os = await this.db.os.get(testerDevice.platform_id);
        const osVersion = await this.db.osVersion.get(
          testerDevice.os_version_id
        );
        devices.push({
          ...(testerDevice.form_factor === "PC"
            ? {}
            : {
                manufacturer: testerDevice.manufacturer,
                model: testerDevice.model,
              }),
          id: testerDevice.id,
          os: os.name,
          osVersion: osVersion.display_name,
        });
      }
    }
    return devices;
  }

  private getLevel(testerId: number) {
    const userLevel = this.userLevels[testerId];
    if (userLevel) {
      return userLevel.name;
    }
    return "No Level";
  }

  private getProfile(wp_user_id: number) {
    const profile = this.applicationUsers[wp_user_id];
    if (
      !profile ||
      !profile.id ||
      !profile.name ||
      !profile.surname ||
      typeof profile.total_exp_pts === "undefined"
    ) {
      return false;
    }
    return {
      id: profile.id,
      name: profile.name,
      surname: profile.surname,
      experience: profile.total_exp_pts,
    };
  }

  private async getApplications() {
    if (!this.applications) {
      this.applications = await this.db.applications.query({
        where: [{ campaign_id: this.campaign_id }, { accepted: 0 }],
      });
    }
    return this.applications;
  }
}
