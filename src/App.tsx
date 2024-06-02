import React, { useState, useEffect } from 'react'
import './App.css'

// TODO: Add half-swording stance

const damageLookup = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 2, 2, 2],
  [0, 0, 1, 1, 2, 2, 3, 3],
];

interface Weapon {
  name: string,
  skill: string,
  slashDamage?: number[],
  stabDamage?: number[],
  bluntSlashDamage?: number[],
  bluntStabDamage?: number[],
  apSlashDamage?: number[],   // Armor piercing
  apStabDamage?: number[],    // Armor piercing
  strSlashMultiplier?: number, // STR * multiplier + slashDamage (even if slashDamage is falsy)
  strStabMultiplier?: number,  // STR * multiplier + stabDamage (even if stabDamage is falsy)
  lengthy?: boolean,
  ambushWeapon?: boolean,
  
  // For bows
  ranges?: number[],
  bowDamage?: number[]
}

interface Weapons {
  [key: string]: Weapon
}

const weapons = {
  dagger: {
    name: "Dagger",
    skill: "daggers",
    slashDamage: [20, 25],
    stabDamage: [20, 25],
    lengthy: true,
    ambushWeapon: true,
  },
  scimitar: {
    name: "Scimitar",
    skill: "cuttingSwords",
    slashDamage: [40, 45, 50, 60],
    stabDamage: [15, 20, 25]
  },
  mace: {
    name: "Mace",
    skill: "maces",
    bluntSlashDamage: [30, 40],
    bluntStabDamage: [10, 20],
    lengthy: true,
  },
  woodenSpear: {
    name: "Wooden Spear",
    skill: "spears",
    stabDamage: [20, 30, 35],
    strSlashMultiplier: 2,
  },
  longbow: {
    name: "Longbow",
    skill: "bows",
    strSlashMultiplier: 2,
    strStabMultiplier: 2,
    ranges: [100, 200, 360],
    bowDamage: [30, 20, 60]
  }
}

const targeting = {
  body: "body",
  limb: "limb",
  head: "head",
}

const statTypes = {
  STR: "STR",
  INT: "INT",
  PRE: "PRE",
  AGI: "AGI",
  CON: "CON",
  SPI: "SPI",
}

const pascalCaseToDisplayName = (pascalCase: string) => {
  let displayName = pascalCase;
  // Add a space between pascal case words
  displayName = displayName.replace(/([A-Z])/g, ' $1');
  // Capitalize the first letter
  displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  return displayName;
}

interface SkillModifier {
  modifier: number,
  active?: boolean,
  parent?: string,
}

interface SkillModifiers {
  [key: string]: SkillModifier
}

const getHighestSkillModifier = (skill: string, skillModifiers: SkillModifiers): number => {
  // Get the greatest skill modifier from the skill and its parents that are active
  let highestModifier = 0;
  let currentSkill: string | undefined = skill;
  while (currentSkill) {
    highestModifier = Math.min(highestModifier, skillModifiers[currentSkill].modifier);
    currentSkill = skillModifiers[currentSkill].parent;
  }

  currentSkill = skill;
  while (currentSkill) {
    if (skillModifiers[currentSkill].active || skillModifiers[currentSkill].active === undefined) {
      highestModifier = Math.max(highestModifier, skillModifiers[currentSkill].modifier);
    }
    currentSkill = skillModifiers[currentSkill].parent;
  }
  return highestModifier;
}

function App() {
  const [baseStats, setBaseStats] = useState<{[key: string]: number}>({
    STR: 0, // Strength
    INT: 0, // Intellect
    PRE: 0, // Presence
    AGI: 0, // Agility
    CON: 0, // Constitution
    SPI: 0, // Spirit
  });

  const [generalStatModifiers, setGeneralStatModifiers] = useState<{[key: string]: number}>({
    STR: 0,
    INT: 0,
    PRE: 0,
    AGI: 0,
    CON: 0,
    SPI: 0,
  });

  const [meleeStatModifiers, setMeleeStatModifiers] = useState<{[key: string]: number}>({
    STR: 0,
    INT: 0,
    PRE: 0,
    AGI: 0,
    CON: 0,
    SPI: 0,
  });

  const [rangedStatModifiers, setRangedStatModifiers] = useState<{[key: string]: number}>({
    STR: 0,
    INT: 0,
    PRE: 0,
    AGI: 0,
    CON: 0,
    SPI: 0,
  });

  const [magicStatModifiers, setMagicStatModifiers] = useState<{[key: string]: number}>({
    STR: 0,
    INT: 0,
    PRE: 0,
    AGI: 0,
    CON: 0,
    SPI: 0,
  });

  const weaponSkills = [
    'unarmed',
    'daggers',
    'standardSwords',
    'cuttingSwords',
    'thrustingSwords',
    'twoHandedSwords',
    'flails',
    'maces',
    'oneHandedAxes',
  ];

  const [skillModifiers, setSkillModifiers] = useState<SkillModifiers>({
    unarmed: { modifier: 0 },

    swords: { modifier: -4 },
    daggers: {
      modifier: 0,
      active: false,
      parent: 'swords'
    },
    standardSwords: {
      modifier: 0,
      active: false,
      parent: 'swords'
    },
    cuttingSwords: {
      modifier: 0,
      active: false,
      parent: 'swords'
    },
    thrustingSwords: {
      modifier: 0,
      active: false,
      parent: 'swords'
    },
    twoHandedSwords: {
      modifier: 0,
      active: false,
      parent: 'swords'
    },

    hafted: {
      modifier: 0,
      active: false
    },
    chain: {
      modifier: -4,
      active: true,
      parent: 'hafted'
    },
    flails: {
      modifier: 0,
      active: false,
      parent: 'chain'
    },
    striking: {
      modifier: 0,
      active: false,
      parent: 'hafted'
    },
    maces: {
      modifier: 0,
      active: true,
      parent: 'striking'
    },
    oneHandedAxes: {
      modifier: -1,
      active: true,
      parent: 'striking'
    }
  });

  const defaultWeapon = weapons.dagger;
  const [equippedWeapon, setEquippedWeapon] = useState<Weapon>(defaultWeapon);
  const [equippedWeaponSkill, setEquippedWeaponSkill] = useState<string>(defaultWeapon.skill);
  const [ambushWeapon, setAmbushWeapon] = useState<boolean>(defaultWeapon.ambushWeapon);

  const [bodyTargeting, setBodyTargeting] = useState(true);
  const [limbTargeting, setLimbTargeting] = useState(false);
  const [headTargeting, setHeadTargeting] = useState(false);

  const [ambush, setAmbush] = useState(false);
  const [inspired, setInspired] = useState(false);

  const [slowed, setSlowed] = useState(false);
  const [stunned, setStunned] = useState(false);

  interface Ability {
    name: string,
    active: boolean,
    overrides: string[],
    description: string,
  }
  
  interface Abilities {
    [key: string]: Ability
  }
  
  const [abilities, setAbilities] = useState<Abilities>({
    armorImmobility: {
      name: 'Armor Immobility',
      active: false,
      overrides: [],
      description: '-1 to any AGI and STR checks.'
    },
    haymaker: {
      name: 'Haymaker',
      active: false,
      overrides: [],
      description: 'Heavy Punch now uses AGI / 2.'
    },
    brawny: {
      name: 'Brawny',
      active: false,
      overrides: [],
      description: '+2 to STR based Unarmed attack rolls.'
    },
    ambusher: {
      name: 'Ambusher',
      active: false,
      overrides: [],
      description: 'Ambush attacks deal 1.5x damage.'
    },
    masterAmbusher: {
      name: 'Master Ambusher',
      active: false,
      overrides: ['ambusher'],
      description: 'Ambush attacks deal 2x damage.'
    }
  });

  const getTotalStat = (stat: string): number => {
    return baseStats[stat] + generalStatModifiers[stat] + meleeStatModifiers[stat] + rangedStatModifiers[stat] + magicStatModifiers[stat];
  }

  const setTargeting = (target: string) => {
    setBodyTargeting(target === targeting.body);
    setLimbTargeting(target === targeting.limb);
    setHeadTargeting(target === targeting.head);
  }

  const calculatePunchDamage = (roll: number) => {
    let damage = getTotalStat(statTypes.STR);
    const baseRoll = roll;
    let finalRoll = baseRoll;

    if (baseRoll === 1) {
      // Critical Miss
      damage = 0;
    } else if (baseRoll === 10) {
      // Critical Hit
      damage *= 2;
    } else {
      const skillModifier: SkillModifier = skillModifiers.unarmed;
      if (skillModifier) {
        finalRoll += skillModifier.modifier;
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
      let agi = getTotalStat(statTypes.AGI);
      if (slowed) {
        agi /= 2;
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

    return {finalRoll, damage};
  }

  const calculateKickDamage = (roll: number) => {
    let damage = Math.ceil(getTotalStat(statTypes.STR) * 1.5);
    const baseRoll = roll;
    let finalRoll = baseRoll;

    if (baseRoll === 1) {
      // Critical Miss
      damage = 0;
    } else if (baseRoll === 10) {
      // Critical Hit
      damage *= 2;
    } else {
      finalRoll -= 2;

      const skillModifier: SkillModifier = skillModifiers.unarmed;
      if (skillModifier) {
        finalRoll += skillModifier.modifier;
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
      let agi = getTotalStat(statTypes.AGI);
      if (slowed) {
        agi /= 2;
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

    return {finalRoll, damage};
  }

  const calculateHeavyPunchDamage = (roll: number) => {
    let damage = getTotalStat(statTypes.STR) * 2;
    const baseRoll = roll;
    let finalRoll = baseRoll;

    if (baseRoll === 1) {
      // Critical Miss
      damage = 0;
    } else if (baseRoll === 10) {
      // Critical Hit
      damage *= 2;
    } else {

      const skillModifier: SkillModifier = skillModifiers.unarmed;
      if (skillModifier) {
        finalRoll += skillModifier.modifier;
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
      let agi = getTotalStat(statTypes.AGI);
      abilities.haymaker.active ? agi /= 2 : agi /= 4;
      if (slowed) {
        agi /= 2;
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

    return {finalRoll, damage};
  }

  const calculateGrapple = (roll: number) => {
    // Does not do damage
    const baseRoll = roll;
    let finalRoll = baseRoll;

    if (baseRoll === 1) {
      // Critical Miss
    } else if (baseRoll === 8) {
      // Critical Success
    } else {
      const skillModifier: SkillModifier = skillModifiers.unarmed;
      if (skillModifier) {
        finalRoll += skillModifier.modifier;
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

      if (abilities.brawny.active) {
        finalRoll += 2;
      }

      // Add STR modifiers
      let str = getTotalStat(statTypes.STR);
      if (slowed) {
        str /= 2;
      }
      str = Math.ceil(str);
      finalRoll += str;
    }

    return finalRoll;
  }

  const calculateMeleeWeaponDamage = (attackType: string, roll: number) => {
    let damage = 0;
    const baseRoll = roll;
    let finalRoll = baseRoll;

    let damageArray: number[] | undefined = [];
    switch (attackType) {
      case 'slash':
        damageArray = equippedWeapon.slashDamage;
        break;
      case 'stab':
        damageArray = equippedWeapon.stabDamage;
        break;
      case 'bluntSlash':
        damageArray = equippedWeapon.bluntSlashDamage;
        break;
      case 'bluntStab':
        damageArray = equippedWeapon.bluntStabDamage;
        break;
      case 'apSlash':
        damageArray = equippedWeapon.slashDamage;
        break;
      case 'apStab':
        damageArray = equippedWeapon.stabDamage;
        break;
    }

    if (damageArray?.length === 0 || !damageArray) {
      return {finalRoll, damage};
    }

    if (baseRoll === 1) {
      // Critical Miss
      damage = 0;
    } else if (baseRoll === 10) {
      // Critical Hit
      damage = damageArray[damageArray.length - 1];
      if (attackType === 'bluntSlash' || attackType === 'bluntStab') {
        damage += getTotalStat(statTypes.STR);
      }
      damage *= 2;
    } else {
      const damageLookupRow = damageArray.length - 1;
      const damageIndex = damageLookup[damageLookupRow]?.[Math.min(baseRoll, 8) - 1];
      if (damageIndex === undefined) {
        return {finalRoll, damage};
      }
      damage = damageArray[damageIndex];
      if (attackType === 'bluntSlash' || attackType === 'bluntStab') {
        damage += getTotalStat(statTypes.STR);
      }

      const skillModifier: SkillModifier = skillModifiers[equippedWeaponSkill];
      if (skillModifier) {
        finalRoll += getHighestSkillModifier(equippedWeaponSkill, skillModifiers);
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
      let agi = getTotalStat(statTypes.AGI);
      if (slowed) {
        agi /= 2;
      }
      agi = Math.ceil(agi);
      finalRoll += agi;
    }

    if (ambush) {
      damage *= 2;

      if (ambushWeapon) {
        damage *= 2;
      }

      if (abilities.masterAmbusher.active) {
        damage *= 2;
      } else if (abilities.ambusher.active) {
        damage *= 1.5;
      }
    }

    return {finalRoll, damage};
  }

  const rolls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div>
      <div style={{display: "flex"}}>
        <div style={{width: window.innerWidth / 3}}>
          <table>
            <thead>
              <tr>
                <th>Stat</th>
                <th>Base</th>
                <th>General</th>
                <th>Melee</th>
                <th>Ranged</th>
                <th>Magic</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(baseStats).map((stat) => {
                return (
                  <tr key={stat}>
                    <td>{stat}</td>
                    <td><StatInput stat={stat} statGroup={baseStats}            setStat={setBaseStats}/></td>
                    <td><StatInput stat={stat} statGroup={generalStatModifiers} setStat={setGeneralStatModifiers}/></td>
                    <td><StatInput stat={stat} statGroup={meleeStatModifiers}   setStat={setMeleeStatModifiers}/></td>
                    <td><StatInput stat={stat} statGroup={rangedStatModifiers}  setStat={setRangedStatModifiers}/></td>
                    <td><StatInput stat={stat} statGroup={magicStatModifiers}   setStat={setMagicStatModifiers}/></td>
                    <td style={{textAlign: "center"}}>{getTotalStat(stat)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <br />

          <label>Weapon: </label>
          <WeaponSelector
            weapons={weapons}
            equippedWeapon={equippedWeapon}
            setEquippedWeapon={setEquippedWeapon}
            setEquippedWeaponSkill={setEquippedWeaponSkill}
            setAmbushWeapon={setAmbushWeapon}
          />
          <br />

          <label>Skill: </label>
          <SkillSelector 
            skills={weaponSkills}
            equippedWeaponSkill={equippedWeaponSkill}
            setEquippedWeaponSkill={setEquippedWeaponSkill}
          />
          <br />
          <br />

          <div>
            <label>Ambush-Weapon: </label>
            <input type="checkbox" checked={ambushWeapon} onChange={() => setAmbushWeapon(!ambushWeapon)} />
          </div>
          <table>
            <tbody>
              <DamageInput
                label = "Slash: "
                property = "slashDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
              <DamageInput
                label = "Stab: "
                property = "stabDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
              <DamageInput
                label = "Blunt Slash: "
                property = "bluntSlashDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
              <DamageInput
                label = "Blunt Stab: "
                property = "bluntStabDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
              <DamageInput
                label = "AP Slash: "
                property = "apSlashDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
              <DamageInput
                label = "AP Stab: "
                property = "apStabDamage"
                equippedWeapon = {equippedWeapon}
                setEquippedWeapon = {setEquippedWeapon}
              />
            </tbody>
          </table>
          <br />

          {/* Radio buttons for body, limb, and head targeting */}
          <label>Body: </label>
          <input type="radio" checked={bodyTargeting} onChange={() => {setTargeting(targeting.body)}} />
          <label>Limb: </label>
          <input type="radio" checked={limbTargeting} onChange={() => {setTargeting(targeting.limb)}} />
          <label>Head: </label>
          <input type="radio" checked={headTargeting} onChange={() => {setTargeting(targeting.head)}} />
          <>{bodyTargeting ? ' 0' : (limbTargeting ? ' -1' : ' -2')}</>
          <br />
          <label>Ambush: </label>
          <input type="checkbox" checked={ambush} onChange={() => setAmbush(!ambush)} />
          <label>Inspired: </label>
          <input type="checkbox" checked={inspired} onChange={() => setInspired(!inspired)} />
          <br />
          <label>Slowed: </label>
          <input type="checkbox" checked={slowed} onChange={() => setSlowed(!slowed)} />
          <label>Stunned: </label>
          <input type="checkbox" checked={stunned} onChange={() => setStunned(!stunned)} />
          <br />
          <br />
        </div>
        <SkillModifiers skillModifiers={skillModifiers} setSkillModifiers={setSkillModifiers} />
        <div style={{width: "300px"}}>
          <table>
            <thead>
              <tr>
                <th style={{textAlign: "left"}}>Ability</th>
                <th style={{textAlign: "left"}}>Description</th>
                <th style={{textAlign: "left"}}>Active</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(abilities).map((ability) => {
                return (
                  <tr key={ability}>
                    <td>{abilities[ability].name}</td>
                    <td>{abilities[ability].description}</td>
                    <td>
                      <input type="checkbox" checked={abilities[ability].active} onChange={() => {
                        const newAbilities = {...abilities};
                        newAbilities[ability].active = !newAbilities[ability].active;
                        setAbilities(newAbilities);
                      }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <br />
      <div>
      <table>
          <thead>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>Base Roll</th>
              <th style={{width: "80px"}}>1</th>
              <th style={{width: "80px"}}>2</th>
              <th style={{width: "80px"}}>3</th>
              <th style={{width: "80px"}}>4</th>
              <th style={{width: "80px"}}>5</th>
              <th style={{width: "80px"}}>6</th>
              <th style={{width: "80px"}}>7</th>
              <th style={{width: "80px"}}>8</th>
              <th style={{width: "80px"}}>9</th>
              <th style={{width: "80px"}}>10</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>Punch</th>
              {rolls.map((roll) => {
                const {finalRoll} = calculatePunchDamage(roll);
                let displayRoll = finalRoll.toString();
                if (roll === 1) displayRoll = 'MISS';
                else if (roll === 10) displayRoll = 'CRIT';

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {displayRoll}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td style={{width: "100px", textAlign: "left"}}>Damage</td>
              {rolls.map((roll) => {
                const {damage} = calculatePunchDamage(roll);

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {damage}
                  </td>
                )
              })}
            </tr>
            <tr style={{height: "10px"}}/>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>Kick</th>
              {rolls.map((roll) => {
                const {finalRoll} = calculateKickDamage(roll);
                let displayRoll = finalRoll.toString();
                if (roll === 1) displayRoll = 'MISS';
                else if (roll === 10) displayRoll = 'CRIT';

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {displayRoll}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td style={{width: "100px", textAlign: "left"}}>Damage</td>
              {rolls.map((roll) => {
                const {damage} = calculateKickDamage(roll);

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {damage}
                  </td>
                )
              })}
            </tr>
            <tr style={{height: "10px"}}/>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>Heavy Punch</th>
              {rolls.map((roll) => {
                const {finalRoll} = calculateHeavyPunchDamage(roll);
                let displayRoll = finalRoll.toString();
                if (roll === 1) displayRoll = 'MISS';
                else if (roll === 10) displayRoll = 'CRIT';

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {displayRoll}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td style={{width: "100px", textAlign: "left"}}>Damage</td>
              {rolls.map((roll) => {
                const {damage} = calculateHeavyPunchDamage(roll);

                let backgroundColor = 'white';
                if (stunned && (roll === 9 || roll === 10)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {damage}
                  </td>
                )
              })}
            </tr>
            <tr style={{height: "10px"}}/>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>Grapple</th>
              {rolls.slice(0, 8).map((roll) => {
                const finalRoll = calculateGrapple(roll);
                let displayRoll = finalRoll.toString();
                if (roll === 1) displayRoll = 'MISS';
                else if (roll === 8) displayRoll = 'CRIT';

                let backgroundColor = 'white';
                if (stunned && (roll === 7 || roll === 8)) {
                  backgroundColor = 'black'
                }

                return (
                  <td
                    key={roll}
                    style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
                  >
                    {displayRoll}
                  </td>
                )
              })}
            </tr>
            {equippedWeapon.slashDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.slashDamage && <MeleeWeaponTableRows
              label="Slash"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('slash', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
            {equippedWeapon.stabDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.stabDamage && <MeleeWeaponTableRows
              label="Stab"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('stab', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
            {equippedWeapon.bluntSlashDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.bluntSlashDamage && <MeleeWeaponTableRows
              label="Blunt Slash"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('bluntSlash', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
            {equippedWeapon.bluntStabDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.bluntStabDamage && <MeleeWeaponTableRows
              label="Blunt Stab"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('bluntStab', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
            {equippedWeapon.apSlashDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.apSlashDamage && <MeleeWeaponTableRows
              label="AP Slash"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('apSlash', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
            {equippedWeapon.apStabDamage && <tr style={{height: "10px"}}/>}
            {equippedWeapon.apStabDamage && <MeleeWeaponTableRows
              label="AP Stab"
              calculateDamage={(roll: number) => calculateMeleeWeaponDamage('apStab', roll)}
              rolls={rolls}
              stunned={stunned}
            />}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatInput({ stat, statGroup, setStat }: {
  stat: string,
  statGroup: {[key: string]: number},
  setStat: React.Dispatch<React.SetStateAction<{[key: string]: number}>> })
{
  return (
      <input
        style={{width: "40px"}}
        type="number"
        value={statGroup[stat]}
        onChange={(e) => {
          const newValue = parseInt(e.target.value);
          if (newValue < 0) {
            return;
          }
          const newStatGroup = {...statGroup};
          newStatGroup[stat] = newValue;
          setStat(newStatGroup);
        }}
      />
  )
}

interface WeaponSelectorProps {
  weapons: Weapons,
  equippedWeapon: Weapon,
  setEquippedWeapon: React.Dispatch<React.SetStateAction<Weapon>>
  setEquippedWeaponSkill: React.Dispatch<React.SetStateAction<string>>
  setAmbushWeapon: React.Dispatch<React.SetStateAction<boolean>>
}

function WeaponSelector({
  weapons,
  equippedWeapon,
  setEquippedWeapon,
  setEquippedWeaponSkill,
  setAmbushWeapon
}: WeaponSelectorProps) {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = weapons[event.target.value];
    setEquippedWeapon(selectedWeapon);
    setEquippedWeaponSkill(selectedWeapon.skill);
    setAmbushWeapon(selectedWeapon.ambushWeapon ? true : false);
  };

  return (
    <select value={Object.keys(weapons).find(key => weapons[key] === equippedWeapon)} onChange={handleSelectChange}>
      {Object.keys(weapons).map((weaponName) => {
        return <option key={weaponName} value={weaponName}>{weapons[weaponName].name}</option>
      })}
    </select>
  )
}

function SkillSelector({ skills, equippedWeaponSkill, setEquippedWeaponSkill }: {
  skills: string[],
  equippedWeaponSkill: string,
  setEquippedWeaponSkill: React.Dispatch<React.SetStateAction<string>>
}) {
  return (
    <select value={equippedWeaponSkill} onChange={(e) => setEquippedWeaponSkill(e.target.value)}>
      {skills.map((skill) => {
        return <option
          key={skill}
          value={skill}>{pascalCaseToDisplayName(skill)}
        </option>
      })}
    </select>
  )
}

interface DamageInputProps {
  label: string,
  property: string,
  equippedWeapon: Weapon,
  setEquippedWeapon: React.Dispatch<React.SetStateAction<Weapon>>
}

function DamageInput({label, property, equippedWeapon, setEquippedWeapon }: DamageInputProps) {
  property = property as keyof Weapon;
  const damageArray = equippedWeapon[property] || [];

  const defaultInput = damageArray.join(', ');
  const [inputValue, setInputValue] = useState(defaultInput);

  useEffect(() => {
    setInputValue(equippedWeapon[property]?.join(', ') || '');
  }, [equippedWeapon, property]);

  const handleBlur = () => {
    const newValues = inputValue.split(',')
      .map((v: string) => parseInt(v.trim()))
      .filter((v: number) => !isNaN(v));
    const newWeapon = {...equippedWeapon};
    newWeapon[property] = newValues;

    if (newValues.length === 0) {
      delete newWeapon[property];
    }

    setEquippedWeapon(newWeapon);

    setInputValue(newValues.join(', '));
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  return (
    <tr>
      <td>{label}</td>
      <td>
        <input
          type = "text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </td>
    </tr>
  )
}

function SkillModifiers({ skillModifiers, setSkillModifiers }: {
  skillModifiers: SkillModifiers,
  setSkillModifiers: React.Dispatch<React.SetStateAction<SkillModifiers>>
} ) {

  return (
    <div style={{width: window.innerWidth / 3}}>
      <table>
        <thead>
          <tr>
            <th style={{textAlign: "left"}}>Skill</th>
            <th style={{textAlign: "left"}}>Modifier</th>
            <th style={{textAlign: "left"}}>Active</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(skillModifiers).map((skill) => {
            const skillActive = skillModifiers[skill].active === undefined || skillModifiers[skill].active;
            return (
              <tr key={skill}>
                <td>{pascalCaseToDisplayName(skill)}</td>
                <td>
                  <input
                    style={{width: "40px"}}
                    type='number'
                    value={
                      skillActive ? skillModifiers[skill].modifier : getHighestSkillModifier(skill, skillModifiers)
                    }
                    disabled={!skillActive}
                    onChange={(e) => {
                      const newSkillModifiers = {...skillModifiers};
                      newSkillModifiers[skill].modifier = parseInt(e.target.value);
                      setSkillModifiers(newSkillModifiers);
                    }}
                  />
                </td>
                <td style={{textAlign: 'center'}}>
                  {
                    skillModifiers[skill].active !== undefined &&
                    <input type="checkbox" checked={skillModifiers[skill].active} onChange={() => {
                      const newSkillModifiers = {...skillModifiers};
                      newSkillModifiers[skill].active = !newSkillModifiers[skill].active;
                      setSkillModifiers(newSkillModifiers);
                    }} />
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface MeleeWeaponTableRowsProps {
  label: string,
  calculateDamage: (roll: number) => {finalRoll: number, damage: number},
  rolls: number[],
  stunned?: boolean
}

const MeleeWeaponTableRows = ({ label, calculateDamage, rolls, stunned }: MeleeWeaponTableRowsProps) => {
  return (
    <>
      <tr>
        <th style={{width: "100px", textAlign: "left"}}>{label}</th>
        {rolls.map((roll) => {
          const {finalRoll} = calculateDamage(roll);
          let displayRoll = finalRoll.toString();
          if (roll === 1) displayRoll = 'MISS';
          else if (roll === 10) displayRoll = 'CRIT';

          let backgroundColor = 'white';
          if (stunned && (roll === 9 || roll === 10)) {
            backgroundColor = 'black'
          }

          return (
            <td
              key={roll}
              style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
            >
              {displayRoll}
            </td>
          )
        })}
      </tr>
      <tr>
        <td style={{width: "100px", textAlign: "left"}}>Damage</td>
        {rolls.map((roll) => {
          const {damage} = calculateDamage(roll);

          let backgroundColor = 'white';
          if (stunned && (roll === 9 || roll === 10)) {
            backgroundColor = 'black'
          }

          return (
            <td
              key={roll}
              style={{border: "1px solid gray", width: "80px", textAlign: "center", backgroundColor}}
            >
              {damage}
            </td>
          )
        })}
      </tr>
    </>
  )
}

export default App
