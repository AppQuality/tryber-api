var CodiceFiscale = require("codice-fiscale-js");

export default async (
  fiscalCode: string,
  {
    name,
    surname,
    gender,
    birthday,
    birthplace,
    birthplaceProvincia,
  }: {
    name: string;
    surname: string;
    gender: string;
    birthday: { day: number; month: number; year: number };
    birthplace: string;
    birthplaceProvincia: string;
  }
) => {
  let cf;
  let checkCf;
  if (birthplaceProvincia === "EE") return true;
  try {
    cf = new CodiceFiscale(fiscalCode);
    checkCf = new CodiceFiscale({
      name,
      surname,
      gender,
      day: birthday.day,
      month: birthday.month,
      year: birthday.year,
      birthplace: birthplace,
      birthplaceProvincia: birthplaceProvincia,
    });
    checkCf = new CodiceFiscale(checkCf.code);
    return cf.code === checkCf.code;
  } catch (e) {
    return false;
  }
};
