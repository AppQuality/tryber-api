import { extract } from "@appquality/jest-extract";
import fs from "fs";

const textFile = process.argv[2];

extract().then((result) => {
  fs.writeFileSync(textFile, result.join("\n"));
});
