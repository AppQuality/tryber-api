import * as db from "@src/features/db";

export default async (): Promise<{ id: string; name: string }[]> => {
  try {
    const SELECT = `SELECT *`;
    const FROM = ` FROM wp_appq_lang`;
    const rows = await db.query(`
        ${SELECT}
        ${FROM}
        `);
    if (!rows.length) throw Error("No languages");
    return rows.map((row: { id: string; display_name: string }) => ({
      id: row.id,
      name: row.display_name,
    }));
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    throw error;
  }
};
