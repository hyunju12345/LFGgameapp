import test from "node:test";
import assert from "node:assert/strict";
import { previewMatchFor } from "../src/preview-match.ts";

test("preview compatibility reflects each player's preferences and score", () => {
  const alex = previewMatchFor("alex"), hailey = previewMatchFor("hailey"), eric = previewMatchFor("eric"), luke = previewMatchFor("luke");
  assert.equal(alex.match, 92);
  assert.equal(hailey.match, 88);
  assert.equal(eric.match, 73);
  assert.deepEqual(alex.compatibility.map(item => item.status), ["match", "match", "match", "partial", "different"]);
  assert.deepEqual(hailey.compatibility.map(item => item.status), ["match", "partial", "match", "match", "match"]);
  assert.equal(luke.compatibility[2].status, "different");
  assert.ok(luke.match < eric.match);
  for (const id of ["alex", "hailey", "eric", "phill", "luke", "gloria"]) {
    const result = previewMatchFor(id);
    assert.equal(result.compatibility.length, 5);
    assert.ok(result.match >= 0 && result.match <= 100);
    assert.ok(result.playPreferences.includes(result.compatibility[4].status === "match" ? "Voice chat" : "No mic"));
  }
  assert.deepEqual(previewMatchFor("missing"), {});
});
