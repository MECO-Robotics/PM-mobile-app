import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const screenTypesSource = readFileSync(new URL("../src/screens/types.ts", import.meta.url), "utf8");
const manufacturingSource = readFileSync(new URL("../src/screens/ManufacturingScreen.tsx", import.meta.url), "utf8");

test("App derives mentor approval permission from mentor, lead, and admin roles", () => {
  assert.match(appSource, /const canMentorApprove\s*=\s*[\s\S]*signedInMember\?\.role === "mentor"/);
  assert.match(appSource, /const canMentorApprove\s*=\s*[\s\S]*signedInMember\?\.role === "lead"/);
  assert.match(appSource, /const canMentorApprove\s*=\s*[\s\S]*signedInMember\?\.role === "admin"/);
});

test("App exposes mentor approval permission through shared screen props", () => {
  assert.match(screenTypesSource, /canMentorApprove:\s*boolean;/);
  assert.match(appSource, /canMentorApprove,\s*\n/);
});

test("manufacturing mentor review actions are guarded by the role permission", () => {
  assert.match(manufacturingSource, /canMentorApprove/);
  assert.match(manufacturingSource, /const canApproveItem\s*=\s*canMentorApprove && !item\.mentorReviewed;/);
  assert.match(manufacturingSource, /\{canApproveItem \? \(/);
});

test("QA report drafts preserve automatic mentor approval from the role permission", () => {
  assert.match(appSource, /mentorApproved:\s*Boolean\(canMentorApprove\)/);
});