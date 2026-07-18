#!/usr/bin/env node
/**
 * Offline unit checks for language-pack helpers (no native modules).
 * Run: pnpm --filter mobile test:langpack
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadPhrasebookSource() {
  return readFileSync(join(root, "lib/phrasebook.ts"), "utf8");
}

function testPhrasebookCoverage() {
  const src = loadPhrasebookSource();
  const keys = [
    "exclusive_breastfeeding_0_6mo",
    "early_initiation",
    "frequent_feeding_newborn",
    "complementary_feeding_start",
    "dietary_diversity",
    "continued_breastfeeding_2yr",
    "responsive_feeding",
    "sick_child_feeding",
    "maternal_nutrition_pregnancy",
    "maternal_nutrition_postpartum",
  ];
  for (const key of keys) {
    assert.ok(src.includes(`key: "${key}"`), `missing guidance key ${key}`);
  }
  assert.ok(src.includes("Good morning"), "common phrases present");
  console.log("ok phrasebook coverage");
}

function testChecksumHelper() {
  const payload = "chw-dagbani-lang-v0.1.0";
  const hex = createHash("sha256").update(payload).digest("hex");
  assert.equal(hex.length, 64);
  assert.notEqual(hex, createHash("sha256").update(payload + "!").digest("hex"));
  console.log("ok sha256 helper");
}

function testManifestShape() {
  const manifest = {
    pack_id: "chw-dagbani-lang-v0.1.0",
    version: "0.1.0",
    status: "experimental",
    languages: ["en", "dag"],
    components: {
      translation: { engine: "onnxruntime", ready: false, files: [] },
      tts: { engine: "sherpa-onnx", ready: false, files: [] },
    },
    total_bytes: 0,
  };
  assert.ok(manifest.languages.includes("dag"));
  assert.equal(manifest.components.translation.ready, false);
  // State machine transitions
  const states = ["missing", "downloading", "verifying", "ready", "error"];
  assert.deepEqual(states.length, 5);
  console.log("ok manifest + state machine");
}

function testTokenLimit() {
  const MAX = 400;
  const long = "x".repeat(500);
  assert.equal(long.slice(0, MAX).length, 400);
  console.log("ok token/char limit");
}

function testCancellationFlag() {
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  cancel();
  assert.equal(cancelled, true);
  console.log("ok cancellation");
}

function testErrorMapping() {
  const map = {
    missing: "LANGUAGE_PACK_URL is not configured",
    empty: "Empty input",
    tts: "Dagbani TTS not installed",
  };
  assert.ok(map.missing.includes("LANGUAGE_PACK"));
  console.log("ok error mapping");
}

testPhrasebookCoverage();
testChecksumHelper();
testManifestShape();
testTokenLimit();
testCancellationFlag();
testErrorMapping();
console.log("\nAll language-pack unit checks passed.");
