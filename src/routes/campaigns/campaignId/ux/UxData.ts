import { tryber } from "@src/features/database";

export default class UxData {
  private _data:
    | {
        id: number;
        campaign_id: number;
        users: number;
        goal: string;
        methodology_type: string;
        methodology_description: string;
        published: number;
      }
    | undefined;

  private _questions: {
    id: number;
    campaign_id: number;
    question: string;
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

  private async getOne() {
    const data = await this.getUxData();

    if (!data) return { data: undefined };

    const clusters = await this.getClusters();

    const questions = await this.getQuestions();

    const sentiments = await this.getSentiments();

    return { data, clusters, questions, sentiments };
  }

  private async getSentiments() {
    return await tryber.tables.UxCampaignSentiments.do()
      .select(
        tryber.ref("id").withSchema("ux_campaign_sentiments"),
        tryber.ref("cluster_id").withSchema("ux_campaign_sentiments"),
        tryber.ref("campaign_id").withSchema("ux_campaign_sentiments"),
        tryber.ref("value").withSchema("ux_campaign_sentiments"),
        tryber.ref("comment").withSchema("ux_campaign_sentiments")
      )
      .join(
        "wp_appq_campaign_task",
        "wp_appq_campaign_task.id",
        "ux_campaign_sentiments.cluster_id"
      )
      .where("ux_campaign_sentiments.campaign_id", this.campaignId)
      .where("ux_campaign_sentiments.value", ">", 0)
      .where("ux_campaign_sentiments.value", "<", 6);
  }

  private async getUxData() {
    return await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: this.campaignId })
      .first();
  }

  private async getClusters() {
    return await tryber.tables.WpAppqCampaignTask.do()
      .select("id", tryber.ref("title").as("name"))
      .where({
        campaign_id: this.campaignId,
      });
  }

  private async getQuestions() {
    return await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: this.campaignId });
  }

  public async getLast() {
    const { data, clusters, questions, sentiments } = await this.getOne();

    if (!data) return;
    this._data = data;

    if (clusters) this._clusters = clusters;
    if (questions) this._questions = questions;
    if (sentiments) this._sentiments = sentiments;
  }

  get data() {
    if (!this._data) return null;
    const { id: i, published: p, ...data } = this._data;
    return {
      ...data,
      visible: p,
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
}
