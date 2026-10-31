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
  await req("/friends", at, "POST", { userId: b.data.user.id });
  let state = (await req("/bootstrap", bt)).data;
  assert.equal(state.users.find((u) => u.id === a.data.user.id).incoming, true);
  await req("/friends", bt, "POST", { userId: a.data.user.id });
  state = (await req("/bootstrap", at)).data;
  assert.equal(
    state.users.find((u) => u.id === b.data.user.id).friendStatus,
    "accepted",
  );
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
  assert.equal((await req(`/parties/${id}/messages`, bt)).status, 403);
  assert.equal((await req(`/parties/${id}/join`, bt, "POST")).status, 200);
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
  await req("/auth/logout", at, "POST");
  assert.equal((await req("/bootstrap", at)).status, 401);
});
