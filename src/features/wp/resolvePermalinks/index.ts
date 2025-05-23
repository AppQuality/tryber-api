import { unserialize } from "php-unserialize";

import * as db from "../../db";

export default async (
  ids: number[]
): Promise<{ [key: string]: { [key: string]: string } }> => {
  const permalink_structure = "/%postname%/";
  const idList = ids.map((id) => Number(id)).join(",");
  if (idList.length == 0) return {};

  const query = `
  SELECT object_id,description
  FROM wp_term_relationships r
  JOIN wp_term_taxonomy t ON (t.term_taxonomy_id = r.term_taxonomy_id)
  WHERE object_id IN (${idList}) AND t.taxonomy = 'post_translations';`;

  try {
    const res = await db.query(query);
    if (!res.length) return {};
    const translations: {
      [key: string]: { en: string; it: string; es: string; fr: string };
    } = {};
    const pages: string[] = [];
    res.forEach((r: { object_id: string; description: string }) => {
      translations[r.object_id] = unserialize(r.description);
      if (translations[r.object_id].en) {
        pages.push(translations[r.object_id].en);
      }
      if (translations[r.object_id].it) {
        pages.push(translations[r.object_id].it);
      }
      if (translations[r.object_id].es) {
        pages.push(translations[r.object_id].es);
      }
      if (translations[r.object_id].fr) {
        pages.push(translations[r.object_id].fr);
      }
    });

    if (!pages.length) return {};

    const pageQuery = `SELECT ID,post_name
    FROM wp_posts
    WHERE ID IN (${pages.join(",")})`;
    const pageRes = await db.query(pageQuery);
    const permalinks: { [key: string]: string | false } = {};
    pageRes.forEach((r: { post_name: string; ID: string }) => {
      permalinks[r.ID] = r.post_name.length
        ? permalink_structure.replace("%postname%", r.post_name)
        : false;
    });
    Object.keys(translations).map((t) => {
      // EN
      const englishPermalink = permalinks[translations[t].en];
      if (translations[t].en && englishPermalink && englishPermalink.length) {
        translations[t].en = englishPermalink;
      } else {
        translations[t].en = "#";
      }

      // IT
      const italianPermalink = permalinks[translations[t].it];
      if (translations[t].it && italianPermalink && italianPermalink.length) {
        translations[t].it = "/it" + italianPermalink;
      } else {
        // If IT trans is not present, put EN trans if present

        if (translations[t].en && englishPermalink && englishPermalink.length) {
          translations[t].it = englishPermalink;
        } else {
          translations[t].it = "#";
        }
      }

      // ES
      const spanishPermalink = permalinks[translations[t].es];
      if (translations[t].es && spanishPermalink && spanishPermalink.length) {
        translations[t].es = "/es" + spanishPermalink;
      } else {
        // If ES trans is not present, put EN trans if present
        if (translations[t].en && englishPermalink && englishPermalink.length) {
          translations[t].es = englishPermalink;
        } else {
          translations[t].es = "#";
        }
      }

      // FR
      const frenchPermalink = permalinks[translations[t].fr];
      if (translations[t].fr && frenchPermalink && frenchPermalink.length) {
        translations[t].fr = "/fr" + frenchPermalink;
      } else {
        // If FR trans is not present, put EN trans if present
        if (translations[t].en && englishPermalink && englishPermalink.length) {
          translations[t].fr = englishPermalink;
        } else {
          translations[t].fr = "#";
        }
      }
    });
    return translations;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
