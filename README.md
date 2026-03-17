<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EcoTrace AI

EcoTrace AI is a powerful platform designed to monitor and visualize the environmental impact of AI inference calls. By integrating with the **Leaftrail** SDK (https://www.npmjs.com/package/@faizfrds/leaftrail), it provides real-time data on carbon emissions, water consumption, and energy usage for every AI interaction.

## 🌿 What it Solves

AI inference requires significant natural resources for compute and cooling. EcoTrace AI aims to:
- **Provide Transparency:** Reveal the hidden environmental cost of large language models (LLMs).
- **Drive Optimization:** Help developers compare regions and prompts to reduce their digital footprint.
- **Enable Accountability:** Facilitate sustainability reporting and carbon offsetting for AI-driven applications.

## Core Features

- **Environmental Dashboard:** Aggregate historical data on carbon footprint, water usage, and energy consumption.
- **Trace Playground:** Test Gemini API prompts and see real-time environmental impact tracing.
- **Project Management:** Generate and manage API keys for different projects to track distributed usage.
- **Integration Snippets:** Easy-to-use code examples for wrapping the Google GenAI SDK with Leaftrail.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts for data visualization, Motion for animations.
- **Backend:** Node.js, Express API server.
- **Database:** Supabase (PostgreSQL) for telemetry storage and key management.
- **AI Ecosystem:** Google Gemini API, [Leaftrail](https://www.npmjs.com/package/@faizfrds/leaftrail) telemetry library.

## 🔗 How it Works with Leaftrail

EcoTrace AI serves as the "Hub" for the Leaftrail ecosystem:
1. **The Client:** Developers use the `@faizfrds/leaftrail` package in their applications to wrap Gemini calls.
2. **The Trace:** Every call calculates environmental impact based on token count and Google's Carbon Free Energy (CFE) data for the specific region.
3. **The Ingestion:** The library automatically sends "traces" to EcoTrace AI's telemetry endpoint (`/api/v1/traces`).
4. **The Visualization:** EcoTrace AI archives these traces and displays them in the dashboard.

---

## 💻 Run Locally

**Prerequisites:** Node.js & Supabase Account

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configuration:**
   Set the following variables in `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_KEY=your_service_role_key (for backend)
   ```

3. **Run the API Server:**
   ```bash
   npm run server
   ```

4. **Run the Frontend:**
   ```bash
   npm run dev
   ```

Visit your app: `http://localhost:3000`

