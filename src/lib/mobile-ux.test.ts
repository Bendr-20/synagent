import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const matchClient = fs.readFileSync("src/app/match/match-client.tsx", "utf8");
const homePage = fs.readFileSync("src/app/page.tsx", "utf8");
const siteShell = fs.readFileSync("src/components/site-shell.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

test("mobile match intake hides structured JSON preview behind an advanced disclosure", () => {
  assert.match(matchClient, /className="structured-intake-preview"/);
  assert.match(matchClient, /<summary[^>]*>\s*Advanced intake preview\s*<\/summary>/);
  assert.doesNotMatch(matchClient, /<div[^>]*>\s*<div style=\{\{ \.\.\.labelStyle, marginBottom: "10px" \}\}>Structured Intake Preview<\/div>/);
});

test("mobile homepage compresses process-heavy cards without removing desktop content", () => {
  assert.match(homePage, /className="process-callout"/);
  assert.match(homePage, /className="mvp-flow"/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.process-callout\s*\{[\s\S]*display:\s*none !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.mvp-flow\s*\{[\s\S]*display:\s*none !important;/);
});

test("mobile CSS makes the primary flow faster to reach", () => {
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.site-status\s*\{[\s\S]*display:\s*none !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.hero-section\s*\{[\s\S]*padding:\s*40px 16px 24px !important;/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.match-submit-button\s*\{[\s\S]*position:\s*sticky;/);
});

test("site header CRED and DOCS navigation use real targets on desktop and mobile", () => {
  assert.doesNotMatch(siteShell, /href="#"/);
  assert.match(siteShell, /https:\/\/dexscreener\.com\/base\/0x55a4f7a23c4c2616cf848e639a08bd4283d13e66f5fcf34f828b5ca7e4e96324/);
  assert.match(siteShell, /https:\/\/helixa\.xyz\/docs/);
  assert.equal((siteShell.match(/href=\{CRED_LINK\}/g) || []).length, 2);
  assert.equal((siteShell.match(/href=\{DOCS_LINK\}/g) || []).length, 2);
});
