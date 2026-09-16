/* ---------------------------------------------------------------------
   PART 10: AI BRAIN BRIDGE (UNIVERSAL AGENT INTERFACE)
   --------------------------------------------------------------------- */
window.__aiBridge = {
  listVillagers: () => VILLAGERS.map(v => v.name),
  getPerception: (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    if(!v) return null;
    const b = ensureBody(v);
    return {
      name: v.name,
      role: v.role,
      worldTime: W.tod.toFixed(2),
      season: W.season,
      weather: { temp: W.temp.toFixed(1), rain: W.rain.toFixed(2), storm: W.storm.toFixed(2) },
      biometrics: {
        satiety: +b.satiety.toFixed(2),
        hydration: +b.hydration.toFixed(2),
        energy: +(1 - b.fatigue).toFixed(2),
        coreTemp: +b.coreTemp.toFixed(1),
        mood: +v.mood.toFixed(2)
      },
      sensations: bodyDrives(v).map(d => d.text),
      equippedTool: v.equippedTool.name,
      location: { x: Math.round(v.x), y: Math.round(v.y), inBuilding: v.inBuilding }
    };
  },
  postAction: (name, action) => {
    const v = VILLAGERS.find(p => p.name === name);
    if(!v) return false;
    if(action.kind === 'drink'){
      v.body.hydration = 1.0;
      showToast(`💧 [AI Brain] ${v.name} drank water`);
    } else if(action.kind === 'eat'){
      v.body.satiety = 1.0;
      showToast(`🍞 [AI Brain] ${v.name} ate a nourishing meal`);
    } else if(action.kind === 'work'){
      v.state = 'work';
    } else if(action.kind === 'sleep'){
      v.state = 'sleep';
    }
    return true;
  }
};
