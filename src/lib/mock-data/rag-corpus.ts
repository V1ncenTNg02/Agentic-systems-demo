export interface MedicineEntry {
  id: string;
  name: string;
  treats: string[];
  sideEffects: string;
  efficacy: string;
  dosage: string;
  gpFlag: boolean;
}

export const MEDICINE_CORPUS: MedicineEntry[] = [
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    treats: ['headache', 'fever', 'pain', 'cold', 'flu', 'sore throat', 'temperature', 'aches'],
    sideEffects: 'Rarely causes side effects at normal doses. Overdose can cause serious liver damage.',
    efficacy: 'Highly effective for mild to moderate pain and fever reduction. Works within 30-60 minutes.',
    dosage: '500mg–1000mg every 4–6 hours. Max 4000mg per day. Do not exceed 8 tablets (500mg) in 24 hours.',
    gpFlag: false,
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    treats: ['headache', 'fever', 'inflammation', 'muscle pain', 'period pain', 'toothache', 'back pain', 'arthritis', 'swelling'],
    sideEffects: 'Can cause stomach upset, nausea, or heartburn. Avoid on an empty stomach. Not suitable for people with kidney problems.',
    efficacy: 'Effective anti-inflammatory. Better than paracetamol for conditions with inflammation.',
    dosage: '200–400mg every 4–6 hours with food. Max 1200mg per day for self-treatment.',
    gpFlag: false,
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    treats: ['headache', 'fever', 'pain', 'cold', 'muscle aches'],
    sideEffects: 'Can irritate the stomach lining. Do not give to children under 16. Increases bleeding risk.',
    efficacy: 'Effective for pain and fever. Also has blood-thinning properties used in heart disease prevention.',
    dosage: '300–600mg every 4 hours. Max 3600mg per day. Always take with food.',
    gpFlag: false,
  },
  {
    id: 'loratadine',
    name: 'Loratadine',
    treats: ['hay fever', 'allergies', 'runny nose', 'sneezing', 'itchy eyes', 'hives', 'allergic rhinitis', 'watery eyes'],
    sideEffects: 'Non-drowsy formula. Rarely causes drowsiness, headache, or dry mouth.',
    efficacy: 'Effective 24-hour allergy relief. Non-sedating antihistamine.',
    dosage: '10mg once daily. One tablet per day is usually sufficient.',
    gpFlag: false,
  },
  {
    id: 'cetirizine',
    name: 'Cetirizine',
    treats: ['allergies', 'hay fever', 'itching', 'hives', 'urticaria', 'allergic rhinitis', 'sneezing', 'runny nose'],
    sideEffects: 'May cause drowsiness in some people. Avoid driving if affected. Also dry mouth.',
    efficacy: 'Fast-acting antihistamine. Effective within 1 hour, lasting 24 hours.',
    dosage: '10mg once daily, preferably in the evening due to possible drowsiness.',
    gpFlag: false,
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole',
    treats: ['heartburn', 'acid reflux', 'indigestion', 'stomach ulcer', 'GERD', 'burning chest', 'acid regurgitation'],
    sideEffects: 'Generally well tolerated. Long-term use may affect magnesium levels and increase infection risk.',
    efficacy: 'Proton pump inhibitor. Very effective at reducing stomach acid production.',
    dosage: '20mg once daily before a meal. Can take up to 4 weeks for full effect.',
    gpFlag: false,
  },
  {
    id: 'pseudoephedrine',
    name: 'Pseudoephedrine',
    treats: ['nasal congestion', 'blocked nose', 'sinusitis', 'sinus pressure', 'stuffy nose', 'cold', 'flu'],
    sideEffects: 'Can raise blood pressure and heart rate. May cause insomnia, anxiety, or restlessness.',
    efficacy: 'Effective decongestant. Reduces nasal swelling within 30 minutes.',
    dosage: '60mg every 4–6 hours. Max 240mg per day. Do not use for more than 7 days.',
    gpFlag: false,
  },
  {
    id: 'loperamide',
    name: 'Loperamide',
    treats: ['diarrhoea', 'loose stools', 'stomach upset', 'travellers diarrhoea', 'IBS diarrhoea'],
    sideEffects: 'Can cause constipation, bloating, or abdominal cramps.',
    efficacy: 'Fast-acting anti-diarrhoeal. Slows gut movement to reduce stool frequency.',
    dosage: '4mg initially, then 2mg after each loose stool. Max 16mg per day. Do not use more than 2 days without GP advice.',
    gpFlag: false,
  },
  {
    id: 'dextromethorphan',
    name: 'Dextromethorphan',
    treats: ['dry cough', 'tickly cough', 'persistent cough', 'cough'],
    sideEffects: 'May cause dizziness, drowsiness, or nausea at high doses.',
    efficacy: 'Suppresses the cough reflex in the brain. Effective for dry, unproductive coughs.',
    dosage: '15–30mg every 4–8 hours. Max 120mg per day.',
    gpFlag: false,
  },
  {
    id: 'guaifenesin',
    name: 'Guaifenesin',
    treats: ['chest congestion', 'productive cough', 'phlegm', 'mucus', 'wet cough', 'chesty cough'],
    sideEffects: 'May cause nausea or vomiting. Drink plenty of water to help loosen mucus.',
    efficacy: 'Expectorant that thins mucus making it easier to cough up.',
    dosage: '200–400mg every 4 hours. Max 2400mg per day. Drink extra fluids.',
    gpFlag: false,
  },
  {
    id: 'hydrocortisone-cream',
    name: 'Hydrocortisone Cream (1%)',
    treats: ['skin rash', 'eczema', 'itching', 'dermatitis', 'insect bites', 'mild allergic skin reaction'],
    sideEffects: 'Thinning of skin with prolonged use. Do not apply to face or broken skin without GP advice.',
    efficacy: 'Mild topical corticosteroid. Reduces inflammation, redness, and itching effectively.',
    dosage: 'Apply thinly to affected area 1–2 times daily. Do not use for more than 7 days on the face or 1 month elsewhere.',
    gpFlag: false,
  },
  {
    id: 'clotrimazole',
    name: 'Clotrimazole',
    treats: ['thrush', 'vaginal thrush', 'fungal infection', 'athletes foot', 'ringworm', 'jock itch'],
    sideEffects: 'May cause mild burning or irritation on application. Rarely causes allergic reactions.',
    efficacy: 'Antifungal that kills fungi and yeasts. Highly effective for localised infections.',
    dosage: 'Apply cream 2–3 times daily. Continue for 2–4 weeks after symptoms clear.',
    gpFlag: false,
  },
  {
    id: 'melatonin',
    name: 'Melatonin',
    treats: ['insomnia', 'sleep problems', 'jet lag', 'difficulty sleeping', 'sleep disorder', 'cant sleep'],
    sideEffects: 'May cause drowsiness, dizziness, or headaches. Only take at bedtime.',
    efficacy: 'Helps regulate sleep-wake cycle. Most effective for jet lag and delayed sleep phase.',
    dosage: '1–3mg taken 30–60 minutes before bedtime. Start with the lowest dose.',
    gpFlag: false,
  },
  {
    id: 'chest-pain-gp',
    name: 'Chest Pain — See GP',
    treats: ['chest pain', 'chest tightness', 'chest pressure', 'heart pain', 'left arm pain with chest'],
    sideEffects: 'N/A — this is a GP escalation entry.',
    efficacy: 'N/A — chest pain requires professional assessment.',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'breathing-difficulty-gp',
    name: 'Breathing Difficulty — See GP',
    treats: ['difficulty breathing', 'shortness of breath', 'cant breathe', 'breathless', 'wheezing', 'tight chest'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'high-fever-gp',
    name: 'High Fever — See GP',
    treats: ['high fever', 'temperature above 39', 'fever in child', 'fever with rash', 'febrile convulsion', 'fever wont go down'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'severe-abdominal-gp',
    name: 'Severe Abdominal Pain — See GP',
    treats: ['severe stomach pain', 'severe abdominal pain', 'appendix', 'sudden stomach pain', 'abdominal cramps severe'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'blood-gp',
    name: 'Blood in Stool/Urine — See GP',
    treats: ['blood in stool', 'rectal bleeding', 'blood in urine', 'coughing blood', 'bleeding'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
];

export function retrieveMedicines(query: string, topK = 3): MedicineEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const scored = MEDICINE_CORPUS.map(entry => {
    let score = 0;
    const nameLower = entry.name.toLowerCase();
    for (const token of tokens) {
      if (nameLower.includes(token)) score += 3;
      if (entry.treats.some(t => t.includes(token))) score += 1;
    }
    return { entry, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.entry);
}

export function detectMode(query: string): 'medicine' | 'symptom' {
  const medicineModeKeywords = ['what is', 'side effect', 'dosage', 'how many', 'efficacy', 'how does', 'what does', 'dose', 'pills', 'tablets', 'milligram', 'mg'];
  const lower = query.toLowerCase();
  return medicineModeKeywords.some(k => lower.includes(k)) ? 'medicine' : 'symptom';
}
