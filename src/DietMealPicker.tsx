import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Dialog } from './Dialog';
import { MacroText } from './MealEditor';
import { foodKey, totalNutrition, type DietPlan, type RoutineMeal } from './nutrition';

export function DietMealPicker({ plan, hasDraft, onChoose, onNew, onClose }: {
  plan: DietPlan; hasDraft: boolean; onChoose: (meal: RoutineMeal) => void;
  onNew: () => void; onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const terms = foodKey(query).split(' ');
  const matches = plan.library.filter(meal => terms.every(term => foodKey(meal.name).includes(term)));

  return <Dialog title="Add meal" onClose={onClose}>
    <p className="muted picker-description">Meal library for {plan.name}</p>
    <label className="search">
      <Search size={18} />
      <input aria-label="Search saved meals" placeholder="Search saved meals" value={query} maxLength={80}
        onChange={event => setQuery(event.target.value)} />
    </label>
    <button className="button secondary full custom-button" onClick={onNew}>
      <Plus size={17} /> {hasDraft ? 'Resume meal draft' : 'New meal'}
    </button>
    {matches.length ? <ul className="picker-list">
      {matches.map(meal => <li key={meal.id}>
        <button className="picker-option" onClick={() => onChoose(meal)}>
          <span className="meal-title">
            <strong>{meal.name}</strong><br />
            <MacroText nutrients={totalNutrition(meal.ingredients)} />
          </span>
          <Plus size={17} aria-hidden="true" />
        </button>
      </li>)}
    </ul> : <p className="muted picker-empty">{plan.library.length ? 'No matching meals.' : 'No meals saved to this plan yet.'}</p>}
  </Dialog>;
}
