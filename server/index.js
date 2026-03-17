const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
// For the backend, we use the SERVICE ROLE key to bypass RLS when injecting traces from API keys
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PUBLIC ENDPOINT: POST /api/v1/traces
 * Used by the Leaftrail package to securely push environmental trace data.
 */
app.post('/api/v1/traces', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Trace Ingestion: Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.split(' ')[1];
    console.log(`Trace Ingestion: Attempting for key ${apiKey.substring(0, 8)}...`);

    // 1. Validate API Key against the database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('project_id')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData) {
      console.error('Trace Ingestion: Invalid API Key or lookup error:', keyError);
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    const { trace } = req.body;
    if (!trace || !trace.tokens || !trace.region) {
      console.warn('Trace Ingestion: Malformed trace payload', req.body);
      return res.status(400).json({ error: 'Malformed trace payload' });
    }

    // 2. Insert trace into database
    const { error: insertError } = await supabase
      .from('traces')
      .insert({
        project_id: keyData.project_id,
        tokens_used: trace.tokens,
        carbon_kg: trace.carbonKg,
        water_liters: trace.waterLiters,
        energy_kwh: trace.energyKWh,
        region: trace.region,
        model_name: trace.modelName || 'gemini-3-flash-preview',
      });

    if (insertError) {
      console.error('Trace Ingestion: Failed to insert trace into Supabase:', insertError);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`Trace Ingestion: Successfully recorded trace for project ${keyData.project_id}`);

    // Optionally update the `last_used_at` of the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', apiKey);

    res.status(202).json({ success: true, message: 'Trace recorded' });
  } catch (error) {
    console.error('Trace Ingestion Critical Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
/**
 * DASHBOARD ENDPOINT: GET /api/v1/traces
 * Returns aggregated trace data for the dashboard.
 */
app.get('/api/v1/traces', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('traces')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Fetch traces error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/debug', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'Loaded' : 'Missing',
    supabaseServiceKey: process.env.VITE_SUPABASE_SERVICE_KEY ? 
      (process.env.VITE_SUPABASE_SERVICE_KEY.startsWith('sb_publishable') ? 'Wrong Key (Publishable)' : 'Possibly Correct (Long/Service)') : 'Missing',
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EcoTrace Telemetry API running on port ${PORT}`);
});
