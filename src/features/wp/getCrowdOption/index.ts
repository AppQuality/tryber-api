import * as db from "@src/features/db";
import { unserialize } from "php-unserialize";

export default async (key: string) => {
  const sql = `SELECT option_value FROM wp_options WHERE option_name = "crowd_options_option_name"`;
  const results = await db.query(db.format(sql, [key]));
  if (!results.length) {
    throw new Error(`Option crowd_options_option_name not found`);
  }
  const option = unserialize(results[0].option_value);
  let value = false;
  if (option[key]) {
    value = option[key];
  }

  return value;
};
