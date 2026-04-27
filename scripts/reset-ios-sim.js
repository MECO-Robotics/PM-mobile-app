const { execFileSync, spawnSync } = require("child_process");

const METRO_PORT = "8081";
const SIMULATOR_ID = "AE2F74A9-73B1-46A8-9EA6-F5D47CCA445B";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : "inherit",
  });
}

function killMetroPort() {
  const result = run("lsof", ["-ti", `tcp:${METRO_PORT}`], { quiet: true });
  const pids = result.stdout
    .split(/\s+/)
    .map((pid) => pid.trim())
    .filter(Boolean);

  for (const pid of pids) {
    run("kill", [pid], { quiet: true });
  }
}

function bootSimulator() {
  run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", SIMULATOR_ID], {
    quiet: true,
  });
  const bootResult = run("xcrun", ["simctl", "boot", SIMULATOR_ID], { quiet: true });
  const alreadyBooted =
    bootResult.status !== 0 && bootResult.stderr.includes("current state: Booted");

  if (bootResult.status !== 0 && !alreadyBooted) {
    process.stderr.write(bootResult.stderr);
    process.exit(bootResult.status ?? 1);
  }

  execFileSync("xcrun", ["simctl", "bootstatus", SIMULATOR_ID, "-b"], {
    stdio: "inherit",
  });
}

killMetroPort();
bootSimulator();
