import { tryber } from "@src/features/database";
import { checkUrl } from "./checkUrl";

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

  private _findings: {
    id: number;
    finding_id: number;
    campaign_id: number;
    version: number;
    title: string;
    description: string;
    severity_id: number;
    cluster_ids: string;
    order: number;
  }[] = [];

  private _videoParts: {
    id: number;
    media_id: number;
    insight_id: number;
    start: number;
    end: number;
    description: string;
    location: string;
    streamUrl: string;
  }[] = [];

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
    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ published: published, campaign_id: this.campaignId })
      .orderBy("version", "desc")
      .first();

    if (!data) return { data: undefined };
    const findings = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where({
        campaign_id: this.campaignId,
        version: data.version,
      })
      .where({ enabled: 1 })
      .orderBy("order", "asc");
    const clusters = await tryber.tables.WpAppqUsecaseCluster.do()
      .select("id", tryber.ref("title").as("name"))
      .where({
        campaign_id: this.campaignId,
      });

    const findingsIds = findings.map((f) => f.id);
    const videoParts = findingsIds.length
      ? await tryber.tables.UxCampaignVideoParts.do()
          .select(
            tryber.ref("id").withSchema("ux_campaign_video_parts"),
            "media_id",
            "start",
            "end",
            "description",
            "location",
            "insight_id"
          )
          .join(
            "wp_appq_user_task_media",
            "wp_appq_user_task_media.id",
            "ux_campaign_video_parts.media_id"
          )
          .whereIn("insight_id", findingsIds)
          .where("location", "like", "%.mp4")
          .orderBy("order", "asc")
      : [];

    const questions = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: this.campaignId })
      .where({ version: data.version })
      .orderBy("version", "DESC");

    const sentiments = await tryber.tables.UxCampaignSentiments.do()
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
      .where({ version: data.version })
      .orderBy("version", "DESC");

    return { data, findings, clusters, videoParts, questions, sentiments };
  }

  public async lastPublished() {
    const { data, findings, clusters, videoParts, questions, sentiments } =
      await this.getOne({
        published: 1,
      });

    if (findings) this._findings = findings;
    if (clusters) this._clusters = clusters;
    if (videoParts) this._videoParts = await this.verifyUrls(videoParts);
    if (questions) this._questions = questions;
    if (sentiments) this._sentiments = sentiments;
    this._data = data;
  }

  public async lastDraft() {
    const { data, findings, clusters, videoParts, questions, sentiments } =
      await this.getOne({
        published: 0,
      });

    if (!data) return;
    this._data = data;

    if (findings) this._findings = findings;
    if (clusters) this._clusters = clusters;
    if (videoParts) this._videoParts = await this.verifyUrls(videoParts);
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

      findings: this.findings,
      questions: this.questions,
      sentiments: this.sentiments,
    };
  }

  get findings() {
    return this._findings.map((f) => {
      const severityName =
        f.severity_id in this.SEVERITIES
          ? this.SEVERITIES[f.severity_id as keyof typeof this.SEVERITIES]
          : "Unknown";

      const videoParts = this._videoParts.filter((v) => v.insight_id === f.id);

      return {
        id: f.id,
        title: f.title,
        description: f.description,
        clusters: getClusters(this._clusters),
        severity: { id: f.severity_id, name: severityName },
        videoParts: videoParts.map((v) => ({
          id: v.id,
          start: v.start,
          mediaId: v.media_id,
          end: v.end,
          description: v.description,
          url: v.location,
          streamUrl: v.streamUrl,
        })),
      };

      function getClusters(clusters: { id: number; name: string }[]) {
        if (f.cluster_ids === "0") return "all" as const;
        const clusterIds = f.cluster_ids.split(",").map(Number);
        return clusters.filter((c) => clusterIds.includes(c.id));
      }
    });
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

  async verifyUrls(
    videoParts: {
      id: number;
      media_id: number;
      insight_id: number;
      start: number;
      end: number;
      description: string;
      location: string;
    }[]
  ) {
    const video = [];
    for (const v of videoParts) {
      const stream = v.location.replace(".mp4", "-stream.m3u8");
      const isValidStream = await checkUrl(stream);
      video.push({
        ...v,
        streamUrl: isValidStream ? stream : "",
      });
    }
    return video;
  }
}
