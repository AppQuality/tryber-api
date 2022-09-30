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
    if (this.sex === -1) return "not-specified";
    if (this.sex === 0) return "female";
    if (this.sex === 1) return "male";
    if (this.sex === 2) return "other";
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
