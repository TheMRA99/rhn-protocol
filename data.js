// THE RED HOOD × NIGHTWING PROTOCOL — data
const DATA = {
  startKg: 75,
  targetKg: 69,
  totalWeeks: 16,

  morningRitual: [
    { name: "Stomach Vacuum", spec: "3 × 30 sec", note: "Inner core, waist control" },
    { name: "Cat-Cow", spec: "10 reps", note: "Spine mobility" },
    { name: "Couch Stretch", spec: "30 sec / side", note: "Hip flexor release · fixes the desk-sit pain at the front of your hip" },
    { name: "Deep Squat Hold", spec: "30 sec", note: "Hip mobility" },
    { name: "Single-Leg Glute Bridge", spec: "10 / side", note: "Wakes lazy glutes from sitting" },
    { name: "Bird Dog", spec: "10 / side · slow", note: "Anti-extension core + glute coordination — built for desk-bound" },
    { name: "Thoracic Opener", spec: "30 sec / side", note: "Doorway. Opens chest, fights hunch" }
  ],

  daily: [
    { name: "Protein", spec: "135–150 g", note: "1.8–2 g per kg bodyweight" },
    { name: "Fiber + veg", spec: "25–30 g", note: "Two fists of veg per meal · flattens glucose, keeps you full" },
    { name: "Water", spec: "3 L+", note: "More in SG humidity" },
    { name: "Steps", spec: "10,000–12,000", note: "NEAT — biggest fat loss lever after the deficit" },
    { name: "Cardio", spec: "10–20 min · Zone 2", note: "Every day · easy & conversational (walk / incline / stairs). Post-lift or a standalone on rest days. Keep it easy — not another hard session." },
    { name: "Sleep", spec: "7+ hrs", note: "The #1 lever for results" },
    { name: "Creatine", spec: "5 g", note: "2 scoops CreAMP, any time" },
    { name: "Vitamin D3", spec: "2,000–4,000 IU", note: "With a fatty meal" },
    { name: "Magnesium glycinate", spec: "300 mg", note: "Before bed — sleep + recovery" },
    { name: "Zinc", spec: "15 mg", note: "If not eating red meat/eggs daily" }
  ],

  stamina: [
    { name: "AM · Kegels", spec: "10 × 5s/5s", note: "Squeeze 5s, release 5s" },
    { name: "PM · Reverse Kegels", spec: "10 × 5s/5s", note: "The one that delays finishing" },
    { name: "PM · Box Breathing", spec: "4×4×4×4 × 4 rounds", note: "In · hold · out · hold" },
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
            { name: "Assisted Pull-Up (wide grip)", sets: 2, reps: "6–8", note: "1–2 reps in tank · log reps achieved", inputMode: "bodyweight_reps" },
            { name: "Chest-Supported Row", sets: 2, reps: "8–10", note: "Drive elbows back · key in one side, app doubles it", barbell: true, bar: 0 },
            { name: "Pendlay Row", sets: 2, reps: "5", note: "Dead-stop on floor each rep · pull explosive to lower chest", barbell: true },
            { name: "Wide-Grip Lat Pulldown", sets: 3, reps: "10–12", note: "Lats not arms · drive elbows down to your ribs, 2-sec squeeze at the bottom" },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 3,
              reps: "10 ea stage",
              note: "3-sec lower, lead with elbows · heavy R, heavy L, immediately drop weight, drop R, drop L",
              inputMode: "multistage",
              stages: [
                { label: "R · heavy" },
                { label: "L · heavy" },
                { label: "R · drop" },
                { label: "L · drop" }
              ]
            },
            { name: "Face Pulls", sets: 3, reps: "15", note: "Rear delts + cuff health" },
            { name: "Hanging Leg Raise", sets: 2, reps: "12", note: "No swinging", inputMode: "bodyweight_reps" },
            { name: "Cable Woodchop", sets: 2, reps: "10/side", note: "Lateral obliques · the V-cut angle (low-to-high or high-to-low)" },
            { name: "Dead Hang", sets: 2, reps: "max hold", note: "Decompresses spine, grip", inputMode: "time" }
          ]
        },
        {
          title: "Diagonal lats",
          exercises: [
            { name: "Single-Arm Diagonal Lat Pulldown", sets: 3, reps: "8–10 / side", phases: [2], note: "Phase 2 only. Kneel tall at the high cable, single handle. Pull DOWN and ACROSS toward the opposite hip — the diagonal line catches the lower-outer lat a straight bar misses. 2-sec squeeze, slow return. Same weight both sides." }
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
            { name: "Romanian Deadlift", sets: 3, reps: "6–8", note: "Ribs down, brace before the hinge. Stop where the back starts to round — that's today's range.", barbell: true },
            { name: "Back Squat", sets: 3, reps: "6–8", note: "Depth over weight. Let your toes point out 15–30° — your natural stance. Cue: knees track over toes, never force toes straight.", barbell: true },
            { name: "Barbell Hip Thrust (off bench)", sets: 2, reps: "8–10", note: "Glute thickness", barbell: true },
            { name: "Hip Abduction & Adduction", sets: 2, reps: "15", note: "Glute medius + adductors" },
            { name: "Single-Leg Calf Raise", sets: 2, reps: "12/side", note: "Achilles prehab", inputMode: "bodyweight_reps" },
            { name: "Dead Bug", sets: 2, reps: "12", note: "Slow, anti-extension", inputMode: "bodyweight_reps" },
            { name: "Incline Walk", sets: 1, reps: "15 min", note: "Easy pace · log min, km/h, incline%", inputMode: "treadmill" }
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
      warmup: "Arm circles + 15 band pull-aparts · incline DB ramp: half weight × 10 before working sets",
      blocks: [
        {
          title: "Push",
          exercises: [
            { name: "Incline DB Press", sets: 3, reps: "6–8", note: "Upper chest = lifted look" },
            { name: "Flat DB Press", sets: 3, reps: "8–10", note: "Mid-chest thickness" },
            { name: "Seated DB Shoulder Press", sets: 3, reps: "8–10", note: "Front + side delts" },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 2,
              reps: "R+L heavy → R+L drop · 10 each",
              note: "3-sec lower, lead with elbows · heavy R, heavy L, immediately drop weight, drop R, drop L",
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
              inputMode: "multistage",
              stages: [
                { label: "R · standard" },
                { label: "L · standard" },
                { label: "R · sideways" },
                { label: "L · sideways" }
              ]
            },
            { name: "Overhead Cable Extension", sets: 2, reps: "10–12", note: "Long head — the part that fills the sleeve" }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Cable Crunch", sets: 2, reps: "15–20", note: "Lighter load, higher reps. Breathe OUT on the way down — never hold your breath (that's the cramp). Stop if it seizes." },
            { name: "Stairmaster · intervals", sets: 1, reps: "30s hard / 60s easy × 6", note: "Log the level you held on the hard bouts + rounds done", inputMode: "interval" }
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
            { name: "Power Clean", sets: 3, reps: "3", note: "Floor → shoulders, explosive · the carry-prep lift", barbell: true },
            { name: "Barbell Deadlift", sets: 3, reps: "5", note: "Brace hard, stay tight", barbell: true },
            { name: "Front Squat", sets: 3, reps: "6–8", note: "Upright torso · toes out 15–30°, knees chase the toes · sub goblet at total kg if no rack", barbell: true },
            { name: "Push Press", sets: 3, reps: "5", note: "Leg dip → drive overhead", barbell: true },
            { name: "Hamstring Curl", sets: 3, reps: "12", note: "Slow negative" }
          ]
        },
        {
          title: "Conditioning",
          exercises: [
            { name: "KB Swings", sets: 3, reps: "15", note: "Hinge, not squat · explosive hips" },
            { name: "Hanging Knee Raises", sets: 2, reps: "12", note: "Spine-loaded core", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Pallof Press", sets: 2, reps: "12/side", note: "Anti-rotation core" }
          ]
        },
        {
          title: "Finish",
          exercises: [
            { name: "Stairmaster · moderate", sets: 1, reps: "8 min", note: "Cool down · log minutes + level", inputMode: "cardio" }
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
            { name: "Wide Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · outer lats · 1 all-out set" },
            { name: "Narrow Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · inner back, biceps" },
            { name: "Reverse Grip Pulldown", sets: 1, reps: "to failure", note: "Heavy · lower lats + biceps" }
          ]
        },
        {
          title: "Chest · cable fly triset",
          exercises: [
            { name: "Cable Fly · high-to-low", sets: 2, reps: "10–12", note: "Lower pec line · pull down and across" },
            { name: "Cable Fly · mid", sets: 2, reps: "10–12", note: "Mid pec · pull straight across" },
            { name: "Cable Fly · low-to-high", sets: 2, reps: "10–12", note: "Upper pec · pull up and across" }
          ]
        },
        {
          title: "Shoulders",
          exercises: [
            { name: "Shoulder Press", sets: 2, reps: "8–10", note: "Controlled · 1–2 in tank" },
            {
              name: "Cable Lateral Raise · drop superset",
              sets: 2,
              reps: "10 ea stage",
              note: "Same drop superset as Day 1/3 — heavy R+L then immediately drop",
              inputMode: "multistage",
              stages: [
                { label: "R · heavy" },
                { label: "L · heavy" },
                { label: "R · drop" },
                { label: "L · drop" }
              ]
            },
            { name: "Reverse Delt Fly", sets: 2, reps: "12–15", note: "Squeeze rear delts" }
          ]
        },
        {
          title: "Arms",
          exercises: [
            { name: "Straight Bar Pushdown", sets: 1, reps: "to failure", note: "Heavy · one all-out set · overall tricep mass" },
            { name: "Seated Bicep Curl · mid hold", sets: 1, reps: "to failure", note: "Heavy · hold at 90° before each rep" },
            { name: "Seated Hammer Curl · mid hold", sets: 1, reps: "to failure", note: "Heavy · brachialis + forearm" }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "V-Ups", sets: 1, reps: "10–12", note: "Reach for your toes · breathe OUT on the way up", inputMode: "bodyweight_reps" },
            { name: "Single-Leg V-Ups", sets: 1, reps: "8/side", note: "Alternate legs · opposite hand to raised foot · exhale up", inputMode: "bodyweight_reps" },
            { name: "Russian Twist · medicine ball", sets: 1, reps: "12/side", note: "Feet up = harder · exhale on each twist · log ball kg" }
          ]
        },
        {
          title: "Zone 2 · optional",
          exercises: [
            { name: "Incline Walk or Stairmaster · Zone 2", sets: 1, reps: "45–60 min", note: "Conversational pace — can talk, wouldn't sing. Here or on a rest day. VO2max = longevity.", inputMode: "cardio" }
          ]
        }
      ]
    },
    {
      id: "homecore",
      name: "Home core",
      tagline: "Compulsory · 20 min",
      blurb: "Mandatory rest-day work. Core circuit + power at home; KB Swings at the gym. No skipping.",
      blocks: [
        {
          title: "Core circuit",
          exercises: [
            { name: "Hollow Hold", sets: 2, reps: "20 sec", note: "Arms over, legs straight", inputMode: "time" },
            { name: "Dead Bug", sets: 2, reps: "12", note: "Opposite arm/leg", inputMode: "bodyweight_reps" },
            { name: "Crunches", sets: 2, reps: "15–20", note: "Slow · breathe OUT as you curl up", inputMode: "bodyweight_reps" },
            { name: "Knee Tucks", sets: 2, reps: "12–15", note: "Seated · pull knees to chest, exhale", inputMode: "bodyweight_reps" },
            { name: "Side Plank", sets: 2, reps: "30 sec/side", note: "Hips high", inputMode: "time" },
            { name: "Superman Hold", sets: 2, reps: "20 sec", note: "Lower back + glutes", inputMode: "time" }
          ]
        },
        {
          title: "Power · explosive",
          exercises: [
            { name: "Explosive Push-Ups", sets: 2, reps: "10", note: "Drive hands off the floor", inputMode: "bodyweight_reps" },
            { name: "Jump Squats", sets: 2, reps: "10", note: "Land soft, reset, jump", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Vertical pull",
          exercises: [
            { name: "Pull-Ups", sets: 3, reps: "max", note: "Wide-ish, palms away · lats + width. Assisted band if needed.", inputMode: "bodyweight_reps" },
            { name: "Chin-Ups", sets: 2, reps: "max", note: "Palms toward you · biceps + lats", inputMode: "bodyweight_reps" }
          ]
        },
        {
          title: "Gym · KB finisher",
          exercises: [
            { name: "KB Swings · intervals", sets: 4, reps: "30s on / 30s off", note: "20kg max. Tap timer for the 30s on. Push max reps (aim 22+). Last round single-arm alternating if you've got it.", timed: 30 }
          ]
        }
      ]
    },
    {
      id: "mvs",
      special: true,
      name: "Minimum viable session",
      tagline: "Bad day · 20 min · still counts",
      blurb: "Tired, short on time, low on sleep? Three lifts, in and out. Showing up is the win — this logs as a full green day.",
      blocks: [
        {
          title: "The 3",
          exercises: [
            { name: "Goblet Squat", sets: 3, reps: "10", note: "One DB, full depth" },
            { name: "DB Row", sets: 3, reps: "10/side", note: "One DB, brace on the bench" },
            { name: "DB Shoulder Press", sets: 3, reps: "10", note: "Standing or seated" }
          ]
        }
      ]
    }
  ],

  mobilityTests: [
    { name: "Deep squat hold", spec: "60 sec, heels down", note: "Sit in the bottom, chest up" },
    { name: "Couch stretch", spec: "60 sec/side, no arch", note: "Glute squeezed, ribs down" },
    { name: "Knee-to-wall", spec: "≥ 10 cm each side", note: "Big toe to wall, knee taps without heel lifting" },
    { name: "Standing toe touch", spec: "Palms to floor", note: "Soft knees, hinge" }
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
    { label: "Water", value: "3 L+", note: "Singapore humidity" },
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
    "Never stack Day 1 + Day 3 (delt overlap).",
    "Never stack Day 2 + Day 4 (leg overlap).",
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
