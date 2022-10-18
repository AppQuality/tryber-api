import CampaignApplications, {
  CampaignApplicationObject,
} from "@src/features/db/class/CampaignApplications";
import Level from "@src/features/db/class/Level";
import Os from "@src/features/db/class/Os";
import OsVersion from "@src/features/db/class/OsVersion";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import Devices, {
  TesterDeviceObject,
} from "@src/features/db/class/TesterDevices";
import UserLevel from "@src/features/db/class/UserLevel";

class Selector {
  private applications: CampaignApplicationObject[] | false = false;
  private applicationUsers: { [key: number]: ProfileObject } = {};
  private testerDevices: { [key: number]: TesterDeviceObject[] } = {};
  private userLevels: { [key: number]: { id: number; name: string } } = {};
  private initialized: boolean = false;

  constructor(private readonly campaign: number) {}

  public async init() {
    if (this.initialized) return;

    const applications = new CampaignApplications();
    const applicationItems = await applications.query({
      where: [{ campaign_id: this.campaign }, { accepted: 0 }],
    });
    this.applicationUsers = await this.initApplicationUsers(applicationItems);
    this.applications = this.filterInvalidProfiles(applicationItems);
    await this.initUserDevices();
    this.applications = this.filterInvalidDevices(this.applications);
    await this.initUserLevels();
    this.initialized = true;
    return this.applications;
  }

  private async initApplicationUsers(
    applications: CampaignApplicationObject[]
  ) {
    const profile = new Profile();
    const applicationWpUserIds = applications.map(
      (application) => application.user_id
    );
    const profiles = await profile.query({
      where: [{ wp_user_id: applicationWpUserIds }],
    });
    const results: { [key: number]: ProfileObject } = {};
    for (const profile of profiles) {
      if (profile.wp_user_id && profile.id) {
        results[profile.wp_user_id] = profile;
      }
    }
    return results;
  }

  private async initUserLevels() {
    const userLevel = new UserLevel();
    const profiles = this.getApplicationsProfiles();
    const levels = await this.getLevelDefinitions();
    const userLevels = await userLevel.query({
      where: [{ tester_id: Object.values(profiles).map((p) => p.id) }],
    });

    for (const userLevel of userLevels) {
      if (
        userLevel.tester_id &&
        userLevel.level_id &&
        levels[userLevel.level_id]
      ) {
        this.userLevels[userLevel.tester_id] = {
          id: userLevel.level_id,
          name: levels[userLevel.level_id],
        };
      }
    }
  }

  private async getLevelDefinitions() {
    const level = new Level();
    const levels: { [key: number]: string } = {};
    const levelData = await level.query({});
    for (const level of levelData) {
      if (level.id && level.name) {
        levels[level.id] = level.name;
      }
    }
    return levels;
  }

  private filterInvalidDevices(applicationItems: CampaignApplicationObject[]) {
    return applicationItems.filter((application) => {
      const profile = this.getApplicationsUser(application);
      if (!profile.id) return false;
      if (!this.testerDevices[profile.id]) return false;
      return true;
    });
  }

  private filterInvalidProfiles(applicationItems: CampaignApplicationObject[]) {
    return applicationItems.filter((application) => {
      if (!this.getApplicationsUser(application)) return false;
      const profile = this.applicationUsers[application.user_id];
      if (profile.wp_user_id === null) return false;
      if (!profile.id) return false;
      if (profile.isDeletedUser()) return false;
      return true;
    });
  }

  private async initUserDevices() {
    if (!this.applications) throw new Error("Applications not initialized");
    const where = [];
    for (const application of this.applications) {
      const profile = this.getApplicationsUser(application);
      if (application.devices && profile) {
        if (application.devices === "0") {
          where.push(`(id_profile = ${profile.id}) AND enabled = 1`);
        } else {
          where.push(
            `(enabled = 1 AND id_profile = ${
              profile.id
            } AND id IN (${application.devices
              .split(",")
              .map((d) => parseInt(d))}))
           `
          );
        }
      }
    }
    if (where.length > 0) {
      const devices = new Devices();
      const deviceItems = await devices.queryWithCustomWhere({
        where: "WHERE " + where.join(" OR "),
      });
      for (const device of deviceItems) {
        if (device.id_profile) {
          if (this.testerDevices[device.id_profile] === undefined) {
            this.testerDevices[device.id_profile] = [];
          }
          this.testerDevices[device.id_profile].push(device);
        }
      }
    }
  }

  public getUserLevel(testerId: number) {
    const userLevelItem = this.userLevels[testerId];
    if (!userLevelItem) return { id: 0, name: "No level" };
    return userLevelItem;
  }

  public getApplicationsUser(application: CampaignApplicationObject) {
    return this.applicationUsers[application.user_id];
  }

  public async getApplications() {
    if (this.applications === false) {
      throw new Error("Applications not initialized");
    }
    const applicationWithProfiles = this.addProfileTo(this.applications);
    const applicationWithDevices = await this.addTesterDeviceTo(
      applicationWithProfiles
    );
    return applicationWithDevices;
  }

  private addProfileTo(applications: CampaignApplicationObject[]) {
    return applications.map((a) => {
      const profile = this.getProfile(a);
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

  private async addTesterDeviceTo(
    applications: ReturnType<typeof this.addProfileTo>
  ) {
    const results = [];
    for (const a of applications) {
      const devices = await this.getTesterDevices(a);
      if (!devices) {
        throw new Error("Profile not found");
      }
      results.push({
        ...a,
        devices,
      });
    }
    return results;
  }

  private async getTesterDevices(application: CampaignApplicationObject) {
    const profile = this.getApplicationsUser(application);
    if (!profile || !profile.id) throw new Error("Profile not found");
    const os = new Os();
    const osVersions = new OsVersion();
    const testerDevices = this.getUserDevices(profile.id);

    let devices: NonNullable<
      StoplightOperations["get-campaigns-campaign-candidates"]["responses"][200]["content"]["application/json"]["results"]
    >[number]["devices"] = [];
    for (const testerDevice of testerDevices) {
      const osItem = await os.get(testerDevice.platform_id);
      const osVersionItem = await osVersions.get(testerDevice.os_version_id);
      devices.push({
        ...(testerDevice.form_factor === "PC"
          ? {}
          : {
              manufacturer: testerDevice.manufacturer,
              model: testerDevice.model,
            }),
        id: testerDevice.id,
        os: osItem.name,
        osVersion: osVersionItem.display_name,
      });
    }
    return devices;
  }

  private getProfile(application: CampaignApplicationObject) {
    const profile = this.getApplicationsUser(application);

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

  public getApplicationsProfiles() {
    if (this.applications === false) {
      throw new Error("Applications not initialized");
    }
    const results: { [key: number]: ProfileObject } = {};
    for (const application of this.applications) {
      results[application.user_id] = this.applicationUsers[application.user_id];
    }
    return results;
  }

  public getUserDevices(profileId: number) {
    return this.testerDevices[profileId];
  }
}

export default Selector;
