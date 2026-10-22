import app from "./app.js";
import { config } from "./config/env.js";

app.listen(config.port, () => {
  console.log(`BFF server running on port ${config.port}`);
});
