import { program } from "commander";
import { initCoverage } from "./actions/coverage";
import { initDumpFiles } from "./actions/dump-files";
import { initDumpSymbols } from "./actions/dump-symbols";

import { loadCliConfig } from "@symbolism/utils";

program.option("-c, --config <path>", "config file path", "./.symbolism.json");

program.hook("preAction", (command) => {
  const opts = command.opts();
  loadCliConfig(opts.config);
});

initCoverage(program);
initDumpFiles(program);
initDumpSymbols(program);

program.parse();
