// seed.js — rutina por defecto + historial real precargado desde el chat.
// Se carga SOLO la primera vez (si no hay datos en el dispositivo).

const DEFAULT_ROUTINE = {
  "Upper A": {
    icon: "💪",
    subtitle: "empuje + bíceps",
    exercises: [
      "Pecho máquina (placas, sentado)",
      "Peck deck",
      "Press militar mancuernas",
      "Extensión tríceps cable",
      "Curl inclinado mancuerna"
    ]
  },
  "Lower A": {
    icon: "🦵",
    subtitle: "cuádriceps",
    exercises: [
      "Prensa inclinada",
      "Sentadilla en Smith",
      "Extensión de cuádriceps",
      "Curl femoral acostado",
      "Elevación pantorrillas de pie"
    ]
  },
  "Upper B": {
    icon: "💪",
    subtitle: "jalón + tríceps",
    exercises: [
      "Press inclinado máquina/mancuernas",
      "Jalón al pecho",
      "Remo (Smith/barra)",
      "Elevaciones laterales cable",
      "Face pull",
      "Skull crusher",
      "Curl martillo"
    ]
  },
  "Lower B": {
    icon: "🦵",
    subtitle: "posterior",
    exercises: [
      "Peso muerto rumano mancuernas",
      "Curl femoral sentado",
      "Zancadas con mancuernas",
      "Extensión de cuádriceps",
      "Elevación pantorrillas sentado"
    ]
  }
};

// helper corto para armar sets
function S(list) {
  // list = [[weight, reps, rir, note?], ...]
  return list.map(x => ({ weight: x[0], reps: x[1], rir: x[2], note: x[3] || "" }));
}

const SEED_HISTORY = [
  // ---------- UPPER A ----------
  {
    id: "seed-ua-1", day: "Upper A", dateISO: "2026-07-20",
    sessionNote: "Día 1. Pecho sin placas: máquina similar sentado, discos.",
    exercises: [
      { name: "Pecho máquina (placas, sentado)", equipmentNote: "25 kg/lado", sets: S([["25/lado","8","—"],["25/lado","12","1"],["25/lado","10","1"],["25/lado","9","1"]]) },
      { name: "Peck deck", equipmentNote: "reemplazó al cable fly", sets: S([["45","7","0"],["40","9","0"],["40","8","0","+estiramiento"]]) },
      { name: "Press militar mancuernas", sets: S([["15","11","1"],["15","10","0"],["15","8","0"]]) },
      { name: "Extensión tríceps cable", equipmentNote: "el nº de la torre no son kg reales", sets: S([["55","7","0"],["50","5","0"],["45","7","0"]]) },
      { name: "Curl inclinado mancuerna", sets: S([["7.5","8","1"],["7.5","8","1"],["7.5","8","0"]]) }
    ]
  },
  {
    id: "seed-ua-2", day: "Upper A", dateISO: "2026-07-27",
    sessionNote: "Bancos ocupados: el curl fue bayesian en polea (sonaba el hombro).",
    exercises: [
      { name: "Pecho máquina (placas, sentado)", equipmentNote: "25 kg/lado", sets: S([["25/lado","13","1"],["25/lado","12","1"],["25/lado","12","1"],["25/lado","12","0","más hombro/brazos"]]) },
      { name: "Peck deck", sets: S([["40","10","1"],["40","9","0"],["40","10","0"]]) },
      { name: "Press militar mancuernas", sets: S([["15","13","1"],["15","12","1"],["15","12","0"]]) },
      { name: "Extensión tríceps cable", sets: S([["45","9","1"],["45","8","2"],["45","8","0"]]) },
      { name: "Curl bayesian en polea", equipmentNote: "⚠️ sonaba el hombro por dentro", sets: S([["10","12/brazo","4"],["15","8/brazo","0"],["15","9 der / 8.5 izq","0"]]) }
    ]
  },
  {
    id: "seed-ua-3", day: "Upper A", dateISO: "2026-08-05",
    sessionNote: "",
    exercises: [
      { name: "Pecho máquina (placas, sentado)", equipmentNote: "27.5 kg/lado", sets: S([["27.5/lado","12","1-2"],["27.5/lado","12","1"],["27.5/lado","12","1"],["27.5/lado","12","0"]]) },
      { name: "Peck deck", sets: S([["40","12","1-2"],["40","12","2","harta musculatura interna del hombro"],["40","12","0"]]) },
      { name: "Press militar mancuernas", sets: S([["17.5","12","1"],["17.5","11.5","fallo"],["17.5","8","fallo"]]) },
      { name: "Extensión tríceps cable", sets: S([["45","10","2-3"],["45","12","1"],["45","11","0"]]) },
      { name: "Curl inclinado mancuerna", sets: S([["7.5","12","1-2"],["7.5","12","1"],["7.5","12","0"]]) }
    ]
  },
  {
    id: "seed-ua-4", day: "Upper A", dateISO: "2026-08-12",
    sessionNote: "En press militar cambié a tempo lento a mitad (mezcla variables).",
    exercises: [
      { name: "Pecho máquina (placas, sentado)", equipmentNote: "27.5 kg/lado — quedó corto", sets: S([["27.5/lado","15","2-3"],["27.5/lado","15","2-3"],["27.5/lado","15","2-3"],["27.5/lado","18","1-2"]]) },
      { name: "Peck deck", sets: S([["40","13","2-3"],["40","13","2"],["40","16","0"]]) },
      { name: "Press militar mancuernas", sets: S([["17.5","12","0"],["17.5","8","0","tempo lento"],["17.5","6","fallo"]]) },
      { name: "Extensión tríceps cable", sets: S([["45","13","1"],["45","13","0"],["45","9","fallo"]]) },
      { name: "Curl inclinado mancuerna", equipmentNote: "no había 8 kg", sets: S([["10","8","0"],["10","7.5","fallo"],["10","7","0"]]) }
    ]
  },
  // ---------- UPPER B ----------
  {
    id: "seed-ub-1", day: "Upper B", dateISO: "2026-07-30",
    sessionNote: "Primera Upper B: sesión de calibración.",
    exercises: [
      { name: "Press inclinado máquina/mancuernas", equipmentNote: "máquina inclinada, kg/lado", sets: S([["20/lado","12","2"],["25/lado","9","1"],["25/lado","9","1"],["25/lado","7","0"]]) },
      { name: "Jalón al pecho", sets: S([["44","8","1"],["44","8","0"],["44","7","fallo"],["44","6","fallo"]]) },
      { name: "Remo (Smith/barra)", equipmentNote: "Smith, +barra sin contar", sets: S([["15/lado","8","2"],["15/lado","10","1"],["15/lado","8","0"],["15/lado","7","fallo"]]) },
      { name: "Elevaciones laterales cable", sets: S([["8","11","1"],["8","8","1"],["8","7 der / 6 izq","fallo"]]) },
      { name: "Face pull", equipmentNote: "piramidal", sets: S([["28","15","3-4"],["32","15","2-3"],["36","15","1-2"]]) },
      { name: "Skull crusher", sets: S([["15","15","2"],["15","12","1"],["15","8","0"]]) },
      { name: "Curl martillo", sets: S([["7.5","16 (8+8)","3+"],["7.5","20 (10+10)","4"],["7.5","22 (11+11)","3"]]) }
    ]
  },
  {
    id: "seed-ub-2", day: "Upper B", dateISO: "2026-08-07",
    sessionNote: "Varias máquinas ocupadas → usé alternativas (anotadas).",
    exercises: [
      { name: "Press inclinado máquina/mancuernas", equipmentNote: "25 kg/lado", sets: S([["25/lado","10","1"],["25/lado","10","0"],["25/lado","9","0"],["25/lado","8.5","fallo"]]) },
      { name: "Jalón al pecho", equipmentNote: "otra máquina (45)", sets: S([["45","12","1"],["45","9","1"],["45","9","0"],["45","9.5","fallo"]]) },
      { name: "Remo (Smith/barra)", equipmentNote: "barra libre (Smith ocupada)", sets: S([["40","10","0"],["40","10","0"],["40","9","0"],["40","8.5","0"]]) },
      { name: "Elevaciones laterales cable", equipmentNote: "otra máquina", sets: S([["10","10","1"],["10","9","0"],["10","9.5","fallo"]]) },
      { name: "Face pull", sets: S([["35","17","2-3"],["35","15","2"],["35","15","2"]]) },
      { name: "Skull crusher", sets: S([["15","15","1"],["15","14","0"],["15","13","0"]]) },
      { name: "Curl martillo", equipmentNote: "10 kg", sets: S([["10","11/brazo","1-2"],["10","11/brazo","1"],["10","10/brazo","1"]]) }
    ]
  },
  {
    id: "seed-ub-3", day: "Upper B", dateISO: "2026-08-14",
    sessionNote: "Corregí postura en jalón (dejé de inclinarme atrás).",
    exercises: [
      { name: "Press inclinado máquina/mancuernas", equipmentNote: "25 kg/lado", sets: S([["25/lado","12","2"],["25/lado","12","1.5"],["25/lado","12","1"],["25/lado","11","0","antebrazo/agarre cedió"]]) },
      { name: "Jalón al pecho", equipmentNote: "máquina de 45", sets: S([["45","12","1","harto bíceps"],["45","10","1"],["45","11","1"],["45","10","1"]]) },
      { name: "Remo (Smith/barra)", equipmentNote: "Smith 15/lado", sets: S([["15/lado","10","1"],["15/lado","10","1"],["15/lado","10","0"],["15/lado","9","0"]]) },
      { name: "Elevaciones laterales cable", sets: S([["10","10/brazo","1"],["10","10 der / 9 izq","fallo"],["10","8/brazo","fallo"]]) },
      { name: "Face pull", sets: S([["40","15","2"],["40","15","1"],["40","16","0"]]) },
      { name: "Skull crusher", equipmentNote: "barra Z + 5 kg/lado (no estaba la de 15)", sets: S([["5/lado","15","1"],["5/lado","15","0"],["5/lado","12","fallo"]]) },
      { name: "Curl martillo", equipmentNote: "10 kg", sets: S([["10","12/brazo","2"],["10","12/brazo","1-2"],["10","12/brazo","1-2"]]) }
    ]
  }
];
