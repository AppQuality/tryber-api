import * as db from "@src/features/db";

type CampaignSelectItem = { id: number; name: string };
class Campaign {
  public id: number;
  public title: string = "";
  public min_allowed_media: number = 0;
  public campaign_type: -1 | 0 | 1 = 0;
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
          `SELECT id,title,min_allowed_media,campaign_type FROM wp_appq_evd_campaign WHERE id = ?`,
          [this.id]
        )
      );
      if (!campaignData.length) {
        reject(Error("Invalid campaign data"));
      }
      this.title = campaignData[0].title;
      this.min_allowed_media = campaignData[0].min_allowed_media;
      this.campaign_type = campaignData[0].campaign_type;
      resolve(true);
    });
  }

  public getData = () => {
    return {
      id: this.id,
      title: this.title,
      min_allowed_media: this.min_allowed_media,
      campaign_type: this.campaign_type,
    };
  };

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
    const candidature = await db.query(
      db.format(
        "SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [userId, this.id]
      )
    );
    if (candidature.length === 0) return false;
    return true;
  }

  public async getUserUseCases(userId: string) {
    const candidatureData = await db.query(
      db.format(
        "SELECT group_id FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [userId, this.id]
      )
    );
    if (candidatureData.length === 0) return [];
    const useCases = await db.query(
      db.format(
        `SELECT id,title as name FROM wp_appq_campaign_task 
          WHERE group_id IN (?,0) 
          AND campaign_id = ?
          ORDER BY position ASC, id ASC`,
        [candidatureData[0].group_id, this.id]
      )
    );
    return [{ id: 0, name: "Not a specific usecase" }, ...useCases];
  }

  get hasBugForm() {
    return this.campaign_type !== -1;
  }

  public async getAvailableFileExtensions() {
    const option = await db.query(
      `SELECT option_value FROM wp_options WHERE option_name = 'options_appq_valid_upload_extensions'`
    );
    if (option.length === 0) return [];
    return option[0].option_value.split(",");
  }
}

export default Campaign;
