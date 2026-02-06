import mysql from "mysql";
import { tryber } from "../database";
import { Knex } from "knex";

export const format = (query: string, data: (string | number)[]) => {
  return mysql.format(query, data);
};

export const query = async (
  query: string,
  trx?: Knex.Transaction
): Promise<any> => {
  const connection = trx || tryber;
  const res = await connection.raw(query);
  if (tryber.client === "better-sqlite3") return res;
  return res ? res[0] : [];
};

/**
 * Execute a function within a database transaction.
 * If the function completes successfully, the transaction is committed.
 * If an error is thrown, the transaction is rolled back.
 *
 * @example
 * ```typescript
 * await transaction(async (trx) => {
 *   await db.query("INSERT INTO users ...", trx);
 *   await db.query("INSERT INTO profiles ...", trx);
 * });
 * ```
 */
export const transaction = async <T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> => {
  // Access the Knex client through a query builder
  // Cast to any to access the transaction method properly
  const knex = tryber.tables.WpUsers.do().client as any;
  return await knex.transaction(callback);
};
