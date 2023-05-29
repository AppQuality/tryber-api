/** OPENAPI-ROUTE: get-popups */

import { tryber } from "@src/features/database";
import { Context } from "openapi-backend";

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
    let query = tryber.tables.WpAppqPopups.do().select().where("is_auto", 0);

    if (req.query.limit && typeof req.query.limit == "string") {
      query = query.limit(parseInt(req.query.limit));
      if (req.query.start && typeof req.query.start == "string") {
        query = query.offset(parseInt(req.query.start));
      }
    }

    const rows = await query;
    if (!rows.length) throw Error("No popups");

    res.status_code = 200;
    return mapPopups(rows);
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

async function mapPopups(
  popups: {
    id: number;
    title: string;
    content: string;
    is_once: number;
    targets: string;
    extras: string;
  }[]
) {
  return popups.map((popup) => {
    let currentProfiles: number[] | string = [];
    if (popup.targets) {
      if (popup.targets == "list") {
        currentProfiles = [];
        if (popup.extras) {
          const profiles = popup.extras.split(",").map((id) => parseInt(id));
          if (profiles) currentProfiles = profiles;
        }
      } else {
        currentProfiles = popup.targets;
      }
    }
    return {
      id: popup.id,
      title: popup.title,
      content: popup.content,
      once: popup.is_once === 1,
      profiles: currentProfiles,
    };
  });
}
