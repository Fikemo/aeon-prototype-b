import { useState, useEffect, useCallback } from 'react'
import { useGlobalState } from './hooks/GlobalState';
import { CharacterInstance } from './CharacterInstance';
import './App.css'
import { Species } from './Character';

const pascalCaseToDisplayName = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

enum Tab {
  Overview,
  Skills,
  Inventory
}

const TabButton = ({ label, onClick, activeTab } : {
  label: string,
  onClick: () => void,
  activeTab: boolean
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        fontWeight: activeTab ? 'bold' : 'normal',
        margin: '0 5px'
      }}
    >
      {label}
    </button>
  )
}

const App = () => {
  const [character] = useGlobalState(CharacterInstance);

  const [activeTab, setActiveTab] = useState(Tab.Overview);

  const [name, setName] = useState<string>(character.name);
  const [species, setSpecies] = useState<Species>(character.species);
  const [age, setAge] = useState<number>(character.age);

  return (
    <>
      <div style={{paddingBottom: '10px'}}>
        <label htmlFor="nameInput">Name: </label>
        <input type="text" id="nameInput" name="nameInput"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          onBlur={(e) => {
            character.name = (e.target as HTMLInputElement).value;
          }}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
          value={name}
        />
        <TabButton
          label={pascalCaseToDisplayName(Tab[Tab.Overview])}
          onClick={() => setActiveTab(Tab.Overview)}
          activeTab={activeTab === Tab.Overview}
        />
        <TabButton
          label={pascalCaseToDisplayName(Tab[Tab.Skills])}
          onClick={() => setActiveTab(Tab.Skills)}
          activeTab={activeTab === Tab.Skills}
        />
        <TabButton
          label={pascalCaseToDisplayName(Tab[Tab.Inventory])}
          onClick={() => setActiveTab(Tab.Inventory)}
          activeTab={activeTab === Tab.Inventory}
        />
        <div style={{float: 'right'}}>
          <button
            onClick={() => {
              console.log(character);
              console.log(character.toJSON());
            }}
          >
            Test
          </button>
          <button
            onClick={() => {
              window.localStorage.removeItem('character');
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div>
        {activeTab === Tab.Overview && <div>
          <label htmlFor="speciesSelect">Species: </label>
          <select
            id="speciesSelect"
            value={species}
            onChange={(e) => {
              character.species = e.target.value as Species;
              setSpecies(e.target.value as Species);
            }}
          >
            {Object.values(Species).map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
          <br />
          <label htmlFor="ageInput">Age: </label>
          <input
            type="number"
            id="ageInput"
            name="ageInput"
            defaultValue={age}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            onBlur={(e) => {
              const newAge = parseInt((e.target as HTMLInputElement).value);
              if (!isNaN(newAge)) {
                character.age = newAge;
                setAge(newAge);
              } else {
                e.target.value = age.toString();
              }
            }}
          />
        </div>}
        {activeTab === Tab.Skills && <div>Skills</div>}
        {activeTab === Tab.Inventory && <div>Inventory</div>}
      </div>
    </>
  )
}

export default App
