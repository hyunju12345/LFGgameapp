export const previewConversations = [
  { id: "jessica", name: "Jessica", preview: "Let’s play league", time: "32 min", unread: 12, image: require("../assets/figma/485dc.png") },
  { id: "team", name: "Team Parsons", count: 6, preview: "this week homework...", time: "3 hours", unread: 30, image: require("../assets/figma/45c8e.png") },
  { id: "may", name: "May", preview: "You wanna have burger?", time: "1day ago", unread: 0, image: require("../assets/figma/ccbff.png") },
  { id: "lemon", name: "Lemon", preview: "Hi", time: "3days ago", unread: 0, image: require("../assets/figma/5f269.png") },
];
export const teamMessages: {
  body: string;
  time: string;
  name?: string;
  image?: import("react-native").ImageSourcePropType;
  date?: string;
}[] = [
  { body: "우리 내일", time: "오전 11:30" },
  { body: "수정 해야됩니다", time: "오전 11:30" },
  { body: "룸메 네명이다", time: "5:00", name: "Jessica", image: require("../assets/figma/c4138.png") },
  { body: "앞으로 우리집은", time: "5:00", name: "Jessica" },
  { body: "인정~", time: "6:29", name: "Ian", image: require("../assets/figma/750be.png") },
  { body: "날짜를", time: "6:30", name: "Ian" },
  { body: "이건 아이메세지 버전입니다", time: "8:00" },
  { body: "수정은 해야하지만..", time: "8:00" },
  { body: "역시 편한 피그마 플러그인", time: "7:20", date: "Tue Oct 27" },
  { body: "인정~", time: "7:43", name: "Marin", image: require("../assets/figma/7c68a.png") },
  { body: "날짜를", time: "7:43", name: "Marin" },
  { body: "빼먹어버렸네용", time: "7:20" },
];
