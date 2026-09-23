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

- `index.html` – page layout and styling
- `app.js` – all calculator logic
- `data.js` – game data: spell ranks, talents and set bonuses, class regen values. Change this when Vanilla+ differs from standard 1.12.

No build step. Edit a file and the site updates on save.

## Credits

Formulas and spell data are based on [Legacy Sim](https://github.com/royalgiraffe/legacy-sim) by Tegas and Royalgiraffe, and on Royalgiraffe's [resistance guide](https://royalgiraffe.github.io/resist-guide) and [testing and analysis](https://royalgiraffe.github.io/resist-analysis). The code and design here are written from scratch.
