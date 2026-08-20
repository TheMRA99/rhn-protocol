// THE RED HOOD × NIGHTWING PROTOCOL — data
const DATA = {
  startKg: 75,
  targetKg: 69,
  totalWeeks: 16,

  morningRitual: [
    { name: "Stomach Vacuum", spec: "3 × 30 sec", note: "Inner core, waist control · pull the navel to the spine, hold, breathe shallow. Your daily non-negotiable." },
    { name: "Core circuit", spec: "1 round", note: "20 push-ups → 1-min plank → 20 push-ups → 1-min reverse plank · no rest between. Add a round when it stops being hard." }
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
    { name: "Calories", spec: "2,000–2,200", note: "300–400 kcal deficit · you decide what the week averages" },
    { name: "Protein", spec: "135–150 g", note: "1.8–2 g per kg bodyweight" },
    { name: "Fiber + veg", spec: "25–30 g", note: "Two fists of veg per meal · flattens glucose, keeps you full" },
    { name: "Water", spec: "2.5–3 L+", note: "More on training days and in the SG heat" },
    { name: "Steps", spec: "10,000–12,000", note: "NEAT — biggest fat loss lever after the deficit" },
    { name: "Cardio", spec: "10–20 min · Zone 2", note: "Every day · easy & conversational (walk / incline / stairs). Post-lift or a standalone on rest days. Keep it easy — not another hard session." },
    { name: "Sleep", spec: "7+ hrs", note: "The #1 lever for results" },
    { name: "Creatine", spec: "5 g", note: "2 scoops CreAMP, any time" },
    { name: "Vitamin D3", spec: "2,000–4,000 IU", note: "With a fatty meal" },
    { name: "Magnesium glycinate", spec: "300 mg", note: "Before bed — sleep + recovery" },
    { name: "Zinc", spec: "15 mg", note: "If not eating red meat/eggs daily" }
  ],

  stamina: [
    { name: "AM · Kegels", spec: "10 × 5s/5s", note: "Squeeze 5s, release 5s · invisible — do them at the desk or on the commute, costs zero clock time" },
    { name: "PM · Reverse Kegels", spec: "10 × 5s/5s", note: "The one that delays finishing" },
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
            { name: "Pendlay Row", sets: 2, reps: "5", note: "Dead-stop on floor each rep · pull explosive to lower chest", barbell: true, sub: "No bar/floor space → bent-over DB row, both arms, dead-stop each rep." },
            { name: "Wide-Grip Lat Pulldown", sets: 3, reps: "10–12", note: "Lats not arms · drive elbows down to your ribs, 2-sec squeeze at the bottom", sub: "Cable queue → pull-ups (banded if needed), or a DB pullover on a bench.",
              byPhase: {
                2: { sets: 2, note: "Trimmed to 2 sets while the diagonal block runs · lats not arms, 2-sec squeeze at the bottom" },
                4: { sets: 2, reps: "8–10", note: "Phase 4: slow tempo — 3-sec negative, 1-sec pause at the stretch · lats not arms" }
              } },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 2,
              reps: "10 ea stage",
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
            { name: "Single-Leg Calf Raise", sets: 2, reps: "12/side", note: "Achilles prehab", inputMode: "bodyweight_reps" },
            { name: "Dead Bug", sets: 2, reps: "12", note: "Slow, anti-extension", inputMode: "bodyweight_reps" },
            { name: "Incline Walk", sets: 1, reps: "10 min", note: "Easy pace · log min, km/h, incline%. Your daily Zone-2 line already covers the rest — this is just the cooldown.", inputMode: "treadmill", sub: "Treadmills full → walk outside or take the stairs. Same 10 min, easy pace." }
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
              sets: 1,
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
          title: "Arm Finisher · 1 min each, no rest",
          exercises: [
            { name: "DB Wide Curl", sets: 1, reps: "1 min · max reps", note: "Tap timer when you start", timed: 60 },
            { name: "Hammer Curl", sets: 1, reps: "1 min · max reps", note: "Tap timer when you start", timed: 60 },
            { name: "Straight Curl", sets: 1, reps: "1 min · max reps", note: "Tap timer when you start", timed: 60 }
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
            { name: "Overhead Cable Extension", sets: 1, reps: "10–12", note: "Long head — the part that fills the sleeve", sub: "Cable taken → two-hand DB overhead extension, seated or standing." }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Cable Crunch", sets: 1, reps: "15–20", note: "One quality set. Lighter load, higher reps. Breathe OUT on the way down — never hold your breath (that's the cramp). Stop if it seizes.", sub: "Cable taken → weighted floor crunch (DB or plate on the chest), or hanging knee raises." },
            { name: "Stairmaster · intervals", sets: 1, reps: "30s hard / 60s easy × 4", note: "Log the level you held on the hard bouts + rounds done", inputMode: "interval", sub: "Stairmaster queue → treadmill at a steep incline, bike, or real stairs. Same 30s hard / 60s easy × 4." }
          ]
        }
      ]
    },
    {
      id: "day4",
      name: "Power + conditioning",
      tagline: "Heavy. Explosive. Springy.",
      blurb: "Heavy pull, explosive work, metabolic finisher. You feel light after.",
      warmup: "5 min easy cardio · bar-only clean drills × 5 · deadlift ramp 60% × 5. Never pull heavy cold",
      blocks: [
        {
          title: "Strength",
          exercises: [
            { name: "Clean → Push Press → Front Squat · complex", sets: 3, reps: "3 each · unbroken", note: "One bar, no drop — 3 power cleans → 3 push press → 3 front squats = 1 set, ×3. Load off your PUSH PRESS (the weak link); if set 3 turns sloppy, drop 5–10% next week. Reset the clean from the floor each round. Do this FIRST, while fresh. Log the bar weight. Worth trying: Clean → Front Squat → Push Press — the bar's already racked after the clean, so you squat fresh and press last.", barbell: true, sub: "No platform/bar → DB clean-to-press + goblet squat, same 3-each unbroken flow." },
            { name: "Barbell Deadlift", sets: 3, reps: "5", note: "AFTER the complex — and not a grind. Stop at RPE 7 (≈3 clean reps left in the tank). The clean already trained the pull; this is axial load, not a max-out. Brace hard, stay tight.", barbell: true, sub: "Bar taken → trap-bar, or heavy DB/KB deadlift from the floor. Same submaximal feel." }
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
            { name: "Stairmaster · moderate", sets: 1, reps: "8 min", note: "Cool down · log minutes + level", inputMode: "cardio", sub: "Any easy cardio — treadmill incline, bike, or stairs. 8 min." }
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
            { name: "Wide Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · outer lats · 1 all-out set", sub: "Cable taken → wide-grip pull-ups to failure (banded if needed)." },
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
            { name: "Reverse Delt Fly", sets: 2, reps: "12–15", note: "Squeeze rear delts", sub: "Machine taken → bent-over DB rear fly, or band pull-aparts." }
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
            { name: "Incline Walk or Stairmaster · Zone 2", sets: 1, reps: "45–60 min", note: "Conversational pace — can talk, wouldn't sing. Here or on a rest day. VO2max = longevity.", inputMode: "cardio", sub: "Machines full → walk outside. Zone 2 needs no equipment at all." }
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
    { label: "Calories", value: "2,000–2,200", note: "300–400 deficit" },
    { label: "Protein", value: "135–150 g", note: "1.8–2 g/kg" },
    { label: "Water", value: "2.5–3 L+", note: "More on training days · SG heat" },
    { label: "Steps", value: "10–12K", note: "Daily" },
    { label: "Sleep", value: "7+ hrs", note: "#1 lever" },
    { label: "Creatine", value: "5 g", note: "Daily" }
  ],

  proteinSources: [
    { name: "3 whole eggs + 2 whites", grams: 25, when: "Breakfast" },
    { name: "Purest Co clear whey", grams: 20, when: "Post-workout / snack" },
    { name: "Chicken breast (150 g)", grams: 35, when: "Lunch · grilled / tandoori" },
    { name: "Paneer (100 g) or dal + chicken", grams: 20, when: "Dinner option" },
    { name: "Greek yogurt (1 cup)", grams: 15, when: "If lactose tolerates" },
    { name: "Whey protein (1 scoop bulk)", grams: 25, when: "Daily top-up, cheaper /g" }
  ],

  goTos: [
    { name: "Chicken rice", how: "Skin off, double chicken, half rice" },
    { name: "Sliced fish soup", how: "No fried fish, extra tofu" },
    { name: "Tandoori chicken", how: "+ 1 roti (not 3) + dal" },
    { name: "Yong tau foo", how: "Protein-heavy picks, clear soup" },
    { name: "Thunder tea rice", how: "All the greens" },
    { name: "Economic bee hoon", how: "Egg + lean protein" }
  ],

  limits: [
    { name: "Ghee in everything", how: "Use sparingly. Measure it" },
    { name: "White rice mountains", how: "1 cup, not 3" },
    { name: "Naan, prata, roti", how: "Pick one per meal, not all" },
    { name: "Sugar in chai", how: "Kills the deficit sneakily" },
    { name: "Samosas, pakoras, bhaji", how: "Occasional, not daily" }
  ],

  executionRules: [
    "Leave 1–2 reps in reserve on heavy lifts. Ego-lifting = torn tendon.",
    "In a deficit: cut volume, never load. Tired? Drop the last set — keep the weight on the bar. That's how muscle survives the cut.",
    "Brace before every heavy rep: big breath into the belly, ribs down, then lift. The brace protects the back the cut can't.",
    "Week 1 load: pick a weight you could grind ~2 reps past the target, then start one notch below. Conservative. The app pre-fills from session 2.",
    "Slow 3-sec eccentrics on laterals and core.",
    "10,000–12,000 steps daily — biggest fat-loss lever after the deficit.",
    "90–120 sec rest on heavy compounds. 45–60 sec on volume work.",
    "No phone between sets. Log, rest, lift.",
    "Morning lifts preferred. Nothing interrupts 6am.",
    "Slept under 5 hrs? Swap gym for a 30-min walk. No gains on no sleep.",
    "Track every workout. What you don't measure, you don't grow.",
    "Consistency > perfection. 80% for 16 weeks beats 100% for 3.",
    "Protein and veg first. Rice/roti last. Flattens insulin spikes.",
    "Hydrate: 2.5–3 L/day, more on training days and in the heat. Salt your food normally — cramping in this humidity is usually sodium, not magnesium.",
    "Gym packed? Don't queue and don't bail. Every station-dependent lift has a TAKEN? swap under it — take the swap and keep moving. A swapped session counts exactly the same; standing around waiting for a machine is not training.",
    "Never stack Day 1 + Day 3 (delt overlap).",
    "Day 2 and Day 4 are both leg days — keep 3 days between them, never 1. The default week runs Day 2 Sunday and Day 4 Wednesday for exactly this reason: 48 hours after squats is peak soreness, and that's what was ruining the power day. Tuesday is upper-body on purpose.",
    "Peak season at work? Flip on Maintain mode below. Minimum viable week: 2 sessions, protein, sleep. Zero guilt."
  ],

  disclaimer: "General information, not medical advice. Week-0 bloodwork and a real doctor/physio are the authority on anything clinical. Any pain that changes how a rep looks, or a groin ache that worsens with lifting or coughing — get it seen now, not at week 16.",

  genetics: [
    { title: "Central fat storage (TOFI)", body: "Gut comes off LAST. Be patient. Don't chase it with endless ab work." },
    { title: "Lower insulin sensitivity", body: "Big carb meals spike harder. Protein + fiber first. Carbs last." },
    { title: "Vitamin D deficiency (near-guaranteed)", body: "Darker skin needs 3–5× more sun. Supplement 2,000–4,000 IU. Daily." },
    { title: "Lower muscle mass baseline", body: "~10–15% lower at same BMI. Protein stays HIGH (1.8–2g/kg). Real, satisfying gains." },
    { title: "Higher tendon strain risk", body: "Achilles + cuff. Warm up properly. Leave 1–2 reps in reserve always." },
    { title: "Lactose intolerance (~70%)", body: "Whey ISOLATE or plant protein if dairy bloats. Clear whey is fine." }
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
    { title: "Main lifts · double progression", body: "RDL, Squat, DL, Incline/Flat DB, Pull-Ups, Press, Row. Hit 8 on ALL sets → +2.5–5kg next session. 6–7 → keep weight. Under 6 → too heavy, drop it." },
    { title: "Volume lifts · 10–15 reps", body: "Delts, arms, forearms. Hit 15 clean on all sets → small increment up." },
    { title: "Deloads · weeks 8 & 14", body: "Same lifts, ~60% load, half the sets. The app auto-adjusts and flags the week. Week 8 also runs a diet break (eat at maintenance 5–7 days — hormonal + mental reset). Week 14 deload sets up a fresh finish, not a fried one." },
    { title: "Stalled? No rep added in 3 sessions", body: "Pick one: (a) drop load 10% and rebuild, (b) swap to a listed variation, (c) fix sleep/food first. A stall is information, not failure." }
  ],

  phases: [
    { weeks: "1–4", title: "ADAPTATION", body: "Strength climbs fast. Pumps feel better. Mood + sleep improve. Scale drops 2–3 kg (mostly water). Waist barely moves. Trust it." },
    { weeks: "5–8", title: "VISIBLE SHIFT", body: "Gut visibly shrinks. Shoulders look wider in fitted shirts. Forearms pop. Stamina up. ~71–72 kg." },
    { weeks: "9–12", title: "V-TAPER EMERGES", body: "V-taper visible in a fitted T. Posture transformed — taller without shoes. Upper chest shelf forms. Core holds hollow. ~69–70 kg." },
    { weeks: "13–16", title: "THE LOOK", body: "Jason/Dick composite at your scale. Dense, defined, capable. Dangerous in a fitted shirt. ~68–69 kg @ 12–14% BF." }
  ]
};
