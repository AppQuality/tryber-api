import { tryber } from "@src/features/database";

/**
 * Basic dataset for the test
 *
 * 3 agreements
 *
 *
 */

const useAgreementsData = () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert([
      { id: 9, company: "Company9", pm_id: 1 },
      { id: 11, company: "Company11", pm_id: 1 },
    ]);
    await tryber.tables.FinanceAgreements.do().insert([
      {
        id: 9,
        customer_id: 9,
        tokens: 165.65,
        token_unit_price: 165,
        created_time: "2021-01-01 00:00:00",
        modification_time: "2021-01-02 00:00:00",
        title: "Title Agreement9",
        additional_note: "Notes Agreement9",
        last_editor_id: 9,
        agreement_date: "2021-01-01 00:00:00",
        agreement_close_date: "2021-01-10 00:00:00",
        salesman: 9,
        is_token_based: 1,
      },
      {
        id: 10,
        customer_id: 9,
        tokens: 222.22,
        token_unit_price: 165,
        created_time: "2021-01-01 00:00:00",
        modification_time: "2021-01-02 00:00:00",
        title: "Title Agreement10",
        additional_note: "",
        last_editor_id: 10,
        agreement_date: "2021-01-01 00:00:00",
        agreement_close_date: "2021-01-10 00:00:00",
        salesman: 10,
        is_token_based: 0,
      },
      {
        id: 11,
        customer_id: 11,
        tokens: 111,
        token_unit_price: 165,
        created_time: "2021-01-01 00:00:00",
        modification_time: "2021-01-02 00:00:00",
        title: "Title Agreement11",
        additional_note: "Notes Agreement11",
        last_editor_id: 11,
        agreement_date: "2021-01-01 00:00:00",
        agreement_close_date: "2021-01-10 00:00:00",
        salesman: 11,
        is_token_based: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.FinanceAgreements.do().delete();
  });
};

export default useAgreementsData;
