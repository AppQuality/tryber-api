import { tryber } from "@src/features/database";

export default async (id: string) => {
  try {
    const data = await tryber.tables.WpAppqEvdBug.do()
      .count("id")
      .where("wp_user_id", id)
      .andWhere("status_id", 2)
      .first();

    if (!data) return Promise.reject(Error("Invalid bugs data"));

    return { approved_bugs: Number(Object.values(data)[0]) };
  } catch (e) {
    if (process.env && process.env.NODE_ENV === "development") console.log(e);
    return Promise.reject(e);
  }
};
