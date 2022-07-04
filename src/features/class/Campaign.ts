import * as db from "@src/features/db";
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
      const campaignData = await db.query(
        db.format(
          `SELECT id,title,min_allowed_media,campaign_type,bug_lang FROM wp_appq_evd_campaign WHERE id = ?`,
          [this.id]
        )
      );
      if (!campaignData.length) {
        reject(Error("Invalid campaign data"));
      }
      this.title = campaignData[0].title;
      this.min_allowed_media = campaignData[0].min_allowed_media;
      this.campaign_type = campaignData[0].campaign_type;
      this.bug_lang = campaignData[0].bug_lang;
      this.ready = Promise.resolve(true);
      resolve(true);
    });
  }

  private async getCustomSelectItem(
    name: string,
    table: string
  ): Promise<number[]> {
    return (
      await db.query(
        db.format(`SELECT ${name} FROM ${table} WHERE campaign_id = ?`, [
          this.id,
        ])
      )
    ).map((s: { [key: string]: number }) => s[name]);
  }

  public async getAvailableSeverities() {
    const customSeverities = await this.getCustomSelectItem(
      "bug_severity_id",
      "wp_appq_additional_bug_severities"
    );
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

    async function getSeverities(): Promise<CampaignSelectItem[]> {
      return (await db.query(`SELECT id,name FROM wp_appq_evd_severity `)).map(
        (s: CampaignSelectItem) => ({
          ...s,
          name: s.name.toUpperCase(),
        })
      );
    }
  }

  public async getAvailableTypes() {
    const customTypes = await this.getCustomSelectItem(
      "bug_type_id",
      "wp_appq_additional_bug_types"
    );
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
      return (await db.query(`SELECT id,name FROM wp_appq_evd_bug_type `)).map(
        (s: typeof types[0]) => ({
          ...s,
          name: s.name.toUpperCase(),
        })
      );
    }
  }

  public async getAvailableReplicabilities() {
    const customReplicabilities = await this.getCustomSelectItem(
      "bug_replicability_id",
      "wp_appq_additional_bug_replicabilities"
    );
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
        await db.query(`SELECT id,name FROM wp_appq_evd_bug_replicability `)
      ).map((s: typeof replicabilities[0]) => ({
        ...s,
        name: s.name.toUpperCase(),
      }));
    }
  }

  public async isUserCandidate(userId: string) {
    const candidature = await this.getUserCandidature(userId);
    if (candidature.length === 0) return false;
    return true;
  }

  public async getUserUseCases(userId: string) {
    const candidatureData = await this.getUserCandidature(userId);

    if (candidatureData.length === 0) return [];
    let useCases: { id: number; name: string; group_id: number }[] =
      await db.query(
        db.format(
          `SELECT id,title as name,group_id FROM wp_appq_campaign_task 
          WHERE group_id IN (?,0, -1) 
          AND campaign_id = ?
          ORDER BY position ASC, id ASC`,
          [candidatureData[0].group_id, this.id]
        )
      );
    const multigroupUsecase = useCases.filter((u) => u.group_id === -1);
    if (multigroupUsecase.length) {
      const UseCaseGroups: number[] = (
        await db.query(
          db.format(
            `SELECT task_id FROM wp_appq_campaign_task_group
          WHERE group_id = ?`,
            [candidatureData[0].group_id]
          )
        )
      ).map((g: { task_id: number }) => g.task_id);
      useCases = useCases.filter(
        (u) => u.group_id !== -1 || UseCaseGroups.includes(u.id)
      );
    }

    const result = useCases.map((u) => ({
      id: u.id,
      name: u.name,
    }));
    return [{ id: -1, name: "Not a specific usecase" }, ...result];
  }

  get hasBugForm() {
    return this.campaign_type !== -1;
  }

  public async getAvailableFileExtensions() {
    const option = await db.query(
      `SELECT option_value FROM wp_options WHERE option_name = 'options_appq_valid_upload_extensions'`
    );
    if (option.length === 0) return [];
    return option[0].option_value
      .split(",")
      .map((option: string) => `.${option}`);
  }

  public async getAdditionalFields(): Promise<AdditionalField[] | undefined> {
    const additionals: {
      id: number;
      slug: string;
      title: string;
      type: "regex" | "select";
      validation: string;
      error_message: string;
    }[] = await db.query(
      db.format(
        `SELECT id,slug,title,type,validation,error_message 
          FROM wp_appq_campaign_additional_fields 
          WHERE cp_id = ?`,
        [this.id]
      )
    );
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
          type: "text",
          regex: item.validation,
        };
      }
      if (item.type === "select") {
        return {
          ...result,
          type: "select",
          options: item.validation.split(";"),
        };
      }
      throw new Error("Invalid additional field type");
    });
  }

  public async getBugLanguageMessage() {
    if (!(await this.ready)) throw Error("Campaign not initialized");
    if (this.bug_lang === 0) return undefined;

    const meta: { meta_key: string; meta_value: string }[] = await db.query(
      db.format(
        `SELECT meta_key,meta_value 
        FROM wp_appq_cp_meta
        WHERE campaign_id = ? AND meta_key IN ("bug_lang_message","bug_lang_code")`,
        [this.id]
      )
    );
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
    const meta: { meta_key: string; meta_value: string }[] = await db.query(
      db.format(
        `SELECT meta_key,meta_value 
        FROM wp_appq_cp_meta
        WHERE campaign_id = ? AND meta_key = "bug_title_rule"`,
        [this.id]
      )
    );
    if (meta.length === 0) return undefined;
    if (meta[0].meta_value === "1") return true;
    return undefined;
  }

  public async getUserCandidature(
    userId: string
  ): Promise<{ selected_device: number; group_id: number }[]> {
    return await db.query(
      db.format(
        "SELECT selected_device, group_id FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [userId, this.id]
      )
    );
  }
  public async getAvailableDevices(user: { userId: string; testerId: number }) {
    const candidature = await this.getUserCandidature(user.userId);
    if (candidature.length === 0) return false;
    const { selected_device } = candidature[0];
    try {
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
