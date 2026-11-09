import { render } from "preact";
import { Startup } from "./startup";
import { prepareOfflineSupport } from "./offline";
import "./tokens.css";
import "./styles.css";
import "./garden.css";
import "./studio.css";

void prepareOfflineSupport();
render(<Startup />, document.getElementById("app")!);
