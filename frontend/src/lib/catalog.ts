export type ServiceOption = {
  value: string;
  label: string;
  note: string;
};

export type CityOption = {
  name: string;
  lat: string;
  lon: string;
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  { value: 'Plumbing', label: 'Plumbing', note: 'Leaks, fittings, emergency repairs' },
  { value: 'Electrical', label: 'Electrical', note: 'Panels, wiring, appliance faults' },
  { value: 'Cleaning', label: 'Cleaning', note: 'Deep cleans and recurring care' },
  { value: 'HVAC', label: 'HVAC', note: 'Cooling, ventilation, diagnostics' },
  { value: 'Carpentry', label: 'Carpentry', note: 'Custom woodwork and fixes' },
  { value: 'Landscaping', label: 'Landscaping', note: 'Exterior care and upkeep' },
  { value: 'Roofing', label: 'Roofing', note: 'Inspections and weather damage' },
  { value: 'Painting', label: 'Painting', note: 'Interior and exterior finishes' }
];

export const CITY_OPTIONS: CityOption[] = [
  { name: 'San Francisco, USA', lat: '37.7749', lon: '-122.4194' },
  { name: 'New York, USA', lat: '40.7128', lon: '-74.0060' },
  { name: 'Delhi, India', lat: '28.7041', lon: '77.1025' },
  { name: 'Mumbai, India', lat: '19.0760', lon: '72.8777' },
  { name: 'Bengaluru, India', lat: '12.9716', lon: '77.5946' },
  { name: 'London, UK', lat: '51.5074', lon: '-0.1278' },
  { name: 'Dubai, UAE', lat: '25.2048', lon: '55.2708' },
  { name: 'Singapore', lat: '1.3521', lon: '103.8198' }
];

export const DEFAULT_CITY = CITY_OPTIONS[0];
