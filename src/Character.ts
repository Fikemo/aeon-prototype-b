import {
    Species,
    StatTypes,
    StatKeys,
} from './Enums';

interface ICharacter {
    name: string;
    species: Species;
    age: number;
    stats: {
        [key: string]: {
            base: number,
            general: number,
            melee: number,
            ranged: number,
            magic: number,
            temp: number,
        }
    }
}

const defaultCharacter: ICharacter = {
    name: '',
    species: Species.Human,
    age: 20,
    stats: {
        str: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        agi: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        int: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        pre: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        spi: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        con: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
    }
}

export class Character implements ICharacter {
    #name: string = defaultCharacter.name;
    #species: Species = defaultCharacter.species;
    #age: number = defaultCharacter.age;
    #stats: { [key: string]: {
        base: number,
        general: number,
        melee: number,
        ranged: number,
        magic: number,
        temp: number,
    }} = {
        str: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        agi: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        int: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        pre: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        spi: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
        con: { base: 0, general: 0, melee: 0, ranged: 0, magic: 0, temp: 0 },
    }

    onValueChangedCallbacks: (() => void)[] = [];

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
        this.#onValueChanged();
    }

    get species(): Species {
        return this.#species;
    }
    set species(species: Species) {
        this.#species = species;
        this.#onValueChanged();
    }

    get age(): number {
        return this.#age;
    }
    set age(age: number) {
        this.#age = age;
        this.#onValueChanged();
    }
    get stats() {
        return this.#stats;
    }

    setStat(
        stat: StatTypes,
        key: StatKeys,
        value: number,
    ) {
        if (this.#stats[stat] === undefined) {
            console.error(`Stat ${stat} does not exist`);
            return;
        }

        if (this.#stats[stat]) {
            this.#stats[stat][key] = value;
            this.#onValueChanged();
        }
    }

    getStatTotal(stat: StatTypes) {
        return this.#stats[stat].base +
        this.#stats[stat].general +
        this.#stats[stat].melee +
        this.#stats[stat].ranged +
        this.#stats[stat].magic +
        this.#stats[stat].temp;
    }

    #onValueChanged() {
        window.localStorage.setItem('character', JSON.stringify(this.toJSON()));
        this.onValueChangedCallbacks.forEach(cb => cb());
    }

    toJSON(): ICharacter {
        return {
            name: this.#name,
            species: this.#species,
            age: this.#age,
            stats: this.#stats,
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
        this.#stats = fullJSON.stats;
    }

    testFunction() {
        console.log('Test function');
        console.log(this);
    }
}