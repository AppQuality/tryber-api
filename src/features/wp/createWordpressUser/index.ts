import { HashPassword } from "wordpress-hash-node";

import { tryber } from "@src/features/database";

export class EmailAlreadyRegisteredError extends Error {}

const createWordpressUser = async (
  username: string,
  email: string,
  password: string
): Promise<number> => {
  const alreadyRegisteredUser = await tryber.tables.WpUsers.do()
    .select("ID")
    .where("user_login", username);

  if (alreadyRegisteredUser.length) {
    const random = Math.random().toString(36).substring(7);
    return await createWordpressUser(`${username}-${random}`, email, password);
  }

  const alreadyRegisteredEmail = await tryber.tables.WpUsers.do()
    .select("ID")
    .where("user_email", email);

  if (alreadyRegisteredEmail.length) {
    throw new EmailAlreadyRegisteredError(`Email ${email} already registered`);
  }

  const hash = HashPassword(password);

  try {
    const results = await tryber.tables.WpUsers.do()
      .insert({
        user_email: email,
        user_nicename: username.substr(0, 50),
        display_name: username,
        user_login: username,
        user_pass: hash,
        user_registered: new Date().toISOString().substring(0, 10),
      })
      .returning("ID");

    return results[0].ID ?? results[0];
  } catch (e) {
    throw e;
  }
};

export default createWordpressUser;
