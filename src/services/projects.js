import {
  supabase,
  isSupabaseConfigured,
  isSchemaMissingError,
  getSupabaseSchemaStatus,
  markSupabaseSchemaMissing,
} from '../lib/supabase';
import { mockStore } from '../lib/mockStore';

/**
 * Projects Service
 */

export async function getProjects() {
  const mockProjects = mockStore.getProjects();

  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockProjects;
  }

  try {
    let dbProjects = [];

    // 1. Try project_stats view
    const { data, error } = await supabase
      .from('project_stats')
      .select('*')
      .order('investment_total', { ascending: false });

    if (!error && data && data.length > 0) {
      dbProjects = data.map((item) => ({
        id: item.project_id || item.id,
        ...item,
      }));
    } else {
      if (error && isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('project_stats view');
      }

      // 2. Fallback to basic projects table
      const { data: fallbackData, error: tableError } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true)
        .order('created_at');

      if (tableError) {
        if (isSchemaMissingError(tableError)) {
          markSupabaseSchemaMissing('projects table');
        }
        return mockProjects;
      }

      if (fallbackData && fallbackData.length > 0) {
        dbProjects = fallbackData.map((p) => ({
          ...p,
          investment_total: 0,
          investors: 0,
          customer_tokens: 0,
        }));
      }
    }

    if (dbProjects.length === 0) {
      return mockProjects;
    }

    // Merge each project with local mockStore investments to ensure live updates are always visible
    const merged = dbProjects.map((p) => {
      const mockP = mockProjects.find(
        (m) =>
          m.id === p.id ||
          String(m.id).toLowerCase() === String(p.id).toLowerCase() ||
          m.name?.toLowerCase().trim() === p.name?.toLowerCase().trim()
      );
      const dbInvested = Number(p.investment_total || 0);
      const mockInvested = Number(mockP?.investment_total || 0);
      const dbInvestors = Number(p.investors || 0);
      const mockInvestors = Number(mockP?.investors || 0);
      const dbTokens = Number(p.customer_tokens || 0);
      const mockTokens = Number(mockP?.customer_tokens || 0);

      return {
        ...p,
        investment_total: Math.max(dbInvested, mockInvested),
        investors: Math.max(dbInvestors, mockInvestors),
        customer_tokens: Math.max(dbTokens, mockTokens),
      };
    });

    // Re-sort ranking by investment_total DESCENDING
    merged.sort((a, b) => Number(b.investment_total || 0) - Number(a.investment_total || 0));

    return merged;
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getProjects catch');
    }
    console.warn('Excepción al cargar proyectos de Supabase, usando respaldo:', err);
    return mockProjects;
  }
}

export async function getProject(id) {
  if (!id) return null;
  const mockP = mockStore.getProject(id);

  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockP;
  }

  try {
    const { data, error } = await supabase
      .from('project_stats')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();

    if (!error && data) {
      const dbInvested = Number(data.investment_total || 0);
      const mockInvested = Number(mockP?.investment_total || 0);
      return {
        id: data.project_id || data.id,
        ...data,
        investment_total: Math.max(dbInvested, mockInvested),
        investors: Math.max(Number(data.investors || 0), Number(mockP?.investors || 0)),
        customer_tokens: Math.max(Number(data.customer_tokens || 0), Number(mockP?.customer_tokens || 0)),
      };
    }

    // Try directly from projects table
    const { data: projectData, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (projErr) {
      if (isSchemaMissingError(projErr)) {
        markSupabaseSchemaMissing('getProject table');
      }
      return mockP;
    }

    if (projectData) {
      return {
        id: projectData.id,
        ...projectData,
        investment_total: Number(mockP?.investment_total || 0),
        investors: Number(mockP?.investors || 0),
        customer_tokens: Number(mockP?.customer_tokens || 0),
      };
    }

    return mockP;
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('getProject catch');
    }
    return mockP;
  }
}

export async function createProject(projectData) {
  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStore.createProject(projectData);
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectData.name,
          description: projectData.description,
          team_name: projectData.team_name,
          category: projectData.category || 'Innovación',
          logo_url: projectData.logo_url,
          active: projectData.active !== undefined ? projectData.active : true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('createProject');
        return mockStore.createProject(projectData);
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('createProject catch');
      return mockStore.createProject(projectData);
    }
    throw err;
  }
}

export async function updateProject(id, updates) {
  if (!isSupabaseConfigured || getSupabaseSchemaStatus() === 'missing_tables') {
    return mockStore.updateProject(id, updates);
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isSchemaMissingError(error)) {
        markSupabaseSchemaMissing('updateProject');
        return mockStore.updateProject(id, updates);
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (isSchemaMissingError(err)) {
      markSupabaseSchemaMissing('updateProject catch');
      return mockStore.updateProject(id, updates);
    }
    throw err;
  }
}

export async function toggleProjectActive(id, active) {
  return updateProject(id, { active });
}
