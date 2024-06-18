import { checkUrl } from "@src/features/checkUrl";
import { tryber } from "@src/features/database";
import { mapToDistribution } from "@src/features/s3/mapToDistribution";

export default class UxData {
  private SEVERITIES = {
    1: "Minor",
    2: "Major",
    3: "Positive",
    4: "Observation",
  };

  private _data:
    | {
        id: number;
        campaign_id: number;
        users: number;
        goal: string;
        methodology_type: string;
        methodology_description: string;
        version: number;
        published: number;
      }
    | undefined;

  private _questions: {
    id: number;
    campaign_id: number;
    question: string;
    version: number;
  }[] = [];

  private _sentiments: {
    id: number;
    campaign_id: number;
    cluster_id: number;
    value: number;
    comment: string;
  }[] = [];

  private _clusters: { id: number; name: string }[] = [];

  constructor(private campaignId: number) {}

  private async getOne({ published }: { published: 0 | 1 }) {
    const data = await this.getUxData({ published });

    if (!data) return { data: undefined };

    const clusters = await this.getClusters();

    const questions = await this.getQuestions({ version: data.version });

    const sentiments = await this.getSentiments({ version: data.version });

    return { data, clusters, questions, sentiments };
  }

  private async getSentiments({ version }: { version: number }) {
    return await tryber.tables.UxCampaignSentiments.do()
      .select(
        tryber.ref("id").withSchema("ux_campaign_sentiments"),
        tryber.ref("cluster_id").withSchema("ux_campaign_sentiments"),
        tryber.ref("campaign_id").withSchema("ux_campaign_sentiments"),
        tryber.ref("value").withSchema("ux_campaign_sentiments"),
        tryber.ref("comment").withSchema("ux_campaign_sentiments")
      )
      .join(
        "wp_appq_usecase_cluster",
        "wp_appq_usecase_cluster.id",
        "ux_campaign_sentiments.cluster_id"
      )
      .where("ux_campaign_sentiments.campaign_id", this.campaignId)
      .where("ux_campaign_sentiments.value", ">", 0)
      .where("ux_campaign_sentiments.value", "<", 6)
      .where({ version })
      .orderBy("version", "DESC");
  }

  private async getUxData({ published }: { published: number }) {
    return await tryber.tables.UxCampaignData.do()
      .select()
      .where({ published: published, campaign_id: this.campaignId })
      .orderBy("version", "desc")
      .first();
  }

  private async getClusters() {
    return await tryber.tables.WpAppqUsecaseCluster.do()
      .select("id", tryber.ref("title").as("name"))
      .where({
        campaign_id: this.campaignId,
      });
  }

  private async getQuestions({ version }: { version: number }) {
    return await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: this.campaignId })
      .where({ version })
      .orderBy("version", "DESC");
  }

  public async lastPublished() {
    const { data, clusters, questions, sentiments } = await this.getOne({
      published: 1,
    });

    if (clusters) this._clusters = clusters;
    if (questions) this._questions = questions;
    if (sentiments) this._sentiments = sentiments;
    this._data = data;
  }

  public async lastDraft() {
    const { data, clusters, questions, sentiments } = await this.getOne({
      published: 0,
    });

    if (!data) return;
    this._data = data;

    if (clusters) this._clusters = clusters;
    if (questions) this._questions = questions;
    if (sentiments) this._sentiments = sentiments;
  }

  get version() {
    return this._data?.version;
  }

  get data() {
    if (!this._data) return null;
    const { id: i, version: v, published: p, ...data } = this._data;
    return {
      ...data,
      questions: this.questions,
      sentiments: this.sentiments,
    };
  }

  get questions() {
    return this._questions.map((q) => ({
      id: q.id,
      name: q.question,
    }));
  }

  get sentiments() {
    return this._sentiments.map((s) => ({
      id: s.id,
      value: s.value,
      comment: s.comment,
      cluster: {
        id: s.cluster_id,
        name: this._clusters.find((c) => c.id === s.cluster_id)?.name || "",
      },
    }));
  }

  isEqual(other: UxData) {
    if (JSON.stringify(this.data) !== JSON.stringify(other.data)) return false;
    return true;
  }

  private mapToDistribution(url: string) {
    return mapToDistribution(url);
  }
}
