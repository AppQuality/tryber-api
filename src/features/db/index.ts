import mysql from "mysql";
import { tryber } from "../database";

export const format = (query: string, data: (string | number)[]) => {
  return mysql.format(query, data);
};

export const query = async (query: string): Promise<any> => {
  const res = await tryber.raw(query);
  if (tryber.client === "better-sqlite3") return res;
  return res ? res[0] : [];
};
