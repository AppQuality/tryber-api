import * as db from "@src/features/db";
import { gravatarUrl } from "avatar-initials";

export default async (id: string, fields: string[]) => {
  let sqlFields = ["p.id"];
  if (fields.includes("name") || fields.includes("image"))
    sqlFields.push("p.name");
  if (fields.includes("surname") || fields.includes("image"))
    sqlFields.push("p.surname");
  if (fields.includes("email") || fields.includes("image"))
    sqlFields.push("p.email");
  if (fields.includes("wp_user_id")) sqlFields.push("p.wp_user_id");
  if (fields.includes("is_verified")) sqlFields.push("p.is_verified");
  if (fields.includes("username")) sqlFields.push("wp.user_login as username");
  if (fields.includes("booty")) sqlFields.push("p.booty");
  if (fields.includes("total_exp_pts")) sqlFields.push("p.total_exp_pts");
  if (fields.includes("birthDate"))
    sqlFields.push("CAST(birth_date as CHAR) as birthDate");
  if (fields.includes("phone")) sqlFields.push("p.phone_number as phone");
  if (fields.includes("gender")) sqlFields.push("p.sex as gender");
  if (fields.includes("country")) sqlFields.push("p.country");
  if (fields.includes("city")) sqlFields.push("p.city");
  if (fields.includes("onboarding_completed"))
    sqlFields.push("p.onboarding_complete as onboarding_completed");

  if (!sqlFields.length) return {};
  try {
    const data = await db.query(
      db.format(
        `SELECT ${sqlFields.join(",")}
          FROM wp_appq_evd_profile p
          JOIN wp_users wp ON (p.wp_user_id = wp.ID)
          WHERE wp.ID = ?`,
        [id]
      )
    );

    if (!data.length) Promise.reject(Error("No user"));
    const user = data[0];
    if (fields.includes("image") && user.name && user.surname) {
      const nameSlug = user.name.toLowerCase().replace(/[\W_ ]+/g, "");
      const surnameSlug = user.surname.toLowerCase().replace(/[\W_ ]+/g, "");
      const initials = `${nameSlug[0] || "?"}+${surnameSlug[0] || "?"}`;
      user.image = gravatarUrl({
        fallback: `https://eu.ui-avatars.com/api/${initials}/132`,
        email: user.email,
        size: 132,
      });
    }
    if (!fields.includes("name")) delete user.name;
    if (!fields.includes("surname")) delete user.surname;
    if (!fields.includes("email")) delete user.email;
    if (
      fields.includes("is_verified") &&
      typeof user.is_verified !== "undefined"
    ) {
      user.is_verified = user.is_verified !== 0;
    }
    if (
      fields.includes("onboarding_completed") &&
      typeof user.onboarding_completed !== "undefined"
    ) {
      user.onboarding_completed = user.onboarding_completed !== 0;
    }

    if (user.hasOwnProperty("birthDate") && user.birthDate) {
      let d = new Date(user.birthDate);
      d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      user.birthDate = d.toISOString().substring(0, 10);
    }
    if (user.hasOwnProperty("gender"))
      user.gender =
        user.gender == 0
          ? "female"
          : user.gender == 1
          ? "male"
          : user.gender == 2
          ? "other"
          : "not-specified";
    return user;
  } catch (e) {
    if (process.env && process.env.NODE_ENV === "development") {
      console.log(e);
    }
    return Promise.reject(e);
  }
};
