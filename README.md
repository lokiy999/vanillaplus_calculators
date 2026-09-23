# VanillaPlus Calculators

Quick theorycrafting calculators for the VanillaPlus private server (WoW 1.12, level 60, level 63 bosses).

Live at **https://calc.lokiy.dev**

| Calculator | What it answers |
|---|---|
| Resistances | Average mitigation, partial resist chances, when full hits stop, spell hit, value of spell pen and spell hit |
| Armor | Physical damage reduction, effective health, armor needed for the 75% cap |
| Attack table | White, dual wield and yellow hit tables, hit cap, glancing blows, crit pushed off the table |
| Defense table | Crit and crushing blow chances, how much defense or avoidance you still need |
| Mana regen | Spirit and mp5 regen while casting and not casting, with Vanilla+ tick rounding |
| Spell ranks | Every rank of a healing spell (or Shadow Bolt) with your gear and talents |

For long-term gearing, use the sim: https://sim.lokiy.dev

## Files

- `index.html` – page layout, styling, all input fields
- `app.js` – all calculator logic, plus the boss resistance presets
- `data.js` – game data: resistance-tab spells, spell ranks, talents and set bonuses, class regen values

No build step. Plain HTML/JS, no libraries.

## Updating the live site

The live site is a git clone of this repo on the server, in `/var/www/calc`.

**Normal way (desktop):**

1. `git pull` (always first, the server may have pushed changes)
2. Edit, then open `index.html` in a browser to test
3. Commit and push
4. On the server: `cd /var/www/calc && git pull`

**Quick fix on the server:** edit the files in `/var/www/calc` (live on save), then
`git add -A && git commit -m "..." && git push`

Caddy sends `Cache-Control: no-cache` for this site, so visitors get new files right away. No version numbers needed in the script tags.

## How to edit common things

### Spells on the Resistances tab (`data.js` → `resistSpells`)

```js
{ name: "Mind Flay", base: 900, coefficient: 0.30, binary: true },
```

- `base` – base damage of the spell
- `coefficient` – spell power coefficient (0.30 = 30% of spell power)
- `binary` – `true` if the spell has any non-damage effect (slow, fear, drain, stun). Binary spells are fully hit or fully resisted, with no partial resists. Picking the spell sets the "Binary spell" checkbox automatically.

### Boss resistance presets (`app.js` → `PLACEHOLDER_BOSSES` / `BOSSES`)

```js
["Boss name", { fire: 150, shadow: 75 }],
```

- `PLACEHOLDER_BOSSES` is shown as "Vanilla+ bosses". Replace the placeholders with real values.
- `BOSSES` is the "Classic raid bosses" group (Molten Core values from Royalgiraffe's guide).
- Each school becomes its own line in the dropdown. Picking one fills in the resistance and switches to "You hit boss".

### Spell ranks tab (`data.js` → `spells`)

Each spell:

```js
{
  id: "flash-heal", name: "Flash Heal", cls: "priest", kind: "heal",   // kind: "heal" or "damage"
  mods: ["spiritualHealing", "amplifyMagic"],   // talents/items that can be ticked (keys from `modifiers`)
  defaults: ["spiritualHealing"],               // ticked by default
  ranks: [[1, 125, 20, 1.5, 202, 247], ...],
}
```

Rank format: `[rank, mana, level, castTime, minHeal, maxHeal, hotTotal, hotDuration]` (the last two only for HoTs).
Optional per spell: `coefficient` / `hotCoefficient` (hybrid spells like Regrowth), `targets: 5` (group heals), `chain: true` (Chain Heal).

### Talents and set bonuses (`data.js` → `modifiers`)

```js
giftOfNature: { name: "Gift of Nature", type: "heal", value: 0.10 },
```

Types: `heal` (+% healing/damage), `hot` (+% HoT only), `mana` (−% mana cost), `manaFlat`, `cast` (cast time change in seconds), `crit` (+crit %), `flat` (flat bonus healing), `refund` (% of base mana back on crit), `critMult`, `graceCast` (Nature's Grace), `duration` (new HoT duration), `addHot`.

### Mana regen per class (`data.js` → `regen`)

`{ base: 13, perSpirit: 1 / 4 }` = mana per 2-second tick from Spirit.

### Formulas (`app.js`)

| Calculator | Function |
|---|---|
| Resistances | `resistStats`, `partials`, `missChance`, `renderResist` |
| Armor | `armorDR` |
| Attack table | `attackChances` |
| Defense table | `renderDefense` |
| Mana regen | `renderRegen` |
| Spell ranks | `spellRow` |

## Credits

Formulas and spell data are based on [Legacy Sim](https://github.com/royalgiraffe/legacy-sim) by Tegas and Royalgiraffe, and on Royalgiraffe's [resistance guide](https://royalgiraffe.github.io/resist-guide) and [testing and analysis](https://royalgiraffe.github.io/resist-analysis). The code and design here are written from scratch.
