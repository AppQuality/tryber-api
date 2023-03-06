import Table from "./table";

type TaxonomyParams = {
  id?: number;
  campaign_id?: number;
  display_name?: string;
  tag_id?: number;
  bug_id?: number;
  is_public?: 0 | 1;
};
const defaultItem: TaxonomyParams = {
  id: 1,
  display_name: "",
};
class Taxonomy extends Table<TaxonomyParams> {
  protected name = "wp_appq_bug_taxonomy";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "tag_id INTEGER",
    "display_name VARCHAR(255)",
    "bug_id INTEGER",
    "campaign_id INTEGER",
    "is_public INTEGER",
  ];
  constructor() {
    super(defaultItem);
  }
}
const taxonomy = new Taxonomy();
export default taxonomy;
export type { TaxonomyParams };
