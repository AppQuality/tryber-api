import app from "@src/app";
import config from "@src/config";
const PORT = config.port || 3000;

app.listen(PORT, () => console.info("api listening on port " + PORT));
