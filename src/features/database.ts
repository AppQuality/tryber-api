import tryberDb from "@appquality/tryber-database";
import config from "../config";

export const tryber = tryberDb({
  client: "mysql",
  connection: {
    host: config.db.host,
    user: config.db.user,
    port: config.db.port || 3306,
    password: config.db.password,
    database: config.db.database,
    charset: "utf8mb4_unicode_ci",
  },
  pool: { min: 1, max: 7 },
});
