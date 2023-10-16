import { tryber } from "@src/features/database";
import { unserialize } from "php-unserialize";

export default async (key: string) => {
  const results = await tryber.tables.WpOptions.do()
    .select("option_value")
    .where({ option_name: "crowd_options_option_name" })
    .first();
  if (!results) {
    throw new Error(`Option crowd_options_option_name not found`);
  }
  const option = unserialize(results.option_value);
  let value: false | string = false;
  if (option[key]) {
    value = option[key];
  }

  return value;
};
