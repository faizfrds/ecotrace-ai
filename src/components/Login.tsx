import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Leaf } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-black/5 shadow-xl">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome to EcoTrace AI</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to monitor your environmental footprint</p>
          </div>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10b981',
                  brandAccent: '#059669',
                }
              }
            }
          }}
          providers={['github', 'google']}
        />
      </div>
    </div>
  );
}
