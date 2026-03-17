import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Copy, Key, Trash2 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*, api_keys(*)');

    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newProjectName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert({ name: newProjectName, user_id: user.id })
      .select()
      .single();

    if (pError || !project) {
      console.error('Project creation failed:', pError);
      return;
    }

    // Create an API key for the project
    const generatedKey = `etrace_${Math.random().toString(36).substring(2, 15)}`;
    const { error: kError } = await supabase
      .from('api_keys')
      .insert({
        project_id: project.id,
        key_hash: generatedKey, // Storing directly for MVP simplicity
        key_prefix: 'etrace_',
        name: 'Default Key'
      });

    if (!kError) {
      setApiKey(generatedKey);
      setNewProjectName('');
      fetchProjects();
    } else {
      console.error('API Key creation failed:', kError);
    }
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Register New Application</h2>
        <div className="flex gap-4">
          <input 
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="App name (e.g. My Next.js Blog)"
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
          />
          <button 
            onClick={createProject}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Create Project
          </button>
        </div>

        {apiKey && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Project API Key Generated</span>
              <button onClick={() => setApiKey(null)} className="text-emerald-500 hover:text-emerald-700 text-xs">Dismiss</button>
            </div>
            <p className="text-xs text-emerald-600 mb-3">Copy this key. You will not be able to see it again!</p>
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-200">
              <code className="text-sm font-mono text-emerald-800 flex-1">{apiKey}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-500 transition-colors"
                title="Copy to clipboard"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-black/5">
            No projects found. Create one to get started.
          </div>
        ) : projects.map((project) => (
          <div key={project.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:border-emerald-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                <Key size={20} />
              </div>
              <button 
                onClick={() => deleteProject(project.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{project.name}</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">
              ID: {project.id.split('-')[0]}...
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-xs font-medium text-gray-500">
                {project.api_keys?.length || 0} API Keys
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(project.api_keys?.[0]?.key_hash || '')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Copy size={12} /> Copy Key
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
