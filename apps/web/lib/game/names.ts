const FIRST = [
  "Ada",
  "Bram",
  "Cleo",
  "Dax",
  "Elio",
  "Fen",
  "Gus",
  "Hana",
  "Ike",
  "Juno",
  "Kai",
  "Lena",
  "Milo",
  "Nya",
  "Oskar",
  "Pia",
  "Quinn",
  "Rory",
  "Sage",
  "Theo",
  "Umi",
  "Vex",
  "Wren",
  "Xio",
  "Yuki",
  "Zane",
];

const LAST = [
  "Shore",
  "Holt",
  "Vance",
  "Quill",
  "Brio",
  "Cairn",
  "Drey",
  "Elm",
  "Frost",
  "Gale",
  "Hart",
  "Iver",
  "Jett",
  "Knox",
  "Lowe",
  "Mire",
  "Nash",
  "Orr",
  "Pike",
  "Rook",
];

export function makeName(rand: () => number): string {
  const f = FIRST[Math.floor(rand() * FIRST.length)];
  const l = LAST[Math.floor(rand() * LAST.length)];
  return `${f} ${l}`;
}
