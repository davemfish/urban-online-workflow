import React, { useState, useEffect } from 'react';

import {
  Button,
  FocusStyleManager,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Label,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import {
  doWallpaper,
  makeScenario,
  getLulcTableForParcel,
  getWallpaperResults,
  getStatus,
  getPatterns,
  createPattern,
  convertToSingleLULC,
} from './requests';
import useInterval from './hooks/useInterval';
import ScenarioTable from './scenarioTable';
import ParcelTable from './parcelTable';
import lulcCodes from './lulcCodes';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    parcel,
    savedScenarios,
    refreshSavedScenarios,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [patterns, setPatterns] = useState([]);
  const [parcelTable, setParcelTable] = useState(null);
  const [jobID, setJobID] = useState(null);
  const [newPatternName, setNewPatternName] = useState("New Pattern 1");
  const [singleLULC, setSingleLULC] = useState('');
  const [conversionOption, setConversionOption] = useState('paint');

  // On first render, get the list of available patterns
  useEffect(async () => {
    setPatterns(await getPatterns());
  }, []);

  useEffect(async () => {
    if (parcel) {
      const table = await getLulcTableForParcel(parcel.coords);
      setParcelTable(table);
    }
  }, [parcel]);

  useInterval(async () => {
    console.log('checking status for', jobID);
    const status = await getStatus(jobID);
    if (status === 'complete') {
      const results = await getWallpaperResults(jobID);
      setParcelTable(results);
      console.log(results)
      setJobID(null);
      refreshSavedScenarios();
    }
  }, jobID ? 1000 : null);

  async function handleSubmitNew(event) {
    event.preventDefault();
    if (!scenarioName) {
      alert('no scenario was selected');
      return;
    }
    if (!parcel) {
      alert('no parcel was selected; no changes to make');
      return;
    }
    let currentScenarioID = scenarioID;
    if (!Object.values(savedScenarios).includes(scenarioName)) {
      currentScenarioID = await makeScenario(scenarioName, 'description');
      setScenarioID(currentScenarioID);
    }
    let jid;
    if (conversionOption === 'wallpaper' && selectedPattern) {
      jid = await doWallpaper(parcel.coords, selectedPattern, currentScenarioID);
    }
    if (conversionOption === 'paint' && singleLULC) {
      jid = await convertToSingleLULC(parcel.coords, singleLULC, currentScenarioID);
    }
    setJobID(jid);
  }

  // TODO: do handlers  need to be wrapped in useCallback? 
  // to memoize the function?
  const handleSelectLULC = (event) => {
    setSingleLULC(event.target.value);
  };

  const handleConversionOption = (event) => {
    setConversionOption(event.target.value);
  };

  const handleTabChange = (tabID) => {
    setActiveTab(tabID);
  };

  const handleSamplePattern = async (event) => {
    event.preventDefault();
    await createPattern(patternSampleWKT, newPatternName);
    setPatterns(await getPatterns());
    setSelectedPattern(newPatternName);
    togglePatternSamplingMode();
  };

  const patternSampleForm = (
    <>
      <p>1. Drag the box over the map to sample a pattern</p>
      <p>2. Name the new pattern:</p>
      <FormGroup>
        <InputGroup
          id="text-input"
          placeholder="Placeholder text"
          value={newPatternName}
          onChange={(event) => setNewPatternName(event.target.value)}
        />
      </FormGroup>
      <Button
        icon="camera"
        text="Sample this pattern"
        onClick={handleSamplePattern}
      />
    </>
  );

  const wallpaperingSelect = (
    <>
      <div className="edit-wallpaper">
        <Label htmlFor="pattern-select">
          Choose an existing pattern:
        </Label>
        <HTMLSelect
          id="pattern-select"
          onChange={setSelectedPattern}
          disabled={patternSamplingMode}
          value={selectedPattern}
        >
          {patterns.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}
        </HTMLSelect>
      </div>
      <Switch
        checked={patternSamplingMode}
        labelElement={<strong>Create new pattern</strong>}
        onChange={togglePatternSamplingMode}
      />
      {patternSamplingMode ? patternSampleForm : <div />}
    </>
  );

  return (
    <div className="menu-container">
      <Tabs id="Tabs" onChange={handleTabChange} selectedTabId={activeTab}>
        <Tab
          id="create"
          title="Create"
          panel={(
            <div>
              <ParcelTable parcelTable={parcelTable} />
              <br />
              {
                (parcel)
                  ? (
                    <form onSubmit={handleSubmitNew}>
                      <RadioGroup
                        className="sidebar-subheading"
                        inline
                        label="Modify the landuse of this parcel by:"
                        onChange={handleConversionOption}
                        selectedValue={conversionOption}
                      >
                        <Radio key="wallpaper" value="wallpaper" label="wallpaper" />
                        <Radio key="paint" value="paint" label="paint" />
                      </RadioGroup>
                      <div className="conversion-panel">
                        {
                          (conversionOption === 'paint')
                            ? (
                              <HTMLSelect onChange={handleSelectLULC}>
                                {Object.entries(lulcCodes)
                                  .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </HTMLSelect>
                            )
                            : wallpaperingSelect
                        }
                      </div>
                      <p className="sidebar-subheading">
                        Add this modification to a scenario
                      </p>
                      <datalist id="scenariolist">
                        {Object.values(savedScenarios)
                          .map(item => <option key={item} value={item} />)}
                      </datalist>
                      <input
                        type="search"
                        id="scenarioName"
                        list="scenariolist"
                        value={scenarioName}
                        onChange={(event) => setScenarioName(event.currentTarget.value)}
                      />
                      <button type="submit">Submit</button>
                    </form>
                  )
                  : <div />
              }
            </div>
          )}
        />
        {/*<Tab
          id="explore"
          title="Explore"
          panel={
            <ScenarioTable
              scenarios={savedScenarios}
            />
          }
        />*/}
      </Tabs>
    </div>
  );
}
