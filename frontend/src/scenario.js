import localforage from 'localforage';

const scenarioStore = localforage.createInstance({
  name: 'scenarios'
});

function newScenario(name) {
  return {
    name: name,
    lulcURL: '/nlcd_extract.tif',
    features: {},
  };
}

export default {
  getAllScenarios: async () => {
    const scenarios = [];
    await scenarioStore.iterate((value, key, idx) => {
      scenarios.push(value)
    });
    return scenarios;
  },

  clearStore: async () => {
    await scenarioStore.clear();
  },

  save: async (id, scene) => {
    await scenarioStore.setItem(id, scene);
  },

  new: (name) => {
    const id = window.crypto.getRandomValues(new Uint16Array(1))[0]
    return [id, newScenario(name)];
  },

  getScenario: async (id) => {
    const scenario = await scenarioStore.getItem(id);
    return scenario;
  }
};
