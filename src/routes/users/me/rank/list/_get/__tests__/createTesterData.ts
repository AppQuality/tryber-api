import UserLevels from "@src/__mocks__/mockedDb/levels";

import Profile from "@src/__mocks__/mockedDb/profile";
import { tryber } from "@src/features/database";

export default async (params: {
  testerId: number;
  name: string;
  surname: string;
  shortname: string;
  exp: number;
  image_name: string;
  level?: number | false;
}) => {
  let tester = await Profile.insert({
    id: params.testerId,
    wp_user_id: params.testerId + 10,
    name: params.name,
    surname: params.surname,
  });
  let exp = 0;
  if (params.exp > 0) {
    await tryber.tables.MonthlyTesterExp.do().insert({
      tester_id: tester.id,
      amount: params.exp,
    });
    exp = params.exp;
  }
  return {
    ...tester,
    short_name: params.shortname,
    image: `https://eu.ui-avatars.com/api/${params.image_name}/132---${tester.email}---132`,
    exp: { amount: exp },
    level:
      params.level !== false
        ? await UserLevels.insert({
            id: params.testerId + 1000,
            tester_id: tester.id,
            level_id: params.level || 10,
          })
        : undefined,
  };
};
