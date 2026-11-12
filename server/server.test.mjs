import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const temp = mkdtempSync(path.join(tmpdir(), "partyup-test-"));
process.env.NODE_ENV = "test";
process.env.DATA_DIR = temp;
const { server } = await import("./server.mjs");
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function req(route, token = "", method = "GET", body) {
  const r = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
after(() => {
  server.close();
  rmSync(temp, { recursive: true, force: true });
});
test("two real accounts: friendship, private data, party capacity, chat, persistence, logout", async () => {
  const password = "test-password-921";
  const a = await req("/auth/register", "", "POST", {
    name: "Raina",
    email: "raina@example.test",
    password,
  });
  assert.equal(a.status, 200);
  const b = await req("/auth/register", "", "POST", {
    name: "May",
    email: "may@example.test",
    password,
  });
  assert.equal(b.status, 200);
  const c = await req("/auth/register", "", "POST", {
    name: "Alex",
    email: "alex@example.test",
    password,
  });
  assert.equal(c.status, 200);
  const at = a.data.token,
    bt = b.data.token,
    ct = c.data.token;
  assert.equal((await req("/bootstrap")).status, 401);
  assert.equal(
    (
      await req("/auth/login", "", "POST", {
        email: "raina@example.test",
        password: "incorrect-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await req("/auth/register", "", "POST", {
        name: "Raina",
        email: "raina@example.test",
        password,
      })
    ).status,
    409,
  );
  const login = await req("/auth/login", "", "POST", {
    email: "raina@example.test",
    password,
  });
  assert.equal(login.data.user.id, a.data.user.id);
  assert.match(a.data.user.friendCode, /^[A-F0-9]{8}$/);
  assert.notEqual(a.data.user.friendCode, b.data.user.friendCode);
  assert.equal(login.data.user.friendCode, a.data.user.friendCode);
  assert.equal((await req(`/friends/lookup?code=${b.data.user.friendCode}`)).status, 401);
  const formattedCode = b.data.user.friendCode.slice(0,4) + "-" + b.data.user.friendCode.slice(4);
  const found = await req(`/friends/lookup?code=${formattedCode.toLowerCase()}`, at);
  assert.equal(found.status, 200);
  assert.equal(found.data.id, b.data.user.id);
  assert.equal(found.data.friendStatus, null);
  assert.equal((await req(`/friends/lookup?code=${a.data.user.friendCode}`, at)).status, 400);
  assert.equal((await req("/friends/lookup?code=bad", at)).status, 400);
  await req("/friends", at, "POST", { userId: found.data.id });
  assert.equal((await req(`/friends/lookup?code=${b.data.user.friendCode}`, at)).data.friendStatus, "pending");
  assert.equal((await req(`/friends/lookup?code=${a.data.user.friendCode}`, bt)).data.incoming, true);

  let state = (await req("/bootstrap", bt)).data;
  assert.equal(state.users.find((u) => u.id === a.data.user.id).incoming, true);
  await req("/friends", bt, "POST", { userId: a.data.user.id });
  state = (await req("/bootstrap", at)).data;
  assert.equal(
    state.users.find((u) => u.id === b.data.user.id).friendStatus,
    "accepted",
  );
  assert.equal((await req(`/friends/lookup?code=${b.data.user.friendCode}`, at)).data.friendStatus, "accepted");
  assert.ok(!JSON.stringify(state).includes(password));
  assert.ok(!JSON.stringify(state).includes("salt"));
  const party = await req("/parties", at, "POST", {
    name: "Team Korea",
    game: "lol",
    mode: "ARAM",
    tags: ["Chill"],
    capacity: 2,
    is_open: true,
  });
  assert.equal(party.status, 200);
  const id = party.data.id;
  assert.equal((await req("/bootstrap", at)).data.currentPartyId, id);
  assert.equal((await req(`/parties/${id}/messages`, bt)).status, 403);
  assert.equal((await req(`/parties/${id}/join`, bt, "POST")).status, 200);
  assert.equal((await req("/bootstrap", bt)).data.currentPartyId, id);
  assert.equal((await req(`/parties/${id}/join`, bt, "POST")).status, 200);
  assert.equal((await req(`/parties/${id}/join`, ct, "POST")).status, 409);
  assert.equal(
    (await req(`/parties/${id}/messages`, at, "POST", { body: "   " })).status,
    400,
  );
  const sent = await req(`/parties/${id}/messages`, at, "POST", {
    body: "같이 게임할까요?",
  });
  assert.equal(sent.data[0].body, "같이 게임할까요?");
  const received = await req(`/parties/${id}/messages`, bt);
  assert.equal(received.data[0].name, "Raina");
  assert.equal(received.data[0].body, sent.data[0].body);
  await req("/profile", bt, "PATCH", {
    name: "May",
    game: "valorant",
    style: "Competitive",
    rank: "Gold",
  });
  assert.equal((await req("/bootstrap", bt)).data.user.game, "valorant");
  await req(`/parties/${id}/leave`, at, "POST");
  state = (await req("/bootstrap", bt)).data;
  assert.equal(state.parties[0].owner, b.data.user.id);
  assert.equal((await req(`/parties/${id}/messages`, at)).status, 403);
  await req(`/parties/${id}/leave`, bt, "POST");
  assert.equal((await req("/bootstrap", bt)).data.parties.length, 0);
  assert.equal((await req("/bootstrap", bt)).data.currentPartyId, null);
  const privateParty = await req("/parties", at, "POST", {
    name: "Private team",
    game: "lol",
    mode: "ARAM",
    tags: [],
    capacity: 5,
    is_open: false,
  });
  assert.equal((await req("/bootstrap", bt)).data.parties.length, 0);
  assert.equal(
    (await req(`/parties/${privateParty.data.id}/join`, bt, "POST")).status,
    403,
  );
  const invitation = await req("/parties", at, "POST", {
    name: "Invited squad", game: "lol", mode: "ARAM", tags: [], capacity: 2, is_open: false,
    invitees: [b.data.user.id],
  });
  assert.equal(invitation.status, 200);
  assert.equal((await req("/bootstrap", bt)).data.parties.find(p => p.id === invitation.data.id).invited, true);
  assert.equal((await req("/bootstrap", at)).data.parties.find(p => p.id === invitation.data.id).invited, false);
  assert.ok(!(await req("/bootstrap", ct)).data.parties.some(p => p.id === invitation.data.id));
  assert.equal((await req(`/parties/${invitation.data.id}/join`, ct, "POST")).status, 403);
  assert.equal((await req(`/parties/${invitation.data.id}/join`, bt, "POST")).status, 200);
  assert.equal((await req("/bootstrap", bt)).data.parties.find(p => p.id === invitation.data.id).invited, false);
  assert.equal((await req("/parties", at, "POST", { name: "Too many", game: "lol", mode: "ARAM", tags: [], capacity: 2, is_open: false, invitees: [b.data.user.id, c.data.user.id] })).status, 400);
  assert.equal((await req("/parties", at, "POST", { name: "Invalid player", game: "lol", mode: "ARAM", tags: [], capacity: 2, is_open: false, invitees: ["missing-player"] })).status, 400);
  const solo = await req("/parties", at, "POST", { name: "Solo draft", game: "lol", mode: "ARAM", tags: [], capacity: 1, is_open: false });
  assert.equal(solo.status, 200);
  assert.equal(solo.data.capacity, 1);
  assert.equal(solo.data.members.length, 1);
  await req("/auth/logout", at, "POST");
  assert.equal((await req("/bootstrap", at)).status, 401);
});

test("Steam catalogue discovery, pagination, saved library isolation, and creating a Steam party", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname !== "store.steampowered.com") return originalFetch(input, options);
    if (url.pathname === "/search/results/") {
      if (url.searchParams.get("term") === "unavailable") return new Response("", { status: 503 });
      const start = Number(url.searchParams.get("start"));
      const id = start ? 9990002 : 9990001;
      return Response.json({ success: 1, total_count: 2, results_html: `<a href="https://store.steampowered.com/app/${id}" data-ds-appid="${id}"><img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg"><span class="title">Test &amp; Game ${id}</span></a>` });
    }
    const id = url.searchParams.get("appids");
    return Response.json({ [id]: id === "9990001" ? { success: true, data: { name: "Test & Game", type: "game", header_image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg` } } : { success: false } });
  };
  try {
    const first = await req("/games/search?q=");
    assert.equal(first.status, 200);
    assert.equal(first.data.items[0].id, "steam:9990001");
    assert.equal(first.data.items[0].name, "Test & Game 9990001");
    assert.equal(first.data.hasMore, true);
    const next = await req(`/games/search?q=&start=${first.data.nextStart}`);
    assert.equal(next.data.items[0].id, "steam:9990002");
    assert.equal(next.data.hasMore, false);
    assert.equal((await req("/games/search?q=x&start=-1")).status, 400);
    assert.equal((await req("/games/search?q=unavailable")).status, 502);
    assert.equal((await req("/games/library")).status, 401);
    const a = (await req("/auth/register", "", "POST", { name: "Steam test", email: "steam@example.test", password: "catalogue-test-password" })).data.token;
    const b = (await req("/auth/register", "", "POST", { name: "Other test", email: "steam2@example.test", password: "catalogue-test-password" })).data.token;
    const before = (await req("/games/library", a)).data;
    assert.equal(before.length, 4);
    const invalid = await req("/games/library", a, "POST", { ids: ["steam:9990001", "steam:9990002"] });
    assert.equal(invalid.status, 404);
    assert.equal((await req("/games/library", a)).data.length, 4);
    const added = await req("/games/library", a, "POST", { ids: ["steam:9990001", "steam:9990001"] });
    assert.equal(added.status, 200);
    assert.equal(added.data.length, 5);
    assert.equal((await req("/games/library", a, "POST", { ids: ["steam:9990001"] })).data.length, 5);
    assert.equal((await req("/games/library", b)).data.length, 4);
    const removed = await req("/games/library", a, "POST", { ids: [], removeIds: ["steam:9990001", "lol"] });
    assert.equal(removed.status, 200);
    assert.equal(removed.data.length, 3);
    assert.ok(!removed.data.some(game => game.id === "lol" || game.id === "steam:9990001"));
    assert.equal((await req("/games/library", b)).data.length, 4);
    assert.equal((await req("/games/library", a)).data.length, 3);
    assert.equal((await req("/games/steam:9990001")).data.name, "Test & Game");
    const party = await req("/parties", a, "POST", { name: "Steam squad", game: "steam:9990001", mode: "Default", tags: [], capacity: 5, is_open: true });
    assert.equal(party.status, 200);
    assert.equal(party.data.game, "steam:9990001");
    const state = (await req("/bootstrap", b)).data;
    assert.equal(state.parties[0].game, "steam:9990001");
    assert.ok(state.gameCatalog.some(game => game.id === "steam:9990001" && game.name === "Test & Game"));
  } finally { globalThis.fetch = originalFetch; }
});
