import { Character } from './Character';
import { createGlobalState } from './hooks/GlobalState';

export const CharacterInstance = createGlobalState(
    new Character()
);