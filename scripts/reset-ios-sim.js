const { execFileSync, spawnSync } = require("child_process");

const METRO_PORT = "8081";
const SIMULATOR_ID = "AE2F74A9-73B1-46A8-9EA6-F5D47CCA445B";
const SIMULATOR_SETTLE_MS = 5000;

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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getSimulator() {
  const output = execFileSync("xcrun", ["simctl", "list", "devices", "--json"], {
    encoding: "utf8",
  });
  const devicesByRuntime = JSON.parse(output).devices;
  return Object.values(devicesByRuntime)
    .flat()
    .find((device) => device.udid === SIMULATOR_ID);
}

function shutdownBootedSimulator() {
  const simulator = getSimulator();

  if (!simulator) {
    throw new Error(`Simulator ${SIMULATOR_ID} was not found.`);
  }

  if (simulator.state !== "Booted") {
    return;
  }

  const result = run("xcrun", ["simctl", "shutdown", SIMULATOR_ID], {
    quiet: true,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

function bootSimulator() {
  shutdownBootedSimulator();

  run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", SIMULATOR_ID], {
    quiet: true,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return simulator;
}

function bootSimulator() {
  const simulator = shutdownBootedSimulator();

  run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", simulator.udid], {
    quiet: true,
  });
  const bootResult = run("xcrun", ["simctl", "boot", simulator.udid], { quiet: true });
  const alreadyBooted =
    bootResult.status !== 0 && bootResult.stderr.includes("current state: Booted");

  if (bootResult.status !== 0 && !alreadyBooted) {
    process.stderr.write(bootResult.stderr);
    process.exit(bootResult.status ?? 1);
  }

  execFileSync("xcrun", ["simctl", "bootstatus", simulator.udid, "-b"], {
    stdio: "inherit",
  });

  sleep(SIMULATOR_SETTLE_MS);
}

killMetroPort();
bootSimulator();
