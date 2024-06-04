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

const weaponSkills = {
  none: 0,
  daggers: 1,
  standardSwords: 2,
  cuttingSwords: 3,
  thrustingSwords: 4,
  twoHandedSwords: 5,
  flails: 6,
  maces: 7,
  oneHandedAxes: 8,
  polearms: 9,
  spears: 10,
  bows: 11,
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
  skill: number,
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
    highestModifier = Math.max(highestModifier, skillModifiers[parent].value);
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
  const [equippedWeapon, setEquippedWeapon] = useState(defaultWeapon);

  const [weaponDialogOpen, setWeaponDialogOpen] = useState(false);

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
            <WeaponAttackTable equippedWeapon={equippedWeapon} setEquippedWeapon={setEquippedWeapon}/>
            <button onClick={() => setWeaponDialogOpen(true)}>+</button>
            <AddWeaponAttackDialog open={weaponDialogOpen} setOpen={setWeaponDialogOpen} setWeapon={setEquippedWeapon} />
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
  weaponSkills: { [key: string]: number }
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
    <div style={{display: open ? "block" : "none", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "10px", border: "1px solid black"}}>
      <div>
        <label>Attack Type: </label>
        <select value={attackType} onChange={(e) => setAttackType(parseInt(e.target.value))}>
          {Object.keys(attackTypes).map((key) => (
            <option key={key} value={attackTypes[key]}>{pascalCaseToDisplayName(key)}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Variance: </label>
        <input type="text" value={variance} onChange={(e) => setVariance(e.target.value)} />
      </div>
      <div>
        <label>Blunt: </label>
        <input type="checkbox" checked={blunt} onChange={(e) => setBlunt(e.target.checked)} />
      </div>
      <div>
        <label>AP: </label>
        <input type="checkbox" checked={ap} onChange={(e) => setAP(e.target.checked)} />
      </div>
      <div>
        <label>STR Add: </label>
        <input type="number" value={strAdd} onChange={(e) => setStrAdd(parseInt(e.target.value))} />
      </div>
      <div>
        <label>Ranges: </label>
        <input type="text" value={ranges} onChange={(e) => setRanges(e.target.value)} />
      </div>
      <button onClick={handleAddAttack}>Add</button>
      <button onClick={() => setOpen(false)}>Cancel</button>
    </div>
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

export default App
