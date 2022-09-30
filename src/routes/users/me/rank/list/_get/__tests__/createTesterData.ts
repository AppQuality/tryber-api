import { data as expData } from "@src/__mocks__/mockedDb/experience";
import { data as levelData } from "@src/__mocks__/mockedDb/levels";
import Profile from "@src/__mocks__/mockedDb/profile";

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
  return {
    ...tester,
    short_name: params.shortname,
    image: `https://eu.ui-avatars.com/api/${params.image_name}/132---${tester.email}---132`,
    exp:
      params.exp > 0
        ? await expData.basicExperience({
            id: params.testerId + 100,
            tester_id: tester.id,
            amount: params.exp,
          })
        : { amount: 0 },
    level:
      params.level !== false
        ? await levelData.basicLevel({
            id: params.testerId + 1000,
            tester_id: tester.id,
            level_id: params.level || 10,
          })
        : undefined,
  };
};
