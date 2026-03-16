import { spawnSync } from "node:child_process";

const attempts = 3;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  console.log(`expo-doctor attempt ${attempt}/${attempts}`);

  const result = spawnSync("npm", ["--prefix", "mobile", "run", "doctor"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < attempts) {
    console.log("expo-doctor hit a transient failure; retrying...");
  }
}

process.exit(1);
