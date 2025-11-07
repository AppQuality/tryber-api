import Table from "./table";

type AttributionParams = {
  id?: number;
  tester_id?: number;
  amount?: number;
  request_id?: number;
  campaign_id?: number;
  work_type_id?: number;
  creation_date?: string;
  is_requested?: 0 | 1;
  is_paid?: 0 | 1;
  is_expired?: 0 | 1;
};
const defaultItem: AttributionParams = {
  id: 1,
  tester_id: 1,
  amount: 1,
  request_id: 0,
  campaign_id: 1,
  work_type_id: 1,
  creation_date: "2020-01-01",
  is_requested: 0,
  is_paid: 0,
  is_expired: 0,
};
class Attributions extends Table<AttributionParams> {
  protected name = "wp_appq_payment";
  protected columns = [
    "id INTEGER PRIMARY KEY",
    "tester_id INTEGER",
    "amount DECIMAL(11,2)",
    "is_requested INTEGER DEFAULT 0",
    "is_paid INTEGER DEFAULT 0",
    "creation_date DATETIME",
    "work_type_id INTEGER",
    "request_id INTEGER DEFAULT NULL",
    "campaign_id INTEGER",
    "is_expired INTEGER DEFAULT 0",
  ];
  constructor() {
    super(defaultItem);
  }
}

const theTable = new Attributions();

export default theTable;
export type { AttributionParams };
