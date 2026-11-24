# Fitness Log V1

## Product goal

Fitness Log brings workout, meal, and weight tracking into one app. **Gym Log** is where users plan workouts and log sets. **Diet** is where they plan meals and track intake. **Dashboard** is where they plan their overall weight goal, log weigh-ins, and review progress and history from both sections.

## Gym Log

Gym Log contains the **Current** and **Workouts** tabs. The Fitness Log home screen opens Gym Log at **Current** and shows Gym Log’s tabs. Selecting the Fitness Log brand returns to the home screen.

### Current

- Provide seven customizable days, initially named Day 1 through Day 7. The user can rename each day or mark it as a rest day. Switching back to a workout day restores any exercises already planned for it.
- Match Day 1 through Day 7 to Monday through Sunday using the device’s local date. Default to today, allow editing every weekday template, and allow logging only for today’s workout. Drafts dated today can be resumed. Older or undated drafts remain viewable and can be discarded.
- Each day can contain multiple muscle groups, and each group can contain multiple exercises.
- Include a built-in exercise library. Search suggestions match the typed name and are limited to exercises assigned to the selected muscle group. A dedicated **Add custom exercise** action saves a named exercise to the day and to that muscle group's library across plans.
- Each exercise has individual set rows. The user can add or remove sets and enter reps and weight in kilograms for each set. A blank weight can represent a set performed without a recorded load.
- Starting a workout copies the selected day's planned sets into a session. Each set can be ticked and unticked independently. The workout shows how many sets are complete, and the ticks survive reloading or visiting Dashboard. The user can adjust actual reps and weights and save the status of every set after completing at least one. The original plan stays available for the next session.

### Workouts

- Create, rename, and switch between multiple named seven-day plans, such as Prep and Off Prep. Current shows the active plan. Each plan has its own days and workout draft. The exercise library is shared.
- Move existing days, drafts, and history into **My workout** when loading data from a prior version. Earlier session records contain the completed sets saved at the time.

## Diet

- Diet contains **Current** and **Diet plans**. **Diet plans** lists named plans and lets the user choose an active plan and edit its calorie, protein, carb, and fat targets. **Current** shows the active plan's Monday-to-Sunday schedule, supports adding and editing meals for each weekday, and shows one meal list for the selected date. The list includes existing dated meals and matches previously recorded routine meals to their weekday entries.
- Each diet plan has a meal library with the user’s meal names, ingredients, portions, calories, and macros. The user can create and edit library meals in **Diet plans**. Existing weekday meals populate their plan’s library on upgrade.
- **Current → Add meal** searches only the active plan’s library. Choosing a saved meal adds a copy to the selected weekday. **New meal** saves to both the weekday and the library. Editing a library meal changes future selections, and removing a meal from the weekday leaves it available in the library.
- Each diet plan owns its manual calorie and macro targets. Earlier saved plans inherit any previously shared targets as starting values. With a weight goal mode active, the calorie target saved on Dashboard is the target shown for the active diet plan. The plan’s saved manual target is available again when the Dashboard goal mode is turned off.
- **Current → Ate something else** offers at least 150 searchable foods, including at least 50 Indian dishes, across snacks, mains, rice and biryani, breakfast and breads, fast food, sweets, and drinks. Guide selection with published delivery trends and Indian food rankings. Show calories and a reference amount in the picker, then calculate calories and macros for the amount eaten and show the source. Accept counts, weights, and volumes when the reference supports them, and require any missing quantity. **Add your own food** accepts the food name and total calories, protein, carbs, and fat for the amount already eaten. Save entries as eaten for today with same-day editing and deletion. Include them in daily totals, unplanned calories, and history. Keep them out of the routine, meal library, and routine adherence.
- Open on the device’s local date. Allow editing weekday routines on any date. Only today supports marking or unmarking meals as eaten, editing a dated log, or logging unplanned food. Keep eaten entries as snapshots when a routine is edited or removed. Provide an explicit edit action for today’s eaten entries. Count checked meals toward daily calories and macros, and show a projection for the full list.
- Accept a meal description with ingredient quantities or individual food entries. Support grams, millilitres, slices, pieces, and servings. Convert to grams using the selected food's reference portion, then scale its per-100 g nutrients and sum them for the meal. Store the original units alongside the resolved weight. Use common Indian foods first, with a broader food library and custom entries from package labels. [Indian Food Composition Tables](https://www.nin.res.in/ebooks/IFCT2017.pdf) · [USDA FoodData Central](https://fdc.nal.usda.gov/data-documentation/)
- If ingredients, quantities, or the weight equivalent of a portion are missing, ask for the specific details and keep the entry as an incomplete draft. Show the source and any conversion before saving. A saved recipe can use the weight of the serving if the recipe has a recorded finished weight.
- Estimate an editable daily protein target by multiplying body weight by the selected training-mode multiplier. Starting presets are 1.2 g/kg for light activity, 1.5 g/kg for regular lifting, and 1.8 g/kg for competition prep. Allow a custom multiplier or a fixed daily target. [Sports nutrition position statement](https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf)
- **What to eat next** shows the unchecked meals from the selected day’s list, in list order, with calories and macros.

## Dashboard

Dashboard contains **Overall**, **Diet History**, and **Gym History**. Overall follows the currently active workout and diet plans. The history tabs retain existing records and let users filter them by plan.

### Overall

- Keep overall weight goals, Cut, Bulk, Maintain, and target review in **Overall**. Store a starting weight, goal weight, timeframe, and profile for the shared goal. When upgrading, prefill the goal for review from the active diet plan’s existing Cut mode settings when available.
- Ask for today’s weight when the user opens **Overall** and has no weigh-in for the local date. Save one entry per date in kilograms and let the user correct it. Show the latest entry, a weight chart, and the current and previous weekly averages when available. Leave gaps on dates without entries and average recorded weights only.
- Show the active workout’s scheduled training days and saved sessions for the current week. Count each scheduled training day at most once and exclude rest days and in-progress sessions. Users continue to specify the exercises, sets, reps, and loads in Gym Log.
- Show the active diet’s planned calories and protein alongside the goal targets and logged intake. Show which days have incomplete meal logs. Use the saved calorie target in **Diet → Current**. Display weekly workout progress in **Gym Log → Current**, with a link to **Dashboard → Overall**.
- Show **Edit workout**, **Change workout**, **Edit diet**, and **Change diet** on the same row as their active plan names. Changes select a saved plan in place and refresh Dashboard progress. Drafts and history stay with their original plans. Opening the workout plan editor preserves an in-progress session and offers a way to resume it.
- Updating a weigh-in updates the weight trend. Changes to the goal’s calorie target take effect when the user reviews and saves the target.
- Validate calorie profile fields before calculating or saving a goal. Flag values outside the calculator’s input bounds for adult age, centimetres, and kilograms with a field-specific message.
- On **Dashboard → Overall**, use the profile and activity level to estimate maintenance calories. **Cut** requires a lower goal weight and estimates a deficit. **Bulk** requires a higher goal weight and starts with a surplus of 5% of estimated maintenance, capped at 250 kcal/day. **Maintain** uses the starting weight as its reference and estimates maintenance calories. Show the mismatch and highlight the goal-weight field when the selected mode and weights disagree. In Cut, an optional timeframe in months shows the requested weekly loss and adjusts the starting calorie target. If it requires more than a 750 kcal/day deficit or falls below the existing intake floor, explain the calculator limit, prompt for a longer timeframe, and link to NIH guidance on health risks from rapid weight loss. For goal weights below BMI 18.5, explain the height-based limit and prompt for a different goal weight. Start at four months when Cut mode is enabled with a blank timeframe. Clearing the field uses the gradual estimate. Calculate the Dashboard calorie target from the goal and profile, including the timeframe for Cut. Apply it to the active diet plan on save. Diet plan calorie inputs are available when the Dashboard target is off or when editing an inactive plan. Keep protein separately adjustable. [NIH Body Weight Planner](https://www.niddk.nih.gov/bwp)

### Diet History

- Filter by plan. Show daily records and calorie and protein averages for logged days. Calculate routine adherence as meals marked eaten divided by routine meals recorded for the dates where the user tracked meals. Future planned meals are excluded until their date arrives.
- Compare daily calories with the current Dashboard calorie target on a shared scale. Show the target line even when all logged days are below it, and label the kcal above target on days that exceed it. Show intake alone when no Dashboard target is set.

### Gym History

- List saved sessions by date, newest first, and allow filtering by workout plan. Opening a session shows the day name, muscle groups, exercises, and the status of each set. Completed sets show their recorded reps and weight.
- Provide an exercise selector for two progress charts. **Heaviest set** shows the highest completed weight per session for that exercise. **Training volume** shows the sum of reps × weight for its completed sets with recorded weights, in kg·reps. Sessions without completed weighted sets remain in the log.
- Show total sessions, completed sets, and recorded unchecked sets as summary counts. Show session history and analytics in **Dashboard → Gym History**.
- Preserve saved sessions when the user edits a day, exercise, or planned set. Match the same exercise across sessions, including when it appears on multiple days.

## V1 platform

A React and TypeScript web app with a desktop layout on Mac and a touch layout on iPhone. The Mac can serve it locally, and the iPhone can open it in Safari over the same Wi-Fi. Store workout plans, drafts, saved sessions, meals, recipes, diet targets, overall goals, and weigh-ins in the current browser so they survive a reload. V1 requires no account or paid service. Cross-device sync is outside V1 scope. The interactive preview starts with sample workout and diet plans, schedules, history, an overall goal, and weigh-ins. Edits made in the preview use separate browser storage.

## Visual scope

Use a black theme across Gym Log, Diet, and Dashboard. Use charcoal surfaces and light neutral text for readability. Green is the only accent color and marks completed sets, active selections, primary actions, chart data, and other key highlights.

## Navigation acceptance criteria

1. The Fitness Log home screen offers **Gym Log**, **Diet**, and **Dashboard** as destinations on desktop and phone. Opening one hides the section chooser. The Fitness Log brand returns users to the home screen.
2. Gym Log opens at **Current** and offers **Workouts**. Diet opens at **Current** and offers **Diet plans**. Dashboard opens at **Overall** and offers **Diet History** and **Gym History**.

## Gym Log acceptance criteria

1. A user can add Chest and Triceps to Day 1, type “press” under Chest, and see only matching chest exercises. **Add custom exercise** is visible before searching. A custom Chest exercise can be saved directly and found in future Chest searches across plans.
2. A user can plan three sets of the same exercise with different reps and weights, start a workout, and save the actual completed sets. The planned values remain available in Current for the next workout.
3. After two saved sessions with different weights for the same exercise, **Dashboard → Gym History** shows both sessions and plots the correct heaviest set and training volume for each session. The session list, set details, and charts still work after a reload and an edit to the plan.
4. Current, workout logging, and **Dashboard → Gym History** use black backgrounds, charcoal surfaces, and readable neutral text. Marking a set complete changes its neutral checkbox to a green checked state. Green is the only accent across controls, feedback, and charts. Checkmarks, labels, and focus outlines make states recognizable by more than color.
5. A user can mark any day for rest. The weekly grid labels it **Rest day**, and workout logging is unavailable for that day. Switching it back reveals its existing plan.
6. A user can tick sets 1 and 3, leave set 2 unticked, and reload to find those exact selections. Unticking set 3 updates the progress count. Saving shows set 1 as completed and sets 2 and 3 as unchecked in **Dashboard → Gym History**. Analytics count set 1 only.
7. A user can keep an in-progress Prep session, switch to a separate Off Prep plan, and then return to the Prep session with its ticks intact. Saved sessions can be filtered by plan after reloading.
8. On a local Saturday, Current opens Day 6. Other weekdays remain editable, and workout logging is available only for Day 6. A Saturday draft stays readable after midnight and its completion controls lock when Sunday begins.

## Diet acceptance criteria

1. Entering “one paneer toast” prompts for the amounts and units of paneer and toast. The draft retains the original description and supplied values, and shows the meal total once quantities and conversions are resolved.
2. Entering “80 g paneer and 50 g whole-wheat toast” lets the user review the matched foods, amounts, and sources. The app calculates calories, protein, carbs, and fat for each ingredient and the meal. Editing a quantity recalculates the total.
3. At 70 kg in the **Regular lifting** preset, the protein target is 105 g/day. A manual override takes effect in the daily view. **Targets** shows the effective target and calories from meals marked eaten for the chosen plan, including when another plan is active. Changing the calorie target updates the preview without changing logged intake.
4. With three meals in today’s routine, checking one meal updates daily intake and leaves the other two in **What to eat next**. Unchecking the meal restores it to that list. Checks persist after reload. Other dates show completion read-only, and edits to their recurring templates preserve logged records.
5. Entering “two whole wheat breads and 120 mL yogurt” shows two slices and 120 mL for review, with the reference weights for the matched bread and yogurt. Switching to a food without a verified conversion prompts for the weight of the portion before saving.
6. A user can keep two named diet plans with different meals for the same weekday. Each routine meal appears once in Current, including meals previously recorded against that routine. Marking one of two routine meals eaten yields 50% adherence for that date and plan. Other plans' records remain available through the filter in **Dashboard → Diet History**.
7. Two diet plans can have different calorie, protein, carb, and fat targets. **Diet plans** shows each plan's configured targets. Choosing a plan opens **Current** with its seven-day routine and targets, including after a reload.
8. A user can save a custom meal in one diet plan and find it by name in that plan’s **Add meal** picker. A second plan has its own suggestions. A meal created in Current appears in its plan’s library after reload and can be added to another weekday.

9. Logging “one burger” shows a sourced reference estimate. Confirming it increases calories eaten and shows the additional calories in Day overview and Diet History. Other dates and the meal plan stay available with their own entries.

## Dashboard acceptance criteria

1. Opening **Overall** on a date with no recorded weight shows **Log today’s weight**. Saving dismisses the prompt for that date. Editing that entry replaces its value. Reloading preserves the entry, and a new date shows the prompt again.
2. With weigh-ins on some dates across two weeks, the chart shows the recorded dates and gaps. The weekly comparison uses recorded weights only and appears once both weeks have entries.
3. Changing the active workout or diet plan updates its Overall summary. Saving a Cut, Bulk, or Maintain calorie target updates the active diet’s Current view. Selecting **Off** restores the active plan’s manual calorie target. A new weigh-in updates weight progress with the saved calorie target still in effect.
4. In Cut mode, entering a one- or two-month timeframe for a 10 kg loss shows the requested pace and prompts for a longer timeframe instead of generating a calorie target. A goal below the calculator’s BMI limit explains why the goal weight needs to change. A supported timeframe recalculates the target, which persists after save and reload.
5. Both Dashboard history tabs display existing records and their charts. Filtering one history by plan keeps that filter scoped to the history view.
6. Weekly training shows scheduled versus logged training days. Weekly nutrition distinguishes planned meals, logged intake, and dates with incomplete logs.
7. For a starting weight of 90 kg, **Cut** rejects 90 kg and above, **Bulk** rejects 90 kg and below, and **Maintain** uses 90 kg automatically. With a valid profile, the calculated targets are ordered from Cut to Maintain to Bulk. Existing Dashboard goals retain their profile and timeline and use the calculated calorie target.
8. Dashboard’s edit shortcuts open the active plans.
9. With insufficient weigh-ins or complete meal logs, the progress review explains what is missing. With enough data, it uses the weight trend, active-plan meal logs, and scheduled workouts to give a next step.
