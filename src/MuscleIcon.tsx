import type { Muscle } from './workout';

// Numeric entries index the four-column illustration sheet in reading order.
const illustrations: Record<Muscle, number | string> = {
  Chest: 0, Back: 1, Shoulders: 2, Biceps: 'biceps.webp',
  Triceps: 'triceps.png', Quadriceps: 5, Hamstrings: 6, Glutes: 7,
  Calves: 8, Core: 9, Forearms: 'forearms.webp', Traps: 11,
};

export function MuscleIcon({ muscle }: { muscle: Muscle }) {
  const tile = illustrations[muscle];
  if (typeof tile === 'string') {
    return <img className="muscle-illustration single-arm-illustration" src={'/illustrations/' + tile} alt="" />;
  }
  const column = tile % 4;
  const row = Math.floor(tile / 4);
  return <span className="muscle-illustration" aria-hidden="true"
    style={{ backgroundPosition: `${column / 3 * 100}% ${row * 50}%` }} />;
}
