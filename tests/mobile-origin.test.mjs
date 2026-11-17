import test from "node:test";
import assert from "node:assert/strict";
import { fromMobileApp, mobileOrigins, MOBILE_APP_SCHEME } from "../src/lib/mobile-origin.ts";

const production = { NODE_ENV: "production" };
const development = { NODE_ENV: "development" };
const headers = (values) => new Headers(values);

test("the native app is recognised only without a browser Origin and with its own scheme", () => {
  assert.equal(fromMobileApp(headers({ "expo-origin": MOBILE_APP_SCHEME }), production), true);
  assert.equal(fromMobileApp(headers({ "expo-origin": MOBILE_APP_SCHEME + "/profile" }), production), true);
  // No header at all, or another app's scheme, is refused.
  assert.equal(fromMobileApp(headers({}), production), false);
  assert.equal(fromMobileApp(headers({ "expo-origin": "evil://" }), production), false);
  assert.equal(fromMobileApp(headers({ "expo-origin": "https://education.example" }), production), false);
  assert.equal(fromMobileApp(headers({ "expo-origin": "" }), production), false);
});

test("a browser request can never pass as the app, whatever else it sends", () => {
  // A browser always sends its own Origin on a state-changing request; any Origin at all disqualifies the claim.
  for (const origin of ["https://evil.example", "http://localhost:3001", "null", MOBILE_APP_SCHEME]) {
    assert.equal(fromMobileApp(headers({ origin, "expo-origin": MOBILE_APP_SCHEME }), production), false, origin);
  }
});

test("the Expo Go development scheme is trusted by a development server only", () => {
  assert.deepEqual(mobileOrigins(production), [MOBILE_APP_SCHEME]);
  assert.deepEqual(mobileOrigins(development), [MOBILE_APP_SCHEME, "exp://"]);
  assert.equal(fromMobileApp(headers({ "expo-origin": "exp://192.168.1.20:8081" }), development), true);
  assert.equal(fromMobileApp(headers({ "expo-origin": "exp://192.168.1.20:8081" }), production), false);
});
