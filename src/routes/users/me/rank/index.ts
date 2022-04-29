import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-rank */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    // const SELECT = `SELECT *`;
    // const FROM = ` FROM wp_appq_popups`;
    // const WHERE = ``;

    // const rows = await db.query(`${SELECT}${FROM}${WHERE}`);
    // if (!rows.length) throw Error("No rank found");

    res.status_code = 200;
    return {
      level: {
        id: 1,
        name: "newbie",
      },
      previousLevel: {
        id: 0,
        name: "shit",
      },
      rank: 0,
      points: 0,
      prospect: {
        level: {
          id: 2,
          name: "starter",
        },
      },
    };
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }
    res.status_code = 400;
    debugMessage(error);
    return {};
  }
};
