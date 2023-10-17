import React, { useState } from 'react';

import {
  Button,
  InputGroup,
  // HTMLSelect,
  Radio,
  RadioGroup,
  Spinner
} from '@blueprintjs/core';

import useInterval from '../hooks/useInterval';
// import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';
import WallpaperingMenu from './wallpaperingMenu';
import LulcMenu from './lulcMenu';
import {
  createScenario,
  getJobStatus,
  lulcFill,
  lulcCrop,
  lulcWallpaper,
} from '../requests';

export default function ScenarioBuilder(props) {
  const {
    activeStudyAreaID,
    parcelArray,
    sessionID,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    refreshScenarios,
    scenarioNames,
  } = props;

  const [singleLULC, setSingleLULC] = useState(null);
  const [conversionOption, setConversionOption] = useState('fill');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    // There are sometimes two jobs submitted concurrently.
    // They are in a priority queue, so for now monitor the lower priority one.
    console.log('checking status for job', jobID);
    const status = await getJobStatus(jobID);
    if (status === 'success') {
      refreshScenarios();
      setJobID(null);
    }
  }, (jobID && scenarioID) ? 1000 : null);

  const submitScenario = async (event) => {
    if (!scenarioNames.includes('baseline')) {
      const sid = await createScenario(activeStudyAreaID, 'baseline', 'crop');
      await lulcCrop(sid);
    }
    const currentScenarioID = await createScenario(
      activeStudyAreaID, scenarioName, conversionOption);
    setScenarioID(currentScenarioID);
    let jid;
    if (conversionOption === 'wallpaper' && selectedPattern) {
      jid = await lulcWallpaper(
        selectedPattern.pattern_id,
        currentScenarioID
      );
    }
    if (conversionOption === 'fill' && Number.isInteger(singleLULC)) {
      jid = await lulcFill(singleLULC, currentScenarioID);
    }
    setJobID(jid);
  };

  if (!parcelArray.length) {
    return <div />;
  }

  let scenarioDescription = '';
  if (conversionOption === 'wallpaper' && selectedPattern) {
    scenarioDescription = (
      <span>
        Create a scenario by <em>wallpapering</em> with <em>{selectedPattern.label}</em>
      </span>
    );
  }
  if (conversionOption === 'fill' && Number.isInteger(singleLULC)) {
    scenarioDescription = (
      <span>
        Create a scenario by <em>filling</em> with <em>{singleLULC}</em>
      </span>
    );
  }

  return (
    <form>
      <label className="sidebar-subheading">
        Modify the landuse in this study area:
      </label>
      <RadioGroup
        className="conversion-radio"
        inline
        onChange={(event) => setConversionOption(event.target.value)}
        selectedValue={conversionOption}
      >
        <Radio key="wallpaper" value="wallpaper" label="wallpaper" />
        <Radio key="fill" value="fill" label="fill" />
      </RadioGroup>
      <div className="panel">
        {
          (conversionOption === 'fill')
            ? (
              <LulcMenu
                setLucode={setSingleLULC}
              />
            )
            : (
              <WallpaperingMenu
                sessionID={sessionID}
                selectedPattern={selectedPattern}
                setSelectedPattern={setSelectedPattern}
                patternSamplingMode={patternSamplingMode}
                togglePatternSamplingMode={togglePatternSamplingMode}
                patternSampleWKT={patternSampleWKT}
              />
            )
        }
      </div>
      <div id="scenario-input-label" className="sidebar-subheading">
        {scenarioDescription}
        {
          (jobID)
            ? <Spinner size="20" />
            : <div />
        }
      </div>
      <InputGroup
        placeholder="name this scenario"
        value={scenarioName}
        onChange={(event) => setScenarioName(event.currentTarget.value)}
        rightElement={(
          <Button
            onClick={submitScenario}
            disabled={scenarioNames.includes(scenarioName) || !scenarioName || jobID}
          >
            Create
          </Button>
        )}
      />
    </form>
  );
}
