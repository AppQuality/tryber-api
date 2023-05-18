import { tryber } from "@src/features/database";
import Devices from "./Devices";

type AdditionalField =
  StoplightComponents["schemas"]["CampaignAdditionalField"];

type CampaignSelectItem = { id: number; name: string };
class Campaign {
  public id: number;
  public title: string = "";
  public min_allowed_media: number = 0;
  public campaign_type: -1 | 0 | 1 = 0;
  public bug_lang: 0 | 1 = 0;
  public ready: Promise<boolean>;
  constructor(id: number, init: boolean = true) {
    this.id = id;
    this.ready = Promise.resolve(false);
    if (init) {
      this.init();
    }
  }

  public init() {
    this.ready = new Promise(async (resolve, reject) => {
      const campaignData = await tryber.tables.WpAppqEvdCampaign.do()
        .select([
          "id",
          "title",
          "min_allowed_media",
          "campaign_type",
          "bug_lang",
        ])
        .where({ id: this.id })
        .first();
      if (!campaignData) {
        return reject(Error("Invalid campaign data"));
      }
      this.title = campaignData.title;
      this.min_allowed_media = campaignData.min_allowed_media;
      this.campaign_type = campaignData.campaign_type as 0 | 1 | -1;
      this.bug_lang = campaignData.bug_lang as 0 | 1;
      this.ready = Promise.resolve(true);
      resolve(true);
    });
  }

  public async getAvailableSeverities() {
    const customSeverities = (
      await tryber.tables.WpAppqAdditionalBugSeverities.do().select(
        "bug_severity_id"
      )
    ).map((c) => c.bug_severity_id);
    const severities = await getSeverities();
    if (!customSeverities.length) {
      return {
        valid: severities.map((s) => s.name),
        invalid: [],
      };
    }
    return {
      valid: severities
        .filter((s) => customSeverities.includes(s.id))
        .map((s) => s.name),
      invalid: severities
        .filter((s) => !customSeverities.includes(s.id))
        .map((s) => s.name),
    };

    async function getSeverities() {
      return (
        await tryber.tables.WpAppqEvdSeverity.do().select(["id", "name"])
      ).map((s) => ({
        ...s,
        name: s.name.toUpperCase(),
      }));
    }
  }

  public async getAvailableTypes() {
    const customTypes = (
      await tryber.tables.WpAppqAdditionalBugTypes.do().select("bug_type_id")
    ).map((c) => c.bug_type_id);
    const types = await getTypes();
    if (!customTypes.length) {
      return {
        valid: types.map((s) => s.name),
        invalid: [],
      };
    }
    return {
      valid: types.filter((s) => customTypes.includes(s.id)).map((s) => s.name),
      invalid: types
        .filter((s) => !customTypes.includes(s.id))
        .map((s) => s.name),
    };

    async function getTypes(): Promise<{ id: number; name: string }[]> {
      return (
        await tryber.tables.WpAppqEvdBugType.do()
          .select(["id", "name"])
          .where({ is_enabled: 1 })
      ).map((s: typeof types[0]) => ({
        ...s,
        name: s.name.toUpperCase(),
      }));
    }
  }

  public async getAvailableReplicabilities() {
    const customReplicabilities = (
      await tryber.tables.WpAppqAdditionalBugReplicabilities.do().select(
        "bug_replicability_id"
      )
    ).map((c) => c.bug_replicability_id);
    const replicabilities = await getReplicabilities();
    if (!customReplicabilities.length) {
      return {
        valid: replicabilities.map((s) => s.name),
        invalid: [],
      };
    }
    return {
      valid: replicabilities
        .filter((s) => customReplicabilities.includes(s.id))
        .map((s) => s.name),
      invalid: replicabilities
        .filter((s) => !customReplicabilities.includes(s.id))
        .map((s) => s.name),
    };

    async function getReplicabilities(): Promise<
      { id: number; name: string }[]
    > {
      return (
        await tryber.tables.WpAppqEvdBugReplicability.do().select([
          "id",
          "name",
        ])
      ).map((s: typeof replicabilities[0]) => ({
        ...s,
        name: s.name.toUpperCase(),
      }));
    }
  }

  public async isUserCandidate(userId: string, isAdmin: boolean = false) {
    const candidature = await this.getUserCandidature(userId, isAdmin);
    if (candidature.length === 0) return false;
    return true;
  }

  public async getUserUseCases(userId: string, isAdmin: boolean = false) {
    const candidatureData = await this.getUserCandidature(userId, isAdmin);

    if (candidatureData.length === 0) return [];
    let useCases = await tryber.tables.WpAppqCampaignTask.do()
      .select("id", "title as name", "group_id")
      .whereIn("group_id", [candidatureData[0].group_id, 0, -1])
      .where({ campaign_id: this.id })
      .orderBy("position", "asc")
      .orderBy("id", "asc");
    const multigroupUsecase = useCases.filter((u) => u.group_id === -1);
    if (multigroupUsecase.length) {
      const UseCaseGroups: number[] = (
        await tryber.tables.WpAppqCampaignTaskGroup.do()
          .select("task_id")
          .whereIn("group_id", [candidatureData[0].group_id, 0])
      ).map((g: { task_id: number }) => g.task_id);
      useCases = useCases.filter(
        (u) => u.group_id !== -1 || UseCaseGroups.includes(u.id)
      );
    }

    const result = useCases.map((u) => ({
      id: u.id,
      name: u.name,
    }));
    return [...result, { id: -1, name: "Not a specific usecase" }];
  }

  get hasBugForm() {
    return this.campaign_type !== -1;
  }

  public async getAvailableFileExtensions() {
    const options = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where({
        option_name: "options_appq_valid_upload_extensions",
      })
      .first();
    if (!options) return [];
    return options.option_value
      .split(",")
      .map((option: string) => `.${option}`);
  }

  public async getAdditionalFields() {
    const additionals = await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select("id", "slug", "title", "type", "validation", "error_message")
      .where({ cp_id: this.id });
    if (additionals.length === 0) return undefined;
    return additionals.map((item) => {
      const result = {
        id: item.id,
        slug: item.slug,
        name: item.title,
        error: item.error_message,
      };
      if (item.type === "regex") {
        return {
          ...result,
          type: "text" as const,
          regex: item.validation,
        };
      }
      if (item.type === "select") {
        return {
          ...result,
          type: "select" as const,
          options: item.validation.split(";"),
        };
      }
      throw new Error("Invalid additional field type");
    });
  }

  public async getBugLanguageMessage() {
    if (!(await this.ready)) throw Error("Campaign not initialized");
    if (this.bug_lang === 0) return undefined;
    const meta = await tryber.tables.WpAppqCpMeta.do()
      .select("meta_key", "meta_value")
      .where({
        campaign_id: this.id,
      })
      .whereIn("meta_key", ["bug_lang_message", "bug_lang_code"]);
    if (meta.length === 0) return undefined;
    const message = meta.find(
      (m) => m.meta_key === "bug_lang_message"
    )?.meta_value;
    const code = meta
      .find((m) => m.meta_key === "bug_lang_code")
      ?.meta_value.toUpperCase();
    if (!message || !code) return undefined;
    return { message, code };
  }
  public async getTitleRule() {
    const meta = await tryber.tables.WpAppqCpMeta.do()
      .select("meta_key", "meta_value")
      .where({
        campaign_id: this.id,
        meta_key: "bug_title_rule",
      });

    if (meta.length === 0) return undefined;
    if (meta[0].meta_value === "1") return true;
    return undefined;
  }

  public async getUserCandidature(userId: string, isAdmin: boolean) {
    const candidature = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("selected_device", "group_id")
      .where({
        user_id: Number(userId),
        campaign_id: this.id,
        accepted: 1,
      });
    if (isAdmin && candidature.length === 0)
      return [{ selected_device: -1, group_id: 0 }];
    return candidature;
  }
  public async getAvailableDevices(user: {
    userId: string;
    testerId: number;
    isAdmin: boolean;
  }): Promise<
    | {
        id: number;
        type: string;
        device:
          | {
              pc_type: string;
            }
          | {
              manufacturer: string;
              model: string;
            };
        operating_system: {
          id: number;
          platform: string;
          version: string;
        };
      }[]
    | false
  > {
    const candidature = await this.getUserCandidature(
      user.userId,
      user.isAdmin
    );
    if (candidature.length === 0) return false;
    const { selected_device } = candidature[0];
    try {
      if (selected_device === -1) {
        return [
          {
            id: -1,
            type: "PC",
            device: { pc_type: "Notebook" },
            operating_system: {
              id: -1,
              platform: "Platform",
              version: "Version",
            },
          },
        ];
      }
      const devices = new Devices();
      if (selected_device === 0) {
        return await devices.getMany({ testerId: user.testerId });
      }
      const device = await devices.getOne(selected_device);
      if (!device) return [];
      return [device];
    } catch {
      return false;
    }
  }
}

export default Campaign;
