import Table from "./table";

type BugMediaParams = {
  id?: number;
  bug_id?: number;
  location?: string;
  type?: string;
  uploaded?: string;
};
const defaultItem: BugMediaParams = {
  id: 1,
  bug_id: 1,
  location: "www.exaple.com/media1.jpg",
  type: "image",
  uploaded: "2020-01-01 00:00:00",
};
class BugMedia extends Table<BugMediaParams> {
  protected name = "wp_appq_evd_bug_media";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "bug_id INTEGER(11)",
    "location VARCHAR(255)",
    "type VARCHAR(45)",
    "uploaded DATETIME",
  ];
  constructor() {
    super(defaultItem);
  }
}
const bugMedia = new BugMedia();
export default bugMedia;
export type { BugMediaParams };
