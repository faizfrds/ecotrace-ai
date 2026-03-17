import { LEAFTRAIL_CONSTANTS as ImportedConstants } from "@faizfrds/leaftrail";

export const LEAFTRAIL_CONSTANTS = ImportedConstants;

export interface EnvironmentalTrace {
  tokens: number;
  region: string;
  carbonKg: number;
  waterLiters: number;
  energyKWh: number;
  timestamp: number;
  prompt: string;
}