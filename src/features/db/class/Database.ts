import * as db from "@src/features/db";

class Database<T extends Record<"fields", Record<string, number | string>>> {
  private fieldItem: Partial<T["fields"]> = {};
  private where: (
    | (Database<T>["fieldItem"] & { isLike?: boolean })
    | (Database<T>["fieldItem"] & { isLike?: boolean })[]
  )[] = [];
  private orderBy:
    | { field: Database<T>["fields"][0]; order?: "ASC" | "DESC" }[] = [];

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

  public async get(id: number): Promise<T["fields"]> {
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

  public query({
    where,
    orderBy,
    limit,
    offset,
  }: {
    where?: Database<T>["where"];
    orderBy?: Database<T>["orderBy"];
    limit?: number;
    offset?: number;
  }): Promise<T["fields"][]> {
    const sql = this.constructSelectQuery({ where, orderBy, limit, offset });
    return db.query(sql);
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

  private constructSelectQuery({
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
          const key = Object.keys(subItem)[0];
          const value = Object.values(subItem)[0] as string | number;
          if (subItem.isLike) {
            return db.format(`${key} LIKE ?`, [value]);
          }
          return db.format(`${key} = ?`, [value]);
        })
        .join(" OR ")})`;
    });
    return `WHERE ${orQueries.join(" AND ")}`;
  }
  protected constructOrderByQuery(orderBy?: Database<T>["orderBy"]) {
    if (typeof orderBy === "undefined") return "";
    if (Array.isArray(orderBy)) {
      const toOrderQueries = orderBy.map(
        (item) =>
          `${String(Object.values(item)[0])} ${item.order ? item.order : "ASC"}`
      );
      return `ORDER BY ${toOrderQueries.join(", ")}`;
    } else return "";
  }
}

export default Database;
