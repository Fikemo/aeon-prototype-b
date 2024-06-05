import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  polearms: "polearms",
  spears: "spears",
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
      { variance: [], attackType: attackTypes.slash, strAdd: 2 },
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
      { variance: [], attackType: attackTypes.stab, strAdd: 1 }
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
      { variance: [], attackType: attackTypes.slash, strAdd: 2 },
      { variance: [], attackType: attackTypes.stab, strAdd: 2 },
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
    highestModifier += skillModifiers[parent].value;
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
    
    swords: { value: 0 },
    daggers: { value: 0, parent: 'swords' },
    standardSwords: { value: 0, parent: 'swords' },
    cuttingSwords: { value: 0, parent: 'swords' },
    thrustingSwords: { value: 0, parent: 'swords' },
    twoHandedSwords: { value: 0, parent: 'swords' },

    hafted: { value: 0},
    chain: { value: 0, parent: 'hafted' },
    flails: { value: 0, parent: 'chain' },
    striking: { value: 0, parent: 'hafted' },
    maces: { value: 0, parent: 'striking' },
    oneHandedAxes: { value: 0, parent: 'striking' },

    polearms: { value: 0 },
    spears: { value: 0, parent: 'polearms' },

    bows: { value: 0 },
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

  const [bodyTargeting, setBodyTargeting] = useState(false);
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

  const calculatePunchDamages = useCallback(() => {
    // return [{finalRoll: number, damage: number},...]
    const punchDamages = [];
    for (let i = 1; i <= 10; i++) {
      const baseRoll = i;
      let damage = getStatTotal(statTypes.STR, stats);
      let finalRoll = baseRoll;
      if (baseRoll === 1) {
        // Critical miss
        damage = 0;
      } else if (baseRoll === 10) {
        // Critical hit
        damage *= 2;
      } else {
        const skillModifier = skillModifiers.unarmed.value;
        if (skillModifier > 0) {
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (limbTargeting) {
          finalRoll -= 1;
        } else if (headTargeting) {
          finalRoll -= 2;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let agi = getStatTotal(statTypes.AGI, stats);
        if (slowed) {
          agi = Math.floor(agi / 2);
        }
        agi = Math.ceil(agi);
        finalRoll += agi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      punchDamages.push({finalRoll, damage});
    }

    return punchDamages;

  }, [abilities.ambusher.active, abilities.masterAmbusher.active, abilities.armorImmobility.active, ambush, inspired, limbTargeting, headTargeting, slowed, stats, skillModifiers.unarmed.value]);

  const calculateSlashDamages = useCallback((attack: IAttack) => {
    const slashDamages = [];
    const damageArray = attack.variance;
    const str = getStatTotal(statTypes.STR, stats);
    for (let i = 1; i <= 10; i++) {
      const baseRoll = i;
      let damage = 0;
      let finalRoll = baseRoll;

      const critSuccess = baseRoll === 10;

      if (baseRoll === 1) {
        // Critical miss
        damage = 0;
      } else {

        if (critSuccess) {
          damage = damageArray[damageArray.length - 1];
        } else {
          const damageLookupRow = damageArray.length - 1;
          const damageIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) -1];
          damage = damageArray[damageIndex];
        }

        if (attack.strAdd) {
          damage += str * attack.strAdd;
        } else if (attack.blunt) {
          damage += str;
        }

        const hasSkillModifier = skillModifiers[equippedWeapon.skill] !== undefined;
        if (hasSkillModifier) {
          const skillModifier = getHighestSkillModifier(equippedWeapon.skill, skillModifiers);
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (limbTargeting) {
          finalRoll -= 1;
        } else if (headTargeting) {
          finalRoll -= 2;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let agi = getStatTotal(statTypes.AGI, stats);
        if (slowed) {
          agi = Math.floor(agi / 2);
        }
        agi = Math.ceil(agi);
        finalRoll += agi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (critSuccess) {
        damage *= 2;
      }

      slashDamages.push({finalRoll, damage});
    }

    return slashDamages;
  }, [abilities.ambusher.active, abilities.armorImmobility.active, abilities.masterAmbusher.active, ambush, equippedWeapon.skill, headTargeting, inspired, limbTargeting, skillModifiers, slowed, stats]);

  const calculateStabDamages = useCallback((attack: IAttack) => {
    const stabDamages = [];
    const damageArray = attack.variance;
    const str = getStatTotal(statTypes.STR, stats);
    for (let i = 1; i <= 10; i++) {
      const baseRoll = i;
      let damage = 0;
      let finalRoll = baseRoll;

      const critSuccess = baseRoll === 10;

      if (baseRoll === 1) {
        // Critical miss
        damage = 0;
      } else {

        if (critSuccess) {
          damage = damageArray[damageArray.length - 1];
        } else {
          const damageLookupRow = damageArray.length - 1;
          const damageIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) -1];
          damage = damageArray[damageIndex];
        }

        if (attack.strAdd) {
          damage += str * attack.strAdd;
        } else if (attack.blunt) {
          damage += str;
        }

        const hasSkillModifier = skillModifiers[equippedWeapon.skill] !== undefined;
        if (hasSkillModifier) {
          const skillModifier = getHighestSkillModifier(equippedWeapon.skill, skillModifiers);
          finalRoll += skillModifier;
        }

        if (inspired) {
          finalRoll += 1;
        }

        if (limbTargeting) {
          finalRoll -= 1;
        } else if (headTargeting) {
          finalRoll -= 3;
        }

        if (abilities.armorImmobility.active) {
          finalRoll -= 1;
        }

        // Add AGI modifiers
        let agi = getStatTotal(statTypes.AGI, stats);
        if (slowed) {
          agi = Math.floor(agi / 2);
        }
        agi = Math.ceil(agi);
        finalRoll += agi;
      }

      if (ambush) {
        damage *= 2;

        if (abilities.masterAmbusher.active) {
          damage *= 2;
        } else if (abilities.ambusher.active) {
          damage *= 1.5;
        }
      }

      if (critSuccess) {
        damage *= 2;
      }

      stabDamages.push({finalRoll, damage});
    }

    return stabDamages;
  }, [abilities.ambusher.active, abilities.armorImmobility.active, abilities.masterAmbusher.active, ambush, equippedWeapon.skill, headTargeting, inspired, limbTargeting, skillModifiers, slowed, stats]);

  const calculateRangedDamages = useCallback((attack: IAttack) => {

    return [];
  }, []);

  const calculateAttackDamages = useCallback((attack: IAttack) => {
    switch (attack.attackType) {
      case attackTypes.slash:
        return calculateSlashDamages(attack);
      case attackTypes.stab:
        return calculateStabDamages(attack);
      case attackTypes.ranged:
        return calculateRangedDamages(attack);
      default:
        return [];
    }
  }, [calculateSlashDamages, calculateStabDamages, calculateRangedDamages]);

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
            <WeaponPropertyInput
              label="Durability"
              value={equippedWeapon.durability || 0}
              setValue={(value) => setEquippedWeapon((prev) => ({...prev, durability: value}))}
            />
            <WeaponPropertyInput
              label="Strikes"
              value={equippedWeapon.strikes || 0}
              setValue={(value) => setEquippedWeapon((prev) => ({...prev, strikes: value}))}
            />
            <WeaponPropertyInput
              label="Reach"
              value={equippedWeapon.reach || 0}
              setValue={(value) => setEquippedWeapon((prev) => ({...prev, reach: value}))}
            />
            <WeaponPropertyInput
              label="Weight"
              value={equippedWeapon.weight}
              setValue={(value) => setEquippedWeapon((prev) => ({...prev, weight: value}))}
            />
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
              <th>Roll</th>
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
              <td colSpan={11} style={{height: "10px"}}></td>
            </tr>
            <tr>
              <th style={{textAlign: "left"}}>Punch</th>
              {calculatePunchDamages().map((damage, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? "white" : "lightgray", textAlign: "center"}}>
                  {damage.finalRoll}
                </td>
              ))}
            </tr>
            <tr>
              <td>Damage</td>
              {calculatePunchDamages().map((damage, index) => (
                <td key={index} style={{backgroundColor: index % 2 === 0 ? "white" : "lightgray", textAlign: "center"}}>
                  {damage.damage}
                </td>
              ))}
            </tr>
            <tr>
              <td colSpan={11} style={{height: "10px"}}></td>
            </tr>
            <AttackTableRows
              equippedWeapon={equippedWeapon}
              calculateAttackDamages={calculateAttackDamages}
            />
          </tbody>
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

interface IWeaponPropertyInputProps {
  label: string,
  value: number,
  setValue: (value: number) => void,
}

function WeaponPropertyInput({ label, value, setValue }: IWeaponPropertyInputProps) {
  return (
    <div>
      <label>{label}: </label>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
      />
    </div>
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
          min={0}
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

function FinalRollRow({ label, damages}: {label: string, damages: {finalRoll: number, damage: number}[]}) {
  return (
    <tr>
      <th style={{textAlign: "left"}}>{label}</th>
      {damages.map((damage, index) => (
        <td key={index} style={{backgroundColor: index % 2 === 0 ? "white" : "lightgray", textAlign: "center"}}>
          {damage.finalRoll}
        </td>
      ))}
    </tr>
  )
}

function DamageRow({ damages }: {damages: {finalRoll: number, damage: number}[]}) {
  return (
    <tr>
      <td>Damage</td>
      {damages.map((damage, index) => (
        <td key={index} style={{backgroundColor: index % 2 === 0 ? "white" : "lightgray", textAlign: "center"}}>
          {damage.damage}
        </td>
      ))}
    </tr>
  )
}

interface IAttackTableRowsProps {
  equippedWeapon: IWeapon,
  calculateAttackDamages: (attack: IAttack) => {finalRoll: number, damage: number}[],
}

function AttackTableRows({ equippedWeapon, calculateAttackDamages }: IAttackTableRowsProps) {
  const attackDamages = equippedWeapon.attacks.map((attack) => calculateAttackDamages(attack));

  return (
    <>
      {equippedWeapon.attacks.map((attack, index) => (
        <React.Fragment key={index}>
          <FinalRollRow label={attack.attackType === 0 ? "Slash" : (attack.attackType === 1 ? "Stab" : "Shoot")} damages={attackDamages[index]} />
          <DamageRow damages={attackDamages[index]} />
          <tr>
            <td colSpan={11} style={{height: "10px"}}></td>
          </tr>
        </React.Fragment>
      ))}
    </>
  )
}

export default App
