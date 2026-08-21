import { viewModules } from './state.js';

const routes = {
  'dashboard': { view: 'overview', js: 'overview.js' },
  'overview': { view: 'overview', js: 'overview.js' },
  'conversations': { view: 'conversations', js: 'conversations.js' },
  'notifications': { view: 'notifications', js: 'notifications.js' },
  'business': { view: 'business', js: 'business.js' },
  'customers': { view: 'customers', js: 'customers.js' },
  'catalogue': { view: 'catalogue', js: 'catalogue.js' },
  'orders': { view: 'orders', js: 'orders.js' },
  'faqs': { view: 'faqs', js: 'faqs.js' },
  'payments': { view: 'payments', js: 'payments.js' },
  'leads': { view: 'leads', js: 'leads.js' },
  'broadcasts': { view: 'broadcasts', js: 'broadcasts.js' },
  'analytics': { view: 'analytics', js: 'analytics.js' },
  'team': { view: 'team', js: 'team.js' },
  'settings': { view: 'settings', js: 'settings.js' },
  'bot': { view: 'bot', js: 'bot.js' },
  'profile': { view: 'profile', js: 'profile.js' }
};

const safeViewModules =
  viewModules && typeof viewModules === "object"
    ? viewModules
    : {
        dashboard: "overview",
        overview: "overview"
      };

const views = Object.fromEntries(
  Object.entries(safeViewModules).map(([route, folder]) => [
    route,
    `views/${folder}/${folder}.html`
  ])
);

export async function loadRoute(route){
  const target=views[route];
  const host=document.getElementById("viewContainer");
  if(!target || !host){
    window.location.hash="dashboard";
    return;
  }
  const response=await fetch(target);
  if(!response.ok) throw new Error(`Could not load ${target}`);
  host.innerHTML=await response.text();
  
  // FIXED: Activate ANY root view by adding 'active' to its first child
  // unless it's the overview which uses dashboard-container (we'll add active anyway)
  const rootView = host.firstElementChild;
  if (rootView) {
    // Remove active from any previously active view (if any)
    // But we only have one at a time, so we just add the class
    rootView.classList.add("active");
    // Also if it's a management-view or workspace-view, we add active too (already covered)
  }
  
  document.querySelectorAll(".nav-item,.bottom-nav button").forEach(el=>el.classList.toggle("active",el.dataset.route===route));

const module =
  route === "dashboard"
    ? "overview"
    : safeViewModules[route];
  try{
    const mod=await import(`../views/${module}/${module}.js`);
    mod.init?.();
  }catch(error){
    console.error(`Failed to initialise ${route}`,error);
  }
}

export async function navigate(route, updateHash=true){
  if(updateHash && location.hash!=="#"+route) history.pushState({route},"","#"+route);
  await loadRoute(route);
}

export function initRouter(){
  window.addEventListener("hashchange",()=>navigate(location.hash.slice(1)||"dashboard",false));
  window.addEventListener("popstate",()=>navigate(location.hash.slice(1)||"dashboard",false));
  return navigate(location.hash.slice(1)||"dashboard",false);
}