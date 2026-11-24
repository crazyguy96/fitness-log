import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, CalendarDays, ChartNoAxesCombined, Dumbbell, HardDrive, LayoutDashboard, Layers3, Utensils } from 'lucide-react';
import { Current, Logging } from './Current';
import { Dashboard } from './Dashboard';
import { dashboardStorageKey, trainingWeek, type DashboardData } from './dashboardData';
import { Diet } from './Diet';
import { DietHistory } from './DietHistory';
import { dashboardCalorieTarget, dayKey, dietStorageKey, readDiet, weekdayOf } from './nutrition';
import { History } from './History';
import { Workouts } from './Workouts';
import { newPlan, readData, storageKey as workoutStorageKey, uid, type AppData, type Session, type WorkoutPlan } from './workout';
import './styles.css';
import './diet.css';
import './dashboard.css';

type Route = 'home' | 'gym' | 'gym/plan' | 'gym/workouts' | 'diet' | 'diet/plans'
  | 'dashboard' | 'dashboard/diet-history' | 'dashboard/gym-history';

const storageKey = workoutStorageKey;
const dietKey = dietStorageKey;
const dashboardKey = dashboardStorageKey;

function locationRoute(): Route {
  const hash = window.location.hash.slice(1);
  if (hash === 'gym/history') return 'dashboard/gym-history';
  if (hash === 'diet/history') return 'dashboard/diet-history';
  switch (hash) {
    case 'gym': case 'gym/plan': case 'gym/workouts': case 'diet': case 'diet/plans':
    case 'dashboard': case 'dashboard/diet-history': case 'dashboard/gym-history': return hash;
    default: return 'home';
  }
}

function loadDiet() {
  try { return readDiet(dietKey); } catch { return null; }
}

function loadDashboard(): DashboardData | null {
  try {
    const saved = localStorage.getItem(dashboardKey);
    if (!saved) return { weights: {}, goal: null };
    const data = JSON.parse(saved) as DashboardData;
    return data && data.weights && typeof data.weights === 'object' && (data.goal === null || data.goal) ? data : null;
  } catch { return null; }
}

function useLocalData<T>(key: string, read: () => T | null) {
  const [data, setData] = useState(read);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === key && !pending) setData(read());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key, pending, read]);

  function save(next: T, keepEdits = false) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setData(next);
      setPending(false);
      return true;
    } catch {
      if (keepEdits) { setData(next); setPending(true); }
      return false;
    }
  }

  return { data, save, pending, reload: () => setData(read()) };
}

function load() {
  try { return readData(storageKey); } catch { return null; }
}

function LoadFailure({ title, onRetry }: { title: string; onRetry: () => void }) {
  return <section className="panel empty-state">
    <h1>{title}</h1><p>Check that this browser allows website storage, then try again.</p>
    <button className="button primary" onClick={onRetry}>Retry</button>
  </section>;
}

function App() {
  const [data, setData] = useState<AppData | null>(load);
  const [route, setRoute] = useState<Route>(locationRoute);
  const section = route.split('/')[0];
  const diet = useLocalData(dietKey, loadDiet);
  const dashboard = useLocalData(dashboardKey, loadDashboard);
  const dietPlan = diet.data?.plans.find(item => item.id === diet.data?.activePlanId);
  const goalCalories = dashboardCalorieTarget(dashboard.data?.goal);
  const [today, setToday] = useState(dayKey);
  const [selectedDay, setDayIndex] = useState<number | null>(null);
  const todayIndex = weekdayOf(today);
  const dayIndex = selectedDay ?? todayIndex;
  const [pending, setPending] = useState<AppData | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const plan = data?.plans.find(item => item.id === data.activePlanId);

  useEffect(() => {
    let timer: number;
    function refresh() {
      window.clearTimeout(timer);
      const now = new Date();
      setToday(dayKey(now));
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(refresh, midnight.getTime() - now.getTime());
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener('focus', refresh); };
  }, []);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === storageKey && !pending) setData(load());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [pending]);

  useEffect(() => {
    function syncSection() {
      setRoute(locationRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, []);

  function navigate(next: Route, openSaved = false) {
    if (!openSaved) setSavedId(null);
    setRoute(next);
    window.location.hash = next === 'home' ? '' : next;
    window.scrollTo(0, 0);
  }

  function persist(next: AppData, keepEdits: boolean) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setData(next);
      setPending(null);
      return true;
    } catch {
      if (keepEdits) setData(next);
      setPending(next);
      return false;
    }
  }

  function selectWorkout(id: string, keepEdits: boolean) {
    if (!data?.plans.some(item => item.id === id)) return false;
    if (id === data.activePlanId) return true;
    const saved = persist({ ...data, activePlanId: id }, keepEdits);
    if (saved || keepEdits) setDayIndex(null);
    return saved;
  }

  function updatePlan(next: WorkoutPlan) {
    if (data) persist({ ...data, plans: data.plans.map(item => item.id === next.id ? next : item) }, true);
  }

  function saveWorkout() {
    if (!data || !plan?.draft || plan.draftDate !== dayKey()) return;
    const session: Session = { ...plan.draft, id: uid(), date: new Date().toISOString(), planId: plan.id, planName: plan.name, dayIndex: plan.draftDayIndex };
    const plans = data.plans.map(item => item.id === plan.id ? { ...item, draft: null, draftDayIndex: undefined, draftDate: undefined } : item);
    const next = { ...data, plans, sessions: [session, ...data.sessions] };
    if (persist(next, false)) showSaved(session.id);
  }

  function showSaved(id: string) {
    setSavedId(id);
    window.scrollTo(0, 0);
  }

  function retrySave() {
    if (!pending || !data) return;
    const savingSession = pending.sessions.length > data.sessions.length;
    if (persist(pending, !savingSession) && savingSession) showSaved(pending.sessions[0].id);
  }

  if (section === 'home') return <main className="fitness-home">
    <span className="brand-icon"><Activity size={26} strokeWidth={2.5} /></span>
    <h1>Fitness Log</h1>
    <div className="fitness-areas">
      <button className="panel fitness-area" aria-label="Gym Log" onClick={() => navigate('gym')}>
        <span className="empty-icon"><Dumbbell size={25} /></span>
        <strong>Gym Log</strong>
        <span>Plan workouts and log sets.</span>
      </button>
      <button className="panel fitness-area" aria-label="Diet" onClick={() => navigate('diet')}>
        <span className="empty-icon"><Utensils size={25} /></span>
        <strong>Diet</strong>
        <span>Plan meals and track nutrition.</span>
      </button>
      <button className="panel fitness-area" aria-label="Dashboard" onClick={() => navigate('dashboard')}>
        <span className="empty-icon"><LayoutDashboard size={25} /></span>
        <strong>Dashboard</strong>
        <span>Set a weight goal and review your progress.</span>
      </button>
    </div>
  </main>;

  return <div className="shell">
    <aside className="sidebar">
      <button className="brand brand-home" aria-label="Back to Fitness Log" onClick={() => navigate('home')}>
        <span className="brand-icon"><Activity size={23} strokeWidth={2.5} /></span><span>Fitness Log</span>
      </button>
      <span className="section-caption">{section === 'gym' ? 'Gym Log' : section === 'diet' ? 'Diet' : 'Dashboard'}</span>
      {section === 'gym' && <nav className="gym-nav" aria-label="Gym Log tabs">
        <button aria-current={route === 'gym' || route === 'gym/plan' ? 'page' : undefined} onClick={() => navigate('gym')}>
          <CalendarDays size={20} /><span>Current</span>
        </button>
        <button aria-current={route === 'gym/workouts' ? 'page' : undefined} onClick={() => navigate('gym/workouts')}>
          <Layers3 size={20} /><span>Workouts</span>
        </button>
      </nav>}
      {section === 'diet' && <nav className="gym-nav" aria-label="Diet tabs">
        <button aria-current={route === 'diet' ? 'page' : undefined} onClick={() => navigate('diet')}>
          <CalendarDays size={20} /><span>Current</span>
        </button>
        <button aria-current={route === 'diet/plans' ? 'page' : undefined} onClick={() => navigate('diet/plans')}>
          <Layers3 size={20} /><span>Diet plans</span>
        </button>
      </nav>}
      {section === 'dashboard' && <nav className="gym-nav" aria-label="Dashboard tabs">
        <button aria-current={route === 'dashboard' ? 'page' : undefined} onClick={() => navigate('dashboard')}>
          <LayoutDashboard size={20} /><span>Overall</span>
        </button>
        <button aria-current={route === 'dashboard/diet-history' ? 'page' : undefined} onClick={() => navigate('dashboard/diet-history')}>
          <Utensils size={20} /><span>Diet History</span>
        </button>
        <button aria-current={route === 'dashboard/gym-history' ? 'page' : undefined} onClick={() => navigate('dashboard/gym-history', true)}>
          <ChartNoAxesCombined size={20} /><span>Gym History</span>
        </button>
      </nav>}
      <div className="local-status"><HardDrive size={16} /> Stored on this device</div>
    </aside>
    <main id="main">
      {section === 'diet' && (diet.data ? <Diet
        tab={route === 'diet/plans' ? 'plans' : 'current'} onTab={next => navigate(next === 'plans' ? 'diet/plans' : 'diet')}
        data={diet.data} today={today} persist={next => diet.save(next, true)} pending={diet.pending}
        onRetry={() => diet.data && diet.save(diet.data, true)} goalCalories={goalCalories} onDashboard={() => navigate('dashboard')} />
        : <LoadFailure title="Couldn’t load Diet" onRetry={diet.reload} />)}
      {route === 'dashboard' && (dashboard.data && data && plan && diet.data && dietPlan
        ? <Dashboard data={dashboard.data} workouts={data} workout={plan} diet={diet.data} dietPlan={dietPlan}
          save={dashboard.save} onGymHistory={() => navigate('dashboard/gym-history')} onDietHistory={() => navigate('dashboard/diet-history')}
          onEditWorkout={() => navigate('gym/plan')}
          onChangeWorkout={id => selectWorkout(id, false)} onManageWorkouts={() => navigate('gym/workouts')}
          onChangeDiet={id => !!diet.data && diet.save({ ...diet.data, activePlanId: id })}
          onManageDiets={() => navigate('diet/plans')}
          onEditDiet={() => navigate('diet')} />
        : <LoadFailure title="Couldn’t load Dashboard" onRetry={() => { dashboard.reload(); diet.reload(); setData(load()); }} />)}
      {route === 'dashboard/diet-history' && (diet.data
        ? <DietHistory meals={diet.data.meals} plans={diet.data.plans} calorieTarget={goalCalories} onCurrent={() => navigate('diet')} />
        : <LoadFailure title="Couldn’t load diet history" onRetry={diet.reload} />)}
      {route === 'dashboard/gym-history' && (data
        ? <History sessions={data.sessions} plans={data.plans} savedId={savedId} onCurrent={() => navigate('gym')} />
        : <LoadFailure title="Couldn’t load workout history" onRetry={() => setData(load())} />)}
      {section === 'gym' && <>
      {pending && <div role="alert" className="notice">
        <span>Couldn’t save to this browser. Your edits are still open.</span>
        <button className="text-button" onClick={retrySave}>Retry</button>
      </div>}
      {!data || !plan ? <section className="panel empty-state">
        <h1>Couldn’t load workout data</h1>
        <p>Check that this browser allows website storage, then try again.</p>
        <button className="button primary" onClick={() => setData(load())}>Retry</button>
      </section> : route === 'gym/workouts' ? <Workouts plans={data.plans} activePlanId={plan.id}
          onAdd={name => persist({ ...data, plans: [...data.plans, newPlan(uid(), name)] }, true)}
          onRename={(id, name) => {
            const selected = data.plans.find(item => item.id === id);
            if (selected) updatePlan({ ...selected, name });
          }}
          onOpen={id => {
            selectWorkout(id, true);
            navigate('gym');
          }} />
        : plan.draft && route !== 'gym/plan' ? <Logging draft={plan.draft} planName={plan.name} locked={plan.draftDate !== today}
          onEditPlan={() => navigate('gym/plan')}
          onChange={draft => {
            if (plan.draftDate === dayKey()) updatePlan({ ...plan, draft });
          }} onSave={saveWorkout} onDiscard={() => {
          updatePlan({ ...plan, draft: null, draftDayIndex: undefined, draftDate: undefined });
          window.scrollTo(0, 0);
        }} />
        : <Current data={data} plan={plan} dayIndex={dayIndex} todayIndex={todayIndex} setDayIndex={setDayIndex} onChange={next => persist(next, true)}
          saved={!!savedId} onHistory={() => navigate('dashboard/gym-history', true)}
          training={trainingWeek(plan, data.sessions, today)} onDashboard={() => navigate('dashboard')} onStart={() => {
            if (plan.draft) { navigate('gym'); return; }
            const date = dayKey();
            if (dayIndex !== weekdayOf(date) || plan.days[dayIndex].rest) return;
            updatePlan({ ...plan, draft: plan.days[dayIndex], draftDayIndex: dayIndex, draftDate: date });
            navigate('gym');
          }} />}
      </>}
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
