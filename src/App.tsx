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
  STR: "STR",
  AGI: "AGI",
  INT: "INT",
  PRE: "PRE",
  CON: "CON",
  SPI: "SPI",
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

const targeting = {
  body: 0,
  limb: 1,
  head: 2,
}

const weaponSkills = {
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
  lgc: "LGC", // Long guns and crossbows
  bows: "bows",
}

const attackTypes: {[key: string]: number} = {
  slash: 0,
  stab: 1,
  ranged: 2,
}

interface IAttack {
  variance: number[],
  attackType: number,
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
  }
}

interface ISkillModifier {
  value: number,
  parent?: string,
}

interface ISkillModifiers {
  [key: string]: ISkillModifier,
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

interface IAttackResult {
  finalRoll: number,
  damage: number,
}

interface IAttackResults {
  // The name of the attack, the final roll (after base roll 1-10), and the damage dealt
  results: { name: string, results: IAttackResult[] }[],
}

function App() {
  const [characterName, setCharacterName] = useState("");

  const [stats, setStats] = useState<IStats>({
    base: {
      STR: 0, // Strength
      INT: 0, // Intellect
      PRE: 0, // Presence
      AGI: 0, // Agility
      CON: 0, // Constitution
      SPI: 0, // Spirit
    },
    general: {
      STR: 0,
      INT: 0,
      PRE: 0,
      AGI: 0,
      CON: 0,
      SPI: 0,
    },
    melee: {
      STR: 0,
      INT: 0,
      PRE: 0,
      AGI: 0,
      CON: 0,
      SPI: 0,
    },
    ranged: {
      STR: 0,
      INT: 0,
      PRE: 0,
      AGI: 0,
      CON: 0,
      SPI: 0,
    },
    magic: {
      STR: 0,
      INT: 0,
      PRE: 0,
      AGI: 0,
      CON: 0,
      SPI: 0,
    },
    temp: {
      STR: 0,
      INT: 0,
      PRE: 0,
      AGI: 0,
      CON: 0,
      SPI: 0,
    }
  });

  const [skillModifiers, setSkillModifiers] = useState<ISkillModifiers>({
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
  });

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
  const [limbTargeting, setLimbTargeting] = useState(false); // -1 to rolls
  const [headTargeting, setHeadTargeting] = useState(false); // -2 to rolls (-3 for stabs)

  const setTargeting = (target: number) => {
    setBodyTargeting(target === targeting.body);
    setLimbTargeting(target === targeting.limb);
    setHeadTargeting(target === targeting.head);
  }

  const [ambush, setAmbush] = useState(false);      // deals 2x damage
  const [inspired, setInspired] = useState(false);  // +1 to rolls
  
  const [slowed, setSlowed] = useState(false);      // AGI / 2
  const [stunned, setStunned] = useState(false);    // Lowered a die type

  const calculatePunchResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: IAttackResult[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let damage = 0;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Damage
        damage = str;

        // Calculate Final Roll
        const skillModifier: ISkillModifier | undefined = skillModifiers.unarmed;
        if (skillModifier) {
          finalRoll += skillModifier.value;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let tempAgi = agi;
        if (slowed) {
          tempAgi /= 2;
        }
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (baseRoll === 10) {
        damage *= 2;
      }

      results.push({ finalRoll, damage });
    }

    return { name: "Punch", results };
  }, [stats, ambush, skillModifiers.unarmed, inspired, headTargeting, limbTargeting, abilities.armorImmobility.active, abilities.masterAmbusher.active, abilities.ambusher.active, slowed]);

  const [punchResults, setPunchResults] = useState<{name: string, results: IAttackResult[]}>(calculatePunchResults());

  const calculateKickResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: IAttackResult[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let damage = 0;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Damage
        damage = str * 1.5;

        // Calculate Final Roll
        finalRoll -= 2; // Kicks are always -2 to roll
        const skillModifier: ISkillModifier | undefined = skillModifiers.unarmed;
        if (skillModifier) {
          finalRoll += skillModifier.value;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let tempAgi = agi;
        if (slowed) {
          tempAgi /= 2;
        }
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (baseRoll === 10) {
        damage *= 2;
      }

      damage = Math.ceil(damage);

      results.push({ finalRoll, damage });
    }

    return { name: "Kick", results };
  }, [stats, ambush, skillModifiers.unarmed, inspired, headTargeting, limbTargeting, abilities.armorImmobility.active, abilities.masterAmbusher.active, abilities.ambusher.active, slowed]);

  const [kickResults, setKickResults] = useState<{name: string, results: IAttackResult[]}>(calculateKickResults());

  const calculateHeavyPunchResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: IAttackResult[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let damage = 0;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Damage
        damage = str * 2;

        // Calculate Final Roll
        const skillModifier: ISkillModifier | undefined = skillModifiers.unarmed;
        if (skillModifier) {
          finalRoll += skillModifier.value;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let tempAgi = abilities.haymaker.active ? agi / 2 : agi / 4;
        if (slowed) {
          tempAgi /= 2;
        }
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (baseRoll === 10) {
        damage *= 2;
      }

      damage = Math.ceil(damage);

      results.push({ finalRoll, damage });
    }

    return { name: "Heavy Punch", results };
  }, [stats, ambush, skillModifiers.unarmed, inspired, headTargeting, limbTargeting, abilities.armorImmobility.active, abilities.haymaker.active, abilities.masterAmbusher.active, abilities.ambusher.active, slowed]);

  const [heavyPunchResults, setHeavyPunchResults] = useState<{name: string, results: IAttackResult[]}>(calculateHeavyPunchResults());

  const calculateGrappleResults = useCallback(() => {
    const str = getStatTotal(statTypes.STR, stats);

    const results: number[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Final Roll
        finalRoll += str;
        
        const skillModifier: ISkillModifier | undefined = skillModifiers.unarmed;
        if (skillModifier) {
          finalRoll += skillModifier.value;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add STR modifiers
        if (abilities.brawny.active) {
          finalRoll += 2;
        }
      }

      results.push(finalRoll);
    }

    return { name: "Grapple", rolls: results };
  }, [stats, skillModifiers.unarmed, inspired, headTargeting, limbTargeting, abilities.armorImmobility.active, abilities.brawny.active]);

  const [grappleResults, setGrappleResults] = useState<{name: string, rolls: number[]}>(calculateGrappleResults());

  useEffect(() => {
    setPunchResults(calculatePunchResults());
    setKickResults(calculateKickResults());
    setHeavyPunchResults(calculateHeavyPunchResults());
    setGrappleResults(calculateGrappleResults());
  
  }, [stats, skillModifiers, ambush, inspired, slowed, stunned, bodyTargeting, limbTargeting, headTargeting, abilities, punchResults, calculatePunchResults, calculateKickResults, calculateHeavyPunchResults, calculateGrappleResults]);

  const calculateSlashResults = useCallback((attack: IAttack) => {
    const {variance} = attack;

    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: IAttackResult[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let damage = 0;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Damage
        const damageLookupRow = variance.length - 1;
        const damageLookupIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) - 1];
        damage = variance[damageLookupIndex];

        if (attack.strAdd) {
          damage += str * attack.strAdd;
        } else if (attack.blunt) {
          damage += str;
        }

        // Calculate Final Roll
        const skillModifier = getHighestSkillModifier(equippedWeapon.skill, skillModifiers);
        if (skillModifier) {
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let tempAgi = agi;
        if (slowed) {
          tempAgi /= 2;
        }
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;
      }

      if (ambush) {
        damage *= 2;

        if (equippedWeapon.ambushWeapon) {
          damage *= 2;
        }

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (baseRoll === 10) {
        damage *= 2;
      }

      results.push({ finalRoll, damage });
    }

    return { name: "Slash", results };
  }, [abilities.ambusher.active, abilities.armorImmobility.active, abilities.masterAmbusher.active, ambush, equippedWeapon.ambushWeapon, equippedWeapon.skill, headTargeting, inspired, limbTargeting, skillModifiers, slowed, stats]);

  const calculateStabResults = useCallback((attack: IAttack) => {
    const {variance} = attack;

    const str = getStatTotal(statTypes.STR, stats);
    const agi = getStatTotal(statTypes.AGI, stats);

    const results: IAttackResult[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let damage = 0;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Damage
        const damageLookupRow = variance.length - 1;
        const damageLookupIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) - 1];
        damage = variance[damageLookupIndex];

        if (attack.strAdd) {
          damage += str * attack.strAdd;
        } else if (attack.blunt) {
          damage += str;
        }

        // Calculate Final Roll
        const skillModifier = getHighestSkillModifier(equippedWeapon.skill, skillModifiers);
        if (skillModifier) {
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 3;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let tempAgi = agi;
        if (slowed) {
          tempAgi /= 2;
        }
        tempAgi = Math.ceil(tempAgi);
        finalRoll += tempAgi;
      }

      if (ambush) {
        damage *= 2;

        if (equippedWeapon.ambushWeapon) {
          damage *= 2;
        }

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (baseRoll === 10) {
        damage *= 2;
      }

      results.push({ finalRoll, damage });
    }

    return { name: "Stab", results };
  }, [abilities.ambusher.active, abilities.armorImmobility.active, abilities.masterAmbusher.active, ambush, equippedWeapon.ambushWeapon, equippedWeapon.skill, headTargeting, inspired, limbTargeting, skillModifiers, slowed, stats]);

  const calculateAllWeaponResults = useCallback(() => {
    const results: { name: string, results: IAttackResult[] }[] = [];

    equippedWeapon.attacks.forEach((attack) => {
      if (attack.attackType === attackTypes.slash) {
        results.push(calculateSlashResults(attack));
      } else if (attack.attackType === attackTypes.stab) {
        results.push(calculateStabResults(attack));
      }
    });

    return { results };
  }, [calculateSlashResults, calculateStabResults, equippedWeapon.attacks]);

  const [attackResults, setAttackResults] = useState<IAttackResults>(calculateAllWeaponResults());

  useEffect(() => {
    setAttackResults(calculateAllWeaponResults());
  }, [stats, skillModifiers, equippedWeapon, ambush, inspired, slowed, stunned, bodyTargeting, limbTargeting, headTargeting, abilities, attackResults, calculateAllWeaponResults])

  const calculateRangedAttackResults = useCallback((attack: IAttack) => {
    const {variance} = attack;

    const str = getStatTotal(statTypes.STR, stats);

    const results: { variance: number[], finalRoll: number }[] = [];
    for (let roll = 1; roll <= 10; roll++) {
      const baseRoll = roll;
      let finalRoll = roll;

      if (baseRoll !== 1) {
        // Calculate Final Roll
        const skillModifier = getHighestSkillModifier(equippedWeapon.skill, skillModifiers);
        if (skillModifier) {
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (headTargeting) {
          finalRoll -= 2;
        } else if (limbTargeting) {
          finalRoll -= 1;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add STR modifiers
        finalRoll += str;
      }

      const modifiedVariance = variance.map((value) => {
        if (ambush) {
          value *= 2;
  
          if (abilities.masterAmbusher.active) {
            value *= 2;
          } else if (abilities.ambusher.active) {
            value *= 1.5;
          }
        }

        if (baseRoll === 10) {
          value *= 2;
        }

        return value;
      });

      results.push({ variance: modifiedVariance, finalRoll });
    }

    return { name: "Ranged", results };
  }, [abilities.ambusher.active, abilities.armorImmobility.active, abilities.masterAmbusher.active, ambush, equippedWeapon.skill, headTargeting, inspired, limbTargeting, skillModifiers, stats]);

  const calculateAllRangedResults = useCallback(() => {
    const results: { name: string, results: { variance: number[], finalRoll: number }[] }[] = [];

    equippedWeapon.attacks.forEach((attack) => {
      if (attack.attackType === attackTypes.ranged) {
        results.push(calculateRangedAttackResults(attack));
      }
    });

    return { results };
  }, [calculateRangedAttackResults, equippedWeapon.attacks]);

  const [rangedAttackResults, setRangedAttackResults] = useState<{results: { name: string, results: { variance: number[], finalRoll: number }[] }[]}>(calculateAllRangedResults());

  useEffect(() => {
    setRangedAttackResults(calculateAllRangedResults());
  }, [stats, skillModifiers, equippedWeapon, ambush, inspired, slowed, stunned, bodyTargeting, limbTargeting, headTargeting, abilities, rangedAttackResults, calculateAllRangedResults]);

  // -------------------------------------------------------------------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------
  return (
    <div className="App">
      <label>Name: </label>
      <NameInput characterName={characterName} setCharacterName={setCharacterName} />
      <div style={{display: "flex"}}>
        <div style={{marginRight: "5px"}}>
          <StatTable stats={stats} setStats={setStats} />
          <div style={{marginTop: "5px"}}>
            <header>Weapon Info:</header>
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
            <WeaponAttackTable equippedWeapon={equippedWeapon} setEquippedWeapon={setEquippedWeapon}/>
            <button onClick={() => setWeaponDialogOpen(true)}>+</button>
            <AddWeaponAttackDialog open={weaponDialogOpen} setOpen={setWeaponDialogOpen} setWeapon={setEquippedWeapon} />
          </div>
          <div>
            <label>Ambush: </label>
            <input
              type="checkbox"
              checked={ambush}
              onChange={(e) => setAmbush(e.target.checked)}
            />
            <label>Inspired: </label>
            <input
              type="checkbox"
              checked={inspired}
              onChange={(e) => setInspired(e.target.checked)}
            />
          </div>
          <div>
            <label>Slowed: </label>
            <input
              type="checkbox"
              checked={slowed}
              onChange={(e) => setSlowed(e.target.checked)}
            />
            <label>Stunned: </label>
            <input
              type="checkbox"
              checked={stunned}
              onChange={(e) => setStunned(e.target.checked)}
            />
          </div>
          <div>
            <label>Body: </label>
            <input
              type="radio"
              checked={bodyTargeting}
              onChange={() => setTargeting(targeting.body)}
            />
            <label>Limb: </label>
            <input
              type="radio"
              checked={limbTargeting}
              onChange={() => setTargeting(targeting.limb)}
            />
            <label>Head: </label>
            <input
              type="radio"
              checked={headTargeting}
              onChange={() => setTargeting(targeting.head)}
            />
          </div>
        </div>
        <div style={{marginRight: "5px"}}>
          <SkillModifierTable skillModifiers={skillModifiers} setSkillModifiers={setSkillModifiers} />
        </div>
        <div style={{marginRight: "5px"}}>
          <AbilityTable abilities={abilities} setAbilities={setAbilities} />
        </div>
      </div>
      <div> {/* This is where the roll tables will go */}
        <table style={{width: "100%"}}>
            <thead>
              <tr>
                <th>Unarmed (R-D)</th>
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
              <tr>
                <td>Punch</td>
                {punchResults.results.map((result, index) => (
                  <td style={{border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}} key={index}>{result.finalRoll}-{result.damage}</td>
                ))}
              </tr>
              <tr>
                <td>Kick</td>
                {kickResults.results.map((result, index) => (
                  <td style={{border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}} key={index}>{result.finalRoll}-{result.damage}</td>
                ))}
              </tr>
              <tr>
                <td>Heavy Punch</td>
                {heavyPunchResults.results.map((result, index) => (
                  <td style={{border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}} key={index}>{result.finalRoll}-{result.damage}</td>
                ))}
              </tr>
              <tr>
                <td>Grapple</td>
                {grappleResults.rolls.map((roll, index) => (
                  <td style={{border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}} key={index}>{roll}</td>
                ))}
              </tr>
            </tbody>
        </table>
        {attackResults.results.length > 0 && <WeaponAttackResultsTable attackResults={attackResults} />}
        {rangedAttackResults.results.length > 0 && <table style={{width: "100%"}}>
          <thead>
            <tr>
              <th>Ranged</th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
            </tr>
          </thead>
          <tbody>
            {rangedAttackResults.results.map((attack, index) => (
              <tr key={index}>
                <td>{attack.name}</td>
                {attack.results.map((result, index) => (
                  <td style={{ border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}} key={index}>{result.finalRoll}-({result.variance.join(", ")})</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>}
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
  attack: IAttack,
  removeAttack: () => void,
}

function WeaponAttackRow({ attack, removeAttack }: IWeaponAttackRowProps) {
  const handleRemoveClick = () => {
    removeAttack();
  };

  return (
    <tr>
      <td style={{border: "1px solid gray", padding: "5px"}}>{pascalCaseToDisplayName(attack.attackType === attackTypes.slash ? "slash" : attack.attackType === attackTypes.stab ? "stab" : "ranged")}</td>
      <td style={{border: "1px solid gray", padding: "5px", textAlign: "center"}}>{attack.variance.join("-")}</td>
      {attack.blunt && <td style={{border: "1px solid gray", padding: "5px"}}>Blunt</td>}
      {attack.ap && <td style={{border: "1px solid gray", padding: "5px"}}>AP</td>}
      {attack.strAdd && <td style={{border: "1px solid gray", padding: "5px"}}>+STR * {attack.strAdd}</td>}
      {attack.ranges && <td style={{border: "1px solid gray", padding: "5px"}}>{attack.ranges.join("-")}</td>}
      <td>
        <button onClick={handleRemoveClick}>X</button>
      </td>
    </tr>
  )
}

interface IWeaponAttackTableProps {
  equippedWeapon: IWeapon
  setEquippedWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
}

function WeaponAttackTable({ equippedWeapon, setEquippedWeapon }: IWeaponAttackTableProps) {
  return (
    <table style={{borderCollapse: "collapse"}}>
      <thead>
        <tr>
          <th>Attack</th>
          <th style={{width: "100px"}}>Damage</th>
        </tr>
      </thead>
      <tbody>
        {equippedWeapon.attacks.map((attack, index) => (
          <WeaponAttackRow key={index} attack={attack} removeAttack={()=> {
            setEquippedWeapon((prev) => ({
              ...prev,
              attacks: prev.attacks.filter((_, i) => i !== index)
            }))
          }}/>
        ))}
      </tbody>
    </table>
  )
}

interface IAddWeaponAttackDialogProps {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setWeapon: React.Dispatch<React.SetStateAction<IWeapon>>,
}

function AddWeaponAttackDialog({ open, setOpen, setWeapon }: IAddWeaponAttackDialogProps) {
  const [attackType, setAttackType] = useState(0);
  const [variance, setVariance] = useState("");
  const [blunt, setBlunt] = useState(false);
  const [ap, setAP] = useState(false);
  const [strAdd, setStrAdd] = useState(0);
  const [ranges, setRanges] = useState("");

  useEffect(() => {
    if (!open) {
      setAttackType(0);
      setVariance("");
      setBlunt(false);
      setAP(false);
      setStrAdd(0);
      setRanges("");
    }
  }, [open]);

  const handleAddAttack = () => {

    const varianceArr = variance.split(",").map((v) => parseInt(v.trim())).filter((v) => !isNaN(v));
    const rangesArr = ranges.split(",").map((r) => parseInt(r.trim())).filter((r) => !isNaN(r));

    setWeapon((prev) => ({
      ...prev,
      attacks: [
        ...prev.attacks,
        {
          variance: varianceArr,
          attackType: attackType,
          blunt: blunt,
          ap: ap,
          strAdd: strAdd || undefined,
          ranges: rangesArr.length > 0 ? rangesArr : undefined,
        }
      ]
    }));
    
    setOpen(false);
  }

  return (
    <>
      {/* Semi transparent gray background*/}
      <div
        style={{display: open ? "block" : "none", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)"}}
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div style={{display: open ? "block" : "none", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "10px", border: "1px solid black"}}>
        <div style={{margin: "5px"}}>
          <label>Attack Type: </label>
          <select value={attackType} onChange={(e) => setAttackType(parseInt(e.target.value))}>
            {Object.keys(attackTypes).map((key) => (
              <option key={key} value={attackTypes[key]}>{pascalCaseToDisplayName(key)}</option>
            ))}
          </select>
        </div>
        <div style={{margin: "5px"}}>
          <label>Variance: </label>
          <input type="text" value={variance} onChange={(e) => setVariance(e.target.value)} />
        </div>
        <div style={{margin: "5px"}}>
          <label>Blunt: </label>
          <input type="checkbox" checked={blunt} onChange={(e) => setBlunt(e.target.checked)} />
        </div>
        <div style={{margin: "5px"}}>
          <label>AP: </label>
          <input type="checkbox" checked={ap} onChange={(e) => setAP(e.target.checked)} />
        </div>
        <div style={{margin: "5px"}}>
          <label>STR Add: </label>
          <input type="number" value={strAdd} onChange={(e) => setStrAdd(parseInt(e.target.value))} />
        </div>
        <div style={{margin: "5px"}}>
          <label>Ranges: </label>
          <input type="text" value={ranges} onChange={(e) => setRanges(e.target.value)} />
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
  }, [value, skill, setSkillModifiers])

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

interface IWeaponAttackResultsTableProps {
  attackResults: IAttackResults,
}

function WeaponAttackResultsTable({ attackResults }: IWeaponAttackResultsTableProps) {
  return (
    <table style={{width: "100%"}}>
          <thead>
            <tr>
              <th>Melee</th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
              <th style={{width: "100px"}}></th>
              <th style={{width: "100px", backgroundColor: "lightgray"}}></th>
            </tr>
          </thead>
          <tbody>
            {attackResults.results.map((attackResult, index) => (
              <tr key={index}>
                <td>{attackResult.name + (attackResult.name==="Slash" ? " (Reach -1)" : "")}</td>
                {attackResult.results.map((result, index) => (
                  <td key={index} style={{border: "1px solid gray", padding: "5px", textAlign: "center", backgroundColor: index % 2 === 0 ? "white" : "lightgray"}}>
                    {result.finalRoll} - {result.damage}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
  )
}

export default App
