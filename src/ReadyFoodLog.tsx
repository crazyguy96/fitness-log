import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog } from './Dialog';
import { nutrientLabels } from './foods';
import { MacroText, nutrientValue } from './MealEditor';
import { nutrientKeys, parseMeal, resolveIngredient, searchFoods, totalNutrition, type Ingredient, type Meal, type Nutrition } from './nutrition';
import { readyFoodCategories, readyFoods } from './readyFoods';
import { uid } from './workout';

type FoodLogProps = {
  meal: Meal | null; onClose: () => void; onSave: (name: string, ingredient: Ingredient) => void;
};

function OwnFoodForm({ meal, name, onSave, onBack }: Pick<FoodLogProps, 'meal' | 'onSave'> & {
  name: string; onBack: () => void;
}) {
  const saved = meal?.ingredients[0];
  const [label, setLabel] = useState(name);
  const [values, setValues] = useState(() => Object.fromEntries(nutrientKeys.map(key =>
    [key, String(saved?.reportedNutrition?.[key] ?? '')])) as Record<keyof Nutrition, string>);
  const valid = !!label.trim() && nutrientKeys.every(key => /^\d+(?:[.,]\d+)?$/.test(values[key].trim()));

  return <form onSubmit={event => {
    event.preventDefault();
    if (!valid) return;
    const name = label.trim();
    const reportedNutrition = Object.fromEntries(nutrientKeys.map(key =>
      [key, Number(values[key].replace(',', '.'))])) as Nutrition;
    onSave(name, {
      food: { id: saved?.reportedNutrition ? saved.food.id : uid(), name, source: 'Entered by you', per100: totalNutrition([]) },
      grams: 0, measure: { amount: 1, unit: 'serving' }, reportedNutrition,
    });
  }}>
    <p className="muted picker-description">Enter the nutrition totals for the amount you ate.</p>
    <label className="field-label">Food name
      <input autoFocus value={label} maxLength={100} onChange={event => setLabel(event.target.value)} />
    </label>
    <div className="diet-fields">
      {nutrientKeys.map(key => <label className="field-label" key={key}>{nutrientLabels[key]} ({key === 'calories' ? 'kcal' : 'g'})
        <input inputMode="decimal" maxLength={12} value={values[key]}
          onChange={event => setValues({ ...values, [key]: event.target.value })} />
      </label>)}
    </div>
    <div className="dialog-actions">
      <button className="button secondary" type="button" onClick={onBack}>{saved?.reportedNutrition ? 'Cancel' : 'Back to search'}</button>
      <button className="button primary" disabled={!valid}>{meal ? 'Save changes' : 'Log as eaten'}</button>
    </div>
  </form>;
}

export function ReadyFoodLog({ meal, onClose, onSave }: FoodLogProps) {
  const saved = meal?.ingredients[0];
  const [query, setQuery] = useState(saved?.food.name ?? '');
  const [ownFood, setOwnFood] = useState(!!saved?.reportedNutrition);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedId, setSelectedId] = useState(saved?.food.id ?? '');
  const [amountOverride, setAmountOverride] = useState<string | null>(
    saved ? String(saved.measure?.amount ?? saved.grams) : null,
  );
  const [savedUnit, setSavedUnit] = useState(saved ? saved.measure?.unit ?? 'g' : undefined);
  const row = query.trim() ? parseMeal(query, readyFoods, true).ingredients[0] : undefined;
  const choices = searchFoods(readyFoods, row?.query ?? query);
  const food = readyFoods.find(item => item.id === (selectedId || row?.food?.id))
    ?? (choices.length === 1 && row?.unit === choices[0].portion.unit ? choices[0] : undefined);
  const unit = savedUnit ?? (food?.byWeight || (row?.unit === 'g' && row.amount) ? 'g'
    : row?.unit === 'ml' && food?.volume ? 'ml' : food?.portion.unit ?? 'g');
  const amount = amountOverride ?? (row?.unit === unit ? row.amount : '');
  const ingredient = food ? resolveIngredient({ id: food.id, query, food, unit, amount }) : null;
  const nutrients = ingredient && totalNutrition([ingredient]);
  const amountLabel = unit === 'g' ? 'Grams eaten' : unit === 'ml' ? 'Millilitres consumed'
    : unit === 'slice' ? 'Slices eaten' : unit === 'piece' ? 'Pieces eaten' : 'Servings eaten';
  const visibleChoices = categoryFilter ? choices.filter(choice => choice.category === categoryFilter) : choices;

  return <Dialog title={meal ? 'Edit logged food' : 'Ate something else'} onClose={onClose}>
    {ownFood ? <OwnFoodForm meal={meal} name={saved?.reportedNutrition ? saved.food.name : row?.query ?? query.trim()}
      onSave={onSave} onBack={saved?.reportedNutrition ? onClose : () => setOwnFood(false)} /> : <form onSubmit={event => {
      event.preventDefault();
      if (ingredient && nutrients && Number.isFinite(nutrients.calories)) onSave(ingredient.food.name, ingredient);
    }}>
      <p className="muted picker-description">Add food you ate outside your meal plan.</p>
      <label className="field-label">What did you eat?
        <input maxLength={100} value={query} placeholder="e.g. chicken biryani or two momos" onChange={event => {
          setQuery(event.target.value); setSelectedId(''); setAmountOverride(null); setSavedUnit(undefined); setCategoryFilter('');
        }} />
      </label>
      <button type="button" className="text-button" onClick={() => setOwnFood(true)}><Plus size={16} /> Add your own food</button>
      {!query.trim() && !food && <label className="field-label">Browse by category
        <select className="ready-food-category" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
          <option value="">All foods ({readyFoods.length})</option>
          {readyFoodCategories.map(category => <option key={category}>{category}</option>)}
        </select>
      </label>}
      {!choices.length && <p className="muted picker-description">{parseMeal(query, readyFoods).ingredients.length > 1
        ? 'Add each food separately.' : 'No matching foods. Try another name or add your own food.'}</p>}
      {!selectedId && visibleChoices.length > 0 && <div className="picker-list ready-food-choices">
        {readyFoodCategories.map(category => {
          const matches = visibleChoices.filter(choice => choice.category === category);
          return matches.length > 0 && <section key={category} aria-label={category}>
            <h3>{category}</h3>
            <ul>{matches.map(choice => <li key={choice.id}>
              <button type="button" className="picker-option" aria-pressed={choice.id === food?.id}
                onClick={() => {
                  setSelectedId(choice.id);
                  if (choice.id !== food?.id) setAmountOverride(null);
                }}>
                <strong>{choice.name}</strong><span>{nutrientValue(choice.per100.calories * choice.portion.grams / 100)} kcal per {choice.byWeight ? '100 g' : choice.portion.unit}</span>
              </button>
            </li>)}</ul>
          </section>;
        })}
      </div>}
      {food && <div className="ready-food-review">
        {selectedId && <div className="ready-food-selection"><strong>{food.name}</strong>
          <button type="button" className="text-button" onClick={() => {
            setSelectedId(''); setAmountOverride(null); setSavedUnit(undefined);
          }}>Browse foods</button>
        </div>}
        <label className="field-label">{amountLabel}<input inputMode="decimal" maxLength={9} value={amount}
          onChange={event => setAmountOverride(event.target.value)} /></label>
        {!ingredient && <p className="muted">Enter how much you ate.</p>}
        {nutrients && <div aria-label="Food estimate" className="ready-food-total"><strong>Estimated nutrition</strong><MacroText nutrients={nutrients} /></div>}
        <p className="muted">Reference portion · {food.reference}. Portions and recipes vary.</p>
        <a className="diet-source" href={food.sourceUrl} target="_blank" rel="noreferrer">{food.source}</a>
      </div>}
      <div className="dialog-actions">
        <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={!nutrients || !Number.isFinite(nutrients.calories)}>{meal ? 'Save changes' : 'Log as eaten'}</button>
      </div>
    </form>}
  </Dialog>;
}
