export enum AttackType {
    slash,
    stab,
    ranged
}

export enum WeaponSkill {
    none,
    daggers,
    standardSwords,
    cuttingSwords,
    thrustingSwords,
    twoHandedSwords,
    flails,
    maces,
    oneHandedAxes,
    staffs,
    greatSwords,
    poleaxes,
    glaives,
    pikes,
    spears,
    pistols,
    longGunsAndCrossbows,
    bows,
}

export enum ArmorType {
    head,
    arms,
    body,
    legs,
}

export enum ArmorWeight {
    light,
    medium,
    heavy,
}

export type Attack = {
    type: AttackType,
    variance: number[],
    skill?: WeaponSkill,
    blunt?: boolean,
    ap?: boolean,
    strMultiplier?: number,
    ranges?: number[],
}

export type Weapon = {
    name: string,
    skill: WeaponSkill,
    attacks: Attack[],
    durability?: number,
    strikes?: number,
    reach?: number,
    weight?: number,
    lengthy?: boolean,
    ambushWeapon?: boolean,
    hook?: boolean,
}

export type Armor = {
    name: string,
    type: ArmorType,
    weight: ArmorWeight,
    underLayer?: boolean,
    slashResist?: number,
    stabResist?: number,
    magicResist?: number,
}