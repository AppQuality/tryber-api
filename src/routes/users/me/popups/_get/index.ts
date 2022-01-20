/** OPENAPI-ROUTE: get-users-me-popups */
import { Context } from "openapi-backend";
import * as db from "../../../../../features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const showExpired =
      req.query &&
      req.query.showExpired &&
      typeof req.query.showExpired === "string";

    const profileSql = `
      SELECT p.id,
             DATE_ADD(p.last_activity, INTERVAL 1 YEAR) >= NOW() as logged_in_year,
         p.country
         FROM wp_appq_evd_profile p 
         WHERE p.wp_user_id = ${req.user.ID}; `;
    const profiles = await db.query(profileSql);
    if (!profiles.length) {
      throw new Error("There was an error with your profile");
    }
    const profile = profiles[0];

    profile.is_italian = false;
    if (profile.country) {
      profile.is_italian = profile.country.search(/\b(italy|italia)\b/gi) >= 0;
    }

    const { id, logged_in_year, is_italian } = profile;

    const SELECT = `SELECT id, title, content, is_once`;
    const FROM = ` FROM wp_appq_popups pop`;
    let WHERE = `WHERE `;
    if (!showExpired) {
      WHERE += ` (  
        1 NOT IN (
          SELECT 1
          FROM wp_appq_popups_read_status 
          WHERE tester_id = ${id}
          AND popup_id = pop.id
        )
      ) AND `;
    }

    const popupsClauses = ['pop.targets = "all"'];
    popupsClauses.push(
      is_italian ? 'pop.targets = "italian"' : 'pop.targets = "non-italian"'
    );
    popupsClauses.push(
      parseInt(logged_in_year) == 1
        ? 'pop.targets = "logged-in-year"'
        : 'pop.targets = "not-logged-in-year"'
    );
    popupsClauses.push(
      `targets = "list" AND CONCAT(",",extras,",") LIKE "%,${id},%"`
    );

    WHERE += " (" + popupsClauses.join(" OR ") + " )";
    const sql = `
            ${SELECT}
            ${FROM}
            ${WHERE}
          `;
    const rows = await db.query(sql);

    if (!rows.length) {
      throw new Error("No popups found");
    }

    res.status_code = 200;
    return rows.map(mapQueryToObject);
  } catch (error) {
    res.status_code = 404;
    return {
      element: "popups",
      id: 0,
      message: (error as OpenapiError).message,
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
  const obj: { [key: string]: string | boolean | number | number[] } = {
    ...(data.id && { id: parseInt(data.id) }),
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
