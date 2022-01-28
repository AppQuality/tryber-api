import * as db from "@src/features/db";
import { Context } from "openapi-backend";

import resolvePermalinks from "../../../../../features/wp/resolvePermalinks";

/** OPENAPI-ROUTE: get-users-me-campaigns */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const SELECT = `
    SELECT cp.id,
           cp.title,
           cp.customer_title,
           cp.campaign_type_id,
           cp.campaign_type as bugform,
           cp.os,
           cp.start_date,
           cp.end_date,
           cp.close_date,
           cp.pm_id,
           cp.is_public,
           cp.page_preview_id,
           cp.page_manual_id,
           IF(c.accepted IS NULL, 0, 1) as applied,
           t.name as campaign_type
  `;
    // this is the base from to be completed for available or accepted cases
    let FROM = `
    FROM wp_appq_evd_campaign cp
    LEFT JOIN wp_crowd_appq_has_candidate c ON (c.campaign_id = cp.id AND c.user_id = ${req.user.ID})
    JOIN wp_appq_campaign_type t ON (cp.campaign_type_id = t.id) 
  `;

    let filterBy: typeof req.query.filterBy = {};
    if (req.query.filterBy && typeof req.query.filterBy !== "string") {
      filterBy = req.query.filterBy;
    }

    if (parseInt(filterBy?.accepted) === 1) {
      // this query get cp where the user is selected
      FROM += `
      WHERE c.user_id = ${req.user.ID}
      AND c.accepted = 1
    `;
    } else {
      // this query get all available campaigns per user
      FROM += `
      WHERE ((cp.is_public = 1 OR cp.is_public = 2) OR page_preview_id IN (SELECT view_id
      FROM wp_appq_lc_access a
      JOIN wp_appq_evd_profile p ON (a.tester_id = p.id)
      WHERE p.wp_user_id = ${req.user.ID}))
      AND (c.accepted != 1 OR c.accepted IS NULL)
    `;
    }

    // optionally filtering by completed
    if (parseInt(filterBy?.completed) === 1) {
      FROM += `
      AND DATEDIFF(cp.end_date, NOW()) < 0
    `;
    } else if (parseInt(filterBy?.completed) === 0) {
      FROM += `
      AND DATEDIFF(cp.end_date, NOW()) >= 0
    `;
    }
    if (filterBy?.statusId) {
      FROM += `
      AND cp.status_id = ${parseInt(filterBy.statusId)}
    `;
    }

    let orderBy: typeof req.query.orderBy = "";
    if (req.query.orderBy && typeof req.query.orderBy === "string") {
      orderBy = req.query.orderBy;
    }

    const accepted = ["name", "start_date", "end_date", "close_date"];
    let ORDER = ``;
    if (orderBy && accepted.includes(orderBy)) {
      ORDER += ` ORDER BY ${orderBy} ${req.query.order || "DESC"} `;
    }

    const GROUPBY = `
      GROUP BY (cp.id)
    `;

    let data: {}[] = [];

    let rows = await db.query(`
    ${SELECT}
    ${FROM}
    ${GROUPBY}
    ${ORDER}
    `);
    if (!rows.length) {
      throw Error("no data found");
    }
    const pageIds = rows.reduce(
      (
        accumulator: string[],
        r: { page_preview_id: string; page_manual_id: string }
      ) => [r.page_preview_id, r.page_manual_id].concat(accumulator),
      []
    );
    const pageLinks = await resolvePermalinks(pageIds);

    rows.map((r: { page_preview_id: string; page_manual_id: string }) => {
      let item = {
        ...r,
        preview_link: pageLinks[r.page_preview_id]
          ? pageLinks[r.page_preview_id]
          : {},
        manual_link: pageLinks[r.page_manual_id]
          ? pageLinks[r.page_manual_id]
          : {},
      };

      if (parseInt(filterBy?.accepted) !== 1) {
        if (Object.keys(item.preview_link).length > 0) {
          if (
            item.preview_link.hasOwnProperty("en") &&
            item.preview_link.hasOwnProperty("es") &&
            item.preview_link.hasOwnProperty("it")
          ) {
            if (
              item.preview_link["en"] !== "#" &&
              item.preview_link["es"] !== "#" &&
              item.preview_link["it"] !== "#"
            ) {
              data.push(item);
            }
          }
        }
      } else {
        data.push(item);
      }
      return r;
    });

    let resultsFull = data.map(mapQueryToObject);

    let start = parseInt((req.query.start as string) || "0");

    const availableCp = {
      results: resultsFull,
      size: data.length,
      start: start,
    };
    if (!req.query.limit) {
      res.status_code = 200;
      return availableCp;
    }
    let limit = parseInt((req.query.limit as string) || "10");
    let total = data.length || 0;
    data = availableCp.results.slice(start, limit + start);

    const results = {
      ...availableCp,
      results: data,
      size: data.length,
      limit: limit,
      total: total,
    };
    res.status_code = 200;
    return results;
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    res.status_code = 404;
    return {
      element: "campaigns",
      id: 0,
      message: (e as OpenapiError).message,
    };
  }
};

const mapQueryToObject = (cp: { [key: string]: any }) => {
  let devices =
    cp.os &&
    cp.os.split(",").map((deviceId: string) => {
      return parseInt(deviceId).toString();
    });
  devices = [...new Set(devices)];
  let devicesObjects = devices.map((deviceId: string) => {
    return { id: deviceId };
  });
  let bugform: false | object = false;
  if (cp.bugform === 1 || cp.bugform === 0) {
    bugform = {
      en: "bugs?controller=bugs&action=byCampaign&id=" + cp.id,
      it: "it/bugs?controller=bugs&action=byCampaign&id=" + cp.id,
    };
  }
  return {
    id: cp.id,
    name: cp.title,
    customer_title: cp.customer_title,
    internal_id: cp.base_bug_internal_id || "-",
    dates: {
      start: cp.start_date.toString(),
      end: cp.end_date.toString(),
      close: cp.close_date.toString(),
    },
    campaign_type: cp.campaign_type ? cp.campaign_type : cp.campaign_type_id,
    devices: devicesObjects,
    manual_link: cp.manual_link || {},
    preview_link: cp.preview_link || {},
    bugform_link: bugform,
    projectManager: {
      username: `${cp.name} ${cp.surname}`,
      id: cp.pm_id,
    },
    applied: cp.applied == 1,
    tokens: cp.tokens_usage,
    csm_effort: cp.effort,
    ux_effort: cp.ux_effort,
  };
};
