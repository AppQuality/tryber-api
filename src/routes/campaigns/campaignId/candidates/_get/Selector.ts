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
import PreselectionFormData, {
  PreselectionFormDataObject,
} from "@src/features/db/class/PreselectionFormData";
import PreselectionForm from "@src/features/db/class/PreselectionForms";
import PreselectionFormFields, {
  PreselectionFormFieldsObject,
} from "@src/features/db/class/PreselectionFormFields";

class InvalidQuestionError extends Error {}

type Field = { type: "question"; id: number };
class Selector {
  private applications: CampaignApplicationObject[] | false = false;
  private applicationUsers: { [key: number]: ProfileObject } = {};
  private testerDevices: { [key: number]: TesterDeviceObject[] } = {};
  private formFields: { [key: number]: PreselectionFormFieldsObject } = {};
  private userLevels: { [key: number]: { id: number; name: string } } = {};
  private userQuestions: {
    [key: number]: { id: number; title: string; value: string }[];
  } = {};
  private initialized: boolean = false;
  private readonly fields: Field[];

  constructor(private readonly campaign: number, fields?: Field[]) {
    this.fields = fields || [];
  }

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

    await this.initUserQuestions();

    this.initialized = true;
    return this.applications;
  }

  private async initUserQuestions() {
    const questionFields = this.fields.filter(
      (field) => field.type === "question"
    );
    if (questionFields.length === 0) return;

    const formFieldsItems = await this.getPreselectionFormFields(
      questionFields
    );
    for (const item of formFieldsItems) {
      if (item.id) {
        this.formFields[item.id] = item;
      }
    }
    const formData = new PreselectionFormData();
    const formDataItems = await formData.query({
      where: [
        {
          field_id: questionFields.map((f) => f.id),
          tester_id: this.getSelectedTesterIds(),
        },
      ],
    });

    for (const item of formDataItems) {
      if (!this.userQuestions[item.tester_id]) {
        this.userQuestions[item.tester_id] = [];
      }
      const formField = formFieldsItems.find((f) => f.id === item.field_id);
      if (formField) {
        this.userQuestions[item.tester_id].push({
          id: item.field_id,
          title: formField.short_name
            ? formField.short_name
            : formField.question,
          value: item.value,
        });
      }
    }
  }

  private getSelectedTesterIds() {
    return Object.values(this.applicationUsers).map((p) => p.id);
  }

  private async getPreselectionFormFields(questionFields: Field[]) {
    const formId = await this.getPreselectionFormId();
    const formFields = new PreselectionFormFields();
    const formFieldsItems = await formFields.query({
      where: [{ id: questionFields.map((f) => f.id) }],
    });
    if (formFieldsItems.some((f) => f.form_id !== formId)) {
      throw new InvalidQuestionError();
    }
    return formFieldsItems;
  }

  private async getPreselectionFormId() {
    const form = new PreselectionForm();
    const formItems = await form.query({
      where: [{ campaign_id: this.campaign }],
      limit: 1,
    });
    if (!formItems.length) throw new InvalidQuestionError();
    return formItems[0].id;
  }

  private async initApplicationUsers(
    applications: CampaignApplicationObject[]
  ) {
    const profile = new Profile();
    const applicationWpUserIds = applications.map(
      (application) => application.user_id
    );
    if (applicationWpUserIds.length === 0) return {};
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
    if (Object.keys(profiles).length === 0) return {};
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

    const applicationWithQuestions = this.addQuestionsTo(
      applicationWithDevices
    );

    return applicationWithQuestions;
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

  private addQuestionsTo(
    applications: Awaited<ReturnType<typeof this.addTesterDeviceTo>>
  ): (Awaited<ReturnType<typeof this.addTesterDeviceTo>>[number] & {
    questions?: { id: number; title: string; value: string }[];
  })[] {
    const results = applications.map((application) => {
      if (this.userQuestions.hasOwnProperty(application.id)) {
        return {
          ...application,
          questions: this.userQuestions[application.id],
        };
      }
      return application;
    });
    return results.map((r) => {
      if (Object.keys(this.formFields).length) {
        let questions: typeof this.userQuestions[number] = [];
        if (r.hasOwnProperty("questions")) {
          questions = r.questions;
        }

        for (const field of Object.values(this.formFields)) {
          const doesFieldAlreadyExist = questions.some(
            (q) => q.id === field.id
          );
          if (!doesFieldAlreadyExist) {
            questions.push({
              id: field.id,
              title: field.short_name ? field.short_name : field.question,
              value: "-",
            });
          }
        }
        return {
          ...r,
          questions,
        };
      }
      return r;
    });
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
export type { Field };
export { InvalidQuestionError };
