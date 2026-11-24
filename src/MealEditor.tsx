import { useState } from 'react';
import { CircleHelp, Plus, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { nutrientLabels } from './foods';
import {
  conversionFor, foodKey, ingredientDraft, nutrientKeys, parseMeal, portionLabel, positiveNumber, resolveIngredient,
  resolveIngredients, searchFoods, totalNutrition, type Food, type Ingredient, type IngredientDraft, type MealDraft, type Nutrition, type PortionUnit,
} from './nutrition';
import { uid } from './workout';

const formatNutrition = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
export const nutrientValue = (value: number) => formatNutrition.format(value);

export function MacroText({ nutrients }: { nutrients: Nutrition }) {
  return <span className="macro-text">
    <span>{nutrientValue(nutrients.calories)} kcal</span>
    <span>{nutrientValue(nutrients.protein)} g protein</span>
    <span>{nutrientValue(nutrients.carbs)} g carbs</span>
    <span>{nutrientValue(nutrients.fat)} g fat</span>
  </span>;
}

function CustomFood({ name, onCreate, onClose }: { name: string; onCreate: (food: Food) => void; onClose: () => void }) {
  const [label, setLabel] = useState(name);
  const [serving, setServing] = useState('100');
  const [values, setValues] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const grams = positiveNumber(serving);
  const valid = !!label.trim() && grams !== null && nutrientKeys.every(key =>
    /^\d+(?:[.,]\d+)?$/.test(values[key].trim()) && Number.isFinite(Number(values[key].replace(',', '.')))
  );

  return <Dialog title="Enter nutrition label" onClose={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      if (!valid || grams === null) return;
      const per100 = Object.fromEntries(nutrientKeys.map(key => [key, Number(values[key].replace(',', '.')) * 100 / grams])) as Nutrition;
      if (nutrientKeys.some(key => !Number.isFinite(per100[key]))) return;
      onCreate({ id: uid(), name: label.trim(), source: 'Your nutrition label', per100, portion: { unit: 'serving', grams } });
    }}>
      <label className="field-label">Food name<input autoFocus value={label} maxLength={80} onChange={event => setLabel(event.target.value)} /></label>
      <label className="field-label">Weight on label (g)<input inputMode="decimal" maxLength={9} value={serving} onChange={event => setServing(event.target.value)} /></label>
      <div className="diet-fields">
        {nutrientKeys.map(key => <label className="field-label" key={key}>{nutrientLabels[key]} ({key === 'calories' ? 'kcal' : 'g'})
          <input inputMode="decimal" maxLength={12} value={values[key]} onChange={event => setValues({ ...values, [key]: event.target.value })} />
        </label>)}
      </div>
      <div className="dialog-actions">
        <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={!valid}>Save ingredient</button>
      </div>
    </form>
  </Dialog>;
}

export function MealEditor({ draft, foods, onChange, onCustomFood, onSave, onClose, title }: {
  title?: string;
  draft: MealDraft;
  foods: Food[];
  onChange: (draft: MealDraft) => void;
  onCustomFood: (food: Food, draft: MealDraft) => void;
  onSave: (ingredients: Ingredient[]) => void;
  onClose: () => void;
}) {
  const [customRow, setCustomRow] = useState<IngredientDraft | null>(null);
  const ingredients = resolveIngredients(draft.ingredients);
  const totals = ingredients ? totalNutrition(ingredients) : null;
  const canSave = !!draft.name.trim() && ingredients !== null;
  const missing = draft.ingredients.filter(row => row.query && positiveNumber(row.amount) === null);
  const unmatched = draft.ingredients.filter(row => !row.food);

  function updateRow(id: string, change: Partial<IngredientDraft>) {
    onChange({ ...draft, ingredients: draft.ingredients.map(row => row.id === id ? { ...row, ...change } : row) });
  }

  function checkIngredients() {
    const parsed = parseMeal(draft.description, foods);
    const previous = [...draft.ingredients];
    const detected = parsed.ingredients.map(row => {
      const index = previous.findIndex(item => foodKey(item.query) === foodKey(row.query) ||
        (row.food && item.food?.id === row.food.id));
      if (index < 0) return row;
      const [prior] = previous.splice(index, 1);
      return row.amount ? { ...row, id: prior.id, food: prior.food ?? row.food } : { ...row, ...prior };
    });
    onChange({ ...draft, name: draft.name || parsed.name, ingredients: [...detected, ...previous.filter(row => row.query || row.amount)] });
  }

  return <section className="panel meal-editor" aria-labelledby="meal-editor-title">
    <div className="section-heading">
      <h2 id="meal-editor-title">{title ?? (draft.id ? 'Edit meal' : 'New meal')}</h2>
      <button className="icon-button" aria-label="Close meal editor" onClick={onClose}><X size={19} /></button>
    </div>
    <label className="field-label">Meal description
      <textarea aria-label="Meal description" value={draft.description} onChange={event => onChange({ ...draft, description: event.target.value })}
        maxLength={600} rows={2} placeholder="e.g. Paneer toast with 80 g paneer and 50 g whole-wheat toast" />
    </label>
    <button className="button secondary" disabled={!draft.description.trim()} onClick={checkIngredients}>Check ingredients</button>
    <label className="field-label meal-name">Meal name<input value={draft.name} maxLength={80} placeholder="e.g. Paneer toast"
      onChange={event => onChange({ ...draft, name: event.target.value })} /></label>

    <h3>Ingredients</h3>
    {draft.ingredients.map((row, index) => {
      const matches = !row.food ? searchFoods(foods, row.query).slice(0, 7) : [];
      const amount = positiveNumber(row.amount);
      const conversion = row.food ? conversionFor(row.food, row.unit) : null;
      const portion = resolveIngredient(row);
      return <div className="ingredient-row" key={row.id}>
        <div className="ingredient-inputs">
          <label className="field-label">Ingredient {index + 1}
            <input value={row.query} maxLength={100} placeholder="Search foods" onChange={event => updateRow(row.id, { query: event.target.value, food: undefined, equivalentGrams: undefined })} />
          </label>
          <label className="field-label">Amount
            <input inputMode="decimal" maxLength={9} value={row.amount} placeholder="0"
              aria-label={(row.unit === 'g' ? 'Grams of ' : 'Amount of ') + (row.food?.name ?? 'ingredient ' + (index + 1))}
              onChange={event => updateRow(row.id, { amount: event.target.value, equivalentGrams: undefined })} />
          </label>
          <label className="field-label">Unit
            <select aria-label={'Unit for ingredient ' + (index + 1)} value={row.unit} onChange={event => updateRow(row.id, { unit: event.target.value as PortionUnit, equivalentGrams: undefined })}>
              <option value="g">g</option><option value="ml">mL</option><option value="slice">Slices</option>
              <option value="piece">Pieces</option><option value="serving">Servings</option>
            </select>
          </label>
          <button className="icon-button" aria-label={'Remove ingredient ' + (index + 1)}
            onClick={() => onChange({ ...draft, ingredients: draft.ingredients.filter(item => item.id !== row.id) })}><X size={17} /></button>
        </div>
        {row.food ? <div className="ingredient-meta">
          {row.food.sourceUrl ? <a className="diet-source" href={row.food.sourceUrl} target="_blank" rel="noreferrer">{row.food.source}</a>
            : <span>{row.food.source}</span>}
          {conversion && !row.equivalentGrams && <span>{portionLabel(conversion.amount, row.unit, nutrientValue)} ≈ {nutrientValue(conversion.grams)} g</span>}
          {row.unit !== 'g' && amount !== null && (!conversion || row.equivalentGrams !== undefined) && <label className="field-label equivalent-weight">
            Weight of {portionLabel(amount, row.unit, nutrientValue)} (g)
            <input aria-label={'Equivalent grams of ' + row.food.name} inputMode="decimal" maxLength={9} value={row.equivalentGrams ?? ''}
              onChange={event => updateRow(row.id, { equivalentGrams: event.target.value })} />
          </label>}
          {portion && <MacroText nutrients={totalNutrition([portion])} />}
          {row.unit !== 'g' && amount !== null && !portion && <span role="status">How many grams does this portion weigh?</span>}
        </div> : <>
          <div className="food-match-list">
            {matches.map(food => <button className="button secondary" key={food.id} onClick={() => updateRow(row.id, { food, query: food.name })}>{food.name}</button>)}
          </div>
          {!!row.query && !matches.length && <p className="muted">No foods match this ingredient.</p>}
        </>}
        {!row.food && <button className="text-button nutrition-label-action" onClick={() => setCustomRow(row)}><Plus size={16} /> Use nutrition label</button>}
        {row.food && <button className="text-button nutrition-label-action" onClick={() => setCustomRow(row)}>Use a different nutrition label</button>}
      </div>;
    })}
    <button className="text-button" onClick={() => onChange({ ...draft, ingredients: [...draft.ingredients, ingredientDraft()] })}><Plus size={17} /> Add ingredient</button>

    {(missing.length > 0 || unmatched.length > 0) && <div className="meal-clarification" role="status">
      <CircleHelp size={18} />
      <div>
        {missing.map(row => <p key={row.id}>How {row.unit === 'g' || row.unit === 'ml' ? 'much' : 'many'} {row.food?.name ?? row.query} did you use? Enter the amount and unit.</p>)}
        {unmatched.length > 0 && <p>Choose a food match or enter its nutrition label.</p>}
      </div>
    </div>}
    {totals && <div className="meal-editor-total"><strong>Meal total</strong><MacroText nutrients={totals} /></div>}
    <div className="meal-editor-actions">
      <button className="button primary" disabled={!canSave} onClick={() => { if (canSave) onSave(ingredients); }}>Save meal</button>
    </div>
    {customRow && <CustomFood name={customRow.query} onClose={() => setCustomRow(null)} onCreate={food => {
      onCustomFood(food, { ...draft, ingredients: draft.ingredients.map(row => row.id === customRow.id ? { ...row, food, query: food.name, equivalentGrams: undefined } : row) });
      setCustomRow(null);
    }} />}
  </section>;
}
