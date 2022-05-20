import * as db from "@src/features/db";

export default async (wpId: string, showExpired: boolean = true) => {
  try {
    const { id, logged_in_year, is_italian } = await getCurrentProfile();

    const rows = await getUserPopups(id, is_italian, logged_in_year);

    if (!rows.length) {
      throw new Error("No popups found");
    }
    return rows.map((row) => ({
      id: parseInt(row.id),
      title: row.title,
      content: row.content,
      once: row.is_once === "1",
    }));
  } catch (error) {
    throw error;
  }

  async function getUserPopups(
    id: any,
    is_italian: any,
    logged_in_year: any
  ): Promise<
    { id: string; title: string; content: string; is_once: string }[]
  > {
    return await db.query(`
      SELECT id, title, content, is_once
      FROM wp_appq_popups pop
      ${getPopupClause(id, is_italian, logged_in_year)}
    `);
  }

  function getPopupClause(
    id: string,
    is_italian: string,
    logged_in_year: string
  ) {
    const result = [];

    if (!showExpired) {
      result.push(onlyNotExpiredClause(id));
    }

    result.push(matchingTargetClause(is_italian, logged_in_year, id));

    if (!result.length) return "";

    const conditions = result.map(
      (condition) => " (" + condition.join(" OR ") + " )"
    );
    return "WHERE " + conditions.join(" AND ");
  }

  async function getCurrentProfile() {
    const profileSql = `
      SELECT p.id,
             DATE_ADD(p.last_activity, INTERVAL 1 YEAR) >= NOW() as logged_in_year,
         p.country
         FROM wp_appq_evd_profile p 
         WHERE p.wp_user_id = ${wpId}; `;
    const profiles = await db.query(profileSql);
    if (!profiles.length) {
      throw new Error("There was an error with your profile");
    }
    const profile = profiles[0];
    profile.is_italian = false;
    if (profile.country) {
      profile.is_italian = profile.country.search(/\b(italy|italia)\b/gi) >= 0;
    }
    return profile;
  }
};

function onlyNotExpiredClause(id: string) {
  return [
    ` (  
  1 NOT IN ( 
    SELECT 1 FROM wp_appq_popups_read_status 
    WHERE tester_id = ${id} AND popup_id = pop.id
  )
)`,
  ];
}
function matchingTargetClause(
  is_italian: string,
  logged_in_year: string,
  id: string
) {
  const targets = ['pop.targets = "all"'];
  targets.push(
    is_italian ? 'pop.targets = "italian"' : 'pop.targets = "non-italian"'
  );
  targets.push(
    parseInt(logged_in_year) == 1
      ? 'pop.targets = "logged-in-year"'
      : 'pop.targets = "not-logged-in-year"'
  );
  targets.push(`targets = "list" AND CONCAT(",",extras,",") LIKE "%,${id},%"`);
  return targets;
}
