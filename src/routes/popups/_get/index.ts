import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-popups */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  if (!req.user?.permission?.admin?.appq_message_center) {
    res.status_code = 403;
    return {
      element: "popups",
      id: 0,
      message: "You cannot list popups",
    };
  }
  try {
    const SELECT = `SELECT *`;
    const FROM = ` FROM wp_appq_popups`;
    const WHERE = ``;
    let LIMIT = ``;

    if (req.query.limit && typeof req.query.limit == "string") {
      LIMIT = ` LIMIT ${parseInt(req.query.limit)}`;
      if (req.query.start && typeof req.query.start == "string") {
        LIMIT += ` OFFSET ${parseInt(req.query.start)}`;
      }
    }

    const rows = await db.query(`${SELECT}${FROM}${WHERE}${LIMIT}`);
    if (!rows.length) throw Error("No popups");

    res.status_code = 200;
    return rows.map(mapQueryToObject);
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }
    res.status_code = 400;
    return {
      message: "Missing parameters: " + (error as OpenapiError).message,
    };
  }
};

const mapQueryToObject = (data: {
  id: string;
  title: string;
  content: string;
  is_once: number;
  targets: string;
  extras: string;
}) => {
  const obj: {
    id?: number;
    title?: string;
    content?: string;
    once?: boolean;
    targets?: string;
    extras?: string;
    profiles?: number[] | string;
  } = {
    ...(data.id && { id: parseInt(data.id || "") }),
    ...(data.content && { content: data.content }),
    ...(data.is_once && { once: data.is_once == 1 }),
    ...(data.title && { title: data.title }),
  };
  if (data.targets) {
    if (data.targets == "list") {
      obj.profiles = [];
      if (data.extras) {
        const profiles = data.extras.split(",").map((id) => parseInt(id));
        if (profiles) obj.profiles = profiles;
      }
    } else {
      obj.profiles = data.targets;
    }
  }
  return obj;
};
