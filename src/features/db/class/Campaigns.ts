import Database from "./Database";
class Campaigns extends Database<{
  fields: {
    id: number;
    title: string;
    is_public: 0 | 1 | 2;
    page_preview_id: string;
    page_manual_id: string;
    status_id: 1 | 2;
    start_date: string;
    end_date: string;
    close_date: string;

    campaign_type_id: number;
  };
}> {
  constructor(fields?: Campaigns["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_evd_campaign",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "title",
            "is_public",
            "page_preview_id",
            "status_id",
            "start_date",
            "end_date",
            "close_date",
          ],
    });
  }
}
export default Campaigns;
