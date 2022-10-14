import Database from "./Database";

type ProfileType = {
  id?: number;
  wp_user_id?: number;
  name?: string;
  surname?: string;
  sex?: -1 | 0 | 1 | 2;
  phone_number?: string;
  country?: string;
  city?: string;
  total_exp_pts?: number;
};

class ProfileObject implements ProfileType {
  id?: number;
  wp_user_id?: number;
  name?: string;
  surname?: string;
  sex?: -1 | 0 | 1 | 2;
  phone_number?: string;
  country?: string;
  city?: string;
  total_exp_pts?: number;

  static genders: { [key: string]: string } = {
    "-1": "not-specified",
    "0": "female",
    "1": "male",
    "2": "other",
  };

  constructor(item: ProfileType) {
    this.id = item.id;
    this.name = item.name;
    this.surname = item.surname;
    this.sex = item.sex;
    this.phone_number = item.phone_number;
    this.country = item.country;
    this.city = item.city;
    this.wp_user_id = item.wp_user_id || 0;
    this.total_exp_pts = item.total_exp_pts;
  }

  get gender() {
    if (typeof this.sex === "undefined") return false;
    const sexIndex = this.sex.toString();
    if (sexIndex in ProfileObject.availableGenders) {
      return ProfileObject.availableGenders[sexIndex];
    }
    throw new Error("Invalid gender");
  }

  static get availableGenders() {
    return this.genders;
  }

  static getGenderNumericValue(
    value: string
  ): NonNullable<ProfileObject["sex"]> {
    const genderItem = Object.entries(this.genders).find(
      (item) => item[1] === value
    );
    if (!genderItem) throw new Error("Gender not found: " + value);
    return parseInt(genderItem[0]) as NonNullable<ProfileObject["sex"]>;
  }
}

class Profile extends Database<{
  fields: ProfileType;
}> {
  constructor(fields?: Profile["fields"][number][] | ["*"]) {
    super({
      table: "wp_appq_evd_profile",
      primaryKey: "id",
      fields: fields
        ? fields
        : [
            "id",
            "name",
            "surname",
            "sex",
            "phone_number",
            "total_exp_pts",
            "country",
            "city",
            "wp_user_id",
          ],
    });
  }

  public createObject(row: ProfileType): ProfileObject {
    return new ProfileObject(row);
  }
}
export default Profile;
export { ProfileObject };
