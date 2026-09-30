/**
 * Mock Store: In-memory & LocalStorage database fallback
 * used when Supabase credentials have not been configured or table schema is missing.
 */

const STORAGE_KEY = 'expo_investment_mock_db_v1';
const RECENT_ACTIVITIES_KEY = 'expo_recent_activities_cache_v1';

const INITIAL_PROJECTS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'EcoTech',
    description: 'Plataforma inteligente de reciclaje y valorización de residuos con incentivos tokenizados en campus universitarios.',
    team_name: 'Equipo Verde Circular',
    category: 'Sostenibilidad',
    city: 'New York',
    country: 'Estados Unidos',
    country_code: '🇺🇸',
    passport_code: 'NYC-7K4P',
    logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    base_investment: 24750,
    base_investors: 83,
    base_tokens: 147,
    investment_total: 24750,
    investors: 83,
    customer_tokens: 147,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'RoboSmart',
    description: 'Brazo robótico articulado modular y de bajo costo para automatización en laboratorios y centros de formación técnica.',
    team_name: 'Mecatrónica Alpha',
    category: 'Robótica & AI',
    city: 'Tokyo',
    country: 'Japón',
    country_code: '🇯🇵',
    passport_code: 'TOK-92XM',
    logo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    base_investment: 18500,
    base_investors: 62,
    base_tokens: 98,
    investment_total: 18500,
    investors: 62,
    customer_tokens: 98,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'GreenApp',
    description: 'Aplicación de carpooling y micromovilidad eléctrica coordinada para reducir la huella de carbono escolar y urbana.',
    team_name: 'EcoMobility Lab',
    category: 'Movilidad',
    city: 'Paris',
    country: 'Francia',
    country_code: '🇫🇷',
    passport_code: 'PAR-5L8Q',
    logo_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    base_investment: 14200,
    base_investors: 45,
    base_tokens: 112,
    investment_total: 14200,
    investors: 45,
    customer_tokens: 112,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'SmartHome',
    description: 'Ecosistema IoT para optimización del consumo eléctrico y detección predictiva de fugas de agua en viviendas.',
    team_name: 'Domótica Conectada',
    category: 'IoT & Hardware',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    country_code: '🇧🇷',
    passport_code: 'RIO-3F7A',
    logo_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    base_investment: 9800,
    base_investors: 31,
    base_tokens: 64,
    investment_total: 9800,
    investors: 31,
    customer_tokens: 64,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'AgroVision',
    description: 'Sistema de teledetección multiespectral con drones para identificación temprana de plagas y estrés hídrico en cultivos.',
    team_name: 'AgroTech Innovators',
    category: 'AgTech',
    city: 'London',
    country: 'Reino Unido',
    country_code: '🇬🇧',
    passport_code: 'LON-8H2M',
    logo_url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    base_investment: 8250,
    base_investors: 27,
    base_tokens: 53,
    investment_total: 8250,
    investors: 27,
    customer_tokens: 53,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'BioHealth',
    description: 'Dispositivo portátil no invasivo para monitoreo y telemetría de signos vitales en comunidades rurales aisladas.',
    team_name: 'BioIngeniería Sanitaria',
    category: 'Salud & Biotech',
    city: 'Rome',
    country: 'Italia',
    country_code: '🇮🇹',
    passport_code: 'ROM-4P9X',
    logo_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
    active: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    base_investment: 6100,
    base_investors: 19,
    base_tokens: 41,
    investment_total: 6100,
    investors: 19,
    customer_tokens: 41,
  },
];

const INITIAL_PRIZES = [
  {
    id: 'prize-demo-1',
    name: 'Gift Card de $25 USD',
    description: 'Tarjeta de regalo digital canjeable en tiendas participantes de la Expo.',
    value: '$25.00',
    quantity: 10,
    claimed_count: 1,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prize-demo-2',
    name: 'Kit Oficial Merchandising Expo',
    description: 'Camiseta conmemorativa de la Expo, termo térmico y sticker pack holográfico.',
    value: '$35.00',
    quantity: 15,
    claimed_count: 2,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prize-demo-3',
    name: 'Pase VIP Networking Universitario',
    description: 'Acceso exclusivo al salón de creadores con inversionistas y mentores ángeles.',
    value: '$50.00',
    quantity: 5,
    claimed_count: 0,
    active: true,
    created_at: new Date().toISOString(),
  },
];

// Unified cross-tab BroadcastChannel
const mockBroadcastChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('expo_live_market_bus')
    : null;

const listeners = new Set();

if (mockBroadcastChannel) {
  mockBroadcastChannel.onmessage = (e) => {
    const eventType = e.data?.type || e.data?.event;
    const payload = e.data?.payload;
    if (eventType && payload) {
      listeners.forEach((fn) => {
        try {
          fn(eventType, payload);
        } catch (err) {
          console.error(err);
        }
      });
    }
  };
}

function notifyChange(event, payload) {
  listeners.forEach((fn) => {
    try {
      fn(event, payload);
    } catch (err) {
      console.error('Error in mock store listener:', err);
    }
  });

  if (mockBroadcastChannel) {
    try {
      mockBroadcastChannel.postMessage({ type: event, payload });
    } catch (e) {
      console.warn('mockBroadcastChannel error:', e);
    }
  }

  // Cross-tab storage trigger
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('expo_live_event_trigger', JSON.stringify({ type: event, payload, _ts: Date.now() }));
    } catch {
      // ignore
    }
  }
}

export function subscribeToMockChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function loadState() {
  if (typeof window === 'undefined') {
    return {
      projects: INITIAL_PROJECTS,
      profiles: [],
      investments: [],
      customerTokens: [],
      transactions: [],
      prizes: INITIAL_PRIZES,
      passportStamps: [],
      passportTokens: [],
      currentUser: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = {
        projects: INITIAL_PROJECTS,
        profiles: [
          {
            id: 'admin-demo-id',
            full_name: 'Administrador Expo',
            email: 'admin@expo.com',
            role: 'admin',
            balance: 10000.0,
            created_at: new Date().toISOString(),
          },
          {
            id: 'team-demo-id',
            full_name: 'Líder EcoTech',
            email: 'equipo@ecotech.com',
            role: 'team',
            project_id: '00000000-0000-0000-0000-000000000001',
            balance: 10000.0,
            created_at: new Date().toISOString(),
          },
        ],
        investments: [],
        customerTokens: [],
        transactions: [],
        prizes: INITIAL_PRIZES,
        passportStamps: [],
        passportTokens: [],
        currentUser: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }

    const parsed = JSON.parse(raw);

    // Auto-heal existing stored projects to guarantee clean base figures & city passport fields
    if (Array.isArray(parsed.projects)) {
      parsed.projects = parsed.projects.map((p) => {
        const init = INITIAL_PROJECTS.find(
          (ip) => ip.id === p.id || ip.name?.toLowerCase().trim() === p.name?.toLowerCase().trim()
        );

        return {
          ...p,
          city: p.city || init?.city || 'Ciudad Global',
          country: p.country || init?.country || 'Internacional',
          country_code: p.country_code || init?.country_code || '🌐',
          passport_code: p.passport_code || init?.passport_code || `EXP-${p.name?.substring(0, 3).toUpperCase()}`,
          base_investment:
            p.base_investment !== undefined
              ? Number(p.base_investment)
              : init
              ? init.base_investment
              : Number(p.investment_total || 0),
          base_investors:
            p.base_investors !== undefined
              ? Number(p.base_investors)
              : init
              ? init.base_investors
              : Number(p.investors || 0),
          base_tokens:
            p.base_tokens !== undefined
              ? Number(p.base_tokens)
              : init
              ? init.base_tokens
              : Number(p.customer_tokens || 0),
        };
      });
    } else {
      parsed.projects = INITIAL_PROJECTS;
    }

    if (!Array.isArray(parsed.prizes) || parsed.prizes.length === 0) {
      parsed.prizes = INITIAL_PRIZES;
    }
    if (!Array.isArray(parsed.passportStamps)) {
      parsed.passportStamps = [];
    }
    if (!Array.isArray(parsed.passportTokens)) {
      parsed.passportTokens = [];
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse mock state:', e);
    return {
      projects: INITIAL_PROJECTS,
      profiles: [],
      investments: [],
      customerTokens: [],
      transactions: [],
      prizes: INITIAL_PRIZES,
      passportStamps: [],
      passportTokens: [],
      currentUser: null,
    };
  }
}

function saveState(state) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export const mockStore = {
  getState: loadState,

  getProjects() {
    const state = loadState();
    const projectsList = Array.isArray(state.projects) && state.projects.length > 0 ? state.projects : INITIAL_PROJECTS;
    const investments = Array.isArray(state.investments) ? state.investments : [];
    const customerTokens = Array.isArray(state.customerTokens) ? state.customerTokens : [];
    const passportStamps = Array.isArray(state.passportStamps) ? state.passportStamps : [];

    return projectsList
      .map((p) => {
        const projectInvestments = investments.filter(
          (i) => i.project_id === p.id || (p.name && i.project_name?.toLowerCase() === p.name.toLowerCase())
        );
        const additionalInvested = projectInvestments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        const uniqueNewInvestors = new Set(projectInvestments.map((i) => i.user_id)).size;
        const additionalTokens = customerTokens.filter(
          (t) => t.project_id === p.id || (p.name && t.project_name?.toLowerCase() === p.name.toLowerCase())
        ).length;
        const stampsCount = passportStamps.filter((s) => s.project_id === p.id).length;

        const baseAmount = Number(p.base_investment !== undefined ? p.base_investment : 0);
        const baseInvestors = Number(p.base_investors !== undefined ? p.base_investors : 0);
        const baseTokens = Number(p.base_tokens !== undefined ? p.base_tokens : 0);

        const totalInvested = baseAmount + additionalInvested;
        const totalInvestors = baseInvestors + uniqueNewInvestors;
        const totalTokens = baseTokens + additionalTokens;

        return {
          ...p,
          base_investment: baseAmount,
          base_investors: baseInvestors,
          base_tokens: baseTokens,
          investment_total: totalInvested,
          investors: totalInvestors,
          customer_tokens: totalTokens,
          passport_stamps_count: stampsCount,
        };
      })
      .sort((a, b) => Number(b.investment_total || 0) - Number(a.investment_total || 0));
  },

  getProject(id) {
    const projects = this.getProjects();
    return (
      projects.find(
        (p) => p.id === id || String(p.id).toLowerCase() === String(id).toLowerCase()
      ) || null
    );
  },

  createProject(projectData) {
    const state = loadState();
    const cityInit = projectData.city || 'Ciudad Expo';
    const cityCode = projectData.passport_code || `${cityInit.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProject = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'proj-' + Date.now(),
      name: projectData.name,
      description: projectData.description,
      team_name: projectData.team_name,
      category: projectData.category || 'Innovación',
      city: cityInit,
      country: projectData.country || 'Global',
      country_code: projectData.country_code || '🌐',
      passport_code: cityCode,
      logo_url:
        projectData.logo_url ||
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
      active: projectData.active !== undefined ? projectData.active : true,
      created_at: new Date().toISOString(),
      base_investment: 0,
      base_investors: 0,
      base_tokens: 0,
      investment_total: 0,
      investors: 0,
      customer_tokens: 0,
    };
    state.projects.unshift(newProject);
    saveState(state);
    notifyChange('PROJECT_INSERT', newProject);
    return newProject;
  },

  updateProject(id, updates) {
    const state = loadState();
    const index = state.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Proyecto no encontrado');
    state.projects[index] = { ...state.projects[index], ...updates };
    saveState(state);
    notifyChange('PROJECT_UPDATE', state.projects[index]);
    return state.projects[index];
  },

  toggleProjectActive(id, active) {
    return this.updateProject(id, { active });
  },

  // Auth & Profile
  registerUser({ full_name, email, password, role = 'visitor' }) {
    const state = loadState();
    const existing = state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico');
    }

    const userId = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now();
    const initialBalance = 10000.0;

    const newProfile = {
      id: userId,
      full_name,
      email: email.toLowerCase(),
      role,
      balance: initialBalance,
      created_at: new Date().toISOString(),
      password,
    };

    const initialTx = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now(),
      user_id: userId,
      type: 'initial_balance',
      amount: initialBalance,
      description: 'Capital inicial asignado',
      created_at: new Date().toISOString(),
    };

    state.profiles.push(newProfile);
    state.transactions.push(initialTx);
    state.currentUser = { id: userId, email: newProfile.email, role: newProfile.role };
    saveState(state);

    return { user: state.currentUser, profile: newProfile };
  },

  loginUser({ email, password }) {
    const state = loadState();
    const profile = state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (!profile) {
      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    if (profile.password && profile.password !== password) {
      throw new Error('Contraseña incorrecta.');
    }

    state.currentUser = { id: profile.id, email: profile.email, role: profile.role };
    saveState(state);
    return { user: state.currentUser, profile };
  },

  getCurrentUser() {
    const state = loadState();
    if (!state.currentUser) return null;
    return state.profiles.find((p) => p.id === state.currentUser.id) || null;
  },

  logoutUser() {
    const state = loadState();
    state.currentUser = null;
    saveState(state);
  },

  // Wallet
  getWallet(userId) {
    const state = loadState();
    const profile = state.profiles.find((p) => p.id === userId);
    if (!profile) return null;

    const userInvestments = (state.investments || []).filter((i) => i.user_id === userId);
    const totalInvested = userInvestments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const supportedProjectsCount = new Set(userInvestments.map((i) => i.project_id)).size;
    const tokensGivenCount = (state.customerTokens || []).filter((t) => t.user_id === userId).length;
    const userTransactions = (state.transactions || [])
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      profile,
      balance: profile.balance,
      totalInvested,
      supportedProjectsCount,
      tokensGivenCount,
      transactions: userTransactions,
      investments: userInvestments,
    };
  },

  // Atomic Investment execution
  makeInvestment(userId, projectId, amount, projectData = null) {
    const state = loadState();
    let profile = state.profiles.find((p) => p.id === userId);
    if (!profile) {
      profile = {
        id: userId,
        full_name: 'Visitante Expo',
        email: 'visitante@expo.com',
        role: 'visitor',
        balance: 10000.0,
        created_at: new Date().toISOString(),
      };
      state.profiles.push(profile);
    }

    let project = state.projects.find(
      (p) =>
        p.id === projectId ||
        String(p.id).toLowerCase() === String(projectId).toLowerCase() ||
        (projectData?.name && p.name?.toLowerCase().trim() === projectData.name.toLowerCase().trim())
    );

    if (!project) {
      project = {
        id: projectId,
        name: projectData?.name || 'Proyecto Expo',
        description: projectData?.description || 'Proyecto participante en la Expo de Logros.',
        team_name: projectData?.team_name || 'Equipo Estudiantil',
        category: projectData?.category || 'Innovación',
        city: projectData?.city || 'Ciudad Expo',
        country: projectData?.country || 'Global',
        country_code: projectData?.country_code || '🌐',
        passport_code: projectData?.passport_code || 'EXP-1234',
        logo_url:
          projectData?.logo_url ||
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
        active: true,
        created_at: new Date().toISOString(),
        base_investment: 0,
        base_investors: 0,
        base_tokens: 0,
        investment_total: 0,
        investors: 0,
        customer_tokens: 0,
      };
      state.projects.push(project);
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('El monto a invertir debe ser un número mayor a cero');
    }

    if (profile.balance < parsedAmount) {
      throw new Error(`Saldo insuficiente. Tu saldo actual es de $${profile.balance.toLocaleString()}`);
    }

    const previousBalance = profile.balance;
    profile.balance = previousBalance - parsedAmount;

    const investmentId = crypto.randomUUID ? crypto.randomUUID() : 'inv-' + Date.now();
    const newInvestment = {
      id: investmentId,
      user_id: userId,
      project_id: project.id,
      project_name: project.name,
      amount: parsedAmount,
      created_at: new Date().toISOString(),
    };
    if (!state.investments) state.investments = [];
    state.investments.push(newInvestment);

    const newTx = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now(),
      user_id: userId,
      type: 'investment',
      amount: -parsedAmount,
      investment_id: investmentId,
      description: `Inversión — ${project.name}`,
      created_at: new Date().toISOString(),
    };
    if (!state.transactions) state.transactions = [];
    state.transactions.push(newTx);

    saveState(state);

    const payload = {
      type: 'investment',
      investment: newInvestment,
      project: {
        id: project.id,
        name: project.name,
        team_name: project.team_name,
        category: project.category,
        city: project.city,
        country: project.country,
        country_code: project.country_code,
      },
      project_id: project.id,
      amount: parsedAmount,
      new_balance: profile.balance,
      previous_balance: previousBalance,
      timestamp: newInvestment.created_at,
    };

    notifyChange('INVESTMENT_CREATED', payload);

    return {
      success: true,
      message: 'Inversión realizada con éxito',
      investment_id: investmentId,
      project_id: project.id,
      project_name: project.name,
      amount: parsedAmount,
      previous_balance: previousBalance,
      new_balance: profile.balance,
    };
  },

  // Customer Token
  giveCustomerToken(userId, projectId, projectData = null) {
    const state = loadState();
    let project = state.projects.find(
      (p) =>
        p.id === projectId ||
        String(p.id).toLowerCase() === String(projectId).toLowerCase() ||
        (projectData?.name && p.name?.toLowerCase().trim() === projectData.name.toLowerCase().trim())
    );

    if (!project) {
      project = {
        id: projectId,
        name: projectData?.name || 'Proyecto Expo',
        description: projectData?.description || 'Proyecto participante en la Expo de Logros.',
        team_name: projectData?.team_name || 'Equipo Estudiantil',
        category: projectData?.category || 'Innovación',
        city: projectData?.city || 'Ciudad Expo',
        country: projectData?.country || 'Global',
        country_code: projectData?.country_code || '🌐',
        passport_code: projectData?.passport_code || 'EXP-1234',
        logo_url:
          projectData?.logo_url ||
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
        active: true,
        created_at: new Date().toISOString(),
        base_investment: 0,
        base_investors: 0,
        base_tokens: 0,
        investment_total: 0,
        investors: 0,
        customer_tokens: 0,
      };
      state.projects.push(project);
    }

    if (!state.customerTokens) state.customerTokens = [];
    const exists = state.customerTokens.some(
      (t) => t.user_id === userId && (t.project_id === project.id || t.project_name === project.name)
    );
    if (exists) {
      throw new Error('Ya has entregado un Customer Token a este proyecto');
    }

    const tokenId = crypto.randomUUID ? crypto.randomUUID() : 'tok-' + Date.now();
    const newToken = {
      id: tokenId,
      user_id: userId,
      project_id: project.id,
      project_name: project.name,
      created_at: new Date().toISOString(),
    };
    state.customerTokens.push(newToken);
    saveState(state);

    const projectTokens = state.customerTokens.filter((t) => t.project_id === project.id).length;
    const totalTokens = (project.base_tokens || 0) + projectTokens;

    const payload = {
      type: 'customer_token',
      token: newToken,
      project: { id: project.id, name: project.name },
      project_id: project.id,
      totalTokens,
      timestamp: newToken.created_at,
    };

    notifyChange('CUSTOMER_TOKEN_CREATED', payload);

    return {
      success: true,
      message: 'Customer Token registrado exitosamente',
      token_id: tokenId,
      project_id: project.id,
      project_name: project.name,
      total_tokens: totalTokens,
    };
  },

  hasGivenCustomerToken(userId, projectId) {
    if (!userId) return false;
    const state = loadState();
    return (state.customerTokens || []).some(
      (t) => t.user_id === userId && (t.project_id === projectId || String(t.project_id).toLowerCase() === String(projectId).toLowerCase())
    );
  },

  // ==========================================
  // PASAPORTE DE CIUDADES & TOKEN FINAL
  // ==========================================

  getPassport(userId) {
    if (!userId) return null;
    const state = loadState();
    const profile = state.profiles.find((p) => p.id === userId) || {
      id: userId,
      full_name: 'Visitante Expo',
      email: 'visitante@expo.com',
    };

    const activeProjects = state.projects.filter((p) => p.active !== false);
    const userStamps = (state.passportStamps || []).filter((s) => s.user_id === userId);
    const userToken = (state.passportTokens || []).find((t) => t.user_id === userId);

    const cities = activeProjects.map((proj) => {
      const stamp = userStamps.find(
        (s) => s.project_id === proj.id || String(s.project_id).toLowerCase() === String(proj.id).toLowerCase()
      );
      return {
        id: proj.id,
        name: proj.name,
        city: proj.city || 'Ciudad',
        country: proj.country || 'Mundo',
        country_code: proj.country_code || '🌐',
        passport_code: proj.passport_code || 'CODE',
        description: proj.description,
        team_name: proj.team_name,
        logo_url: proj.logo_url,
        unlocked: Boolean(stamp),
        stamped_at: stamp ? stamp.created_at : null,
      };
    });

    const visitedCount = cities.filter((c) => c.unlocked).length;
    const totalCount = cities.length;
    const percentage = Math.round((visitedCount / Math.max(totalCount, 1)) * 100);
    const isCompleted = totalCount > 0 && visitedCount >= totalCount;

    let tokenDetails = null;
    if (userToken) {
      let prizeDetails = null;
      if (userToken.prize_id) {
        const prize = (state.prizes || []).find((p) => p.id === userToken.prize_id);
        if (prize) {
          prizeDetails = {
            id: prize.id,
            name: prize.name,
            description: prize.description,
            value: prize.value,
          };
        }
      }
      tokenDetails = {
        token_code: userToken.token_code,
        completed_at: userToken.completed_at,
        revealed: Boolean(userToken.revealed),
        has_prize: Boolean(userToken.prize_id),
        prize: prizeDetails,
      };
    }

    return {
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
      },
      cities,
      visitedCount,
      totalCount,
      percentage,
      isCompleted,
      token: tokenDetails,
    };
  },

  claimPassportStamp(userId, code) {
    if (!userId) {
      throw new Error('Debes iniciar sesión para sellar tu pasaporte.');
    }
    if (!code || !code.trim()) {
      throw new Error('Debes ingresar un código de ciudad válido.');
    }

    const state = loadState();
    const cleanCode = code.toUpperCase().trim();

    // 1. Find project by passport_code
    const project = state.projects.find(
      (p) => p.passport_code && p.passport_code.toUpperCase().trim() === cleanCode
    );

    if (!project) {
      throw new Error('El código ingresado no existe o no corresponde a una ciudad válida.');
    }

    if (project.active === false) {
      throw new Error('El stand de esta ciudad se encuentra temporalmente inactivo.');
    }

    // 2. Check if user already has this stamp
    if (!state.passportStamps) state.passportStamps = [];
    const alreadyStamped = state.passportStamps.some(
      (s) => s.user_id === userId && s.project_id === project.id
    );

    if (alreadyStamped) {
      throw new Error('Ya tienes el sello de esta ciudad.');
    }

    // 3. Create stamp
    const stampId = crypto.randomUUID ? crypto.randomUUID() : 'stamp-' + Date.now();
    const newStamp = {
      id: stampId,
      user_id: userId,
      project_id: project.id,
      created_at: new Date().toISOString(),
    };
    state.passportStamps.push(newStamp);

    // 4. Check completion
    const activeProjects = state.projects.filter((p) => p.active !== false);
    const userStamps = state.passportStamps.filter((s) => s.user_id === userId);
    const completed = userStamps.length >= activeProjects.length;

    let finalTokenCode = null;
    let assignedPrize = null;

    if (completed) {
      if (!state.passportTokens) state.passportTokens = [];
      let token = state.passportTokens.find((t) => t.user_id === userId);

      if (!token) {
        // Generate unique token code (e.g. #X7K92P)
        finalTokenCode = 'TOKEN #' + (crypto.randomUUID ? crypto.randomUUID().substring(0, 6).toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase());

        // Assign prize from available stock
        const availablePrizes = (state.prizes || []).filter(
          (p) => p.active !== false && Number(p.quantity) > Number(p.claimed_count || 0)
        );

        let prizeId = null;
        if (availablePrizes.length > 0) {
          const randomIndex = Math.floor(Math.random() * availablePrizes.length);
          const chosenPrize = availablePrizes[randomIndex];
          prizeId = chosenPrize.id;
          chosenPrize.claimed_count = Number(chosenPrize.claimed_count || 0) + 1;
          assignedPrize = chosenPrize;
        }

        token = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'tok-fin-' + Date.now(),
          user_id: userId,
          token_code: finalTokenCode,
          prize_id: prizeId,
          revealed: false,
          redeemed: false,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        state.passportTokens.push(token);
      } else {
        finalTokenCode = token.token_code;
      }
    }

    saveState(state);

    const payload = {
      type: 'PASSPORT_STAMP_CLAIMED',
      userId,
      stamp: {
        id: stampId,
        project_id: project.id,
        project_name: project.name,
        city: project.city,
        country: project.country,
        country_code: project.country_code,
        created_at: newStamp.created_at,
      },
      completed,
      token_code: finalTokenCode,
      timestamp: newStamp.created_at,
    };

    notifyChange('PASSPORT_STAMP_CLAIMED', payload);

    return {
      success: true,
      message: '¡Sello conseguido con éxito!',
      stamp: {
        id: stampId,
        project_id: project.id,
        project_name: project.name,
        city: project.city,
        country: project.country,
        country_code: project.country_code,
        created_at: newStamp.created_at,
      },
      progress: {
        visited_cities: userStamps.length,
        total_cities: activeProjects.length,
        percentage: Math.round((userStamps.length / Math.max(activeProjects.length, 1)) * 100),
      },
      completed,
      token_code: finalTokenCode,
    };
  },

  revealPassportToken(userId) {
    if (!userId) throw new Error('Usuario no autenticado');
    const state = loadState();
    const token = (state.passportTokens || []).find((t) => t.user_id === userId);
    if (!token) {
      throw new Error('Aún no has completado tu Pasaporte de Ciudades.');
    }

    token.revealed = true;
    saveState(state);

    let prizeInfo = null;
    if (token.prize_id) {
      const prize = (state.prizes || []).find((p) => p.id === token.prize_id);
      if (prize) {
        prizeInfo = {
          name: prize.name,
          description: prize.description,
          value: prize.value,
        };
      }
    }

    return {
      success: true,
      token_code: token.token_code,
      has_prize: Boolean(prizeInfo),
      prize: prizeInfo,
      message: prizeInfo ? `Has ganado: ${prizeInfo.name}` : 'Gracias por participar en Expo Investment',
    };
  },

  getPassportAdminStats() {
    const state = loadState();
    const visitors = (state.profiles || []).filter((p) => p.role === 'visitor');
    const stamps = state.passportStamps || [];
    const tokens = state.passportTokens || [];
    const prizes = state.prizes || [];
    const projects = state.projects || [];

    const totalVisitors = visitors.length;
    const completedPassports = tokens.length;
    const totalStamps = stamps.length;
    const tokensUnlocked = tokens.length;
    const tokensWithPrize = tokens.filter((t) => Boolean(t.prize_id)).length;
    const prizesDelivered = tokens.filter((t) => t.revealed && t.prize_id).length;

    // City visit stats
    const cityStats = projects.map((p) => {
      const count = stamps.filter((s) => s.project_id === p.id).length;
      return {
        id: p.id,
        city: p.city || p.name,
        country: p.country,
        country_code: p.country_code,
        stamps_count: count,
        percentage: totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0,
      };
    }).sort((a, b) => b.stamps_count - a.stamps_count);

    // Visitor passport table rows
    const visitorRows = visitors.map((v) => {
      const vStamps = stamps.filter((s) => s.user_id === v.id);
      const vToken = tokens.find((t) => t.user_id === v.id);
      const vPrize = vToken?.prize_id ? prizes.find((p) => p.id === vToken.prize_id) : null;

      return {
        id: v.id,
        name: v.full_name || 'Visitante',
        email: v.email,
        progress: `${vStamps.length} / ${projects.length}`,
        percentage: Math.round((vStamps.length / Math.max(projects.length, 1)) * 100),
        token_code: vToken ? vToken.token_code : null,
        prize_name: vPrize ? vPrize.name : vToken ? 'Sin premio' : 'Pendiente',
        has_prize: Boolean(vPrize),
        status: vToken ? (vToken.revealed ? 'Completado & Revelado' : 'Completado (Token Listo)') : 'En progreso',
      };
    });

    return {
      totalVisitors,
      completedPassports,
      totalStamps,
      tokensUnlocked,
      tokensWithPrize,
      prizesDelivered,
      cityStats,
      visitorRows,
      prizes,
    };
  },

  getAllPrizes() {
    const state = loadState();
    return state.prizes || [];
  },

  createPrize(prizeData) {
    const state = loadState();
    const newPrize = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'prize-' + Date.now(),
      name: prizeData.name,
      description: prizeData.description || '',
      value: prizeData.value || '$0.00',
      quantity: Number(prizeData.quantity || 1),
      claimed_count: 0,
      active: true,
      created_at: new Date().toISOString(),
    };
    if (!state.prizes) state.prizes = [];
    state.prizes.push(newPrize);
    saveState(state);
    return newPrize;
  },

  updatePrize(id, updates) {
    const state = loadState();
    const idx = (state.prizes || []).findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Premio no encontrado');
    state.prizes[idx] = { ...state.prizes[idx], ...updates };
    saveState(state);
    return state.prizes[idx];
  },

  getRecentActivity(limit = 20) {
    const state = loadState();
    const investments = Array.isArray(state.investments) ? state.investments : [];
    const customerTokens = Array.isArray(state.customerTokens) ? state.customerTokens : [];
    const passportStamps = Array.isArray(state.passportStamps) ? state.passportStamps : [];
    const projects = Array.isArray(state.projects) ? state.projects : INITIAL_PROJECTS;

    const invEvents = investments.map((inv) => {
      const project = projects.find((p) => p.id === inv.project_id || p.name === inv.project_name);
      return {
        id: inv.id,
        type: 'investment',
        title: 'NUEVA INVERSIÓN',
        amount: Number(inv.amount),
        projectName: project?.name || inv.project_name || 'Proyecto',
        projectId: inv.project_id,
        timestamp: inv.created_at || new Date().toISOString(),
      };
    });

    const tokEvents = customerTokens.map((tok) => {
      const project = projects.find((p) => p.id === tok.project_id || p.name === tok.project_name);
      return {
        id: tok.id,
        type: 'customer_token',
        title: 'NUEVO CUSTOMER TOKEN',
        amount: null,
        projectName: project?.name || tok.project_name || 'Proyecto',
        projectId: tok.project_id,
        timestamp: tok.created_at || new Date().toISOString(),
      };
    });

    const stampEvents = passportStamps.map((st) => {
      const project = projects.find((p) => p.id === st.project_id);
      return {
        id: st.id,
        type: 'passport_stamp',
        title: 'SELLO DE CIUDAD',
        amount: null,
        projectName: `${project?.country_code || '📍'} ${project?.city || project?.name || 'Ciudad'}`,
        projectId: st.project_id,
        timestamp: st.created_at || new Date().toISOString(),
      };
    });

    const combined = [...invEvents, ...tokEvents, ...stampEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (combined.length === 0) {
      const now = Date.now();
      return [
        {
          id: 'seed-act-1',
          type: 'investment',
          title: 'NUEVA INVERSIÓN',
          amount: 2500,
          projectName: 'EcoTech (New York 🇺🇸)',
          projectId: '00000000-0000-0000-0000-000000000001',
          timestamp: new Date(now - 120000).toISOString(),
        },
        {
          id: 'seed-act-2',
          type: 'customer_token',
          title: 'NUEVO CUSTOMER TOKEN',
          amount: null,
          projectName: 'EcoTech',
          projectId: '00000000-0000-0000-0000-000000000001',
          timestamp: new Date(now - 240000).toISOString(),
        },
        {
          id: 'seed-act-3',
          type: 'passport_stamp',
          title: 'SELLO DE CIUDAD',
          amount: null,
          projectName: '🇯🇵 Tokyo (RoboSmart)',
          projectId: '00000000-0000-0000-0000-000000000002',
          timestamp: new Date(now - 360000).toISOString(),
        },
      ];
    }

    return combined.slice(0, limit);
  },

  getDashboardStats() {
    const state = loadState();
    const projects = this.getProjects();

    const totalInvested = projects.reduce((acc, p) => acc + Number(p.investment_total || 0), 0);
    const totalInvestors = projects.reduce((acc, p) => acc + Number(p.investors || 0), 0);
    const totalCustomerTokens = projects.reduce((acc, p) => acc + Number(p.customer_tokens || 0), 0);
    const totalPassportStamps = (state.passportStamps || []).length;
    const totalPassportsCompleted = (state.passportTokens || []).length;
    const totalVisitors = (state.profiles || []).filter((p) => p.role === 'visitor').length + 50;

    const sortedProjects = [...projects].sort(
      (a, b) => Number(b.investment_total || 0) - Number(a.investment_total || 0)
    );

    // Global city exploration percentages for Dashboard
    const cityExploration = projects.map((p) => {
      const stamps = (state.passportStamps || []).filter((s) => s.project_id === p.id).length;
      const basePercentage = p.base_investors ? Math.min(95, Math.round((p.base_investors / 100) * 100)) : 45;
      const percentage = Math.min(100, Math.max(basePercentage, Math.round((stamps / Math.max(totalVisitors, 1)) * 100)));
      return {
        id: p.id,
        name: p.name,
        city: p.city || p.name,
        country: p.country,
        country_code: p.country_code || '🌐',
        passport_code: p.passport_code,
        stamps_count: stamps + Math.round(basePercentage * 0.8),
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return {
      total_invested: totalInvested,
      total_investors: totalInvestors,
      total_customer_tokens: totalCustomerTokens,
      total_passport_stamps: totalPassportStamps + 348,
      total_passports_completed: totalPassportsCompleted + 18,
      total_visitors: totalVisitors,
      city_exploration: cityExploration,
      ranking: sortedProjects,
    };
  },

  getAllVisitors() {
    const state = loadState();
    return (state.profiles || [])
      .filter((p) => p.role === 'visitor')
      .map((p) => {
        const userInvestments = (state.investments || []).filter((i) => i.user_id === p.id);
        const investedAmount = userInvestments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        const tokensCount = (state.customerTokens || []).filter((t) => t.user_id === p.id).length;
        const stampsCount = (state.passportStamps || []).filter((s) => s.user_id === p.id).length;
        const hasToken = (state.passportTokens || []).some((t) => t.user_id === p.id);

        return {
          ...p,
          invested_amount: investedAmount,
          tokens_count: tokensCount,
          stamps_count: stampsCount,
          has_completed_passport: hasToken,
          projects_supported: new Set(userInvestments.map((i) => i.project_id)).size,
        };
      });
  },

  getAllInvestments() {
    const state = loadState();
    return (state.investments || [])
      .map((inv) => {
        const profile = (state.profiles || []).find((p) => p.id === inv.user_id);
        const project = (state.projects || []).find((p) => p.id === inv.project_id);
        return {
          ...inv,
          visitor_name: profile ? profile.full_name : 'Visitante',
          visitor_email: profile ? profile.email : '',
          project_name: project ? project.name : inv.project_name || 'Proyecto',
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  resetDemoData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_ACTIVITIES_KEY);
      window.location.reload();
    }
  },
};
