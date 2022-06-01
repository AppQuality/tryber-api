import wpAuthProvider from "@appquality/wp-auth";
import config from "../config";
import authenticate from "../features/wp/authenticate";
import getUserById from "../features/wp/getUserById";

const wpAuth = wpAuthProvider.create({
  wpurl: config.CROWD_URL,
  logged_in_key: config.wp.logged_in_key,
  logged_in_salt: config.wp.logged_in_salt,
  mysql_host: config.db.host,
  mysql_user: config.db.user,
  mysql_port: config.db.port,
  mysql_pass: config.db.password,
  mysql_db: config.db.database,
  wp_table_prefix: "wp_",
  checkKnownHashes: false,
});

export const checkCookies = (req: OpenapiRequest): Promise<UserType> => {
  return new Promise((resolve, reject) => {
    return wpAuth
      .checkAuth(req)
      .on("auth", async function (authIsValid: boolean, userId: number) {
        if (authIsValid) {
          const userData = await getUserById(userId);
          const user = await authenticate(userData);
          if (user instanceof Error) {
            return reject(user);
          }
          return resolve(user);
        }
        return reject(new Error("Missing authorization header"));
      });
  });
};
