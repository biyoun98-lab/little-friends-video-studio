import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bible = JSON.parse(await readFile(new URL("../assets/character-bible.json", import.meta.url), "utf8"));
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("canonical character bible keeps the signature outfits", () => {
  assert.match(bible.characters.Leo.signature_outfit, /red vest/i);
  assert.match(bible.characters.Mimi.signature_outfit, /pink dress/i);
  assert.match(bible.characters.Mimi.signature_outfit, /pink bow/i);
  assert.match(bible.characters.Bobo.skin, /blue/i);
});

test("studio default AI prompt uses the canonical character designs", () => {
  assert.match(html, /signature bright red vest/i);
  assert.match(html, /signature pink dress and matching pink bow/i);
  assert.doesNotMatch(html, /golden lion cub in a green vest/i);
});

test("saved drafts with the old green vest design are migrated", () => {
  assert.match(html, /d\.fields\?\.characters&&\/green vest\/i/);
  assert.match(html, /signature bright red vest/);
});
