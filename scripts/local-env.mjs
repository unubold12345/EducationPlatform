import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env already exists; left unchanged.");
} else {
  const lines = [
    "# Local-only EducationPlatform development configuration. Never commit.",
    "DATABASE_URL=postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable",
    "SHADOW_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:51215/template1?sslmode=disable",
    "BETTER_AUTH_URL=http://localhost:3001",
    "BETTER_AUTH_SECRET=" + randomBytes(48).toString("base64url"),
    "AUTH_LOCAL_PILOT=true",
    "",
  ];
  writeFileSync(".env", lines.join("\n"), { mode: 0o600, flag: "wx" });
  console.log("Created local .env with a fresh secret. Secret values were not printed.");
}


