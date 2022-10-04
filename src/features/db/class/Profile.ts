import Database from "./Database";

type ProfileType = {
  id?: number;
  name?: string;
  sex?: -1 | 0 | 1 | 2;
  phone_number?: string;
  country?: string;
  city?: string;
};

class ProfileObject implements ProfileType {
  id?: number;
  name?: string;
  sex?: -1 | 0 | 1 | 2;
  phone_number?: string;
  country?: string;
  city?: string;

  static genders: { [key: string]: string } = {
    "-1": "not-specified",
    "0": "female",
    "1": "male",
    "2": "other",
  };

  constructor(item: ProfileType) {
    this.id = item.id;
    this.name = item.name;
    this.sex = item.sex;
    this.phone_number = item.phone_number;
    this.country = item.country;
    this.city = item.city;
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
        : ["id", "name", "sex", "phone_number", "country", "city"],
    });
  }

  public createObject(row: ProfileType): ProfileObject {
    return new ProfileObject(row);
  }
}
export default Profile;
export { ProfileObject };
