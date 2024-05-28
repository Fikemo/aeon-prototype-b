import React, { useState } from 'react'
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
  lengthy?: boolean,
  ambushWeapon?: boolean,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const statNames = {
  STR: "Strength",
  INT: "Intellect",
  PRE: "Presence",
  AGI: "Agility",
  CON: "Constitution",
  SPI: "Spirit",
}

const camelCaseToDisplayName = (camelCase: string) => {
  let displayName = camelCase;
  // Add a space between camel case words
  displayName = displayName.replace(/([A-Z])/g, ' $1');
  // Capitalize the first letter
  displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  return displayName;
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

  const [skillModifiers, setSkillModifiers] = useState<{[key: string]: number}>({
    basicSwords: 0,
    daggers: 0,
    standardSwords: 0,
    cuttingSwords: 0,
    thrustingSwords: 0,
    twoHandedSwords: 0,
    basicHaftedWeapons: 0,
    flails: 0,
    maces: 0,
    oneHandedAxes: 0,
    greatswords: 0,
    spears: 0,
    poleaxes: 0,
    glaives: 0,
    pikes: 0,
  });

  const [activeAttackType, setActiveAttackType] = useState<string>('slash');

  const defaultWeapon = weapons.dagger;
  const [equippedWeapon, setEquippedWeapon] = useState<Weapon>(defaultWeapon);
  const [equippedWeaponSkill, setEquippedWeaponSkill] = useState<string>(defaultWeapon.skill);
  const [ambushWeapon, setAmbushWeapon] = useState<boolean>(defaultWeapon.ambushWeapon);
  const [slashDamageDisplay, setSlashDamageDisplay] = useState<string>(defaultWeapon.slashDamage.join(', '));
  const [stabDamageDisplay, setStabDamageDisplay] = useState<string>(defaultWeapon.stabDamage.join(', '));
  const [bluntSlashDamageDisplay, setBluntSlashDamageDisplay] = useState<string>('');
  const [bluntStabDamageDisplay, setBluntStabDamageDisplay] = useState<string>('');

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

  const calculateMeleeWeaponDamage = (attackType: string, roll: number) => {
    let damage = 0;
    const baseRoll = roll;
    let finalRoll = baseRoll;

    let damageArray: number[] = [];
    switch (attackType) {
      case 'slash':
        damageArray = slashDamageDisplay.split(',').map((damage) => parseInt(damage.trim()));
        break;
      case 'stab':
        damageArray = stabDamageDisplay.split(',').map((damage) => parseInt(damage.trim()));
        break;
      case 'bluntSlash':
        damageArray = bluntSlashDamageDisplay.split(',').map((damage) => parseInt(damage.trim()));
        break;
      case 'bluntStab':
        damageArray = bluntStabDamageDisplay.split(',').map((damage) => parseInt(damage.trim()));
        break;
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
      const damageIndex = damageLookup[damageLookupRow][Math.min(baseRoll, 8) - 1];
      damage = damageArray[damageIndex];
      if (attackType === 'bluntSlash' || attackType === 'bluntStab') {
        damage += getTotalStat(statTypes.STR);
      }

      const skillModifier: number = skillModifiers[equippedWeaponSkill];
      if (skillModifier) {
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
      let agi = getTotalStat(statTypes.AGI);
      if (slowed) {
        agi /= 2;
      }
      finalRoll += agi;
      finalRoll = Math.ceil(finalRoll);
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
        <div style={{width: "400px"}}>
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
            setActiveAttackType={setActiveAttackType}
            setSlashDamageDisplay={setSlashDamageDisplay}
            setStabDamageDisplay={setStabDamageDisplay}
            setBluntSlashDamageDisplay={setBluntSlashDamageDisplay}
            setBluntStabDamageDisplay={setBluntStabDamageDisplay}
          />
          <br />
          <label>Skill: </label>
          <SkillSelector
            skills={skillModifiers}
            equippedWeaponSkill={equippedWeaponSkill}
            setEquippedWeaponSkill={setEquippedWeaponSkill}
          />
          <br />
          <br />
          <div>
            <label>Ambush-Weapon: </label>
            <input type="checkbox" checked={ambushWeapon} onChange={() => setAmbushWeapon(!ambushWeapon)} />
          </div>
          <div>
            <label>Slash: </label>
            <input type="text" value={slashDamageDisplay} onChange={(e) => setSlashDamageDisplay(e.target.value)} />
          </div>
          <div>
            <label>Stab: </label>
            <input type="text" value={stabDamageDisplay} onChange={(e) => setStabDamageDisplay(e.target.value)} />
          </div>
          <div>
            <label>Blunt Slash: </label>
            <input type="text" value={bluntSlashDamageDisplay} onChange={(e) => setBluntSlashDamageDisplay(e.target.value)} />
          </div>
          <div>
            <label>Blunt Stab: </label>
            <input type="text" value={bluntStabDamageDisplay} onChange={(e) => setBluntStabDamageDisplay(e.target.value)} />
          </div>
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
          <button disabled={slashDamageDisplay === ''}
          onClick={() => {
            setActiveAttackType('slash');
          }}>Slash</button>
          <button disabled={stabDamageDisplay === ''}
          onClick={() => {
            setActiveAttackType('stab');
          }}>Stab</button>
          <button disabled={bluntSlashDamageDisplay === ''}
          onClick={() => {
            setActiveAttackType('bluntSlash');
          }}>Blunt Slash</button>
          <button disabled={bluntStabDamageDisplay === ''}
          onClick={() => {
            setActiveAttackType('bluntStab');
          }}>Blunt Stab</button>
          <br />
        </div>
        <div style={{width: "300px"}}>
          <table>
            <thead>
              <tr>
                <th style={{textAlign: "left"}}>Skill</th>
                <th style={{textAlign: "left"}}>Modifier</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(skillModifiers).map((skill) => {
                return (
                  <tr key={skill}>
                    <td>{camelCaseToDisplayName(skill)}</td>
                    <td><SkillInput skill={skill} skillModifiers={skillModifiers} setSkillModifiers={setSkillModifiers}/></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
      <table style={{width: "1000px"}}>
          <thead>
            <tr>
              <th style={{width: "100px", textAlign: "left"}}>{camelCaseToDisplayName(activeAttackType)}</th>
              <th style={{width: "100px"}}>1</th>
              <th style={{width: "100px"}}>2</th>
              <th style={{width: "100px"}}>3</th>
              <th style={{width: "100px"}}>4</th>
              <th style={{width: "100px"}}>5</th>
              <th style={{width: "100px"}}>6</th>
              <th style={{width: "100px"}}>7</th>
              <th style={{width: "100px"}}>8</th>
              <th style={{width: "100px"}}>9</th>
              <th style={{width: "100px"}}>10</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{border: "1px solid gray", width: "100px"}}>Final Roll</td>
              {rolls.map((roll) => {
                  return (
                    <td key={roll} style={{border: "1px solid gray", width: "100px", textAlign: "center"}}>
                      {calculateMeleeWeaponDamage(activeAttackType, roll).finalRoll}
                    </td>
                  )
              })}
            </tr>
            <tr>
              <td style={{border: "1px solid gray", width: "100px"}}>Damage</td>
              {rolls.map((roll) => {
                  return (
                    <td key={roll} style={{border: "1px solid gray", width: "100px", textAlign: "center"}}>
                      {calculateMeleeWeaponDamage(activeAttackType, roll).damage}
                    </td>
                  )
              })}
            </tr>
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

function SkillInput({ skill, skillModifiers, setSkillModifiers }: {
  skill: string,
  skillModifiers: {[key: string]: number},
  setSkillModifiers: React.Dispatch<React.SetStateAction<{[key: string]: number}>>
}) {
  return (
      <input
        style={{width: "40px"}}
        type="number"
        value={skillModifiers[skill]}
        onChange={(e) => {
          const newSkillModifiers = {...skillModifiers};
          newSkillModifiers[skill] = parseInt(e.target.value);
          setSkillModifiers(newSkillModifiers);
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
  setActiveAttackType: React.Dispatch<React.SetStateAction<string>>
  setSlashDamageDisplay: React.Dispatch<React.SetStateAction<string>>
  setStabDamageDisplay: React.Dispatch<React.SetStateAction<string>>
  setBluntSlashDamageDisplay: React.Dispatch<React.SetStateAction<string>>
  setBluntStabDamageDisplay: React.Dispatch<React.SetStateAction<string>>
}

function WeaponSelector({
  weapons,
  equippedWeapon,
  setEquippedWeapon,
  setEquippedWeaponSkill,
  setAmbushWeapon,
  setActiveAttackType,
  setStabDamageDisplay,
  setSlashDamageDisplay,
  setBluntSlashDamageDisplay,
  setBluntStabDamageDisplay
}: WeaponSelectorProps) {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeapon = weapons[event.target.value];
    setEquippedWeapon(selectedWeapon);
    setEquippedWeaponSkill(selectedWeapon.skill);
    setAmbushWeapon(selectedWeapon.ambushWeapon ? true : false);

    if (selectedWeapon.slashDamage) {
      setActiveAttackType('slash');
    } else if (selectedWeapon.stabDamage) {
      setActiveAttackType('stab');
    } else if (selectedWeapon.bluntSlashDamage) {
      setActiveAttackType('bluntSlash');
    } else if (selectedWeapon.bluntStabDamage) {
      setActiveAttackType('bluntStab');
    }

    if (selectedWeapon.slashDamage) {
      setSlashDamageDisplay(selectedWeapon.slashDamage.join(', '));
    } else {
      setSlashDamageDisplay('');
    }

    if (selectedWeapon.stabDamage) {
      setStabDamageDisplay(selectedWeapon.stabDamage.join(', '));
    } else {
      setStabDamageDisplay('');
    }

    if (selectedWeapon.bluntSlashDamage) {
      setBluntSlashDamageDisplay(selectedWeapon.bluntSlashDamage.join(', '));
    } else {
      setBluntSlashDamageDisplay('');
    }

    if (selectedWeapon.bluntStabDamage) {
      setBluntStabDamageDisplay(selectedWeapon.bluntStabDamage.join(', '));
    } else {
      setBluntStabDamageDisplay('');
    }
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
  skills: {[key: string]: number},
  equippedWeaponSkill: string,
  setEquippedWeaponSkill: React.Dispatch<React.SetStateAction<string>>
}) {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEquippedWeaponSkill(event.target.value);
  };

  return (
    <select value={equippedWeaponSkill} onChange={handleSelectChange}>
      <option value="">None</option>
      {Object.keys(skills).map((skillName) => {
        const displayName = camelCaseToDisplayName(skillName);
        return <option key={skillName} value={skillName}>{displayName}</option>
      })}
    </select>
  )
}

export default App
