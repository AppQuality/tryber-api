import { v5 as uuidv5 } from "uuid";

export default (str: string) => {
  return uuidv5(str, "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d");
};
