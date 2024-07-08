import config from "../config";

import tryberDb from "@appquality/tryber-database";

export const tryber = tryberDb({
  client: "mysql",
  connection: {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: "utf8mb4_unicode_ci",
  },
  pool: { min: 1, max: 7 },
});
