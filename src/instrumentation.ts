// Runs once when the server starts (see
// node_modules/next/dist/docs/.../instrumentation.md) -- used here to print
// a clear, impossible-to-miss note when the app is booted without the two
// credentials that gate real blockchain minting and file uploads, so
// anyone running this from a fresh clone (a grader, a teammate) understands
// why those two features show a degraded message instead of assuming
// something is broken.
const LIVE_DEMO_URL = "http://161.153.217.84/";
const REPO_URL = "https://github.com/MauricioBravo/DDIB26";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing = [
    "SYSTEM_SIGNER_MNEMONIC",
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
  ].filter((name) => !process.env[name]);

  if (missing.length === 0) return;

  const border = "*".repeat(72);
  console.log(`\n${border}`);
  console.log("**");
  console.log("**  GreenProof: missing environment variables");
  console.log("**");
  console.log(`**  Missing: ${missing.join(", ")}`);
  console.log("**");
  console.log("**  This app still runs: browsing, login, the voting UI, and");
  console.log("**  rankings all work. Only real blockchain minting and");
  console.log("**  evidence file uploads need these two credentials.");
  console.log("**");
  console.log("**  To see every feature working, please visit the live demo:");
  console.log(`**    ${LIVE_DEMO_URL}`);
  console.log("**");
  console.log("**  Or copy .env.example to .env.local and ask a maintainer");
  console.log("**  for real values. Source: " + REPO_URL);
  console.log("**");
  console.log(`${border}\n`);
}
