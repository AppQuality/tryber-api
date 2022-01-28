import * as db from "@src/features/db";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE:delete-users-me */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const insertDeltionReason = `INSERT INTO wp_appq_user_deletion_reason (tester_id,reason) VALUES (?,?)`;
    await db.query(
      db.format(insertDeltionReason, [req.user.testerId, req.body.reason])
    );

    const updateProfile = `UPDATE wp_appq_evd_profile 
    SET name = "Deleted User", 
    email = "",
    surname = "",
    birth_date = "1970-01-01",
    sex = -1,
    phone_number = NULL,
    city = NULL,
    address = NULL,
    postal_code = NULL,
    province = NULL,
    country = NULL,
    booty = 0,
    pending_booty = 0,
    address_number = NULL,
    u2b_login_token = NULL,
    fb_login_token = NULL,
    ln_login_token = NULL,
    total_exp_pts = 0,
    employment_id = 0,
    education_id = 0,
    state = NULL,
    country_code = NULL
    WHERE id = ?`;
    await db.query(db.format(updateProfile, [req.user.testerId]));

    const disableDevice = `UPDATE wp_crowd_appq_device
    SET enabled = 0
    WHERE id_profile = ?`;
    await db.query(db.format(disableDevice, [req.user.testerId]));

    const deleteUser = `DELETE FROM wp_users
    WHERE ID = ?`;
    await db.query(db.format(deleteUser, [req.user.ID]));

    const deleteMeta = `DELETE FROM wp_usermeta
    WHERE user_id = ?`;
    await db.query(db.format(deleteMeta, [req.user.ID]));

    const deleteCuf = `DELETE FROM wp_appq_custom_user_field_data
    WHERE profile_id = ?`;
    await db.query(db.format(deleteCuf, [req.user.testerId]));

    const deleteProfile = `DELETE FROM wp_appq_fiscal_profile
    WHERE tester_id = ? AND is_active = 0`;
    await db.query(db.format(deleteProfile, [req.user.testerId]));

    res.status_code = 200;
    return true;
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 400;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
