import React, { useState, useEffect, useCallback } from 'react'
import './App.css'

const pascalCaseToDisplayName = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

const damageLookup = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 2, 2, 2],
  [0, 0, 1, 1, 2, 2, 3, 3],
];

const statTypes = {
  STR: "STR", // Strength
  AGI: "AGI", // Agility
  INT: "INT", // Intellect
  PRE: "PRE", // Presence
  SPI: "SPI", // Spirit
  CON: "CON", // Constitution
}

interface IStats {
  [key: string]: {
    [key: string]: number,
  }
}

const getStatTotal = (stat: string, stats: IStats): number => {
  return (
    stats.base[stat] +
    stats.general[stat] +
    stats.melee[stat] +
    stats.ranged[stat] +
    stats.magic[stat] +
    stats.temp[stat]
  )
}

const targeting: {[key: string]: string} = {
  body: "body",
  limb: "limb", // -1 to attack rolls
  head: "head", // -2 to attack rolls (-3 for stabs)
}

const weaponSkills: {[key: string]: string} = {
  none: "none",
  daggers: "daggers",
  standardSwords: "standardSwords",
  cuttingSwords: "cuttingSwords",
  thrustingSwords: "thrustingSwords",
  twoHandedSwords: "twoHandedSwords",
  flails: "flails",
  maces: "maces",
  oneHandedAxes: "oneHandedAxes",
  staffs: "staffs",
  greatSwords: "greatSwords",
  poleaxes: "poleaxes",
  glaives: "glaives",
  pikes: "pikes",
  spears: "spears",
  pistols: "pistols",
  lgc: "lgc", // Long guns and crossbows
  bows: "bows",
}

const attackTypes: {[key: string]: string} = {
  slash: "slash",
  stab: "stab",
  ranged: "ranged",
}

interface IAttack {
  variance: number[], // damage variance
  attackType: string,
  blunt?: boolean,    // if true, damage is blunt
  ap?: boolean,       // if true, damage is armor piercing
  strAdd?: number,    // add STR * strAdd to damage
  ranges?: number[],  // ranges for ranged attacks
}

interface IWeapon {
  name: string,
  skill: string,
  attacks: IAttack[],
  durability?: number,
  strikes?: number,
  reach?: number,
  weight: number,
  lengthy?: boolean,
  ambushWeapon?: boolean,
  hook?: boolean,
}

interface IWeapons {
  [key: string]: IWeapon,
}

const weapons: IWeapons = {
  dagger: {
    name: "Dagger",
    skill: weaponSkills.daggers,
    attacks: [
      { variance: [20, 25], attackType: attackTypes.slash },
      { variance: [20, 25], attackType: attackTypes.stab }
    ],
    durability: 40,
    strikes: 2,
    reach: 1,
    weight: 3,
    lengthy: true,
    ambushWeapon: true,
  },
  scimitar: {
    name: "Scimitar",
    skill: weaponSkills.cuttingSwords,
    attacks: [
      { variance: [40, 45, 50, 60], attackType: attackTypes.slash },
      { variance: [15, 20, 25], attackType: attackTypes.stab }
    ],
    durability: 40,
    strikes: 2,
    reach: 3,
    weight: 5,
  },
  armingSword: {
    name: "Arming Sword",
    skill: weaponSkills.standardSwords,
    attacks: [
      { variance: [30, 40, 50, 60], attackType: attackTypes.slash },
      { variance: [30, 45, 60], attackType: attackTypes.stab }
    ],
    durability: 60,
    strikes: 3,
    reach: 3,
    weight: 6,
  },
  sideSword: {
    name: "Side Sword",
    skill: weaponSkills.standardSwords,
    attacks: [
      { variance: [25, 30, 35, 40], attackType: attackTypes.stab },
      { variance: [40, 60, 80], attackType: attackTypes.slash }
    ],
    durability: 60,
    strikes: 3,
    reach: 3,
    weight: 6,
  },
  bastardSword: {
    name: "Bastard Sword",
    skill: weaponSkills.standardSwords,
    attacks: [
      { variance: [40, 50, 60, 70], attackType: attackTypes.slash },
      { variance: [30, 45, 60], attackType: attackTypes.stab }
    ],
    durability: 65,
    strikes: 3,
    reach: 3,
    weight: 8,
  },
  mace: {
    name: "Mace",
    skill: weaponSkills.maces,
    attacks: [
      { variance: [30, 40], attackType: attackTypes.slash, blunt: true },
      { variance: [10, 20], attackType: attackTypes.stab, blunt: true }
    ],
    durability: 100,
    strikes: 3,
    reach: 2,
    weight: 6,
    lengthy: true,
  },
  beardedAxe: {
    name: "Bearded Axe",
    skill: weaponSkills.oneHandedAxes,
    attacks: [
      { variance: [70], attackType: attackTypes.slash },
      { variance: [0], attackType: attackTypes.stab, strAdd: 1.5 }
    ],
    durability: 60,
    strikes: 3,
    reach: 3,
    weight: 7,
  },
  woodenSpear: {
    name: "Wooden Spear",
    skill: weaponSkills.spears,
    attacks: [
      { variance: [0], attackType: attackTypes.slash, strAdd: 2 },
      { variance: [20, 30, 35], attackType: attackTypes.stab }
    ],
    durability: 30,
    strikes: 2,
    reach: 4,
    weight: 4,
  },
  warHammer: {
    name: "War Hammer",
    skill: weaponSkills.maces,
    attacks: [
      { variance: [30, 50, 50], attackType: attackTypes.slash, blunt: true },
      { variance: [15, 25], attackType: attackTypes.slash, ap: true },
      { variance: [0], attackType: attackTypes.stab, strAdd: 1 }
    ],
    durability: 30,
    strikes: 3,
    reach: 2,
    weight: 7,
    lengthy: true,
  },
  flail: {
    name: "Flail",
    skill: weaponSkills.flails,
    attacks: [
      { variance: [15, 25], attackType: attackTypes.slash, blunt: true, strAdd: 2 },
    ],
    durability: 30,
    strikes: 3,
    reach: 3,
    weight: 8
  },
  fixieBow: {
    name: "Fixie Bow",
    skill: weaponSkills.bows,
    attacks: [
      { variance: [20, 15], attackType: attackTypes.ranged, ranges: [30, 60] },
      { variance: [0], attackType: attackTypes.slash, strAdd: 1.5 },
      { variance: [0], attackType: attackTypes.stab, strAdd: 1.5 },
    ],
    durability: 30,
    strikes: 1,
    reach: 3,
    weight: 1,
  },
  longbow: {
    name: "Longbow",
    skill: weaponSkills.bows,
    attacks: [
      { variance: [15, 20, 30], attackType: attackTypes.ranged, ranges: [100, 200, 360] },
      { variance: [0], attackType: attackTypes.slash, strAdd: 2 },
      { variance: [0], attackType: attackTypes.stab, strAdd: 2 },
    ],
    durability: 40,
    strikes: 2,
    reach: 5,
    weight: 3,
  },

  // Temp
  athansiosTalons: {
    name: "Athansios' Talons",
    skill: weaponSkills.daggers,
    attacks: [
      { variance: [80, 90], attackType: attackTypes.slash },
      { variance: [40, 50], attackType: attackTypes.stab, strAdd: 1.5 }
    ],
    durability: 40,
    strikes: 2,
    reach: 3,
    weight: 3,
    lengthy: true,
    ambushWeapon: true,
  },
  athansiosTailWhip: {
    name: "Athansios' Tail Whip",
    skill: weaponSkills.flails,
    attacks: [
      { variance: [0], attackType: attackTypes.slash, blunt: true, strAdd: 2 },
    ],
    durability: 30,
    strikes: 3,
    reach: 4,
    weight: 8
  }
}

interface ISkillModifier {
  value: number,
  parent?: string,
}

interface ISkillModifiers {
  [key: string]: ISkillModifier,
}
const defaultSkillModifiers: ISkillModifiers = {
  unarmed: { value: 0 },
  
  swords: { value: -4 },
  daggers: { value: 0, parent: 'swords' },
  standardSwords: { value: -4, parent: 'swords' },
  cuttingSwords: { value: -4, parent: 'swords' },
  thrustingSwords: { value: -4, parent: 'swords' },
  twoHandedSwords: { value: -4, parent: 'swords' },

  hafted: { value: -4},
  chain: { value: -4, parent: 'hafted' },
  flails: { value: -4, parent: 'chain' },
  striking: { value: -4, parent: 'hafted' },
  maces: { value: 0, parent: 'striking' },
  oneHandedAxes: { value: -1, parent: 'striking' },

  polearms: { value: -5 },
  staffs: { value: 0, parent: 'polearms'},
  greatSwords: { value: -5, parent: 'polearms' },
  spears: { value: -5, parent: 'polearms' },
  poleaxes: { value: -5, parent: 'polearms' },
  glaives: { value: -5, parent: 'polearms' },
  pikes: { value: -5, parent: 'polearms' },

  pistols: { value: -2 },
  lgc: { value: -1 },
  bows: { value: -2 },
}

const getHighestSkillModifier = (skill: string, skillModifiers: ISkillModifiers): number => {
  // find ancestor with highest modifier value
  let highestModifier = skillModifiers[skill].value;
  let parent = skillModifiers[skill].parent;
  while (parent) {
    if (skillModifiers[parent].value > highestModifier) {
      highestModifier = skillModifiers[parent].value;
    }
    parent = skillModifiers[parent].parent;
  }
  return highestModifier;
}

interface Ability {
  name: string,
  description: string,
  active: boolean,
  overrides?: string[],
}

interface Abilities {
  [key: string]: Ability,
}

function App() {
  const [characterName, setCharacterName] = useState("");

  const [stats, setStats] = useState<IStats>(
    JSON.parse(localStorage.getItem("stats") || 'null') ||
    {
      base:     {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
      general:  {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
      melee:    {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
      ranged:   {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
      magic:    {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
      temp:     {STR: 0, AGI: 0, INT: 0, PRE: 0, SPI: 0, CON: 0},
    }
  );

  useEffect(() => {
    localStorage.setItem("stats", JSON.stringify(stats));
  }, [stats]);

  const [skillModifiers, setSkillModifiers] = useState<ISkillModifiers>(
    JSON.parse(localStorage.getItem("skillModifiers") || 'null') ||
    defaultSkillModifiers
  );

  useEffect(() => {
    localStorage.setItem("skillModifiers", JSON.stringify(skillModifiers));
  }, [skillModifiers]);

  const [abilities, setAbilities] = useState<Abilities>({
    armorImmobility: {
      name: "Armor Immobility",
      description: "-1 to any STR or AGI based skill checks.",
      active: false,
    },
    haymaker: {
      name: "Haymaker",
      description: "Heavy Punch now uses AGI / 2 instead of AGI / 4.",
      active: false,
    },
    brawny: {
      name: "Brawny",
      description: "+2 to STR based Unarmed attack rolls.",
      active: false,
    },
    ambusher: {
      name: "Ambusher",
      description: "Ambush attacks deal 1.5x additional damage.",
      active: false,
    },
    masterAmbusher: {
      name: "Master Ambusher",
      description: "Ambush attacks deal 2x additional damage.",
      active: false,
      overrides: ['ambusher'],
    }
  });

  const defaultWeapon = weapons.dagger;
  const [equippedWeapon, setEquippedWeapon] = useState<IWeapon>(defaultWeapon);
  const [weaponDialogOpen, setWeaponDialogOpen] = useState(false);

  const [bodyTargeting, setBodyTargeting] = useState(true);
  const [limbTargeting, setLimbTargeting] = useState(false);
  const [headTargeting, setHeadTargeting] = useState(false);

  const setTargeting = useCallback((target: string) => {
    setBodyTargeting(target === targeting.body);
    setLimbTargeting(target === targeting.limb);
    setHeadTargeting(target === targeting.head);
  }, [setBodyTargeting, setLimbTargeting, setHeadTargeting]);

  const [chargeAttack, setChargeAttack] = useState(false);           // -2 to attack rolls. 1.5x damage
  const [ambush, setAmbush] = useState(false);                       // 2x damage
  const [inspiringPresence, setInspiringPresence] = useState(false); // +1 to all rolls

  const [slowed, setSlowed] = useState(false);  // AGI / 2

  const getModifiedDamage = useCallback((damage: number, crit: boolean = false, ambushWeapon: boolean = false): number => {
    let modifiedDamage = damage;

    if (chargeAttack) {
      modifiedDamage *= 1.5;
    }

    if (ambush) {
      modifiedDamage *= 2;

      if (ambushWeapon) {
        modifiedDamage *= 2;
      }

      if (abilities.masterAmbusher.active) {
        modifiedDamage *= 2;
      } else if (abilities.ambusher.active) {
        modifiedDamage *= 1.5;
      }
    }

    if (crit) {
      modifiedDamage *= 2;
    }

    return modifiedDamage;
  }, [chargeAttack, ambush, abilities]);

  const calculatePunchResults = useCallback((): {label: string, finalRolls: number[], damages: number[]} => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: {label: string, finalRolls: number[], damages: number[]} = {
      label: "Punch",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = 0;

      if (baseRoll !== 1) {
        // Calculate damage
        damage = str;

        damage = getModifiedDamage(damage, baseRoll === 10);
        
        results.damages.push(damage);

        // Calculate final roll
        finalRoll += skillModifiers.unarmed.value;

        if (chargeAttack) finalRoll -= 2;
        
        if (inspiringPresence) finalRoll += 1;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        let tempAgi = agi;
        if (slowed) tempAgi /= 2;
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push(0);
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [stats, skillModifiers, chargeAttack, inspiringPresence, headTargeting, limbTargeting, slowed, abilities, getModifiedDamage]);

  const calculateKickResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: {label: string, finalRolls: number[], damages: number[]} = {
      label: "Kick",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = 0;

      if (baseRoll !== 1) {
        // Calculate damage
        damage = str * 1.5;

        damage = getModifiedDamage(damage, baseRoll === 10);
        
        results.damages.push(damage);

        // Calculate final roll
        finalRoll -= 2; // Kick is always -2

        finalRoll += skillModifiers.unarmed.value;

        if (chargeAttack) finalRoll -= 2;
        
        if (inspiringPresence) finalRoll += 1;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        let tempAgi = agi;
        if (slowed) tempAgi /= 2;
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push(0);
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [stats, skillModifiers, chargeAttack, inspiringPresence, headTargeting, limbTargeting, slowed, abilities, getModifiedDamage]);

  const calculateHeavyPunchResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: {label: string, finalRolls: number[], damages: number[]} = {
      label: "Heavy Punch",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = 0;

      if (baseRoll !== 1) {
        // Calculate damage
        damage = str * 2;

        damage = getModifiedDamage(damage, baseRoll === 10);
        
        results.damages.push(damage);

        // Calculate final roll
        finalRoll += skillModifiers.unarmed.value;

        if (chargeAttack) finalRoll -= 2;
        
        if (inspiringPresence) finalRoll += 1;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        let tempAgi = agi;
        tempAgi = abilities.haymaker.active ? Math.ceil(tempAgi / 2) : Math.ceil(tempAgi / 4);
        if (slowed) tempAgi /= 2;
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push(0);
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [stats, skillModifiers, chargeAttack, inspiringPresence, headTargeting, limbTargeting, slowed, abilities, getModifiedDamage]);

  const calculateGrappleResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);

    const results: {label: string, finalRolls: number[]} = {
      label: "Grapple",
      finalRolls: [],
    }

    for (let roll = 1; roll <= 8; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;

      if (baseRoll !== 1) {
        // Calculate final roll
        finalRoll += skillModifiers.unarmed.value;

        if (chargeAttack) finalRoll -= 2;
        
        if (inspiringPresence) finalRoll += 1;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        if (abilities.brawny.active) finalRoll += 2;

        finalRoll += str;

        results.finalRolls.push(finalRoll);
      } else {
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [stats, skillModifiers, chargeAttack, inspiringPresence, headTargeting, limbTargeting, abilities]);
  
  // -------------------------------------------------------------------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------
  return (
    <div className="App">
      <label>Name: </label>
      <NameInput characterName={characterName} setCharacterName={setCharacterName} />
      <div style={{display: "flex"}}>
        <div style={{margin: "5px"}}>
          <StatTable stats={stats} setStats={setStats} />
          <div style={{marginTop: "5px"}}>
            <header>Weapon</header>
            <table>
              <tbody>
                <tr>
                  <th style={{textAlign: "left"}}>Equipped: </th>
                  <td>
                    <WeaponSelector weapons={weapons} equippedWeapon={equippedWeapon} setEquippedWeapon={setEquippedWeapon} />
                  </td>
                </tr>
                <tr>
                  <th style={{textAlign: "left"}}>Skill: </th>
                  <td>
                    <WeaponSkillSelector weaponSkills={weaponSkills} equippedWeapon={equippedWeapon} setEquippedWeapon={setEquippedWeapon} />
                  </td>
                </tr>
              </tbody>
            </table>
            <label>Ambush Weapon: </label>
            <input
              type="checkbox"
              checked={equippedWeapon.ambushWeapon || false}
              onChange={(e) => setEquippedWeapon((prev) => ({
                ...prev,
                ambushWeapon: e.target.checked,
              }))}
            />
            <label>Hook: </label>
            <input
              type="checkbox"
              checked={equippedWeapon.hook || false}
              onChange={(e) => setEquippedWeapon((prev) => ({
                ...prev,
                hook: e.target.checked,
              }))}
            />
            <table>
              <tbody>
                <tr>
                  <td>Reach: </td>
                  <td>
                    <input 
                      type="number"
                      value={equippedWeapon.reach}
                      min={0}
                      onChange={(e) => setEquippedWeapon((prev) => ({
                        ...prev,
                        reach: parseInt(e.target.value),
                      }))}
                    />
                  </td>
                  <td>
                    <label>Lengthy: </label>
                    <input
                      type="checkbox"
                      checked={equippedWeapon.lengthy || false}
                      onChange={(e) => setEquippedWeapon((prev) => ({
                        ...prev,
                        lengthy: e.target.checked,
                      }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Durability: </td>
                  <td>
                    <input 
                      type="number"
                      value={equippedWeapon.durability}
                      min={0}
                      onChange={(e) => setEquippedWeapon((prev) => ({
                        ...prev,
                        durability: parseInt(e.target.value),
                      }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Strikes: </td>
                  <td>
                    <input 
                      type="number"
                      value={equippedWeapon.strikes}
                      min={0}
                      onChange={(e) => setEquippedWeapon((prev) => ({
                        ...prev,
                        strikes: parseInt(e.target.value),
                      }))}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Weight: </td>
                  <td>
                    <input 
                      type="number"
                      value={equippedWeapon.weight}
                      min={0}
                      onChange={(e) => setEquippedWeapon((prev) => ({
                        ...prev,
                        weight: parseInt(e.target.value),
                      }))}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{borderCollapse: "collapse"}}>
              <tbody>
                {equippedWeapon.attacks.map((_, index) => (
                  <WeaponAttackRow key={index} equippedWeapon={equippedWeapon} setEquippedWeapon={setEquippedWeapon} index={index} />
                ))}
              </tbody>
            </table>
            <button onClick={() => setWeaponDialogOpen(true)}>+</button>
            {weaponDialogOpen && (
              <AddWeaponAttackDialog open={weaponDialogOpen} setOpen={setWeaponDialogOpen} setWeapon={setEquippedWeapon} />
            )}
          </div>
          <div>
            <div>
              <label>Ambush: </label>
              <input
                type="checkbox"
                checked={ambush}
                onChange={(e) => setAmbush(e.target.checked)}
              />
            </div>
            <div>
            <label>Charge Attack: </label>
            <input
              type="checkbox"
              checked={chargeAttack}
              onChange={(e) => setChargeAttack(e.target.checked)}
            />
            </div>
            <div>
              <label>Inspiring Presence: </label>
              <input
                type="checkbox"
                checked={inspiringPresence}
                onChange={(e) => setInspiringPresence(e.target.checked)}
              />
            </div>
            <div>
              <label>Slowed: </label>
              <input
                type="checkbox"
                checked={slowed}
                onChange={(e) => setSlowed(e.target.checked)}
              />
            </div>
            <div>
              <label>Targeting: </label>
              <select
                value={bodyTargeting ? targeting.body : limbTargeting ? targeting.limb : targeting.head}
                onChange={(e) => setTargeting(e.target.value)}
              >
                <option value={targeting.body}>Body</option>
                <option value={targeting.limb}>Limb</option>
                <option value={targeting.head}>Head</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{margin: "5px"}}>
          <SkillModifierTable skillModifiers={skillModifiers} setSkillModifiers={setSkillModifiers} />
        </div>
        <div style={{margin: "5px"}}>
          <AbilityTable abilities={abilities} setAbilities={setAbilities} />
        </div>
      </div>
      <div>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{borderTop: "1px solid gray"}}>
                <th>Roll (R-D)</th>
                <th style={{width: "100px"}}>1</th>
                <th style={{width: "100px", backgroundColor: "lightgray"}}>2</th>
                <th style={{width: "100px"}}>3</th>
                <th style={{width: "100px", backgroundColor: "lightgray"}}>4</th>
                <th style={{width: "100px"}}>5</th>
                <th style={{width: "100px", backgroundColor: "lightgray"}}>6</th>
                <th style={{width: "100px"}}>7</th>
                <th style={{width: "100px", backgroundColor: "lightgray"}}>8</th>
                <th style={{width: "100px"}}>9</th>
                <th style={{width: "100px", backgroundColor: "lightgray"}}>10</th>
            </tr>
          </thead>
          <tbody>
            <BlankAttackRow />
            <tr style={{borderTop: "1px solid gray"}}>
              <td>Punch</td>
              {calculatePunchResults().finalRolls.map((roll, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{roll}</td>
              ))}
            </tr>
            <tr>
              <td>Damage</td>
              {calculatePunchResults().damages.map((damage, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{damage}</td>
              ))}
            </tr>
            <BlankAttackRow />
            <tr style={{borderTop: "1px solid gray"}}>
              <td>Kick</td>
              {calculateKickResults().finalRolls.map((roll, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{roll}</td>
              ))}
            </tr>
            <tr>
              <td>Damage</td>
              {calculateKickResults().damages.map((damage, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{damage}</td>
              ))}
            </tr>
            <BlankAttackRow />
            <tr style={{borderTop: "1px solid gray"}}>
              <td>Heavy Punch</td>
              {calculateHeavyPunchResults().finalRolls.map((roll, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{roll}</td>
              ))}
            </tr>
            <tr>
              <td>Damage</td>
              {calculateHeavyPunchResults().damages.map((damage, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{damage}</td>
              ))}
            </tr>
            <BlankAttackRow />
            <tr style={{borderTop: "1px solid gray"}}>
              <td>Grapple</td>
              {calculateGrappleResults().finalRolls.map((roll, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? undefined : "lightgray", textAlign: "center"}}>{roll}</td>
              ))}
              <td></td>
              <td style={{backgroundColor: "lightgray"}}></td>
            </tr>
            <BlankAttackRow />
          </tbody>
          <WeaponAttackTBodies
            equippedWeapon={equippedWeapon}
            stats={stats}
            skillModifiers={skillModifiers}
            chargeAttack={chargeAttack}
            inspiringPresence={inspiringPresence}
            headTargeting={headTargeting}
            limbTargeting={limbTargeting}
            slowed={slowed}
            abilities={abilities}
            getModifiedDamage={getModifiedDamage}
          />
        </table>
      </div>
    </div>
  )
  // -------------------------------------------------------------------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------
}

interface INameInputProps {
  characterName: string,
  setCharacterName: React.Dispatch<React.SetStateAction<string>>,
}

function NameInput({ characterName, setCharacterName }: INameInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();

      document.title = characterName;
    }
  }

  return (
    <input
      style={{marginBottom: "5px"}}
      type="text"
      value={characterName}
      onChange={(e) => setCharacterName(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}

interface IStatRowProps {
  stats: IStats,
  setStats: React.Dispatch<React.SetStateAction<IStats>>,
  stat: string,
}

function StatRow({ stats, setStats, stat }: IStatRowProps) {
  const [base, setBase] = useState(stats.base[stat]);
  const [general, setGeneral] = useState(stats.general[stat]);
  const [melee, setMelee] = useState(stats.melee[stat]);
  const [ranged, setRanged] = useState(stats.ranged[stat]);
  const [magic, setMagic] = useState(stats.magic[stat]);
  const [temp, setTemp] = useState(stats.temp[stat]);

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      base: {
        ...prev.base,
        [stat]: base,
      },
      general: {
        ...prev.general,
        [stat]: general,
      },
      melee: {
        ...prev.melee,
        [stat]: melee,
      },
      ranged: {
        ...prev.ranged,
        [stat]: ranged,
      },
      magic: {
        ...prev.magic,
        [stat]: magic,
      },
      temp: {
        ...prev.temp,
        [stat]: temp,
      },
    }))
  }, [base, general, melee, ranged, magic, temp, setStats, stat])

  return (
    <tr>
      <td>{stat}</td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={base}
          onChange={(e) => setBase(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={general}
          onChange={(e) => setGeneral(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={melee}
          onChange={(e) => setMelee(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={ranged}
          onChange={(e) => setRanged(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={magic}
          onChange={(e) => setMagic(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="number"
          style ={{width: "50px"}}
          value={temp}
          onChange={(e) => setTemp(parseInt(e.target.value))}
        />
      </td>
      <td style={{textAlign: "center"}}>{getStatTotal(stat, stats)}</td>
    </tr>
  )
}

interface IStatTableProps {
  stats: IStats,
  setStats: React.Dispatch<React.SetStateAction<IStats>>,
}

function StatTable({ stats, setStats }: IStatTableProps) {
  return (
    <table style={{border: "1px solid gray"}}>
      <thead>
        <tr>
          <th>STAT</th>
          <th>Base</th>
          <th>General</th>
          <th>Melee</th>
          <th>Ranged</th>
          <th>Magic</th>
          <th>Temp</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <StatRow stats={stats} setStats={setStats} stat={statTypes.STR} />
        <StatRow stats={stats} setStats={setStats} stat={statTypes.AGI} />
        <StatRow stats={stats} setStats={setStats} stat={statTypes.INT} />
        <StatRow stats={stats} setStats={setStats} stat={statTypes.PRE} />
        <StatRow stats={stats} setStats={setStats} stat={statTypes.CON} />
        <StatRow stats={stats} setStats={setStats} stat={statTypes.SPI} />
        <tr>
          <td colSpan={7}></td>
          <td style={{textAlign: "center"}}>
            {Object.values(statTypes).reduce((acc, stat) => acc + getStatTotal(stat, stats), 0)}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

interface IWeaponSelectorProps {
  weapons: IWeapons,
  equippedWeapon: IWeapon,
  setEquippedWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
}

function WeaponSelector({ weapons, equippedWeapon, setEquippedWeapon }: IWeaponSelectorProps) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = weapons[e.target.value];
    setEquippedWeapon(selectedWeapon);
  }

  return (
    <select value={Object.keys(weapons).find(key => weapons[key] === equippedWeapon)} onChange={handleSelectChange}>
      {Object.keys(weapons).map((key) => (
        <option key={key} value={key}>{weapons[key].name}</option>
      ))}
    </select>
  )
}

interface IWeaponSkillSelectorProps {
  weaponSkills: { [key: string]: string }
  equippedWeapon: IWeapon,
  setEquippedWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
}

function WeaponSkillSelector({ weaponSkills, equippedWeapon, setEquippedWeapon }: IWeaponSkillSelectorProps) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSkill = weaponSkills[e.target.value];
    setEquippedWeapon((prev) => ({
      ...prev,
      skill: selectedSkill,
    }))
  }

  return (
    <select value={Object.keys(weaponSkills).find(key => weaponSkills[key] === equippedWeapon.skill)} onChange={handleSelectChange}>
      {Object.keys(weaponSkills).map((key) => (
        <option key={key} value={key}>{pascalCaseToDisplayName(key)}</option>
      ))}
    </select>
  )
}

interface IWeaponAttackRowProps {
  equippedWeapon: IWeapon,
  setEquippedWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
  index: number,
}

function WeaponAttackRow({ equippedWeapon, setEquippedWeapon, index }: IWeaponAttackRowProps) {
  const attack: IAttack = equippedWeapon.attacks[index];

  const handleRemoveClick = () => {
    setEquippedWeapon((prev) => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index),
    }))
  }

  const label = pascalCaseToDisplayName(attack.attackType);

  const blunt = attack.blunt || false;
  const ap = attack.ap || false;
  const strAdd = attack.strAdd || 0;
  const ranges = attack.ranges || [];

  return (
    <tr>
      <td style={{border: "1px solid gray", padding: "5px"}}>{label}</td>
      <td style={{border: "1px solid gray", padding: "5px", textAlign: "center"}}>{attack.variance.join("-")}</td>
      {strAdd > 0 && <td style={{border: "1px solid gray", padding: "5px"}}>+ STR * {strAdd}</td>}
      {blunt && <td style={{border: "1px solid gray", padding: "5px"}}>Blunt</td>}
      {ap && <td style={{border: "1px solid gray", padding: "5px"}}>AP</td>}
      {ranges.length > 0 && <td style={{border: "1px solid gray", padding: "5px"}}>{ranges.join("-")}</td>}
      <td>
        <button onClick={handleRemoveClick}>X</button>
      </td>
    </tr>
  )
}

interface IAddWeaponAttackDialogProps {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
}

function AddWeaponAttackDialog({ open, setOpen, setWeapon }: IAddWeaponAttackDialogProps) {
  const [attackType, setAttackType] = useState(attackTypes.slash);
  const [variance, setVariance] = useState([0, 0, 0, 0, 0]);
  const [strAdd, setStrAdd] = useState(0);
  const [blunt, setBlunt] = useState(false);
  const [ap, setAp] = useState(false);
  const [ranges, setRanges] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (open) {
      setVariance([0, 0, 0, 0, 0]);
      setStrAdd(0);
      setBlunt(false);
      setAp(false);
      setRanges([0, 0, 0, 0, 0]);
    }
  }, [open]);

  const handleAddAttack = () => {

    const varianceArray = variance.filter((v) => v > 0).sort((a, b) => a - b);
    const rangesArray = ranges.filter((r) => r > 0).sort((a, b) => a - b);

    const newAttack: IAttack = {
      attackType: attackType,

      variance: varianceArray,
      strAdd: strAdd,
      blunt: blunt,
      ap: ap,
      ranges: ranges,
    }

    if (rangesArray.length === 0) delete newAttack.ranges;
    if (strAdd === 0) delete newAttack.strAdd;
    if (!blunt) delete newAttack.blunt;
    if (!ap) delete newAttack.ap;

    setWeapon((prev) => ({
      ...prev,
      attacks: [...prev.attacks, newAttack],
    }));

    setOpen(false);
  }

  return (
    <>
      {/* Semi transparent gray background */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)"
        }}
        onClick={() => setOpen(false)}
      ></div>
      {/* Dialog */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid black",
        }}
      >
        <div style={{margin: "5px"}}>
          <label>Attack Type: </label>
          <select value={attackType} onChange={(e) => setAttackType(e.target.value)}>
            {Object.keys(attackTypes).map((key) => (
              <option key={key} value={attackTypes[key]}>{pascalCaseToDisplayName(key)}</option>
            ))}
          </select>
        </div>
        <div style={{display: "flex", margin: "5px"}}>
          <label>Variance: </label>
          {variance.map((v, index) => (
            <input
              key={index}
              style={{width: "40px"}}
              step={5}
              type="number"
              value={v}
              onChange={(e) => {
                const newVariance = [...variance];
                newVariance[index] = parseInt(e.target.value);
                setVariance(newVariance);
              }}
            />
          ))}
        </div>
        <div style={{margin: "5px"}}>
          <label>STR Add: </label>
          <input
            style={{width: "40px"}}
            type="number"
            value={strAdd}
            onChange={(e) => setStrAdd(parseInt(e.target.value))}
          />
        </div>
        <div style={{margin: "5px"}}>
          <label>Blunt: </label>
          <input
            type="checkbox"
            checked={blunt}
            onChange={(e) => setBlunt(e.target.checked)}
          />
        </div>
        <div style={{margin: "5px"}}>
          <label>AP: </label>
          <input
            type="checkbox"
            checked={ap}
            onChange={(e) => setAp(e.target.checked)}
          />
        </div>
        <div style={{display: "flex", margin: "5px"}}>
          <label>Ranges: </label>
          {ranges.map((r, index) => (
            <input
              key={index}
              style={{width: "40px"}}
              type="number"
              value={r}
              onChange={(e) => {
                const newRanges = [...ranges];
                newRanges[index] = parseInt(e.target.value);
                setRanges(newRanges);
              }}
            />
          ))}
        </div>
        <button onClick={handleAddAttack}>Add</button>
        <button onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </>
  )
}

interface ISkillModifierRowProps {
  skill: string,
  skillModifiers: ISkillModifiers,
  setSkillModifiers: React.Dispatch<React.SetStateAction<ISkillModifiers>>,
}

function SkillModifierRow({skill, skillModifiers, setSkillModifiers}: ISkillModifierRowProps) {
  const [value, setValue] = useState(skillModifiers[skill].value);

  useEffect(() => {
    setSkillModifiers((prev) => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        value: value,
      }
    }))
  }, [value, skill, setSkillModifiers]);

  useEffect(() => {
    setValue(getHighestSkillModifier(skill, skillModifiers));
  }, [skill, skillModifiers]);

  return (
    <tr>
      <td>{pascalCaseToDisplayName(skill)}</td>
      <td>
        <input
          type="number"
          style={{width: "50px"}}
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
        />
      </td>
    </tr>
  )
}

interface ISkillModifierTableProps {
  skillModifiers: ISkillModifiers,
  setSkillModifiers: React.Dispatch<React.SetStateAction<ISkillModifiers>>,
}

function SkillModifierTable({skillModifiers, setSkillModifiers}: ISkillModifierTableProps) {
  return (
    <table style={{border: "1px solid gray"}}>
      <thead>
        <tr>
          <th>Skill</th>
          <th>Modifier</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(skillModifiers).map((skill) => (
          <SkillModifierRow key={skill} skill={skill} skillModifiers={skillModifiers} setSkillModifiers={setSkillModifiers} />
        ))}
        <tr>
          <td></td>
          <td>
            <button
              onClick={() => setSkillModifiers(defaultSkillModifiers)}
              title={"Reset"}
            >
              Reset
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

interface IAbilityRowProps {
  ability: string,
  abilities: Abilities,
  setAbilities: React.Dispatch<React.SetStateAction<Abilities>>,
}

function AbilityRow({ability, abilities, setAbilities}: IAbilityRowProps) {
  // Name | Description | Active
  const [active, setActive] = useState(abilities[ability].active);

  useEffect(() => {

    setAbilities((prev) => ({
      ...prev,
      [ability]: {
        ...prev[ability],
        active: active,
      }
    }))
  }, [active, ability, setAbilities])

  return (
    <tr>
      <td style={{border: "1px solid gray", padding: "5px"}}>{abilities[ability].name}</td>
      <td style={{border: "1px solid gray", padding: "5px"}}>{abilities[ability].description}</td>
      <td style={{border: "1px solid gray", padding: "5px", textAlign: "center"}}>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
      </td>
    </tr>
  )
}

interface IAbilityTableProps {
  abilities: Abilities,
  setAbilities: React.Dispatch<React.SetStateAction<Abilities>>,
}

function AbilityTable({abilities, setAbilities}: IAbilityTableProps) {
  return (
    <table style={{border: "1px solid gray", borderCollapse: "collapse"}}>
      <thead>
        <tr>
          <th>Ability</th>
          <th>Description</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(abilities).map((ability) => (
          <AbilityRow key={ability} ability={ability} abilities={abilities} setAbilities={setAbilities} />
        ))}
      </tbody>
    </table>
  )
}

function BlankAttackRow() {
  return (
    <tr style={{ padding: "5px", textAlign: "center", height: "10px"}}>
      <td></td>
      <td style={{width: "100px"}}></td>
      <td style={{width: "100px", backgroundColor: "lightgray"}}></td>
      <td style={{width: "100px"}}></td>
      <td style={{width: "100px", backgroundColor: "lightgray"}}></td>
      <td style={{width: "100px"}}></td>
      <td style={{width: "100px", backgroundColor: "lightgray"}}></td>
      <td style={{width: "100px"}}></td>
      <td style={{width: "100px", backgroundColor: "lightgray"}}></td>
      <td style={{width: "100px"}}></td>
      <td style={{width: "100px", backgroundColor: "lightgray"}}></td>
    </tr>
  )
}

interface IAttackRowProps {
  label: string,
  values: number[] | string[],
  border?: boolean,
}

function AttackRow({ label, values,border }: IAttackRowProps) {
  return (
    <tr style={{borderTop: border ? "1px solid gray" : ""}}>
      <td>{label}</td>
      {values.map((value, index) => (
        <td key={index}
          style={{padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}}
        >
          {value}
        </td>
      ))}
    </tr>
  )
}

interface IWeaponAttackTBodies {
  equippedWeapon: IWeapon,
  stats: IStats,
  skillModifiers: ISkillModifiers,
  chargeAttack: boolean,
  inspiringPresence: boolean,
  headTargeting: boolean,
  limbTargeting: boolean,
  slowed: boolean,
  abilities: Abilities,
  getModifiedDamage: (damage: number, crit: boolean, ambushWeapon: boolean) => number,
}

function WeaponAttackTBodies({
  equippedWeapon, stats, skillModifiers, abilities, chargeAttack, inspiringPresence, headTargeting, limbTargeting, slowed, getModifiedDamage
}: IWeaponAttackTBodies) {
  const calculateSlashResults = useCallback((attack: IAttack) => {
    const {variance} = attack;
    
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: {label: string, finalRolls: number[], damages: number[]} = {
      label: "Slash",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = 0;

      if (baseRoll !== 1) {
        // Calculate damage
        const damageLookupRow = variance.length - 1;
        const damageLookupIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) - 1];
        damage = variance[damageLookupIndex];

        if (attack.strAdd) damage += str * attack.strAdd;

        damage = getModifiedDamage(damage, baseRoll === 10, equippedWeapon.ambushWeapon === true);

        results.damages.push(damage);

        // Calculate final roll
        finalRoll += getHighestSkillModifier(equippedWeapon.skill, skillModifiers);

        if (inspiringPresence) finalRoll += 1;

        if (chargeAttack) finalRoll -= 2;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        let tempAgi = agi;
        if (slowed) tempAgi /= 2;
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push(0);
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [abilities.armorImmobility.active, chargeAttack, equippedWeapon.ambushWeapon, equippedWeapon.skill, getModifiedDamage, headTargeting, inspiringPresence, limbTargeting, skillModifiers, slowed, stats]);

  const calculateStabResults = useCallback((attack: IAttack) => {
    const {variance} = attack;
    
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: {label: string, finalRolls: number[], damages: number[]} = {
      label: "Slash",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = 0;

      if (baseRoll !== 1) {
        // Calculate damage
        const damageLookupRow = variance.length - 1;
        const damageLookupIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) - 1];
        damage = variance[damageLookupIndex];

        if (attack.strAdd) damage += str * attack.strAdd;

        damage = getModifiedDamage(damage, baseRoll === 10, equippedWeapon.ambushWeapon === true);

        results.damages.push(damage);

        // Calculate final roll
        finalRoll += getHighestSkillModifier(equippedWeapon.skill, skillModifiers);

        if (inspiringPresence) finalRoll += 1;

        if (chargeAttack) finalRoll -= 2;

        if (headTargeting) finalRoll -= 3;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        let tempAgi = agi;
        if (slowed) tempAgi /= 2;
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push(0);
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [abilities.armorImmobility.active, chargeAttack, equippedWeapon.ambushWeapon, equippedWeapon.skill, getModifiedDamage, headTargeting, inspiringPresence, limbTargeting, skillModifiers, slowed, stats]);

  const calculateRangedResults = useCallback((attack: IAttack) => {
    const {variance} = attack;
    
    const str = getStatTotal(statTypes.STR, stats);

    const results: {label: string, finalRolls: number[], damages: string[]} = {
      label: "Slash",
      finalRolls: [],
      damages: [],
    }

    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = baseRoll;
      let damage = "0";

      if (roll !== 1) {
        // Calculate damage
        const newDamage = variance.map((v) => {
          return getModifiedDamage(v, baseRoll === 10, equippedWeapon.ambushWeapon === true);
        });
        damage = newDamage.join("-");
        results.damages.push(damage);

        // Calculate final roll
        finalRoll += getHighestSkillModifier(equippedWeapon.skill, skillModifiers);

        if (inspiringPresence) finalRoll += 1;

        if (chargeAttack) finalRoll -= 2;

        if (headTargeting) finalRoll -= 2;
        else if (limbTargeting) finalRoll -= 1;

        if (abilities.armorImmobility.active) finalRoll -= 1;

        finalRoll += str;

        results.finalRolls.push(finalRoll);
      } else {
        results.damages.push("0");
        results.finalRolls.push(1);
      }
    }

    return results;
  }, [abilities.armorImmobility.active, chargeAttack, equippedWeapon.ambushWeapon, equippedWeapon.skill, getModifiedDamage, headTargeting, inspiringPresence, limbTargeting, skillModifiers, stats]);

  const {attacks} = equippedWeapon;

  return attacks.map((attack, index) => {
    return (
      <tbody key={index}>
        <AttackRow
          border={true}
          label={attack.attackType === attackTypes.slash ? "Slash" : attack.attackType === attackTypes.stab ? "Stab" : "Ranged"}
          values={attack.attackType === attackTypes.slash ? calculateSlashResults(attack).finalRolls : attack.attackType === attackTypes.stab ? calculateStabResults(attack).finalRolls : calculateRangedResults(attack).finalRolls}
        />
        <AttackRow
          label={"Damage"}
          values={attack.attackType === attackTypes.slash ? calculateSlashResults(attack).damages : attack.attackType === attackTypes.stab ? calculateStabResults(attack).damages : calculateRangedResults(attack).damages}
        />
      </tbody>
    )
  })

}

export default App
