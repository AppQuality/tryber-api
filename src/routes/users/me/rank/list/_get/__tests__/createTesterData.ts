import { data as expData } from "@src/__mocks__/mockedDb/experience";
import { data as levelData } from "@src/__mocks__/mockedDb/levels";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";

export default async (params: {
  testerId: number;
  name: string;
  surname: string;
  shortname: string;
  exp: number;
  image_name: string;
  level?: number | false;
}) => {
  let tester = await profileData.basicTester({
    id: params.testerId,
    wp_user_id: params.testerId + 10,
    name: params.name,
    surname: params.surname,
  });
  tester.short_name = params.shortname;
  tester.image = `https://eu.ui-avatars.com/api/${params.image_name}/132---${tester.email}---132`;
  tester.exp = { amount: 0 };
  if (params.exp > 0)
    tester.exp = await expData.basicExperience({
      id: params.testerId + 100,
      tester_id: tester.id,
      amount: params.exp,
    });
  if (params.level !== false)
    tester.level = await levelData.basicLevel({
      id: params.testerId + 1000,
      tester_id: tester.id,
      level_id: params.level || 10,
    });
  return tester;
};
