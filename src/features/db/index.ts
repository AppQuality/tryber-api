import mysql from "mysql";

import config from "../../config";

export const format = (query: string, data: (string | number)[]) =>
  mysql.format(query, data);

export const query = (query: string): Promise<any> => {
  const connection = mysql.createConnection(config.db);
  connection.connect();
  return new Promise((resolve, reject) => {
    return connection.query(query, function (error, results) {
      if (error) return reject(error);
      return resolve(results);
    });
  }).finally(() => connection.end());
};

export const insert = (table: string, data: any): Promise<any> => {
  const connection = mysql.createConnection(config.db);
  connection.connect();
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
  }).finally(() => connection.end());
};
