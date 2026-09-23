// Game data for calc.lokiy.dev.
// Spell rank values are the standard 1.12 values, as collected in
// legacy-sim by Tegas (github.com/royalgiraffe/legacy-sim).
// Adjust these where Vanilla+ differs.

window.CALC_DATA = {
  // Mana regen per 2 sec tick from Spirit, per class.
  regen: {
    priest:  { base: 13, perSpirit: 1 / 4 },
    mage:    { base: 13, perSpirit: 1 / 4 },
    druid:   { base: 15, perSpirit: 1 / 5 },
    shaman:  { base: 15, perSpirit: 1 / 5 },
    paladin: { base: 15, perSpirit: 1 / 5 },
    hunter:  { base: 15, perSpirit: 1 / 5 },
    warlock: { base: 8,  perSpirit: 1 / 4 },
  },

  // Talents, set bonuses and items that change a spell.
  // type: heal = +% healing/damage, hot = +% HoT only, mana = -% mana cost,
  // cast = cast time change (sec), crit = +% crit, flat = flat bonus healing,
  // refund = % of base mana returned on crit, manaFlat = flat mana saved,
  // critMult = crit bonus multiplier, graceCast = Nature's Grace,
  // duration = new HoT duration, addHot = add a HoT to the spell.
  modifiers: {
    giftOfNature:          { name: "Gift of Nature", type: "heal", value: 0.10 },
    improvedHealingTouch:  { name: "Improved Healing Touch", type: "cast", value: -0.5 },
    tranquilSpirit:        { name: "Tranquil Spirit", type: "mana", value: 0.10 },
    moonglow:              { name: "Moonglow", type: "mana", value: 0.09 },
    naturesGrace:          { name: "Nature's Grace", type: "graceCast", value: 0.5 },
    improvedRegrowth:      { name: "Improved Regrowth", type: "crit", value: 50 },
    improvedRejuvenation:  { name: "Improved Rejuvenation", type: "hot", value: 0.15 },
    t2Druid8:              { name: "T2 8-piece (Rejuv +3 sec)", type: "duration", value: 15 },
    t3Druid4:              { name: "T3 4-piece", type: "mana", value: 0.03 },
    t3Druid8:              { name: "T3 8-piece", type: "refund", value: 0.30 },
    idolOfHealth:          { name: "Idol of Health", type: "cast", value: -0.15 },
    idolOfLongevity:       { name: "Idol of Longevity", type: "manaFlat", value: 25 },

    spiritualHealing:      { name: "Spiritual Healing", type: "heal", value: 0.10 },
    improvedRenew:         { name: "Improved Renew", type: "hot", value: 0.15 },
    divineFury:            { name: "Divine Fury", type: "cast", value: -0.5 },
    improvedHealing:       { name: "Improved Healing", type: "mana", value: 0.15 },
    mentalAgility:         { name: "Mental Agility", type: "mana", value: 0.10 },
    improvedPrayer:        { name: "Improved Prayer of Healing", type: "mana", value: 0.20 },
    t2Priest8:             { name: "T2 8-piece (Renew on Greater Heal)", type: "addHot", tick: 63, duration: 15 },

    healingLight:          { name: "Healing Light", type: "heal", value: 0.12 },
    illumination:          { name: "Illumination", type: "refund", value: 1.0 },
    blessingOfLightHL:     { name: "Blessing of Light", type: "flat", value: 400 },
    blessingOfLightFoL:    { name: "Blessing of Light", type: "flat", value: 115 },

    purification:          { name: "Purification", type: "heal", value: 0.10 },
    tidalFocus:            { name: "Tidal Focus", type: "mana", value: 0.05 },
    improvedHealingWave:   { name: "Improved Healing Wave", type: "cast", value: -0.5 },
    healingWay:            { name: "Healing Way (3 stacks)", type: "heal", value: 0.18 },

    amplifyMagic:          { name: "Amplify Magic (improved)", type: "flat", value: 225 },

    bane:                  { name: "Bane", type: "cast", value: -0.5 },
    cataclysm:             { name: "Cataclysm", type: "mana", value: 0.05 },
    ruin:                  { name: "Ruin", type: "critMult", value: 1.0 },
    shadowMastery:         { name: "Shadow Mastery", type: "heal", value: 0.10 },
    demonicSacrifice:      { name: "Demonic Sacrifice (Succubus)", type: "heal", value: 0.15 },
  },

  // coefficient / hotCoefficient override the cast time rule for hybrid spells.
  spells: [
    {
      id: "healing-touch", name: "Healing Touch", cls: "druid", kind: "heal",
      mods: ["improvedHealingTouch", "giftOfNature", "tranquilSpirit", "moonglow", "naturesGrace", "amplifyMagic", "t3Druid4", "t3Druid8", "idolOfHealth", "idolOfLongevity"],
      defaults: ["improvedHealingTouch", "giftOfNature", "tranquilSpirit"],
      ranks: [
        [1, 25, 1, 1.5, 40, 55], [2, 55, 8, 2, 94, 119], [3, 110, 14, 2.5, 204, 253],
        [4, 185, 20, 3, 376, 459], [5, 270, 26, 3.5, 589, 712], [6, 335, 32, 3.5, 761, 914],
        [7, 405, 38, 3.5, 958, 1143], [8, 495, 44, 3.5, 1224, 1453], [9, 600, 50, 3.5, 1545, 1826],
        [10, 720, 56, 3.5, 1916, 2257], [11, 800, 60, 3.5, 2266, 2677],
      ],
    },
    {
      id: "rejuvenation", name: "Rejuvenation", cls: "druid", kind: "heal",
      mods: ["improvedRejuvenation", "giftOfNature", "moonglow", "t2Druid8", "t3Druid4", "amplifyMagic"],
      defaults: ["improvedRejuvenation", "giftOfNature"],
      // [rank, mana, level, cast, min, max, hotTotal, duration]
      ranks: [
        [1, 25, 4, 1.5, 0, 0, 32, 12], [2, 40, 10, 1.5, 0, 0, 56, 12], [3, 75, 16, 1.5, 0, 0, 116, 12],
        [4, 105, 22, 1.5, 0, 0, 180, 12], [5, 135, 28, 1.5, 0, 0, 244, 12], [6, 160, 34, 1.5, 0, 0, 304, 12],
        [7, 195, 40, 1.5, 0, 0, 388, 12], [8, 235, 46, 1.5, 0, 0, 488, 12], [9, 280, 52, 1.5, 0, 0, 608, 12],
        [10, 335, 58, 1.5, 0, 0, 756, 12], [11, 360, 60, 1.5, 0, 0, 888, 12],
      ],
    },
    {
      id: "regrowth", name: "Regrowth", cls: "druid", kind: "heal",
      coefficient: 0.3, hotCoefficient: 0.5,
      mods: ["improvedRegrowth", "giftOfNature", "moonglow", "naturesGrace", "t3Druid4", "amplifyMagic"],
      defaults: ["improvedRegrowth", "giftOfNature", "moonglow"],
      ranks: [
        [1, 120, 12, 2, 92, 107, 98, 21], [2, 205, 18, 2, 176, 201, 175, 21], [3, 280, 24, 2, 255, 290, 259, 21],
        [4, 350, 30, 2, 335, 378, 343, 21], [5, 420, 36, 2, 425, 478, 427, 21], [6, 510, 42, 2, 534, 599, 546, 21],
        [7, 615, 48, 2, 672, 751, 686, 21], [8, 740, 54, 2, 838, 935, 861, 21], [9, 880, 60, 2, 1003, 1120, 1064, 21],
      ],
    },
    {
      id: "heal", name: "Heal", cls: "priest", kind: "heal",
      mods: ["spiritualHealing", "divineFury", "improvedHealing", "amplifyMagic"],
      defaults: ["spiritualHealing", "divineFury", "improvedHealing"],
      ranks: [[1, 155, 16, 3, 306, 353], [2, 205, 22, 3, 444, 507], [3, 255, 28, 3, 585, 662], [4, 305, 34, 3, 734, 827]],
    },
    {
      id: "greater-heal", name: "Greater Heal", cls: "priest", kind: "heal",
      mods: ["spiritualHealing", "divineFury", "improvedHealing", "t2Priest8", "amplifyMagic"],
      defaults: ["spiritualHealing", "divineFury", "improvedHealing"],
      ranks: [[1, 370, 40, 3, 924, 1039], [2, 455, 46, 3, 1177, 1318], [3, 545, 52, 3, 1469, 1642], [4, 655, 58, 3, 1812, 2021], [5, 710, 60, 3, 1965, 2194]],
    },
    {
      id: "flash-heal", name: "Flash Heal", cls: "priest", kind: "heal",
      mods: ["spiritualHealing", "amplifyMagic"],
      defaults: ["spiritualHealing"],
      ranks: [[1, 125, 20, 1.5, 202, 247], [2, 155, 26, 1.5, 268, 325], [3, 185, 32, 1.5, 339, 406], [4, 215, 38, 1.5, 413, 492], [5, 265, 44, 1.5, 534, 633], [6, 315, 50, 1.5, 662, 783], [7, 380, 56, 1.5, 828, 975]],
    },
    {
      id: "renew", name: "Renew", cls: "priest", kind: "heal",
      mods: ["spiritualHealing", "improvedRenew", "mentalAgility", "amplifyMagic"],
      defaults: ["spiritualHealing", "improvedRenew", "mentalAgility"],
      ranks: [
        [1, 30, 8, 1.5, 0, 0, 45, 15], [2, 65, 14, 1.5, 0, 0, 100, 15], [3, 105, 20, 1.5, 0, 0, 175, 15],
        [4, 140, 26, 1.5, 0, 0, 245, 15], [5, 170, 32, 1.5, 0, 0, 315, 15], [6, 205, 38, 1.5, 0, 0, 400, 15],
        [7, 250, 44, 1.5, 0, 0, 510, 15], [8, 305, 50, 1.5, 0, 0, 650, 15], [9, 365, 56, 1.5, 0, 0, 810, 15],
        [10, 410, 60, 1.5, 0, 0, 970, 15],
      ],
    },
    {
      id: "prayer-of-healing", name: "Prayer of Healing", cls: "priest", kind: "heal", targets: 5,
      mods: ["spiritualHealing", "improvedPrayer"],
      defaults: ["spiritualHealing", "improvedPrayer"],
      ranks: [[1, 410, 30, 3, 312, 333], [2, 560, 40, 3, 458, 487], [3, 770, 50, 3, 674, 713], [4, 1030, 60, 3, 938, 991], [5, 1070, 60, 3, 1040, 1099]],
    },
    {
      id: "holy-nova", name: "Holy Nova", cls: "priest", kind: "heal", targets: 5,
      mods: ["spiritualHealing"],
      defaults: ["spiritualHealing"],
      ranks: [[1, 185, 20, 1.5, 54, 63], [2, 290, 28, 1.5, 88, 101], [3, 400, 36, 1.5, 124, 143], [4, 520, 44, 1.5, 165, 192], [5, 635, 52, 1.5, 239, 276], [6, 750, 60, 1.5, 301, 350]],
    },
    {
      id: "holy-light", name: "Holy Light", cls: "paladin", kind: "heal",
      mods: ["healingLight", "illumination", "blessingOfLightHL", "amplifyMagic"],
      defaults: ["healingLight", "illumination", "blessingOfLightHL"],
      ranks: [[1, 35, 1, 2.5, 42, 51], [2, 60, 6, 2.5, 81, 96], [3, 110, 14, 2.5, 167, 196], [4, 190, 22, 2.5, 321, 368], [5, 275, 30, 2.5, 506, 569], [6, 365, 38, 2.5, 716, 799], [7, 465, 46, 2.5, 967, 1076], [8, 580, 54, 2.5, 1271, 1414], [9, 660, 60, 2.5, 1589, 1770]],
    },
    {
      id: "flash-of-light", name: "Flash of Light", cls: "paladin", kind: "heal",
      mods: ["healingLight", "illumination", "blessingOfLightFoL", "amplifyMagic"],
      defaults: ["healingLight", "illumination", "blessingOfLightFoL"],
      ranks: [[1, 35, 20, 1.5, 66, 77], [2, 50, 26, 1.5, 102, 117], [3, 70, 34, 1.5, 152, 171], [4, 90, 42, 1.5, 206, 231], [5, 115, 50, 1.5, 277, 310], [6, 140, 58, 1.5, 348, 389]],
    },
    {
      id: "healing-wave", name: "Healing Wave", cls: "shaman", kind: "heal",
      mods: ["purification", "tidalFocus", "improvedHealingWave", "healingWay", "amplifyMagic"],
      defaults: ["purification", "tidalFocus", "improvedHealingWave", "healingWay"],
      ranks: [[1, 25, 1, 1.5, 36, 47], [2, 45, 6, 2, 68, 83], [3, 80, 12, 2.5, 136, 163], [4, 155, 18, 3, 279, 328], [5, 200, 24, 3, 389, 454], [6, 265, 32, 3, 552, 639], [7, 340, 40, 3, 759, 874], [8, 440, 48, 3, 1040, 1191], [9, 560, 56, 3, 1388, 1583], [10, 620, 60, 3, 1619, 1850]],
    },
    {
      id: "lesser-healing-wave", name: "Lesser Healing Wave", cls: "shaman", kind: "heal",
      mods: ["purification", "tidalFocus", "amplifyMagic"],
      defaults: ["purification", "tidalFocus"],
      ranks: [[1, 105, 20, 1.5, 170, 195], [2, 145, 28, 1.5, 257, 292], [3, 185, 36, 1.5, 349, 394], [4, 235, 44, 1.5, 472, 529], [5, 305, 52, 1.5, 648, 723], [6, 380, 60, 1.5, 831, 928]],
    },
    {
      id: "chain-heal", name: "Chain Heal", cls: "shaman", kind: "heal", chain: true,
      mods: ["purification", "tidalFocus"],
      defaults: ["purification", "tidalFocus"],
      ranks: [[1, 260, 40, 2.5, 332, 381], [2, 315, 46, 2.5, 418, 479], [3, 405, 54, 2.5, 567, 646]],
    },
    {
      id: "shadow-bolt", name: "Shadow Bolt", cls: "warlock", kind: "damage",
      mods: ["bane", "cataclysm", "ruin", "shadowMastery", "demonicSacrifice"],
      defaults: ["bane", "cataclysm", "ruin", "shadowMastery"],
      ranks: [[1, 25, 1, 1.7, 13, 18], [2, 40, 6, 2.2, 25, 32], [3, 70, 12, 2.8, 52, 61], [4, 110, 20, 3, 91, 104], [5, 160, 28, 3, 149, 170], [6, 210, 36, 3, 213, 240], [7, 265, 44, 3, 292, 327], [8, 315, 52, 3, 372, 415], [9, 370, 60, 3, 454, 507], [10, 380, 60, 3, 481, 538]],
    },
  ],
};
