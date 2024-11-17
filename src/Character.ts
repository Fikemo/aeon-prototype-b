import {
    Species
} from './Enums';

export interface IStats {
    STR: Stat;
    AGI: Stat;
    INT: Stat;
    PRE: Stat;
    SPI: Stat;
    CON: Stat;
}

interface ICharacter {
    name: string;
    species: Species;
    age: number;
    stats: IStats;
}

export interface IStat {
    base: number;
    general: number;
    melee: number;
    ranged: number;
    magic: number;
    temp: number;
}

export class Stat implements IStat {
    #base: number = 0;
    #general: number = 0;
    #melee: number = 0;
    #ranged: number = 0;
    #magic: number = 0;
    #temp: number = 0;

    get base(): number { return this.#base; }
    set base(value: number) { this.#base = value; }

    get general(): number { return this.#general; }
    set general(value: number) { this.#general = value; }

    get melee(): number { return this.#melee; }
    set melee(value: number) { this.#melee = value; }

    get ranged(): number { return this.#ranged; }
    set ranged(value: number) { this.#ranged = value; }

    get magic(): number { return this.#magic; }
    set magic(value: number) { this.#magic = value; }

    get temp(): number { return this.#temp; }
    set temp(value: number) { this.#temp = value; }

    get total(): number {
        return this.#base + this.#general + this.#melee + this.#ranged + this.#magic + this.#temp;
    }

    toJSON(): IStat {
        return {
            base: this.#base,
            general: this.#general,
            melee: this.#melee,
            ranged: this.#ranged,
            magic: this.#magic,
            temp: this.#temp,
        }
    }

    fromJSON(json: IStat): this {
        this.#base = json.base;
        this.#general = json.general;
        this.#melee = json.melee;
        this.#ranged = json.ranged;
        this.#magic = json.magic;
        this.#temp = json.temp;

        return this;
    }
}

const defaultCharacter: ICharacter = {
    name: '',
    species: Species.Human,
    age: 20,
    stats: {
        STR: new Stat(),
        AGI: new Stat(),
        INT: new Stat(),
        PRE: new Stat(),
        SPI: new Stat(),
        CON: new Stat(),
    }
}

export class Character implements ICharacter {
    #name: string = defaultCharacter.name;
    #species: Species = defaultCharacter.species;
    #age: number = defaultCharacter.age;

    #stats: IStats = {
        STR: new Stat(),
        AGI: new Stat(),
        INT: new Stat(),
        PRE: new Stat(),
        SPI: new Stat(),
        CON: new Stat(),
    }

    constructor() {
        const savedJSON = window.localStorage.getItem('character');
        if (savedJSON) {
            this.fromJSON(JSON.parse(savedJSON));
        } else {
            this.fromJSON(defaultCharacter);
        }
    }

    get name(): string {
        return this.#name;
    }
    set name(name: string) {
        this.#name = name;
        this.onValueChanged();
    }

    get species(): Species {
        return this.#species;
    }
    set species(species: Species) {
        this.#species = species;
        this.onValueChanged();
    }

    get age(): number {
        return this.#age;
    }
    set age(age: number) {
        this.#age = age;
        this.onValueChanged();
    }

    get stats(): IStats {
        return this.#stats;
    }

    setStat(stat: keyof IStats, table: keyof IStat, value: number) {
        this.#stats[stat as keyof IStats][table as keyof IStat] = value;
        this.onValueChanged();
    }

    onValueChanged() {
        window.localStorage.setItem('character', JSON.stringify(this.toJSON()));
    }

    toJSON(): ICharacter {
        return {
            name: this.#name,
            species: this.#species,
            age: this.#age,
            stats: {
                STR: this.#stats.STR.toJSON(),
                AGI: this.#stats.AGI.toJSON(),
                INT: this.#stats.INT.toJSON(),
                PRE: this.#stats.PRE.toJSON(),
                SPI: this.#stats.SPI.toJSON(),
                CON: this.#stats.CON.toJSON(),
            }
        }
    }

    fromJSON(json: ICharacter) {
        // Combine the saved JSON with the default values to ensure all fields are present
        const fullJSON = {
            ...defaultCharacter,
            ...json,
        }
        this.#name = fullJSON.name;
        this.#species = fullJSON.species;
        this.#age = fullJSON.age;
    }

    testFunction() {
        console.log('Test function');
        console.log(this);
    }
}