import { tryber } from "@src/features/database";
import debugMessage from "@src/features/debugMessage";

export default async (id: number) => {
  try {
    await tryber.tables.WpAppqEvdProfile.do()
      .update({ last_activity: tryber.fn.now() })
      .where({ id });
  } catch (e) {
    debugMessage(e);
    throw e;
  }
};
