import * as db from "@src/features/db";
import { Data } from "aws-sdk/clients/firehose";
type Arrayable<T> = { [K in keyof T]: T[K] | T[K][] };

type WhereConditions =
  | { isLike?: boolean }
  | { isLower?: boolean }
  | { isGreaterEqual?: boolean };

class Database<T extends Record<"fields", Record<string, number | string>>> {
  private fieldItem: Partial<T["fields"]> = {};
  private whereClause:
    | (Arrayable<Partial<T["fields"]>> & WhereConditions)
    | undefined;
  private where: (
    | (Arrayable<Partial<T["fields"]>> & WhereConditions)
    | (Arrayable<Partial<T["fields"]>> & WhereConditions)[]
  )[] = [];
  private orderBy: {
    field: Extract<keyof T["fields"], string>;
    order?: "ASC" | "DESC";
  }[] = [];

  private table: string;
  private primaryKey: keyof T["fields"];
  private fields: (keyof T["fields"])[];
  constructor({
    table,
    primaryKey,
    fields,
  }: {
    table: string;
    primaryKey: keyof T["fields"];
    fields?: (keyof T["fields"])[] | ["*"];
  }) {
    this.table = table;
    this.primaryKey = primaryKey;
    this.fields = fields ? fields : ["*"];
  }

  public async get(id: number) {
    const result = await this.query({
      where: [{ [this.primaryKey]: id }] as Database<T>["where"],
      limit: 1,
    });
    if (result.length === 0) {
      throw new Error(`No ${this.table} with id ${id}`);
    }
    return result[0];
  }

  public async exists(id: number): Promise<boolean> {
    const result = await this.query({
      where: [{ [this.primaryKey]: id }] as Database<T>["where"],
      limit: 1,
    });
    return result.length > 0;
  }

  public async query({
    where,
    orderBy,
    limit,
    offset,
  }: {
    where?: Database<T>["where"];
    orderBy?: Database<T>["orderBy"];
    limit?: number;
    offset?: number;
  }): Promise<ReturnType<this["createObject"]>[]> {
    const sql = this.constructSelectQuery({ where, orderBy, limit, offset });
    return (await db.query(sql)).map((item: T["fields"]) =>
      this.createObject(item)
    );
  }

  public async update({
    data,
    where,
  }: {
    data: Database<T>["fieldItem"];
    where: Database<T>["where"];
  }) {
    const sql = this.constructUpdateQuery({ data, where });
    await db.query(sql);
  }

  public async insert(
    data: Database<T>["fieldItem"]
  ): Promise<{ insertId: number }> {
    const sql = this.constructInsertQuery({ data });
    return await db.query(sql);
  }

  public async delete(where: Database<T>["fieldItem"][]) {
    const sql = this.constructDeleteQuery({ where });
    await db.query(sql);
  }

  public createObject(item: T["fields"]) {
    return item;
  }

  protected constructSelectQuery({
    where,
    limit,
    offset,
    orderBy,
  }: {
    where?: Database<T>["where"];
    orderBy?: Database<T>["orderBy"];
    limit?: number;
    offset?: number;
  }) {
    if (offset && !limit) {
      throw new Error("Offset without limit");
    }
    return `SELECT ${this.fields.join(",")} FROM ${this.table} ${
      where ? this.constructWhereQuery(where) : ""
    } 
    ${orderBy ? this.constructOrderByQuery(orderBy) : ""}
    ${limit ? `LIMIT ${limit}` : ""} ${offset ? `OFFSET ${offset}` : ""}`;
  }

  private constructUpdateQuery({
    data,
    where,
  }: {
    data: Database<T>["fieldItem"];
    where?: Database<T>["where"];
  }) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const sql = db.format(
      `UPDATE ${this.table} SET ${dataKeys
        .map((key) => `${key} = ?`)
        .join(",")} ${where ? this.constructWhereQuery(where) : ""}`,
      dataValues
    );
    return sql;
  }

  private constructInsertQuery({ data }: { data: Database<T>["fieldItem"] }) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const sql = db.format(
      `INSERT INTO ${this.table} (${dataKeys
        .map((key) => `${key}`)
        .join(",")}) VALUES (${dataValues.map((value) => `?`).join(",")})`,
      dataValues
    );
    return sql;
  }

  private constructDeleteQuery({
    where,
  }: {
    where?: Database<T>["fieldItem"][];
  }) {
    return `DELETE FROM ${this.table} ${
      where ? this.constructWhereQuery(where) : ""
    } `;
  }

  protected constructWhereQuery(where?: Database<T>["where"]) {
    if (typeof where === "undefined") return "";

    const orQueries = where.map((item) => {
      let ors = item;
      if (!Array.isArray(item)) {
        ors = [item];
      }
      if (!Array.isArray(ors)) throw new Error("Undefined where");
      return `(${ors
        .map((subItem) => {
          return this.constructSingleWhereClause(subItem);
        })
        .join(" OR ")})`;
    });
    return `WHERE ${orQueries.join(" AND ")}`;
  }

  private constructSingleWhereClause(
    item: NonNullable<Database<T>["whereClause"]>
  ) {
    const key = Object.keys(item)[0];
    const value = Object.values(item)[0] as
      | string
      | number
      | string[]
      | number[];

    if (typeof value === "string" || typeof value === "number") {
      let operation: "LIKE" | "<" | ">=" | "=" = "=";
      if (item.isLike) {
        operation = "LIKE";
      }
      if (item.isLower) {
        operation = "<";
      }
      if (item.isGreaterEqual) {
        operation = ">=";
      }

      if (value === "NOW()") return `${key} ${operation} ${value}`;
      else return db.format(`${key} ${operation} ?`, [value]);
    }

    if (Array.isArray(value)) {
      return db.format(
        `${key} IN (${Array(value.length).fill("?").join(",")})`,
        value
      );
    }
    return db.format(`${key} = ?`, [value]);
  }

  protected constructOrderByQuery(orderBy?: Database<T>["orderBy"]) {
    if (typeof orderBy === "undefined") return "";
    return `ORDER BY ${orderBy
      .map((item) => {
        return `${item.field} ${item.order ? item.order : "ASC"}`;
      })
      .join(", ")}`;
  }
}

export default Database;
