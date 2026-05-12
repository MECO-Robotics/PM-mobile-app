const { execFileSync, spawnSync } = require("child_process");

const METRO_PORT = "8081";
const DEFAULT_SIMULATOR_NAME = "iPhone 17";
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
  const devices = Object.entries(devicesByRuntime).flatMap(([runtime, devices]) =>
    devices.map((device) => ({ ...device, runtime })),
  );

  if (process.env.SIMULATOR_ID) {
    return devices.find((device) => device.udid === process.env.SIMULATOR_ID);
  }

  const simulatorName = process.env.SIMULATOR_NAME ?? DEFAULT_SIMULATOR_NAME;
  return devices
    .filter((device) => device.name === simulatorName && device.isAvailable !== false)
    .sort((left, right) => getRuntimeVersion(right.runtime) - getRuntimeVersion(left.runtime))[0];
}

function getRuntimeVersion(runtime) {
  const parts = runtime.match(/iOS-(\d+)-(\d+)/);
  if (!parts) {
    return 0;
  }

  return Number(parts[1]) * 1000 + Number(parts[2]);
}

function shutdownBootedSimulator() {
  const simulator = getSimulator();

  if (!simulator) {
    const target = process.env.SIMULATOR_ID
      ? `with UDID ${process.env.SIMULATOR_ID}`
      : `named ${process.env.SIMULATOR_NAME ?? DEFAULT_SIMULATOR_NAME}`;
    throw new Error(`Simulator ${target} was not found.`);
  }

  if (simulator.state !== "Booted") {
    return simulator;
  }

  const result = run("xcrun", ["simctl", "shutdown", simulator.udid], {
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
