import config from "../config";

import tryberDb from "@appquality/tryber-database";

export const tryber = tryberDb({
  client: "mysql",
  connection: {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  },
  pool: { min: 0, max: 7 },
});
