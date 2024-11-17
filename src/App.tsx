import { useState, useEffect, useCallback } from 'react'
import { useGlobalState } from './hooks/GlobalState';
import { CharacterInstance } from './CharacterInstance';
import './App.css'
import {
  Species,
  StatTypes,
  StatKeys
} from './Enums';

const pascalCaseToDisplayName = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
};

enum Tab {
  Overview,
  Stats,
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

const NumberInput = ({ value, onChange, ...props }: {
  value: number,
  onChange: (value: number) => void,
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void,
  [key: string]: unknown
}) => {
  const [tempValue, setTempValue] = useState<string>(value.toString());

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parsedValue = parseInt(tempValue, 10);
    if (!isNaN(parsedValue)) {
      onChange(parsedValue); // Update the real value if it's valid
    } else {
      setTempValue(value.toString()); // Reset to the last valid value
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (/^-?\d*$/.test(inputValue)) { // Allow only integer-like input
      setTempValue(inputValue);
    }
  };

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  return (
    <input
      type="number"
      value={tempValue}
      style={{
        width: '50px'
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
        if (props.onKeyDown) { props.onKeyDown(e); }
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  )
}

const App = () => {
  const [character] = useGlobalState(CharacterInstance);

  const [activeTab, setActiveTab] = useState(Tab.Overview);

  const [name, setName] = useState<string>(character.name);
  const [species, setSpecies] = useState<Species>(character.species);
  const [age, setAge] = useState<number>(character.age);

  const [stats, setStats] = useState(character.stats);

  const onCharacterPropertyChange = useCallback(() => {
    setName(character.name);
    setSpecies(character.species);
    setAge(character.age);
    setStats({...character.stats});
  }, [character]);

  useEffect(() => {
    character.onValueChangedCallbacks.push(onCharacterPropertyChange);
    return () => {
      character.onValueChangedCallbacks = character.onValueChangedCallbacks.filter(cb => cb !== onCharacterPropertyChange);
    };
  }, [character, onCharacterPropertyChange]);

  return (
    <>
      <div style={{paddingBottom: '10px'}}>
        <label htmlFor="nameInput">Name: </label>
        <input type="text" id="nameInput" name="nameInput"
          placeholder="Enter name"
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
          label={pascalCaseToDisplayName(Tab[Tab.Stats])}
          onClick={() => setActiveTab(Tab.Stats)}
          activeTab={activeTab === Tab.Stats}
        />
        <TabButton
          label={pascalCaseToDisplayName(Tab[Tab.Inventory])}
          onClick={() => setActiveTab(Tab.Inventory)}
          activeTab={activeTab === Tab.Inventory}
        />
        <div style={{float: 'right'}}>
          <button
            onClick={() => {
              character.testFunction();
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
          <label>Age: </label>
          <NumberInput
            value={age}
            onChange={(value) => {
              character.age = value;
              setAge(value);
            }}
          />
        </div>}
        {activeTab === Tab.Stats && <div>
          <table>
            <thead>
              <tr>
                <th></th>
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
              {Object.entries(stats).map(([stat, values]) => (
                <tr key={stat}>
                  <td>{stat.toUpperCase()}</td>
                  {Object.entries(values).map(([key, value]) => (
                    <td key={key}>
                      <NumberInput
                        value={value}
                        onChange={(newValue) => {
                          character.setStat(stat as StatTypes, key as StatKeys, newValue);
                          setStats({...character.stats});
                        }}
                      />
                    </td>
                  ))}
                  <td
                    style={{textAlign: 'right'}}
                  >
                    {character.getStatTotal(stat as StatTypes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
        {activeTab === Tab.Inventory && <div>Inventory</div>}
      </div>
    </>
  )
}

export default App
