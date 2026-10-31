export type Player = {
  id: string;
  name: string;
  game: string;
  style: string;
  rank: string;
  online: boolean;
  friendStatus?: string | null;
  incoming?: boolean;
  match?: number;
  reason?: string;
};
export type Party = {
  id: string;
  owner: string;
  name: string;
  game: string;
  mode: string;
  tags: string[];
  capacity: number;
  is_open: boolean;
  members: Player[];
};
export type Message = {
  id: string;
  user_id: string;
  name: string;
  body: string;
  created: number;
};
export type Bootstrap = { user: Player; users: Player[]; parties: Party[] };
export const games = [
  {
    id: "lol",
    name: "League of Legends",
    image: require("../assets/figma/b64d6.png"),
    modes: ["Normal Draft", "ARAM", "Ranked Solo/Duo"],
  },
  {
    id: "valorant",
    name: "VALORANT",
    image: require("../assets/figma/dc830.png"),
    modes: ["Unrated", "Competitive", "Swiftplay"],
  },
  {
    id: "overwatch",
    name: "Overwatch",
    image: require("../assets/figma/66292.png"),
    modes: ["Quick Play", "Competitive", "Arcade"],
  },
  {
    id: "minecraft",
    name: "Minecraft",
    image: require("../assets/figma/68de9.png"),
    modes: ["Survival", "Creative", "Adventure"],
  },
  {
    id: "stardew",
    name: "Stardew Valley",
    image: require("../assets/figma/46416.png"),
    modes: ["Co-op Farm", "New Farm"],
  },
  {
    id: "roblox",
    name: "Roblox",
    image: require("../assets/figma/e312f.png"),
    modes: ["Discover", "Friends"],
  },
];
export const gameById = (id?: string) =>
  games.find((g) => g.id === id) || games[0];
export const avatars = {
  raina: require("../assets/figma/6cacd.png"),
  may: require("../assets/figma/96ea3.png"),
  jessica: require("../assets/figma/08549.png"),
  lemon: require("../assets/figma/61e34.png"),
  alex: require("../assets/figma/f5448.png"),
  hailey: require("../assets/figma/2dc40.png"),
  eric: require("../assets/figma/ba89a.png"),
  phill: require("../assets/figma/94d7a.png"),
  luke: require("../assets/figma/6f074.png"),
  gloria: require("../assets/figma/1303b.png"),
  sam: require("../assets/figma/fa532.png"),
  jun: require("../assets/figma/f0722.png"),
  partyMay: require("../assets/figma/b71a8.png"),
  partyAlex: require("../assets/figma/b5f22.png"),
};
export const avatarFor = (name: string) =>
  avatars[name.toLowerCase() as keyof typeof avatars] || avatars.raina;
const player = (id: string, name: string, game = "lol"): Player => ({
  id,
  name,
  game,
  style: "Chill",
  rank: "Casual",
  online: true,
  friendStatus: "accepted",
});
export const preview: Bootstrap = {
  user: player("preview", "Raina"),
  users: [
    player("may", "May"),
    player("jessica", "Jessica", "valorant"),
    player("lemon", "Lemon", "overwatch"),
    ...["Alex", "Hailey", "Eric", "Phill", "Luke", "Gloria"].map((name, i) => ({
      ...player(name.toLowerCase(), name),
      friendStatus: null,
      match: [92, 88, 73, 73, 73, 73][i],
      reason:
        i === 0
          ? "Similar rank • Casual play"
          : i === 1
            ? "Similar rank • Same goals"
            : "Casual play • Same map",
    })),
  ],
  parties: [
    {
      id: "preview-party",
      owner: "may",
      name: "May’s game",
      game: "lol",
      mode: "ARAM",
      tags: ["Chill", "Every night", "For fun", "Voice chat"],
      capacity: 5,
      is_open: true,
      members: [
        player("may", "May"),
        player("alex", "Alex"),
        player("sam", "Sam"),
        player("jun", "Jun"),
      ],
    },
  ],
};
