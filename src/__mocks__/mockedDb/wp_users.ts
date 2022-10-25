import Table from "./table";

type WpUsersParams = {
  ID?: number;
  user_login?: string;
  user_email?: string;
  user_pass?: string;
};

class WpUsers extends Table<WpUsersParams> {
  protected name = "wp_users";
  protected columns = [
    "ID INTEGER PRIMARY KEY",
    "user_login VARCHAR(255)",
    "user_email VARCHAR(100)",
    "user_pass VARCHAR(255)",
  ];
  constructor() {
    super({
      ID: 1,
      user_login: "tester",
      user_email: "tester@example.com",
      user_pass: "pass",
    });
  }
}

const theTable = new WpUsers();

export default theTable;
