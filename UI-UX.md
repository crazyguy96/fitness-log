# Fitness Log V1 screens

## Navigation

Open the **Fitness Log** home screen with three choices, **Gym Log**, **Diet**, and **Dashboard**. Show the selected section’s tabs and the Fitness Log brand button, which returns to the home screen.

- **Gym Log** opens at **Current** and offers **Workouts**.
- **Diet** opens at **Current** and offers **Diet plans**.
- **Dashboard** opens at **Overall** and offers **Diet History** and **Gym History**.
- On desktop, show the selected section’s tabs in the sidebar. On phones, use the bottom bar for the same tabs and the header brand button for returning home.

## Visual style

- Use black as the page background, charcoal for cards and inputs, and light neutral text for legibility. Use neutral gray for secondary text, borders, and chart axes.
- Reserve green for checked boxes, active tabs and days, primary actions, keyboard focus, chart data, and feedback that needs emphasis. Pair active navigation with an indicator and use distinct line and point shapes for chart data where needed.
- Use a neutral outline for an unchecked set and a green fill with a dark checkmark for a completed set. Give each checkbox a label that identifies its set.
- Use black-and-green anatomical thumbnails in the muscle-group picker, workout plan, and active session. Show the relevant front or rear view, with the target muscle highlighted in green.
- Keep error and success feedback explicit in text. For an invalid input, show an inline message that identifies the problem and tells the user how to fix it. Use a visible outline to identify the field within the black-and-green palette.

## Gym Log

### Current

1. Start on today’s weekday using the device’s local date. Let users browse and edit all seven day templates, using the existing week selector without adding a calendar. Show the selected day's name and a way to rename it.
   Offer **Mark as rest day** on the empty day and in the overview for a planned day. Label it **Rest day** in the week grid. Its panel offers **Switch to workout day** and restores any planned exercises when switched back.
2. Show the day's muscle groups as sections with an **Add exercise** action in each section. Show **Add muscle group** at the day level.
3. The exercise picker shows the selected muscle group and filters suggestions as the user types. Keep **Add custom exercise** visible even before typing. It opens a name field. **Save and add** adds the exercise to this day and saves it in the muscle group's library for future use across plans.
4. Under each exercise, show numbered set rows with separate **Reps** and **Weight (kg)** fields and controls to add or remove a set.
5. **Start workout** appears on today’s training template and opens a session populated from that day's plan. The user can edit rep and weight values and tick or untick each set in its **Done** column. Show the completed set count and keep ticks in the dated draft. An older or undated draft shows its values and ticks read-only, with access to the plan editor and discard action. In Current, show weekly training progress and link to **Dashboard → Overall**. **Save workout** records the status of all sets and shows a confirmation with a link to **Dashboard → Gym History**.

### Workouts

- List saved plans and identify the active plan and any session in progress. **Use workout** switches the active plan and opens it in Current.
- **Add workout** creates an empty seven-day plan from a unique name. Each plan card includes a rename control.

## Diet

### Current

1. Match the Gym Log Current layout with the active plan name, a seven-day week selector, the selected day's routine, and a day overview. Show calorie and macro intake against the active plan’s goals and show the effect of planned meals in the daily projection. When a Dashboard goal mode is active, show the calorie target from Dashboard and a link to review it there.
2. **Add meal** opens a searchable picker for the active plan’s library. Each result shows the meal name, calories, and macros. Selecting it adds a copy to the weekday. **New meal** opens the ingredient editor and saves to both the weekday and the library. Use the device’s local date by default, with weekday and previous/next controls. Enable eaten checkboxes only for today using the existing Gym Log checkbox treatment. For eaten routine meals, label the template action **Edit routine**. Offer **Edit today’s log** for corrections to today’s eaten entry.
3. The meal editor accepts a dish description or a list of ingredients. Let the user review each matched food, preparation or brand, source, amount, and unit. Offer **g**, **mL**, **Slices**, **Pieces**, and **Servings**. Show the weight equivalent used in the calculation and offer nutrition-label entry for a different product.
4. When information is missing, keep the entry open and ask for the amount and unit or the weight of the portion. Preserve the fields the user has filled and enable **Save meal** once the ingredient quantities and conversions are resolved.
5. Show calories, protein, carbs, and fat per ingredient and per meal. Let the user edit meal amounts, remove meals, and reuse saved recipes with a measured portion.
6. **What to eat next** lists the unchecked meals from the selected day with their calories and macros. Place it in the right-hand column on desktop and below the meal list on narrow screens. Show a completion message when every meal is checked.

7. **+ Ate something else** is available for today and opens a searchable food picker with category browsing and calories per reference amount. Show the estimate and source once the user selects a food and enters the amount eaten. Ask for one item at a time and offer **+ Add your own food** above the results and in the empty-search flow. The manual form takes a name, calories, protein, carbs, and fat for the full amount eaten. **Log as eaten** becomes available once the fields are valid. Label catalog entries **Unplanned · Estimate** and manual entries **Unplanned · Self-entered**. Show both in Day overview and Diet History.

For an empty day, show **Add meal**. While matching foods, keep the entered description and ingredient quantities visible. If a match is unavailable, offer search or manual nutrition-label entry. After a save, show the updated daily totals and the meal status.

### Diet plans

- Match the Gym Log Workouts list. Show the number of saved diet plans, mark the active plan, and show each plan's configured calorie and macro targets. **Use plan** switches the active plan and opens Current.
- **Meal library** opens a plan’s saved meals and shows a count. **New meal** adds a reusable meal, and **Edit** changes the saved portion for future use. An empty library offers **New meal**.
- **Targets** opens the editor for that plan’s manual calorie and macro targets from the plan card or Current’s day overview. Use today’s intake on the plan card and the selected date in Current. Label the Dashboard calorie target when a Dashboard goal mode is active and link to **Dashboard → Overall** to edit it.

## Dashboard

### Overall

1. Show **Log today’s weight** at the top until today’s entry is saved. Use today’s local date and a numeric field labeled **Weight (kg)**. After saving, show the weight and an **Edit** action. Offer a date selector to correct an earlier weigh-in.
2. Show the latest weight, weekly averages, and the change from the previous week when data is available. Plot observed weights and the goal weight on a date-labeled chart. Leave gaps for missed dates and label weeks that have yet to record a weight.
3. Put the overall goal and a **Goal mode** selector on this screen. Offer **Cut**, **Bulk**, **Maintain**, and **Off**. Show a field error if the goal weight is in the wrong direction for the mode. Show starting weight, goal weight in Cut and Bulk, the Cut timeframe when applicable, and the active workout and diet plan names. Maintain uses the starting weight automatically. Use the existing profile inputs and show the calorie estimate for review. The optional **Timeframe (months)** field starts at four months when enabling Cut mode, shows the requested weekly loss, and updates the suggested calorie target live. Show the calculated calorie target in the summary. When it applies to the active diet, link to Dashboard to review the goal and hide the manual calorie input for that plan. If the timeframe needs a larger deficit than the calculator supports, show a longer timeframe to try and explain the health risk of rapid weight loss. When the goal weight is under the calculator’s BMI minimum, explain the height-based limit and highlight the goal-weight field.
4. Put nutrition and training summaries beside the weight and goal cards on wider screens. Stack them below on phones. For Diet, label **Planned**, **Eaten**, and the saved target, and indicate incomplete logs. For Gym Log, show weekly scheduled and logged training days and link to set details in **Gym History**.
5. For a goal carried over from a diet plan, show the prefilled values for review. After saving a target, show its value and the active diet plan that uses it.

6. In **Weight goal**, place **Edit workout**, **Change workout**, **Edit diet**, and **Change diet** on the same row as each plan name. On narrow screens, use compact **Edit** and **Change** buttons with full accessible names. Both change actions list saved plans and identify the active plan and plans with a draft. Selecting another plan keeps the user on Dashboard. Offer **Manage workouts** and **Manage diet plans** to create or rename plans. In the workout editor, offer **Resume workout** when a session is in progress.

### Diet History

- Filter by diet plan and show the percentage and count of recorded routine meals marked eaten. Show average calories and protein per logged day, a calorie chart, and expandable daily meal records with their eaten or planned status.
- Draw a dashed vertical line across the calorie bars at the current Dashboard goal and label its value in kcal. Hatch the part of a bar beyond the line and show **+N kcal over** beside the daily total. Use the same scale for all rows and keep the reference line visible when it sits beyond every bar.

### Gym History

- Show a workout filter when multiple plans exist. Show total sessions, completed sets, and recorded unchecked sets, then an exercise selector with **Heaviest set** and **Training volume** charts based on completed sets. Label dates and units. Let the user tap or focus a point to see its exact value.
- Show a newest-first list with dates, plan names, day names, and set counts. Expanded sessions show **Completed** in green beside recorded reps and weight, and **Unchecked** on the other sets. Label earlier sessions that only contain completed sets.
- With one qualifying session, show a single point and its value. With no recorded weights for the selected exercise, explain why the weight-based charts are empty and keep the session details accessible.

## Interactive preview

Open the existing Fitness Log screens with sample data. Show **Interactive preview · Demo data** and **Exit preview** on the home screen and in each area. Include sample goals and weigh-ins in Dashboard alongside the existing demo plans, checklists, and history. Use the same controls as the main app.

## Screen states

| State | Current | Dashboard |
| --- | --- | --- |
| Empty | Offer **Add muscle group** or **Mark as rest day** for an empty workout day and **Add meal** for an empty diet day. | Offer **Log today’s weight** and **Set weight goal** in Overall. Empty history views explain what will appear and link to the relevant Current screen. |
| Loading | If local data takes time to load, show a brief loading state before rendering the day. | Show the same loading state while retrieving the goal, weigh-ins, or records. |
| Success | Confirm when a workout is saved. | Show the saved weigh-in and updated trend, the applied goal target, or the saved session and updated chart as appropriate. |
| Error | Highlight invalid set fields. If saving fails, keep the entries visible and offer a retry. | Highlight invalid goal or weigh-in fields. Keep the entered values visible and offer a retry if local storage fails. |

## Visual references

Use the black-and-green visual style above across Gym Log, Diet, and Dashboard.

The illustrations are stylized muscle-group guides. References include [OpenStax upper-limb anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs), [lower-limb anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs), and [abdominal anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax).

Triceps uses the supplied rear-view image at `public/illustrations/triceps.png`.

<details>
<summary>Illustration generation prompt</summary>

Asset `public/illustrations/muscle-groups.webp`, created with the built-in ImageGen tool.

> Use case: scientific-educational. Make a single production-ready sprite sheet for Gym Log, with 12 original cartoon anatomy thumbnails arranged on an EXACT regular grid of four equally wide columns by three equally high rows. Make it landscape, ideally 4:3. Full canvas uniform solid near-black #101110. No titles, text, letters, numbers, frames, cell boundaries, equipment, or logos. Every tile contains one centered adult training anatomy mannequin or close-up cropped body area, occupying about 80% of its own cell with even padding, with an unmistakable silhouette on black. High-end sports app illustration, bold clean medium-gray outlines, graphite musculature with a little gray fiber definition, one electric lime green #baf56d accent strictly on the target muscles. There is no other hue. Clean stylized mannequin, opaque neutral charcoal modesty clothing where visible, no face needed. High readability even at 60px thumbnail size. Grid positions are fixed in reading order:
> Row 1 (1) CHEST front upper torso, paired fan-shaped pectorals only green (2) BACK posterior torso, broad paired latissimus dorsi along mid to lower back only green (3) SHOULDERS upper torso, rounded A-shaped deltoid caps only green (4) BICEPS front view of two upper arms with bent elbows, biceps brachii only green between shoulder and elbow.
> Row 2 (1) TRICEPS rear elbow-to-shoulder view, posterior upper arm triceps only green (2) QUADRICEPS front upper legs, paired anterior thigh quadriceps only green hip to just above knee (3) HAMSTRINGS back upper legs, posterior thighs only green below the glutes and above the knees (4) GLUTES back view of hip and top of thighs, paired gluteus maximus green, neutral thighs, opaque athletic anatomy mannequin.
> Row 3 (1) CALVES back view of two lower legs, bulging calf muscles green between knee and ankle, heels gray (2) CORE front torso with green rectus abdominis and lateral obliques under neutral pecs (3) FOREARMS close-up of two forearms with neutral hands, paired forearm muscle bellies green between the elbow and wrist, neutral hands and upper arms (4) TRAPS rear neck and shoulders, green trapezius, broad diamond from the base of the neck to both shoulder corners and central mid-back, gray lats and deltoids.
> Use exactly these 12 tiles in the specified positions, with no gaps in the grid and no overlaps beyond cell boundaries. Anatomical landmarks should distinguish front from back and clearly differentiate adjacent muscles.

</details>

<details>
<summary>Single-arm illustration prompts</summary>

Created with built-in ImageGen. Use a front biceps flex and a single forearm with a closed fist.

**Biceps** · `public/illustrations/biceps.webp`

> Create one new Biceps illustration, using the provided multi-tile artwork as style reference only. Depict a classic front single-arm biceps flex, with the upper arm lifted out to the side near shoulder height, elbow bent around 90 degrees, and a single closed fist curled toward the head. Use a tightly framed front three-quarter view showing only the one arm and a sliver of that shoulder. Highlight only the rounded biceps on the front of the upper arm between shoulder and elbow in lime. Keep the deltoid, forearm, wrist, and fist gray. Square workout app thumbnail. Match the reference's stylized graphite anatomy mannequin rendering, gray fiber lines and vivid lime green (#baf56d) muscle highlights on uniform near-black. Bold enough to read at 44px, no text, no props, no jewelry, no scenery. Center the cropped single arm with margin around the hand and elbow. Only one arm and one hand visible.

**Forearms** · `public/illustrations/forearms.webp`

> Edit the existing two-fist forearms illustration into a single-arm view. Remove the entire second arm and hand, then center and enlarge the remaining forearm so it reads at thumbnail size. Keep the remaining closed fist with the thumb curled across the fingers, the straight wrist, the anterior view of the forearm from just above the elbow down to the fist, and the same lime-green forearm muscles. The closed fist stays gray. Keep part of the upper arm dark gray for anatomy context. Square workout app thumbnail. Match the reference's stylized graphite anatomy mannequin rendering, gray fiber lines and vivid lime green (#baf56d) muscle highlights on uniform near-black. Bold enough to read at 44px, no text, no props, no jewelry, no scenery. Center the cropped single arm with margin around the hand and elbow. Only one arm and one hand visible.

</details>
