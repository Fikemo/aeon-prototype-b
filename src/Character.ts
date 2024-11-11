export enum Species {
    Human = 'Human',
    Elf = 'Elf',
    Dwarf = 'Dwarf',
    Orc = 'Orc',
}

type CharacterJSON = {
    name: string,
    species: Species,
    age: number,
}

const defaultCharacter: CharacterJSON = {
    name: '',
    species: Species.Human,
    age: 20,
}

export class Character {
    #name: string = defaultCharacter.name;
    #species: Species = defaultCharacter.species;
    #age: number = defaultCharacter.age;

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

    onValueChanged() {
        window.localStorage.setItem('character', JSON.stringify(this.toJSON()));
    }

    toJSON(): CharacterJSON {
        return {
            name: this.#name,
            species: this.#species,
            age: this.#age,
        }
    }

    fromJSON(json: CharacterJSON) {
        // Combine the saved JSON with the default values to ensure all fields are present
        const fullJSON = {
            ...defaultCharacter,
            ...json,
        }
        this.#name = fullJSON.name;
        this.#species = fullJSON.species;
        this.#age = fullJSON.age;
    }
}