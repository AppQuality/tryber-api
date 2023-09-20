import mysql from "mysql";
import { tryber } from "../database";
import connectionManager from "./mysql";

export const format = (query: string, data: (string | number)[]) => {
  return mysql.format(query, data);
};

export const query = async (query: string): Promise<any> => {
  const res = await tryber.raw(query);
  if (tryber.client === "better-sqlite3") return res;
  return res ? res[0] : [];
};

export const insert = (table: string, data: any): Promise<any> => {
  const connection = connectionManager.getConnection();
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO ?? SET ?";
    const query = mysql.format(sql, [table, data]);
    return connection.query(query, function (error, results) {
      if (error) return reject(error);
      if (results.insertId) {
        return resolve(results.insertId);
      }
      return reject(new Error(`Error on INSERT ${JSON.stringify(data)}`));
    });
  });
};
