import { tryber } from "@src/features/database";

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
        version: number;
        published: number;
      }
    | undefined;

  private _findings: {
    id: number;
    campaign_id: number;
    version: number;
    title: string;
    description: string;
    severity_id: number;
    cluster_ids: string;
    order: number;
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
      .orderBy("order", "asc");
    const clusters = await tryber.tables.WpAppqUsecaseCluster.do()
      .select("id", tryber.ref("title").as("name"))
      .where({
        campaign_id: this.campaignId,
      });
    return { data, findings, clusters };
  }

  public async lastPublished() {
    const { data, findings, clusters } = await this.getOne({
      published: 1,
    });

    if (findings) this._findings = findings;
    if (clusters) this._clusters = clusters;
    this._data = data;
  }

  public async lastDraft() {
    const { data, findings, clusters } = await this.getOne({
      published: 0,
    });

    if (!data) return;
    this._data = data;

    if (findings) this._findings = findings;
    if (clusters) this._clusters = clusters;
  }

  get data() {
    if (!this._data) return null;
    const { id: i, version: v, published: p, ...data } = this._data;
    return { ...data, findings: this.findings };
  }

  get findings() {
    return this._findings.map((f) => {
      const severityName =
        f.severity_id in this.SEVERITIES
          ? this.SEVERITIES[f.severity_id as keyof typeof this.SEVERITIES]
          : "Unknown";
      return {
        id: f.id,
        title: f.title,
        description: f.description,
        cluster: getClusters(this._clusters),
        severity: { id: f.severity_id, name: severityName },
        videoPart: [],
      };

      function getClusters(clusters: { id: number; name: string }[]) {
        if (f.cluster_ids === "0") return "all" as const;
        const clusterIds = f.cluster_ids.split(",").map(Number);
        return clusters.filter((c) => clusterIds.includes(c.id));
      }
    });
  }

  isEqual(other: UxData) {
    if (JSON.stringify(this.data) !== JSON.stringify(other.data)) return false;
    return true;
  }
}
