import { EnvironmentalTrace } from "./services/ecoTraceService";

export interface DashboardStats {
  totalTokens: number;
  totalElectricity: number;
  totalCarbon: number;
  totalWater: number;
  traceCount: number;
}

export const calculateDashboardStats = (traces: EnvironmentalTrace[]): DashboardStats => {
  return traces.reduce((acc, trace) => ({
    totalTokens: acc.totalTokens + trace.tokens,
    totalElectricity: acc.totalElectricity + trace.energyKWh,
    totalCarbon: acc.totalCarbon + trace.carbonKg,
    totalWater: acc.totalWater + trace.waterLiters,
    traceCount: acc.traceCount + 1,
  }), {
    totalTokens: 0,
    totalElectricity: 0,
    totalCarbon: 0,
    totalWater: 0,
    traceCount: 0,
  });
};

export const formatNumber = (num: number, decimals = 4) => {
  if (num === 0) return "0";
  if (num < 0.0001) return num.toExponential(2);
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const integrationSnippet = (apiKey: string = 'YOUR_API_KEY') => `
// 1. Install Leaftrail
// npm install @faizfrds/leaftrail @google/genai

import { Leaftrail } from '@faizfrds/leaftrail';

const tracer = new Leaftrail({ 
  apiKey: process.env.GEMINI_API_KEY,      // Your Gemini API Key
  region: 'us-central1',                   // Desired inference region
  ecoTrace: {
    endpoint: '${import.meta.env.VITE_APP_URL || 'http://localhost:3001'}api/v1/traces',
    apiKey: '${apiKey}'                   // Your EcoTrace Project Key
  }
});

// 2. Use the tracer to generate content
const { response, trace } = await tracer.generateContent("How to be more sustainable?");

console.log(\`This call used \${trace.carbonKg}kg of CO2e in \${trace.region}\`);
`.trim();
