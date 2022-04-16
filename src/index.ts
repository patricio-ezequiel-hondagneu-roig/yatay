import { existsSync, readFileSync } from "fs";
import { argv } from "process";
import { YatayCli } from "./yatay-cli";

const yatayCli = new YatayCli();
yatayCli.run();
