/** OPENAPI-ROUTE: post-popups */

import { tryber } from "@src/features/database";
import * as db from "@src/features/db";
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
      message: "You cannot create new popups",
    };
  }
  try {
    const data: {
      content: string;
      is_once: number;
      title: string;
      targets?: string;
      extras: string;
    } = {
      ...(req.body.content && { content: req.body.content }),
      ...(req.body.once && { is_once: req.body.once }),
      ...(req.body.title && { title: req.body.title }),
    };
    if (req.body.profiles) {
      if (typeof req.body.profiles == "string") {
        data.targets = req.body.profiles;
      } else if (Array.isArray(req.body.profiles)) {
        data.targets = "list";
        data.extras = req.body.profiles.join(",");
      }
    }
    const popup = await tryber.tables.WpAppqPopups.do()
      .insert(data)
      .returning("id");
    const insertId = popup[0].id ?? popup[0];
    if (!insertId) throw Error("Error on INSERT");

    const sql = `SELECT * FROM wp_appq_popups WHERE id = ${insertId}`;
    const result = await db.query(sql);
    if (!result.length) throw Error("Error on SELECT");

    res.status_code = 200;

    return mapQueryToObject(result[0]);
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.error(error);
    }
    res.status_code = 404;
    return {
      element: "popups",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};

const mapObjectToQuery = (obj: { [key: string]: any }) => {
  const data = {
    ...(obj.content && { content: obj.content }),
    ...(obj.once && { is_once: obj.once }),
    ...(obj.title && { title: obj.title }),
  };
  if (obj.profiles) {
    if (typeof obj.profiles == "string") {
      data.targets = obj.profiles;
    } else if (Array.isArray(obj.profiles)) {
      data.targets = "list";
      data.extras = obj.profiles.join(",");
    }
  }
  return data;
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
