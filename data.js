// THE RED HOOD × NIGHTWING PROTOCOL — data
const DATA = {
  startKg: 83,
  targetKg: 70,
  heightCm: 167,
  totalWeeks: 34,

  morningRitual: [
    { name: "Bike, easy", spec: "2 min", note: "Just get warm and breathing." },
    { name: "Ankle rocks + slow single-leg calf raise", spec: "10 rocks · 12/leg", note: "Knee to wall, heel down — left is the stiff side, do it first and give it extra. Then calf raises off a step, 3-sec lower." },
    { name: "Cable external rotation", spec: "1 × 15 / side", note: "Elbow pinned to your side, light. Shoulder armour before any pressing." },
    { name: "Half-kneeling hip-flexor stretch", spec: "20 s / side", note: "Squeeze the back glute. Undoes the desk." },
    { name: "Ramp set", spec: "1 light set", note: "Of each first-block lift, ~half weight × 8. Then start." }
  ],

  // Optional mobility — the old long ritual, kept for days with 5 spare minutes.
  mobilityReset: [
    { name: "Lower-lumbar Cat-Cow", spec: "8–10 slow", note: "Drive it from the PELVIS (tuck → arch), not the upper back. Exhale into the tuck. Stop if you feel a pinch or pain ≥3." },
    { name: "Child's Pose", spec: "30–45 sec", note: "Hips to heels, arms long, breathe into the low back and let it decompress. Stop if you feel a pinch or pain ≥3." },
    { name: "Couch Stretch", spec: "30 sec / side", note: "Hip flexor release · fixes the desk-sit pain at the front of your hip" },
    { name: "Deep Squat Hold", spec: "30 sec", note: "Hip mobility" },
    { name: "Single-Leg Glute Bridge", spec: "10 / side", note: "Wakes lazy glutes from sitting" },
    { name: "Thoracic Opener", spec: "30 sec / side", note: "Doorway. Opens chest, fights hunch" }
  ],

  daily: [
    { name: "Walk after meals", spec: "10–15 min · lunch + dinner", note: "The single best habit for South Asian bodies — muscles soak up the rice/roti sugar instead of it turning into belly fat. Even 5 min counts. Office lunch → walk the block; dinner → walk downstairs." },
    { name: "Eat in order", spec: "Veg → protein → carbs", note: "Same meal, smaller blood-sugar spike. Start with the sabzi/salad, then the chicken/fish/dal, rice or roti last." },
    { name: "Calories", spec: "1,900–2,000", note: "Weeks 1–2: log everything once to calibrate (half-rice briyani ≈ 750 kcal, chapati set ≈ 600 + ghee). Then order the defaults. If the 7-day average drops less than 0.5 kg/week by week 4, cut 150–200 kcal." },
    { name: "Protein", spec: "140 g · fixed base", note: "Every day, no thinking: 1 whey scoop + 3 eggs + 1 chicken pouch/portion (~70 g). Hawker meat counts as only 20–25 g a plate. Short day → a 2nd scoop. Dal is fibre, not protein (~9 g a bowl)." },
    { name: "Plate rule", spec: "½ veg · ¼ protein · ¼ carbs", note: "Carbs = 1 fist of rice OR 2 small chapati — never both. Training day: put that carb in the meal before or after the lift. Dinner: half. Gravy on the side." },
    { name: "Oil + ghee", spec: "1 tbsp a meal", note: "Indian cooking hides 300–500 kcal in oil. At home, measure it. Eating out: dry dishes (tandoori, tikka, grilled) over curries (butter chicken, korma)." },
    { name: "Fibre", spec: "30 g", note: "Dal, chana, rajma, veg at every meal, a fruit a day. Keeps you full and flattens the sugar spike." },
    { name: "Late dinner", spec: "After 8:30pm?", note: "Protein snack at 4–5pm. Dinner = protein + veg, half a fist of carbs (none after 9:30). Kitchen closes after." },
    { name: "Drinks", spec: "Kosong / siew dai", note: "Teh tarik / masala chai kosong or siew dai. Lassi → plain chaas. No Milo/bubble tea/Rose syrup daily. No caffeine after 2pm." },
    { name: "Water", spec: "2.5–3 L", note: "More on gym days and in the SG heat" },
    { name: "Steps", spec: "8K → 10K", note: "Belly (visceral) fat responds to movement more than anything. The meal walks do most of it." },
    { name: "Sleep", spec: "7+ hrs", note: "Short sleep = bigger appetite tomorrow and less fat lost. Move bedtime, not wake time." },
    { name: "Supplements", spec: "Creatine 3–5 g · D3 · Mg · fish", note: "Creatine monohydrate powder any time (start week 1 or not at all — ~1–2 kg water early) · D3 2,000 IU with a fatty meal (very common to be low with brown skin) · magnesium glycinate 300 mg before bed · fish 2×/week or an omega-3 capsule" }
  ],

  trailFuel: [
    { name: "Before the trip", spec: "Oct 24–27", note: "Stop the deficit — eat at maintenance or a little above for the last 3–5 days. Arrive fuelled, not lean." },
    { name: "Night before a hike", spec: "Extra carbs", note: "Normal dinner plus extra rice or bread · 500 ml water with an electrolyte tab." },
    { name: "Breakfast", spec: "2 h before", note: "80–100 g carbs + some protein (oats, dates, bread, eggs) · 500 ml fluid." },
    { name: "Drink", spec: "500–750 ml / hour", note: "Sip every 15–20 min. Dry heat hides sweat — drink to the clock, not to thirst." },
    { name: "Electrolytes", spec: "300–600 mg sodium / L", note: "At least 1 bottle in 2. Headache, nausea or cramps = you need salt, not just water." },
    { name: "Eat", spec: "30–60 g carbs / hour", note: "3–4 dates, half a bar, trail mix or a banana every 45 min — before you're hungry. Prayer stops are natural refuel points." },
    { name: "Carry", spec: "3 L minimum", note: "No refills on the Jebel Shams rim. Plus spare electrolyte sachets." },
    { name: "Check", spec: "Pale-straw pee", note: "Dark, or nothing in 3 h = drink 500 ml with electrolytes now. Weigh before/after training hikes: lost >1.5 kg = drink more." },
    { name: "Heat", spec: "Hat · sleeves · shade 12–3", note: "Start early. Dizzy, chills in the heat, stopped sweating or confused = stop, shade, sip electrolytes, cool neck and wrists." },
    { name: "After", spec: "Within 1 h", note: "20–30 g protein + carbs, salty dinner, 500 ml electrolytes before bed. Check your feet every evening." }
  ],

  stamina: [
    { name: "Reverse Kegels", spec: "10 × 5s/5s · daily", note: "The daily anchor. Gently bear down, LENGTHEN and release the pelvic floor — letting go, not squeezing, is the skill that builds control. Practise the 'drop and lengthen' as arousal rises." },
    { name: "Pelvic-floor release", spec: "1–2 min · after heavy lifts", note: "After squats / deadlifts / cleans or a hard core day: slow breaths INTO the pelvic floor (belly + base expand on the inhale), or a minute of child's pose. Offsets all the bracing so the floor doesn't lock up tight." },
    { name: "Kegels", spec: "2× / week only", note: "You already get plenty of pelvic-floor CONTRACTION from bracing, stomach vacuums and heavy lifting — extra daily squeezes tip you into tightness, which reduces control. Keep these light, twice a week at most." },
    { name: "PM · Box Breathing", spec: "4×4×4×4 × 2 rounds", note: "In · hold · out · hold · ~2 min. Add rounds on rough days" },
    { name: "PM · Happy Baby", spec: "45–60 sec", note: "Hold the outside of the feet, knees toward the armpits, rock gently · lets the low back flatten (posterior tilt) and downshifts you for sleep. Stop if you feel a pinch or pain ≥3." },
    { name: "Physiological sigh", spec: "3 reps · anytime", note: "Double inhale nose, long exhale mouth · fastest downshift — works mid-meeting, at the rack" },
    { name: "Eyes · 20-20-20", spec: "Every 20 min", note: "Look 6m+ away for 20 sec · stack it on prayer + water breaks" }
  ],

  officeStations: [
    { name: "Hip-flexor opener", spec: "30 s / side", note: "Split stance, back knee drops, squeeze that glute hard, ribs down · THE move for your hips" },
    { name: "Hip hinges or air squats", spec: "10 slow", note: "Resets the sitting pattern" },
    { name: "Wall slide / doorframe pec stretch", spec: "30 s", note: "Undoes the keyboard hunch" },
    { name: "Chin tucks at the mirror", spec: "5 reps", note: "Looks like checking your hair · it's neck posture work" },
    { name: "Calf + tibialis rocks at the sink", spec: "10 each", note: "Ankle foundation work" }
  ],

  officeDesk: [
    { name: "Seated glute squeezes", spec: "10 × 10 s · 2×/day", note: "Wakes up what sitting puts to sleep" },
    { name: "Posterior pelvic tilts", spec: "10 slow", note: "Kills the anterior-tilt creep in the chair" },
    { name: "Toe spreads + ankle rocks", spec: "20 reps", note: "Under the desk · zero visibility" },
    { name: "Laptop-unlock anchor", spec: "Every unlock", note: "Password = chin tuck, chest proud, shoulders down-back · 30+ posture resets a day" },
    { name: "Glass, not bottle", spec: "Hourly refills", note: "~1,500 extra steps per office day" },
    { name: "Post-lunch walk", spec: "10 min", note: "Long way back to the desk · flattens the glucose spike" }
  ],

  workouts: [
    {
      id: "reset_a",
      name: "A · Wide",
      tagline: "≤35 min · lats, chest, side delts, arms",
      blurb: "The V-taper day: wider lats and side delts make the waist look smaller. The first block (~17 min) is a full session on its own. Week 1: only the first block. Weeks 2–3: add one more block. Week 4+: all of it.",
      warmup: "5-min warm-up card · 1 light ramp set of each first-block lift",
      ramadanBlocks: [0, 2],
      blocks: [
        {
          title: "Floor · superset (counts as full session)",
          exercises: [
            { name: "Assisted Neutral-Grip Chin-Up", sets: 3, reps: "6–10", rest: 20, note: "Chest to handles, 3-sec lower. Log the assist kg (lower = stronger) and reps. When every set hits 10, take one plate less assistance. Goal: your first unassisted chin-up.", inputMode: "bodyweight_reps", assist: true, sub: "Machine taken → lat pulldown, neutral grip, 8–10." },
            { name: "Incline DB Press (30°)", sets: 3, reps: "8–10", rest: 20, note: "Upper chest — the shelf under the collarbone. DBs to upper chest, elbows ~45°. Log each hand's DB.", sub: "DBs or bench taken → Smith incline press.", alt: { name: "Neutral-Grip Incline DB Press (30°)", note: "Palms facing each other, elbows tucked ~30°. Easier on the shoulders, more triceps. Log each hand's DB." } },
            { name: "DB Lateral Raise", sets: 3, reps: "15", rest: 60, note: "Side delts = width. Thumbs slightly up, raise to just below shoulder height, 2-sec lower. Rest 60 s after this, then back to the chin-up. From week 5: a 4th set.", sub: "Cable lateral raise.", byWeek: { 5: { sets: 4 } } }
          ]
        },
        {
          title: "Legs · Smith squat",
          exercises: [
            { name: "Heels-Elevated Smith Squat", sets: 3, reps: "8", rest: 90, note: "Plates under the heels (helps the stiff left ankle), upright torso. Straight sets.", sub: "Goblet squat, heels on plates.", alt: { name: "Heels-Elevated Goblet Squat · 1-s pause", note: "One heavy DB at the chest, heels on plates, 1-second pause at the bottom. Log the DB." } }
          ]
        },
        {
          title: "Sleeves + waist",
          exercises: [
            { name: "Spider Curl", sets: 2, reps: "10–12", rest: 15, note: "Chest on a 45° incline bench, arms hanging straight down, curl and squeeze. Shoulder-safe — no stretch at the front of the shoulder. Log each hand's DB.", sub: "Bench taken → cable curl, elbows pinned." },
            { name: "Rope Pushdown", sets: 2, reps: "12–15", rest: 15, note: "Elbows pinned to your sides, split the rope at the bottom. Triceps are 2/3 of the arm.", cable: true, sub: "Straight-bar pushdown." },
            { name: "Cable Pallof Press", sets: 2, reps: "10 / side", rest: 45, note: "Stand side-on to the cable, press out and hold 2 s — resist the twist. Tight waist, flat belly.", cable: true, sub: "Band Pallof press, or a 20-s side plank per side." }
          ]
        }
      ]
    },
    {
      id: "reset_b",
      name: "B · Engine",
      tagline: "≤35 min · hinge, back, delts, arms",
      blurb: "Thick back, strong hips, and the heart-rate work that strips fat. The first block (~17 min) is a full session on its own. Week 1: only the first block. Weeks 2–3: add one more block. Week 4+: all of it.",
      warmup: "5-min warm-up card · 1 light ramp set of each first-block lift",
      ramadanBlocks: [0, 2],
      blocks: [
        {
          title: "Floor · superset (counts as full session)",
          exercises: [
            { name: "Smith Romanian Deadlift", sets: 3, reps: "8–10", rest: 20, note: "Hamstrings + glutes — the 'glute shelf' that makes the waist look smaller. Soft knees, hips back, stop when the back wants to round. 3-sec lower. Log the total on the bar.", sub: "DB RDL.", alt: { name: "DB B-Stance (Kickstand) RDL", reps: "8–10 / leg", note: "Back foot's toes on the floor for balance only — 80% of the weight on the front leg. LEFT first. Log each hand's DB." } },
            { name: "Incline-Bench Prone DB Row", sets: 3, reps: "10–12", rest: 20, note: "Back thickness. Chest on a 30° bench, elbows to hips, 1-sec squeeze. From week 5: a 4th set.", sub: "Chest-supported row machine.", byWeek: { 5: { sets: 4 } }, alt: { name: "Chest-Supported Row Machine · neutral grip", note: "Chest on the pad, elbows to hips, 1-sec squeeze. Log the stack." } },
            { name: "Seated DB Lateral Raise", sets: 3, reps: "15", rest: 60, note: "Sit on the same bench, raise to just below shoulder height. Side delts = width. From week 5: a 4th set.", sub: "Cable lateral raise.", byWeek: { 5: { sets: 4 } } }
          ]
        },
        {
          title: "Engine · hips + chest",
          exercises: [
            { name: "KB Swing", sets: 3, reps: "12", rest: 20, note: "Hinge, not squat — snap the hips, arms just hold on. Heart rate up = fat gone. Light in weeks 1–3. Log the KB.", sub: "KB taken → DB swing, or a DB Romanian deadlift 3 × 10." },
            { name: "DB Floor Press", sets: 2, reps: "10", rest: 60, note: "Chest thickness, shoulder-friendly — elbows stop at the floor.", sub: "Smith floor press, or push-ups on the Smith bar at hip height." }
          ]
        },
        {
          title: "Sleeves + grip",
          exercises: [
            { name: "Cable Bar Curl", sets: 2, reps: "10–12", rest: 15, note: "One stack for this, the other for the pushdown. Elbows pinned, full squeeze.", cable: true, sub: "DB hammer curl." },
            { name: "Straight-Bar Pushdown", sets: 2, reps: "10–12", rest: 45, note: "Elbows pinned to your sides, lock out hard.", cable: true, sub: "Rope pushdown, or bench dips with feet on the floor (only if the shoulders feel fine)." },
            { name: "Farmer Carry", sets: 1, reps: "40 m", rest: 60, note: "Heavy. Tall posture, slow steps. Forearms under a rolled sleeve + a braced core.", inputMode: "carry", sub: "KBs, or one DB at a time (suitcase carry).", alt: { name: "Heavy Suitcase Carry", reps: "30 m / side", note: "One heavy DB, don't lean. Obliques + grip. Log the DB and metres per side." } }
          ]
        }
      ]
    },
    {
      id: "reset_c",
      name: "C · Build",
      tagline: "≤35 min · legs, shoulders, lats",
      blurb: "Legs and shoulders for an athletic frame, plus lat width. The first block (~19 min) is a full session on its own. Week 1: only the first block. Weeks 2–3: add one more block. Week 4+: all of it.",
      warmup: "5-min warm-up card · 1 light ramp set of each first-block lift",
      ramadanBlocks: [0, 1],
      blocks: [
        {
          title: "Floor · superset (counts as full session)",
          exercises: [
            { name: "DB Reverse Lunge", sets: 3, reps: "8 / leg", rest: 15, note: "Step back, front shin vertical, push through the front heel. LEFT leg first.", sub: "Smith split squat.", alt: { name: "DB Bulgarian Split Squat", note: "Rear foot on the bench, front shin near vertical. LEFT first. Start light. Log each hand's DB." } },
            { name: "Kneeling Cable Press · 45°", sets: 3, reps: "8–10 / side", rest: 15, note: "Half-kneeling, pulley at the bottom. Press up and forward to eye height — never straight overhead. Let the shoulder blade wrap round the ribs. Next pin when every set hits 10.", cable: true, sub: "Cable taken → 45° incline single-arm DB press, neutral grip.", alt: { name: "45° Incline DB Press · neutral grip", reps: "8–10", cable: false, note: "Bench at 45°, palms facing, press up and slightly back. Log each hand's DB." } },
            { name: "Lean-Away DB Lateral Raise", sets: 3, reps: "12–15 / side", rest: 45, note: "Hold a post, lean away, raise to just below shoulder height. Side delts = width.", sub: "Cable lateral raise." }
          ]
        },
        {
          title: "Width · lats + rear delts",
          exercises: [
            { name: "Neutral-Grip Lat Pulldown", sets: 3, reps: "8–10", rest: 20, note: "V-handle, chest up, pull to the upper chest, 3 seconds on the way up. Lats = the V. Log the stack.", cable: true, sub: "Machine taken → assisted chin-up, 8.", alt: { name: "Half-Kneeling Single-Arm Cable Pulldown", reps: "10 / side", note: "Elbow down to your hip, full stretch at the top. Log the stack." } },
            { name: "Reverse-Delt Fly Machine", sets: 2, reps: "15", rest: 60, note: "Rear delts — round shoulders from the side and back, fixes the desk hunch.", sub: "Cable or band face pull." }
          ]
        },
        {
          title: "Legs + engine",
          exercises: [
            { name: "Step-Up + Goblet Squat circuit", sets: 1, reps: "6 min", note: "One box, one DB: 8 step-ups/leg (step DOWN slowly — stairs and hikes) + 10 goblet squats, repeat until the timer ends. Steady, could still talk in short sentences. Log rounds.", inputMode: "amrap", timed: 360, sub: "No box → walking lunges 10/leg + 10 goblet squats." }
          ]
        }
      ]
    },
    {
      id: "reset_z2",
      name: "Zone 2 · any machine",
      tagline: "Easy engine work · 25–60 min",
      blurb: "Burns belly fat without eating into recovery, and builds the engine. Talk test only — full sentences yes, singing no. Weeks 1–3: 25–35 min · week 4+: 40–60 min. From week 5, Engine intervals REPLACE one of these each week.",
      warmup: "3 min very easy, then settle into pace",
      blocks: [
        {
          title: "Main",
          exercises: [
            { name: "Zone 2 · incline walk / bike / Stairmaster", sets: 1, reps: "25–60 min", note: "Log minutes + level/incline. Use a different machine than last time — same benefit, less boring.", inputMode: "cardio", machines: ["Incline walk", "Bike", "Stairmaster", "Outdoor"], sub: "Anything that lets you talk but not sing." }
          ]
        }
      ]
    },
    {
      id: "reset_intervals",
      name: "Engine intervals · 20 min",
      tagline: "Stamina · from week 5 · bike or Stairmaster",
      blurb: "The fastest stamina upgrade there is — and it burns belly fat hard. Weeks 1–4: do Zone 2 instead. From week 5: once a week, never the day before Session B.",
      warmup: "5 min easy, getting slightly faster",
      blocks: [
        {
          title: "Main",
          exercises: [
            { name: "1 min hard / 2 min easy", sets: 1, reps: "6 rounds → build to 8", note: "Hard = can only say a few words, NOT an all-out sprint. Easy = full recovery pedalling. Add a round every 2 weeks. Log rounds + the hard-minute level.", inputMode: "interval", machines: ["Bike", "Stairmaster", "Incline walk"], sub: "Machines taken → hill sprints outside: 30 s uphill walk-run, walk down." }
          ]
        },
        {
          title: "Cool-down",
          exercises: [
            { name: "Easy spin + walk", sets: 1, reps: "3–5 min", note: "Heart rate down before you stop.", inputMode: "cardio", machines: ["Bike", "Walk"], sub: "Walk." }
          ]
        }
      ]
    },
    {
      id: "reset_swim",
      name: "Swim · engine",
      tagline: "Once a week · whenever you're free · 30–40 min",
      blurb: "Full-body cardio that's easy on the joints, plus calm breathing and comfort in deep water. Easy effort — finish wanting more.",
      warmup: "2 easy lengths, any stroke · 10 arm circles each way",
      blocks: [
        {
          title: "Main · continuous",
          exercises: [
            { name: "Continuous swim · no touching the wall", sets: 1, reps: "start 3 min → build to 10 min", note: "Breaststroke or easy long-reach freestyle — no butterfly, no paddles. The clock only counts while you're swimming (no resting on the wall). Add a minute when it feels easy. Shoulder pinches → kickboard lengths instead. Log minutes + lengths (lengths in 'level').", inputMode: "cardio", machines: ["Pool"], sub: "Pool closed → Zone 2 session instead." }
          ]
        },
        {
          title: "Water skills",
          exercises: [
            { name: "Kickboard + bubble exhale", sets: 4, reps: "1 length", note: "Face in, exhale slowly through the nose/mouth — trains calm breathing.", inputMode: "bodyweight_reps", sub: "No kickboard → hold the wall and kick, 30 s." },
            { name: "Tread water", sets: 3, reps: "45 s → 2 min", note: "Deep end. Slow egg-beater or scissor kick, relaxed breathing — the open-water safety skill. Build to 2 × 2 min.", inputMode: "time", sub: "No deep end → float on your back 60 s, relaxed." }
          ]
        }
      ]
    },
    {
      id: "reset_hill",
      name: "Hill day",
      tagline: "Weekend · doesn't feel like gym",
      blurb: "MacRitchie, Bukit Timah, Southern Ridges or an HDB stairwell. Start before 8am to beat the heat. Easy on the flats, steady on the climbs, slow and controlled on the way down.",
      warmup: "First 5 min flat and slow",
      blocks: [
        {
          title: "Main",
          exercises: [
            { name: "Trail / hill walk · Zone 2", sets: 1, reps: "W1–3: 30–45 min · W4+: 60–75 min", note: "Talk test on the climbs. From week 4, add a 5→8 kg day pack. Log minutes; put the route number in 'level'.", inputMode: "cardio", machines: ["Outdoor", "Treadmill"], sub: "Rain → treadmill at 10% incline, same minutes." }
          ]
        }
      ]
    },
    {
      id: "reset_home",
      name: "Home 20 · no equipment",
      tagline: "Crushed week · any day · 20 min",
      blurb: "For heavy work weeks. The 12-min circuit alone counts. Never a reason to feel behind.",
      warmup: "2 min · arm circles, 10 air squats, 5 inchworms",
      blocks: [
        {
          title: "Floor · 12-min circuit",
          exercises: [
            { name: "10 Split Squats/leg + 8 Incline Push-Ups (hands on a chair) + 12 Prone Y-T Raises + 6 Dead Bugs/side", sets: 1, reps: "12 min", note: "Steady pace, stop 2–3 reps shy on the push-ups. Log rounds.", inputMode: "amrap", timed: 720, sub: "Too hard → wall push-ups." }
          ]
        },
        {
          title: "Finisher · 6 min",
          exercises: [
            { name: "Step-jacks / brisk march", sets: 1, reps: "6 × 30s on / 30s off", note: "Breathe hard, stay light on your feet. Log level (1–10 effort) + rounds.", inputMode: "interval", sub: "Brisk walk outside, 6 min." }
          ]
        }
      ]
    },
    {
      id: "day1",
      name: "Back width + side delts",
      tagline: "The V-taper day",
      blurb: "Every lift makes shoulders wider, waist smaller. Matters MORE at 167cm.",
      warmup: "3 min brisk incline walk · 1 light pulldown set (half weight × 12) before working sets",
      blocks: [
        {
          title: "Lifts",
          exercises: [
            { name: "Assisted Pull-Up (wide grip)", sets: 2, reps: "6–8", note: "1–2 reps in tank · log reps achieved", inputMode: "bodyweight_reps", sub: "Machine taken → band-assisted pull-up, or lat pulldown. No bar at all → inverted row under a bar set at hip height." },
            { name: "Chest-Supported Row", sets: 2, reps: "8–10", note: "Drive elbows back · key in one side, app doubles it", barbell: true, bar: 0, sub: "Station taken → single-arm DB row, hand braced on any bench. Log one side's weight.",
              byPhase: { 3: { name: "Chest-Supported Row · wide elbows", note: "Phase 3: elbows flared ~60°, pull to the upper chest · shifts it to upper back + rear delts · key in one side, app doubles it" } } },
            { name: "Cable Y-Raise", sets: 2, reps: "12–15", note: "Replaces the Pendlay Row. Low cable, thumbs up, raise into a Y · side delts + lower traps, zero spinal load. (Old Pendlay numbers in this slot aren't comparable — ignore the first 'last' chip.)", sub: "Cable taken → prone DB Y-raise on an incline bench, light." },
            { name: "Wide-Grip Lat Pulldown", sets: 3, reps: "10–12", note: "Lats not arms · drive elbows down to your ribs, 2-sec squeeze at the bottom", sub: "Cable queue → pull-ups (banded if needed), or a DB pullover on a bench.",
              byPhase: {
                2: { sets: 2, note: "Trimmed to 2 sets while the diagonal block runs · lats not arms, 2-sec squeeze at the bottom" },
                4: { sets: 2, reps: "8–10", note: "Phase 4: slow tempo — 3-sec negative, 1-sec pause at the stretch · lats not arms" }
              } },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 3,
              reps: "10 ea stage",
              note: "3-sec lower, lead with elbows · heavy R, heavy L, immediately drop weight, drop R, drop L · side delts are your #1 width lever at your height, so bring real intent even though they land after the pulls",
              sub: "Cables taken → DB lateral raise drop set: heavy pair R+L, put them down, straight into a lighter pair R+L.",
              byPhase: { 3: { name: "Lean-Away Cable Lateral · drop superset", note: "Phase 3: grip the frame, lean away — constant tension, deeper stretch at the bottom · same heavy R/L then drop R/L" } },
              inputMode: "multistage",
              stages: [
                { label: "R · heavy" },
                { label: "L · heavy" },
                { label: "R · drop" },
                { label: "L · drop" }
              ]
            },
            { name: "Face Pulls", sets: 2, reps: "15", note: "Rear delts + cuff health", sub: "Cable taken → band face-pull anchored at eye height, or bent-over DB rear-delt fly." },
            { name: "Hanging Leg Raise", sets: 2, reps: "12", note: "No swinging", inputMode: "bodyweight_reps", sub: "No free bar → lying leg raise on the floor, hands under the hips." },
            { name: "Cable Woodchop", sets: 2, reps: "10/side", note: "Lateral obliques · the V-cut angle (low-to-high or high-to-low)", sub: "Cable taken → band woodchop, or a DB/plate Russian twist for the same oblique angle." },
            { name: "Dead Hang", sets: 1, reps: "max hold", note: "Spinal decompression after a day of sitting, plus grip · one honest max hold is enough", inputMode: "time", sub: "No free bar → heavy DB farmer hold, 40–50 sec." }
          ]
        },
        {
          title: "Diagonal lats",
          exercises: [
            { name: "Single-Arm Diagonal Lat Pulldown", sets: 3, reps: "8–10 / side", phases: [2], note: "Phase 2 only. Kneel tall at the high cable, single handle. Pull DOWN and ACROSS toward the opposite hip — the diagonal line catches the lower-outer lat a straight bar misses. 2-sec squeeze, slow return. Same weight both sides.", sub: "Cable taken → single-arm DB row pulled ACROSS toward the opposite hip, same diagonal line." }
          ]
        },
        {
          title: "Forearms + Traps",
          exercises: [
            { name: "Wrist Curl (palms up)", sets: 2, reps: "15", note: "Flexor mass" },
            { name: "Reverse Wrist Curl", sets: 2, reps: "12", note: "Extensor width" },
            { name: "DB Shrugs", sets: 2, reps: "12–15", note: "1-sec hold at top · trap shelf for V-taper" }
          ]
        },
        {
          title: "Cuff + calves",
          exercises: [
            { name: "Cable External Rotation", sets: 2, reps: "12–15 / side", note: "Elbow pinned to a towel at your side, light, slow · cuff armour for all the pressing", sub: "Cable taken → band external rotation, or side-lying DB ER." },
            { name: "Smith Standing Calf Raise", sets: 3, reps: "8–12", note: "Toes on a plate, 2-sec pause in the deep stretch, full rise", sub: "Smith taken → single-leg DB calf raise off a step, 10–12/side." }
          ]
        }
      ]
    },
    {
      id: "day2",
      name: "Lower posterior + core",
      tagline: "Glutes, hams, taller posture",
      blurb: "Open hips = taller posture. Glute shelf makes the waist look smaller.",
      warmup: "5 min incline walk · RDL ramp: empty bar × 8, then ~60% × 5, then working weight",
      blocks: [
        {
          title: "Lifts",
          exercises: [
            { name: "Romanian Deadlift", sets: 3, reps: "6–8", note: "Ribs down, brace before the hinge. Stop where the back starts to round — that's today's range.", barbell: true, sub: "Bar/rack taken → DB RDL, one heavy DB each hand. Same hinge, same range." },
            { name: "Back Squat", sets: 3, reps: "6–8", note: "Depth over weight. Let your toes point out 15–30° — your natural stance. Cue: knees track over toes, never force toes straight.", barbell: true, sub: "Rack taken → goblet squat with the heaviest DB you can hold, or DB split squats 8–10/side." },
            { name: "Barbell Hip Thrust (off bench)", sets: 2, reps: "8–10", note: "Glute thickness", barbell: true, sub: "Bench/bar taken → single DB across the hips on the floor, or single-leg glute bridge 12/side." },
            { name: "Hip Abduction & Adduction", sets: 2, reps: "15", note: "Glute medius + adductors", sub: "Machine taken → banded lateral walks + side-lying leg raises, 15/side." },
            { name: "Single-Leg Calf Raise", sets: 3, reps: "12/side", note: "Knee slightly bent = soleus/Achilles · hold a DB, 3-sec lower", inputMode: "bodyweight_reps", sub: "No step → flat floor, full range." },
            { name: "Dead Bug", sets: 2, reps: "12", note: "Slow, anti-extension", inputMode: "bodyweight_reps" },
            { name: "Incline Walk", sets: 1, reps: "10 min", note: "Easy pace · log min, km/h, incline%. Your daily Zone-2 line already covers the rest — this is just the cooldown.", inputMode: "treadmill", machines: ["Treadmill", "Outdoor", "Stairs"], sub: "Treadmills full → walk outside or take the stairs. Same 10 min, easy pace." }
          ]
        },
        {
          title: "Single-leg · even the sides",
          exercises: [
            { name: "DB Split Squat", sets: 2, reps: "8–10 / side", note: "Slot this in after the squat, before the walk. Your knee-to-wall test read 13cm left vs 16cm right — the left ankle is the tighter side, and a bilateral squat lets the better side quietly take over. This doesn't. Lead with the LEFT every time and let it set the depth the right has to match, never the other way round. Also the single-leg strength a loaded carry actually runs on.", sub: "No space or DBs → bodyweight split squat, or rear foot up on a bench to make it harder." }
          ]
        },
        {
          title: "Hip prep · duck-feet",
          exercises: [
            { name: "Frog Pulses", sets: 1, reps: "12–15 slow", note: "Knees wide, shins out, rock the hips toward your heels and pulse. Never force the groin; pad the knees. Stop if you feel a pinch or pain ≥3.", inputMode: "bodyweight_reps" },
            { name: "Frog Internal Rotations", sets: 1, reps: "8–10 / side", note: "From frog/quadruped, rotate shins and feet to drive the hip inward — go slow and own the end range. THE drill for your toes-out. Stop if you feel a pinch or pain ≥3.", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Ankle + glute-med prep",
          gated: "ankle",
          exercises: [
            { name: "Wall Ankle Rocks", sets: 2, reps: "12/side", note: "Knee over toes to the wall · your knee-to-wall test flagged tight ankles", inputMode: "bodyweight_reps" },
            { name: "Tibialis Raises", sets: 2, reps: "15", note: "Heels down, toes up against a wall", inputMode: "bodyweight_reps" },
            { name: "Banded Clamshells", sets: 2, reps: "15/side", note: "Glute med — fixes the toe-out gait", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Hamstrings + knees",
          exercises: [
            { name: "Single-Leg DB RDL", sets: 2, reps: "8–10 / side", note: "Hand on a rack for balance is fine · long hamstring stretch, hips square · LEFT first", sub: "B-stance DB RDL, or KB in one hand." },
            { name: "Leg Extension · slow eccentric", sets: 2, reps: "10–12", note: "1 sec up, 4 sec down · patellar-tendon armour for knees that hike and jump", sub: "Machine taken → wall sit 45 sec." }
          ]
        }
      ]
    },
    {
      id: "day3",
      name: "Chest + shoulders + arms",
      tagline: "Fill the sleeve",
      blurb: "Dense chest, capped delts, arms that fill a sleeve, forearms under a rolled cuff.",
      warmup: "Arm circles + 15 band pull-aparts · incline DB ramp: half weight × 10, then ~80% × 3. You only get 2 working sets now and both are heavy — the ramp is what makes that safe. Never take a heavy first set cold.",
      blocks: [
        {
          title: "Push",
          exercises: [
            { name: "Incline DB Press", sets: 2, reps: "6–8", note: "Upper chest = lifted look. Both sets heavy — leave 1 in the tank, not 2. Two heavy sets beat three soft ones, but only if you ramp first (see warm-up).", sub: "No incline bench → put plates under one end of a flat bench, or feet-elevated push-ups to failure." },
            { name: "Flat DB Press", sets: 2, reps: "8–10", note: "Mid-chest thickness · both sets heavy, 1 in the tank. Day 5's fly triset covers the rest of your chest volume.", sub: "Benches all taken → floor DB press (same load, shorter range) or push-ups to failure.",
              byPhase: { 4: { name: "Slight-Decline DB Press", note: "Phase 4: bench one notch down (or plates under the head end) · fuller pec stretch, easier on the shoulders" } } },
            { name: "Seated DB Shoulder Press", sets: 2, reps: "8–10", note: "Front + side delts · laterals ×3/wk + push press cover the rest", sub: "No bench → standing DB press. Brace hard, ribs down, no leg drive." },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 2,
              reps: "R+L heavy → R+L drop · 10 each",
              note: "3-sec lower, lead with elbows · heavy R, heavy L, immediately drop weight, drop R, drop L",
              sub: "Cables taken → DB lateral raise drop set: heavy pair R+L, put them down, straight into a lighter pair R+L.",
              byPhase: { 3: { name: "Lean-Away Cable Lateral · drop superset", note: "Phase 3: grip the frame, lean away — constant tension, deeper stretch at the bottom · same heavy R/L then drop R/L" } },
              inputMode: "multistage",
              stages: [
                { label: "R · heavy" },
                { label: "L · heavy" },
                { label: "R · drop" },
                { label: "L · drop" }
              ]
            }
          ]
        },
        {
          title: "Triceps",
          exercises: [
            {
              name: "Single-Arm Cable Pushdown · superset",
              sets: 2,
              reps: "10 ea stage",
              note: "Both arms standard, then both arms sideways · lateral head",
              sub: "Cables taken → DB overhead extension + bench dips, same rep target per stage.",
              inputMode: "multistage",
              stages: [
                { label: "R · standard" },
                { label: "L · standard" },
                { label: "R · sideways" },
                { label: "L · sideways" }
              ]
            },
            { name: "Overhead Cable Extension", sets: 2, reps: "10–12", note: "Long head — the part that fills the sleeve", sub: "Cable taken → two-hand DB overhead extension, seated or standing." }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Cable Crunch", sets: 1, reps: "15–20", note: "One quality set. Lighter load, higher reps. Breathe OUT on the way down — never hold your breath (that's the cramp). Stop if it seizes.", sub: "Cable taken → weighted floor crunch (DB or plate on the chest), or hanging knee raises." },
            { name: "Stairmaster · intervals", sets: 1, reps: "30s hard / 60s easy × 4", note: "Log the level you held on the hard bouts + rounds done", inputMode: "interval", machines: ["Stairmaster", "Treadmill", "Bike", "Stairs"], sub: "Stairmaster queue → treadmill at a steep incline, bike, or real stairs. Same 30s hard / 60s easy × 4." }
          ]
        },
        {
          title: "Arms · straight sets",
          exercises: [
            { name: "Incline DB Curl", sets: 3, reps: "8–12", note: "Bench at 45°, arms hang behind you · long-head stretch · 1 in the tank, log the weight", sub: "No incline bench → standing DB curl, back on a wall." },
            { name: "Hammer Curl", sets: 2, reps: "10–12", note: "Brachialis = arm thickness · no swing", sub: "Cable rope hammer curl." }
          ]
        },
        {
          title: "Cuff",
          exercises: [
            { name: "Cable External Rotation", sets: 2, reps: "12–15 / side", note: "Light · after pressing, never before heavy sets", sub: "Band external rotation, or side-lying DB ER." }
          ]
        }
      ]
    },
    {
      id: "day4",
      name: "Power + conditioning",
      tagline: "Heavy. Explosive. Springy.",
      blurb: "Heavy pull, explosive work, metabolic finisher. You feel light after.",
      warmup: "5 min easy bike · pogo hops 2 × 15 · deadlift ramp 60% × 5. Never pull heavy cold",
      blocks: [
        {
          title: "Strength",
          exercises: [
            { name: "DB Jump Squat", sets: 4, reps: "3", note: "Replaces the clean complex: same explosive triple extension, zero catch skill. Light DBs at your sides (5–10 kg each), jump tall, land soft, reset each rep. Fast or stop. Log the DB weight. (Old complex numbers in this slot aren't comparable.)", sub: "DBs taken → bodyweight jump squat, or KB swing 4 × 8 max power." },
            { name: "Barbell Deadlift", sets: 3, reps: "5", note: "After the jumps — and not a grind. Stop at RPE 7 (≈3 clean reps left in the tank). The clean already trained the pull; this is axial load, not a max-out. Brace hard, stay tight.", barbell: true, sub: "Bar taken → heavy DB/KB deadlift from the floor. Same submaximal feel." }
          ]
        },
        {
          title: "Conditioning",
          exercises: [
            { name: "KB Swings", sets: 2, reps: "15", note: "Hinge, not squat · explosive hips", sub: "No KB free → two-hand DB swing, same hinge." },
            { name: "Hanging Knee Raises", sets: 2, reps: "12", note: "Spine-loaded core", inputMode: "bodyweight_reps", sub: "No free bar → floor knee tucks, hands under the hips." }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Pallof Press", sets: 2, reps: "12/side", note: "Anti-rotation core", cable: true, sub: "Cable taken → band Pallof anchored at chest height on any rack." }
          ]
        },
        {
          title: "Finish",
          exercises: [
            { name: "Stairmaster · moderate", sets: 1, reps: "8 min", note: "Cool down · log minutes + level", inputMode: "cardio", machines: ["Stairmaster", "Treadmill", "Bike"], sub: "Any easy cardio — treadmill incline, bike, or stairs. 8 min." }
          ]
        },
        {
          title: "Width + calves",
          exercises: [
            { name: "DB Lateral Raise", sets: 2, reps: "12–15", note: "Straight sets, 3-sec lower · do these before the finish if the gym's tight", sub: "Single-arm cable lateral raise." },
            { name: "Smith Seated Calf Raise", sets: 3, reps: "12–20", note: "Bar across the knees · soleus, pause at the bottom stretch", sub: "Seated DB calf raise, DBs on the knees." }
          ]
        }
      ]
    },
    {
      id: "day5",
      name: "Pump · upper volume",
      tagline: "Volume day. Full sleeves.",
      blurb: "Controlled volume across pull, push, and arms. Leave 1–2 reps in the tank.",
      warmup: "2 light pulldown sets (half weight × 12) · then straight in",
      blocks: [
        {
          title: "Lat Pulldown · triset",
          exercises: [
            { name: "Wide Grip Pulldown", sets: 2, reps: "8–12 · set 2 to failure", note: "Heavy · outer lats", sub: "Cable taken → wide-grip pull-ups to failure (banded if needed)." },
            { name: "Narrow Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · inner back, biceps", sub: "Cable taken → close-grip/neutral pull-ups, or single-arm DB row to failure." },
            { name: "Reverse Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · lower lats + biceps", sub: "Cable taken → chin-ups (palms toward you) to failure." }
          ]
        },
        {
          title: "Chest · cable fly triset",
          exercises: [
            { name: "Cable Fly · high-to-low", sets: 2, reps: "10–12", note: "Lower pec line · pull down and across", sub: "Cables taken → decline DB fly, or a slight-decline push-up." },
            { name: "Cable Fly · mid", sets: 2, reps: "10–12", note: "Mid pec · pull straight across", sub: "Cables taken → flat DB fly on any bench (or the floor)." },
            { name: "Cable Fly · low-to-high", sets: 2, reps: "10–12", note: "Upper pec · pull up and across", sub: "Cables taken → incline DB fly, bench at ~30°." }
          ]
        },
        {
          title: "Shoulders",
          exercises: [
            { name: "Shoulder Press", sets: 2, reps: "8–10", note: "Controlled · 1–2 in tank", sub: "Machine/bench taken → standing DB press." },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 2,
              reps: "10 ea stage",
              note: "Same drop superset as Day 1/3 — heavy R+L then immediately drop",
              sub: "Cables taken → DB lateral raise drop set: heavy pair R+L, put them down, straight into a lighter pair R+L.",
              byPhase: { 3: { name: "Lean-Away Cable Lateral · drop superset", note: "Phase 3: grip the frame, lean away — constant tension, deeper stretch at the bottom · same heavy R/L then drop R/L" } },
              inputMode: "multistage",
              stages: [
                { label: "R · heavy" },
                { label: "L · heavy" },
                { label: "R · drop" },
                { label: "L · drop" }
              ]
            },
            { name: "Reverse Delt Fly", sets: 2, reps: "12–15", note: "Squeeze rear delts", sub: "Machine taken → bent-over DB rear fly, or band pull-aparts." },
            { name: "Cable External Rotation", sets: 2, reps: "15 / side", note: "Light, elbow pinned", sub: "Band external rotation." }
          ]
        },
        {
          title: "Arms",
          exercises: [
            { name: "Straight Bar Pushdown", sets: 1, reps: "to failure", note: "Heavy · one all-out set · overall tricep mass", sub: "Cable taken → bench dips to failure, or DB overhead extension." },
            { name: "Spider Curl", sets: 1, reps: "to failure", note: "Heavy · chest on a 45° incline bench, arms hanging · curl to peak, 1-sec squeeze · the bench kills the swing", sub: "No incline bench → standing DB curl with your back flat on a wall (kills the swing the same way)." },
            { name: "Spider Hammer Curl", sets: 1, reps: "to failure", note: "Heavy · same setup, neutral grip · brachialis + forearm", sub: "No incline bench → standing hammer curl, back on a wall." }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "V-Ups", sets: 1, reps: "10–12", note: "Reach for your toes · breathe OUT on the way up", inputMode: "bodyweight_reps" },
            { name: "Single-Leg V-Ups", sets: 1, reps: "8/side", note: "Alternate legs · opposite hand to raised foot · exhale up", inputMode: "bodyweight_reps" },
            { name: "Russian Twist · medicine ball", sets: 1, reps: "12/side", note: "Feet up = harder · exhale on each twist · log ball kg", sub: "No med ball → any DB or plate held at the chest." }
          ]
        },
        {
          title: "Zone 2 · optional",
          exercises: [
            { name: "Incline Walk or Stairmaster · Zone 2", sets: 1, reps: "45–60 min", note: "Conversational pace — can talk, wouldn't sing. Here or on a rest day. VO2max = longevity.", inputMode: "cardio", machines: ["Incline walk", "Stairmaster", "Bike", "Outdoor"], sub: "Machines full → walk outside. Zone 2 needs no equipment at all." }
          ]
        },
        {
          title: "Lats · extra",
          exercises: [
            { name: "Single-Arm Lat Pulldown", sets: 2, reps: "10–12 / side", note: "Full stretch overhead, elbow to the hip", sub: "Single-arm DB row toward the hip." }
          ]
        }
      ]
    },
    {
      id: "homecore",
      name: "Home core",
      tagline: "Rest day · 15 min",
      blurb: "This is a REST day. Four core sets on the floor is the whole requirement — everything below that is take-it-or-leave-it. Your gym days already carry the core volume; this is here to keep the streak and the habit, not to be a sixth session.",
      blocks: [
        {
          title: "Core · floor circuit",
          exercises: [
            { name: "Hollow Hold", sets: 1, reps: "20–30 sec", note: "Arms over, legs straight, low back pressed into the floor", inputMode: "time" },
            { name: "Dead Bug", sets: 1, reps: "12 / side", note: "Opposite arm and leg, slow · anti-extension, the one that fights the desk-sit arch", inputMode: "bodyweight_reps" },
            { name: "Side Plank", sets: 1, reps: "30 sec / side", note: "Hips high · obliques, and the waist line you're actually chasing", inputMode: "time" },
            { name: "Superman Hold", sets: 1, reps: "20 sec", note: "Lower back + glutes · the direct counter to a week in the chair", inputMode: "time" }
          ]
        },
        {
          title: "Power · explosive",
          exercises: [
            { name: "Explosive Push-Ups", sets: 1, reps: "10", note: "Drive the hands off the floor · one crisp set, stop the moment they stop leaving the ground", inputMode: "bodyweight_reps" },
            { name: "Jump Squats", sets: 1, reps: "10", note: "Land soft, reset, jump. Thursday sits the day after Day 4's cleans and squats — if the legs are still cooked, skip this one outright. It is not worth a stiff Saturday.", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Vertical pull · ONE home day only",
          exercises: [
            { name: "Pull-Ups", sets: 2, reps: "max", note: "Wide-ish, palms away · lats + width. Band-assisted if needed. ONE of the two home days only — never both, and never the day before Saturday's back day.", inputMode: "bodyweight_reps", sub: "No bar → band pulldowns, or skip. This block is optional by design." }
          ]
        },
        {
          title: "Gym · KB finisher",
          exercises: [
            { name: "KB Swings · intervals", sets: 2, reps: "30s on / 30s off", note: "Only if you're already at the gym — don't make a trip for it. 20kg max, tap the timer for the 30s on, push max reps (aim 22+).", timed: 30, sub: "No KB free → two-hand DB swing. Not at the gym → skip it, the day still counts." }
          ]
        }
      ]
    },
    {
      id: "mvs",
      special: true,
      name: "Minimum viable session",
      tagline: "Crowded or bad day · 20 min · still counts",
      blurb: "Gym packed, tired, or short on time? Three lifts, in and out — all of it doable with two dumbbells and a bench, so a full gym can't block you. Showing up is the win; this logs as a full green day.",
      blocks: [
        {
          title: "The 3",
          exercises: [
            { name: "Goblet Squat", sets: 3, reps: "10", note: "One DB, full depth" },
            { name: "DB Row", sets: 3, reps: "10/side", note: "One DB, brace on the bench", sub: "No bench free → hinge over and row from a standing split stance." },
            { name: "DB Shoulder Press", sets: 3, reps: "10", note: "Standing or seated", sub: "No bench free → standing. Brace hard, ribs down." }
          ]
        }
      ]
    },
    {
      id: "spidey",
      special: true,
      name: "Spidey session",
      tagline: "No gym / wiped out · bodyweight + a run · still counts",
      blurb: "Can't face the gym, or just running on empty? Everything here is bodyweight — a pull-up bar is the only kit, and even that has a sub. On a tired day this is a WIN, not a workout to crush: keep an easy pace, leave 2–3 in the tank, and let the run be a real Zone-2 stroll. Logs as a full green day.",
      warmup: "2 min easy movement · arm circles, 10 slow air squats, a few scap pull-ups. Don't blast into it cold.",
      blocks: [
        {
          title: "Cindy · 20-min AMRAP",
          exercises: [
            { name: "Cindy — 5 pull-ups · 10 push-ups · 15 air squats", sets: 1, reps: "20 min · max rounds", note: "Set the 20-min timer, then loop the sequence — 5 pull-ups → 10 push-ups → 15 air squats — for as many rounds as you can. LOG THE TOTAL ROUNDS. Wiped today? Pace it steady and stop each set 2–3 reps shy — the point is to move and keep the habit, not to redline. Scale freely: band or jumping pull-ups, knees-down push-ups.", inputMode: "amrap", timed: 1200, sub: "No pull-up bar → inverted rows under a sturdy table, or band pulldowns. No bar and no band → swap the pull-ups for a 20-sec superman hold each round." }
          ]
        },
        {
          title: "Then · easy run",
          exercises: [
            { name: "Easy run · Zone 2", sets: 1, reps: "15–20 min", note: "Conversational pace — you can talk, couldn't sing. This is recovery, not a session; keep it genuinely easy, especially on a tired day. Log the minutes (+ your pace if you've got it).", inputMode: "treadmill", machines: ["Outdoor", "Treadmill"], sub: "Rather not run? A brisk 20-min walk counts the same. Sore knees → incline walk or bike instead." }
          ]
        }
      ]
    },
    {
      id: "oman1",
      name: "Legs · strength + hinge",
      tagline: "Durability base · heavy, not heroic",
      blurb: "Strong hips and quads make a descent survivable. Deadlifts and split squats at RPE 7 — leave stronger, not wrecked. Week 3 (Oct 19+) = taper: 2 sets each.",
      warmup: "5 min incline walk · knee-to-wall rocks × 15 L / 10 R · bodyweight squats × 10 · glute bridge × 10",
      blocks: [
        {
          title: "Lower strength",
          exercises: [
            { name: "Barbell Deadlift", sets: 3, reps: "5", note: "RPE 7 — two clean reps in reserve, never a grind. Replaces power cleans. Brace hard, bar close. Log the weight per side.", barbell: true, sub: "Bar taken → heavy DB Romanian deadlift × 8." },
            { name: "Rear-Foot-Elevated Split Squat", sets: 3, reps: "8 / leg", note: "3-sec lowering. LEFT leg first. Let the knee travel over the toes.", sub: "Bench taken → Smith split squat, or reverse lunge × 10/leg, slow lowering." },
            { name: "Weighted Step-Up · step down slow", sets: 2, reps: "10 / leg", note: "Knee-height box, DBs in hand. Step DOWN over 3 sec — the descent is the point.", sub: "Box taken → Smith step-up or the bottom stair, same tempo." }
          ]
        },
        {
          title: "Ankle + calf",
          exercises: [
            { name: "Single-Leg Calf Raise · slow lower", sets: 3, reps: "12 / leg", note: "Off a step, 3-sec lower into full stretch. Left gets an extra set.", inputMode: "bodyweight_reps", sub: "No step → Smith calf raise on a plate." },
            { name: "Single-Leg Balance · eyes closed", sets: 2, reps: "30 sec / leg", note: "On a folded mat. Scree-proofing.", inputMode: "time", sub: "Eyes open on the floor, turning your head side to side." }
          ]
        },
        {
          title: "Carry",
          exercises: [
            { name: "Farmer Carry", sets: 3, reps: "40 m", note: "Heavy DB each hand. Grip + core for a pack.", inputMode: "carry", sub: "DBs taken → KBs, or one heavy DB at a time (suitcase carry)." }
          ]
        }
      ]
    },
    {
      id: "oman2",
      name: "Upper · V-taper push",
      tagline: "Chest, side delts, triceps",
      blurb: "The look-the-part day. Side delts get the most volume — shoulder width is what makes a 167cm frame read big. Zero leg fatigue.",
      warmup: "Band pull-aparts × 20 · push-ups × 10 · light lateral raises × 15",
      blocks: [
        {
          title: "Press",
          exercises: [
            { name: "Incline DB Press", sets: 4, reps: "6–10", note: "1–2 in the tank. Log each hand.", sub: "Bench taken → Smith incline press." },
            { name: "Seated DB Shoulder Press", sets: 3, reps: "8–10", note: "Controlled, no lockout bounce.", sub: "Shoulder-press machine or Smith seated press." }
          ]
        },
        {
          title: "V-taper",
          exercises: [
            { name: "Cable Lateral Raise", sets: 4, reps: "12–20 / side", note: "Last set: drop the weight at failure and keep going. The #1 width lift.", sub: "Cables taken → DB lateral raise." },
            { name: "Cable Fly · low-to-high", sets: 3, reps: "12–15", note: "Deep stretch, upper chest.", sub: "DB fly on an incline bench." },
            { name: "Overhead Cable Triceps Extension", sets: 3, reps: "10–15", note: "Long-head stretch = arm size.", sub: "DB overhead extension or dips." }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Suitcase Carry", sets: 3, reps: "40 m / side", note: "One heavy DB. Anti-lean core for a loaded pack.", inputMode: "carry", sub: "Single KB carry." }
          ]
        }
      ]
    },
    {
      id: "oman3",
      name: "Eccentric legs · downhill armour",
      tagline: "The descent session · control, not speed",
      blurb: "Jebel Shams goes DOWN for hours — that's what destroys quads. Slow lowering now means your legs shrug it off later. Week 1 is a light dose and will still make you sore; it gets easier. Last one Oct 21.",
      warmup: "5 min easy bike · knee-to-wall rocks × 15 L · 2 flights easy stairs",
      blocks: [
        {
          title: "Downhill simulation",
          exercises: [
            { name: "Stair Descents · loaded", sets: 1, reps: "W1: 10 flights · W2: 20–25 flights", note: "Pack on: 5 kg week 1, 8–10 kg week 2. Walk DOWN under control, quiet feet, lift/walk back up. Log flights + pack kg.", inputMode: "cardio", machines: ["Stairwell", "HDB block"], sub: "No stairwell → slow box step-downs 3 × 15/leg with the pack on. (Stairmaster only trains UP.)" },
            { name: "Slow Step-Down · heel tap", sets: 3, reps: "8 / leg", note: "20 cm step, lower the other heel over 4 sec, don't push off it. LEFT first. Knee over 2nd toe. Add DBs in week 2.", inputMode: "bodyweight_reps", sub: "No step → bench edge or the bottom stair." }
          ]
        },
        {
          title: "Eccentric strength",
          exercises: [
            { name: "Tempo Goblet Squat", sets: 3, reps: "8", note: "4 sec down, 1 sec pause, normal up. Moderate DB.", sub: "KB goblet or light Smith squat, same tempo." },
            { name: "Leg Extension · 4s lower", sets: 2, reps: "10–12", note: "Up with both legs, lower slowly. Pure quad brakes, tendon-friendly.", sub: "Machine taken → wall sit 45 sec." },
            { name: "DB Romanian Deadlift · 4s lower", sets: 2, reps: "8", note: "Hamstrings brake you downhill too. Log DB weight.", sub: "KB RDL or light barbell RDL." }
          ]
        },
        {
          title: "Ankle",
          exercises: [
            { name: "Lateral Hop-and-Stick", sets: 2, reps: "6 / leg", note: "Small side hops, land and hold 2 sec. Teaches the ankle to catch a bad rock.", inputMode: "bodyweight_reps", sub: "Ankle niggly → single-leg balance on a mat, 30 sec." },
            { name: "Tibialis Raise", sets: 2, reps: "20", note: "Back to wall, lift the toes. Shins take a beating downhill.", inputMode: "bodyweight_reps", sub: "Seated on a bench, light DB between the feet." }
          ]
        }
      ]
    },
    {
      id: "oman4",
      name: "Long loaded hike · weekend",
      tagline: "Time on feet · the rehearsal day",
      blurb: "Matters more than any other session. Real pack, real shoes, real food + water. Conversational pace — long, not hard. Oct 10: 2.5 h · Oct 17: 3.5–4 h PEAK (+ Oct 18: 2 h easy back-to-back) · Oct 24: 90 min kit rehearsal.",
      warmup: "First 10 min easy · ankle rocks × 10 L",
      blocks: [
        {
          title: "The hike",
          exercises: [
            { name: "Loaded hike · Bukit Timah / MacRitchie / Southern Ridges", sets: 1, reps: "see blurb", note: "Pack 6 kg → 8–10 kg (peak) → 6 kg (rehearsal). Hit every hill and stair — DOWN slowly. Log minutes + pack kg in level.", inputMode: "cardio", machines: ["Outdoor", "Stairwell", "Treadmill"], sub: "Rain → stairwell up + walk down with pack, 60–90 min, then incline treadmill to make up the time." },
            { name: "Stair descent block · mid-hike", sets: 1, reps: "10–15 flights", note: "In the middle, while already tired. That's Jebel Shams at hour 4.", inputMode: "cardio" }
          ]
        },
        {
          title: "Rehearsal",
          exercises: [
            { name: "Fuel + water on schedule", sets: 1, reps: "every 20 min", note: "Follow the Trail fuel card (Fuel tab). Weigh before and after: lost >1.5 kg = drink more next time.", inputMode: "time" },
            { name: "Kit check", sets: 1, reps: "once", note: "Trip shoes + socks, hat, sleeves, poles if bringing (use them downhill). Any hot spot → fix it this week, not in Oman.", inputMode: "bodyweight_reps" }
          ]
        }
      ]
    },
    {
      id: "oman5",
      name: "Upper · V-taper pull + Zone 2",
      tagline: "Lats, rear delts, biceps · aerobic base",
      blurb: "Wide lats finish the V, and pulling keeps shoulders happy under pack straps. Finish with easy Zone 2 + ankle mobility. Taper week: 2 sets each, 30 min walk.",
      warmup: "Dead hang 30 s · band pull-aparts × 20 · light pulldown × 15",
      blocks: [
        {
          title: "Pull",
          exercises: [
            { name: "Lat Pulldown", sets: 4, reps: "6–10", note: "Full stretch at the top. Log weight.", sub: "Assisted pull-up or pull-up." },
            { name: "Chest-Supported Row", sets: 3, reps: "8–12", note: "No lower-back fatigue before the long day.", sub: "Chest on an incline bench, DB row." },
            { name: "Single-Arm Cable Lat Pulldown", sets: 3, reps: "12–15 / side", note: "Elbow to hip. Lat width.", sub: "Single-arm DB row toward the hip." }
          ]
        },
        {
          title: "Accessories",
          exercises: [
            { name: "DB Lateral Raise (2nd dose)", sets: 3, reps: "15–20", note: "Side delts twice a week beats once.", sub: "Cable lateral raise." },
            { name: "Face Pull", sets: 3, reps: "15–20", note: "Rear delts + cuff.", sub: "Band pull-apart × 25, or reverse-delt-fly machine." },
            { name: "Incline DB Curl", sets: 3, reps: "10–12", note: "Long-head stretch.", sub: "Cable curl." }
          ]
        },
        {
          title: "Aerobic + mobility",
          exercises: [
            { name: "Zone 2 · incline walk or Stairmaster", sets: 1, reps: "25–40 min", note: "Could hold a conversation. Taper week: 30 min.", inputMode: "treadmill", machines: ["Treadmill", "Stairmaster", "Bike", "Outdoor"], sub: "Any easy cardio, same time." },
            { name: "Knee-to-Wall Ankle Rock · loaded", sets: 2, reps: "15 L / 10 R", note: "DB on the knee. Retest Mondays — goal L ≥ 14 cm.", inputMode: "bodyweight_reps", sub: "Unloaded rocks." }
          ]
        }
      ]
    }
  ],

  mobilityTests: [
    { name: "Deep squat hold", spec: "60 sec, heels down", note: "Sit in the bottom, chest up" },
    { name: "Couch stretch", spec: "60 sec/side, no arch", note: "Glute squeezed, ribs down" },
    { name: "Knee-to-wall", spec: "≥ 10 cm each side", note: "Big toe to wall, knee taps without heel lifting" },
    { name: "Standing toe touch", spec: "Palms to floor", note: "Soft knees, hinge" },
    { name: "Hip internal rotation", spec: "Compare L vs R", note: "Seated or frog-IR · turn the shin out to rotate the hip in. Re-test monthly: range opening = your toes-out is soft-tissue and the frog work is winning; stuck and symmetric = anatomical, manage it in gait, don't force it." }
  ],

  maintainCircuit: [
    { name: "Push-Ups", spec: "3 × max", note: "Hold the groove, don't chase numbers" },
    { name: "Bodyweight Squats", spec: "3 × 20", note: "Full depth, controlled" },
    { name: "Dead Hang", spec: "2 × max", note: "Decompress the spine, keep grip" },
    { name: "Morning ritual", spec: "Full", note: "Keeps the hips honest while you're away" }
  ],

  targets: [
    { label: "Calories", value: "1,900–2,000", note: "Defaults, not counting" },
    { label: "Protein", value: "140 g", note: "Fixed base: whey + 3 eggs + chicken, then meals" },
    { label: "Weight", value: "−13 kg", note: "83 → 70 kg · 7-day avg · −0.4–0.5 kg/wk · ≈ early July 2027" },
    { label: "Waist", value: "94 → 90 → 83.5", note: "< 90 cm = out of the South Asian risk zone · ≤ 83.5 = half your height, the finish line. Navel, every 2nd Saturday" },
    { label: "Meal walks", value: "10–15 min", note: "After lunch + dinner · the South Asian superpower" },
    { label: "Steps", value: "8–10K", note: "Daily · meal walks do most of it" },
    { label: "Sleep", value: "7+ hrs", note: "#1 lever" },
    { label: "Stall rule", value: "14 days flat", note: "−150–200 kcal or +2K steps" }
  ],

  proteinSources: [
    { name: "3 eggs", grams: 20, when: "Breakfast · 7-Eleven on early days" },
    { name: "Halal whey sachet (isolate if it bloats)", grams: 25, when: "4–5pm, or with a banana on the way in" },
    { name: "Tandoori / grilled chicken (hawker plate)", grams: 25, when: "Lunch or dinner · ask for extra chicken = +15 g" },
    { name: "Fish — batang soup, ikan bakar, saba, salmon", grams: 25, when: "Twice a week minimum" },
    { name: "Chicken breast pouch / ready-cooked chicken", grams: 25, when: "Desk drawer or 7-Eleven · late-night insurance" },
    { name: "Greek yogurt / hung curd cup", grams: 15, when: "Desk snack, or as raita" },
    { name: "Chana / rajma (1 cup) — bonus, not a main", grams: 12, when: "Fibre + some protein" }
  ],

  snacks: [
    { name: "Greek yogurt / hung curd + berries", how: "~15–20 g protein · ~150 kcal · the best desk snack" },
    { name: "2 boiled eggs (7-Eleven)", how: "~13 g protein · ~140 kcal" },
    { name: "Chicken breast pouch + cucumber", how: "~25 g protein · ~150 kcal · desk drawer" },
    { name: "Whey shake + 1 fruit", how: "~25 g protein · ~200 kcal · before a late dinner" },
    { name: "Roasted chana (1 small cup)", how: "~10 g protein · ~180 kcal · crunchy, kills the murukku craving" },
    { name: "Edamame (1 cup)", how: "~17 g protein · ~190 kcal · FairPrice frozen section" },
    { name: "Chaas / plain buttermilk", how: "~5 g protein · ~60 kcal · great after spicy food" },
    { name: "Apple / guava / orange", how: "~80 kcal · fibre, fills you up" },
    { name: "Nuts — ONE palmful (~15 almonds)", how: "~100 kcal · never from the bag" },
    { name: "Careful: 'healthy' but dense", how: "Trail mix, dates (>3), granola, dried fruit, smoothies, protein bars, baked murukku — easy 400 kcal" }
  ],

  goTos: [
    { name: "Chapati set", how: "2 chapati + chicken/mutton dry + dhal + veg — the best Indian hawker default" },
    { name: "Tandoori set", how: "Tandoori chicken + 1 naan or 2 chapati (not both) + dal + mint" },
    { name: "Nasi briyani", how: "Half rice, chicken or fish, acar + raita, skip the extra ghee and the papadam" },
    { name: "Thosai", how: "Plain thosai + sambar + an egg or chicken on the side. Masala thosai = carbs on carbs" },
    { name: "Roti prata", how: "1 plain/kosong + egg, dip in dhal not fish curry. 3 pratas = a dinner's worth of oil" },
    { name: "Home dal-sabzi-chicken", how: "1 tbsp oil per pan, chicken/fish palm-plus, 1–2 roti, salad first" },
    { name: "Nasi padang", how: "Ayam bakar, kangkong + cabbage, half rice, gravy on the side" },
    { name: "Chicken rice", how: "Skin off, double chicken, half rice" },
    { name: "Sliced fish soup / yong tau foo", how: "Clear soup, protein-heavy picks, extra tofu" },
    { name: "Early-meeting breakfast", how: "2 boiled eggs (7-Eleven) + a protein drink, or a shake + banana on the way" }
  ],

  limits: [
    { name: "Teh tarik / masala chai with sugar", how: "Kosong or siew dai — 2 a day sweet = ~300 kcal" },
    { name: "Fried sides", how: "Samosa, pakora, vadai, curry puff, murukku — weekends, one portion" },
    { name: "Rice AND roti in one meal", how: "Pick one. Rice drowned in kuah → gravy on the side, half rice" },
    { name: "Murtabak, mee goreng mamak, butter chicken", how: "Once a week, share the murtabak" },
    { name: "Mithai + kueh", how: "Gulab jamun, ladoo, jalebi, kueh — one piece at events, never at the desk" },
    { name: "Supper prata / Maggi after 10pm", how: "Protein snack at 4–5pm prevents it" },
    { name: "Mango lassi, Milo, bubble tea, Rose syrup", how: "Once a week, small. Chaas or kosong instead" }
  ],

  executionRules: [
    "The first block of every session is the MINIMUM — done = a full session. Only LIFTING sessions (A/B/C) count toward the week: 2 = full week, 3 = great week (week 4+ aim for 3). Swim, Zone 2, intervals, hill and Home 20 are bonus — they never replace a lift.",
    "Short on time? Drop in this order, last first: lifts > lunch walk > one Move session > swim > hill.",
    "Go in order A → B → C → A, whatever the weekday. Missed one? Just do the next one — no make-ups, no doubling up.",
    "Effort: week 1 = only the first block, stop when 3–4 more reps were possible. Weeks 2–3 = add one more block, 2–3 left. Week 4+ = everything; the LAST set of each lift goes to 1–2 reps left, earlier sets 2–3.",
    "Progress: when every set hits the top of the rep range, add the smallest jump next time (DB +2 kg, Smith +2.5 kg, cable +1 pin). Want a change? Week 5 and week 10 each offer one alternate per main lift — keep or try, then it's locked.",
    "Fit it around work: weekday sessions after Zuhr at lunch or straight after work (never go home first); one on the weekend morning. Crushed week → Home 20.",
    "Weeks 7–9 (year-end holidays): ONE session = a full week — and here a hill walk or Home 20 counts too.",
    "Back after 10+ days off? Just the first block, lighter than last time. No catching up.",
    "Gym packed? Take the TAKEN? swap under the lift and keep moving.",
    "Slept under 6 hrs? First block only, easy — or a 30-min walk instead.",
    "Shoulder pinch rule: sharp or pinching pain at the front of the shoulder = stop that exercise today, use the swap. A dull muscle burn is fine. Pinched two sessions running → drop back to last week's set count.",
    "Pain: next-day soreness ≤3/10 is fine. Joint pain still there next morning → no load increase, go lighter or swap. Sharp pain → stop that exercise.",
    "Food does ~75% of the fat loss. Weigh daily, judge only the 7-day average. Don't add gym days to fix a stall — add meal walks and fix the carb portion first.",
    "Walk 10–15 min after lunch and dinner. For South Asian bodies this does more for belly fat than an extra gym session.",
    "Long days: keep 2 chicken pouches and whey sachets in the desk drawer — the 4–5pm protein hit stops the 10pm raid. Catered meeting: take the protein and fruit, skip the kueh."
  ],

  lookThePart: [
    "SPF 30+ on your face every morning — SG sun ages skin fastest.",
    "Haircut every 3–4 weeks; book the next one as you leave.",
    "Creatine (optional): 3–5 g monohydrate powder a day. Expect ~1–2 kg of water early — not fat. Start in week 1 or not at all. In Ramadan, take it at suhoor or iftar."
  ],

  disclaimer: "General information, not medical advice. Sharp or lingering pain: stop and swap the exercise.",

  genetics: [
    { title: "Fat goes to the belly first — and leaves it last", body: "Same weight, more belly (visceral) fat than other groups. The waist is your scoreboard: under 90 cm = out of the South Asian men's risk zone, 83.5 cm = the finish line." },
    { title: "Less muscle at the same weight", body: "Muscle is where blood sugar goes to be burned. That makes lifting the #1 fat-loss tool for you — not cardio. From week 4: 3 sessions a week, 2 still counts." },
    { title: "Carbs hit harder", body: "Rice, roti and sugar spike higher. Fix it without giving them up: veg first, carbs last, one carb per meal, and walk 10 min after eating." },
    { title: "Belly fat loves movement", body: "Steps + Zone 2 + one interval session a week strip visceral fat fastest. It's the first fat to go once you move daily." },
    { title: "Vitamin D is almost always low", body: "Brown skin + office life. D3 2,000 IU daily with a meal." },
    { title: "Triglycerides run high", body: "Sugary drinks, fried snacks and big carb dinners drive them. Fish twice a week, kosong drinks, fried food as a treat." },
    { title: "Lactose can bloat", body: "Whey ISOLATE if normal whey bloats you; chaas and Greek yogurt are usually fine." }
  ],

  virility: [
    "Sleep 7+ hours. T drops ~15% per hour lost. #1 lever.",
    "Manage stress. Wind-down hour before bed. No laptop.",
    "Don't cut below 12% body fat. Tanks hormones.",
    "Heavy compounds (RDL, squat, DL). You're already doing these.",
    "Vitamin D3 — almost guaranteed low. Non-negotiable.",
    "Zinc + magnesium — oysters, beef, pumpkin seeds, or supplement.",
    "Enough calories. Chronic under-eating kills libido fast.",
    "AVOID: tribulus, T-boosters, megadose ashwagandha long-term, >2 drinks twice a week."
  ],

  progression: [
    { title: "Main lifts · double progression", body: "Hit the top of the rep range on ALL sets → add the smallest jump next session (DB +2 kg, Smith +2.5 kg). Middle of the range → same weight. Below the range → too heavy, drop it." },
    { title: "Assisted chin-up", body: "Log the assist kg on every set (lower = stronger). All sets at 10 → one plate less assistance. First unassisted rep is the big milestone." },
    { title: "Engine work", body: "Swings and the step-up circuit: add a round or a heavier bell when it feels steady. Swim: add a minute of no-touch swimming. Zone 2: add minutes before speed." },
    { title: "Stalled? No rep added in 3 sessions", body: "Pick one: drop the load 10% and rebuild, take the listed swap, or fix sleep and food first. A stall is information, not failure." }
  ],

  phases: [
    { weeks: "1–4", title: "RHN · COME BACK", body: "Phase 1 of the RHN road. Easy on purpose. Scale drops 2–3 kg — mostly water, expected. Stamina and sleep improve first. ~80–81 kg." },
    { weeks: "5–13", title: "RHN · STEADY LOSS", body: "0.4–0.5 kg a week, 3 lifts a week + intervals start. Waist under 90 cm (out of the South Asian risk zone) around here. Belly shrinks, chin-up assist drops, hikes get easier. Week 5: optional lift swaps. Week 10: the app asks for your check-in (3 min) to build RHN 2.0. ~78 kg and a waist near 90 cm by Ramadan." },
    { weeks: "14–19", title: "RAMADAN · HOLD", body: "~8 Feb → Raya ~10 Mar + open-house week. Maintenance calories. 2 lifts a week, still A → B → C, 60–90 min after iftar (never in a prayer slot): the app trims each to ~25 min but KEEPS the laterals and arms. Hold your weights, 2–3 reps left. Walks only, no intervals. Iftar: 3 dates + water, then protein, then one carb. Bandung: one small glass. Kuih 1–2. Open house: one plate, protein + veg first. Finish at the same weight = a win." },
    { weeks: "20–34", title: "RHN 2.0 · FINISH", body: "From Sat 20 Mar 2027: RHN 2.0 — physique + functional, built from your week-10 check-in. Opens easy like week 1. ~0.4 kg a week. Waist 86 → 83.5 cm (≈ 70 kg, ~14% body fat — the RHN look) around week 30, mid-2027." }
  ]
};
