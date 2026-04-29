// THE RED HOOD × NIGHTWING PROTOCOL — data
const DATA = {
  startKg: 75,
  targetKg: 69,
  totalWeeks: 16,

  morningRitual: [
    { name: "Stomach Vacuum", spec: "3 × 30 sec", note: "Inner core, waist control" },
    { name: "Glute Bridge", spec: "2 × 15", note: "Activates glutes, fights desk-sit" },
    { name: "Cat-Cow", spec: "10 reps", note: "Spine mobility" },
    { name: "Deep Squat Hold", spec: "30 sec", note: "Hip mobility" },
    { name: "Thoracic Opener", spec: "30 sec / side", note: "Doorway. Opens chest, fights hunch" }
  ],

  daily: [
    { name: "Protein", spec: "135–150 g", note: "1.8–2 g per kg bodyweight" },
    { name: "Water", spec: "3 L+", note: "More in SG humidity" },
    { name: "Steps", spec: "8,000–10,000", note: "Non-negotiable for fat loss" },
    { name: "Sleep", spec: "7+ hrs", note: "The #1 lever for results" },
    { name: "Creatine", spec: "5 g", note: "2 scoops CreAMP, any time" },
    { name: "Vitamin D3", spec: "2,000–4,000 IU", note: "With a fatty meal" },
    { name: "Magnesium glycinate", spec: "300 mg", note: "Before bed — sleep + recovery" },
    { name: "Zinc", spec: "15 mg", note: "If not eating red meat/eggs daily" }
  ],

  stamina: [
    { name: "AM · Kegels", spec: "10 × 5s/5s", note: "Squeeze 5s, release 5s" },
    { name: "PM · Reverse Kegels", spec: "10 × 5s/5s", note: "The one that delays finishing" },
    { name: "PM · Box Breathing", spec: "4×4×4×4 × 4 rounds", note: "In · hold · out · hold" }
  ],

  workouts: [
    {
      id: "day1",
      name: "Back width + side delts",
      tagline: "The V-taper day",
      blurb: "Every lift makes shoulders wider, waist smaller. Matters MORE at 167cm.",
      blocks: [
        {
          title: "Lifts",
          exercises: [
            { name: "Assisted Pull-Up (wide grip)", sets: 4, reps: "6–8", note: "1–2 reps in tank" },
            { name: "Chest-Supported Row", sets: 4, reps: "8–10", note: "Drive elbows back" },
            { name: "Wide-Grip Lat Pulldown", sets: 3, reps: "10–12", note: "Lats, not arms" },
            { name: "Cable Lateral Raise", sets: 5, reps: "12–15", note: "THE lift. 3-sec eccentric" },
            { name: "Rear Delt DB Fly", sets: 4, reps: "12–15", note: "3D shoulders + posture" },
            { name: "Face Pulls", sets: 3, reps: "15", note: "Rear delts + cuff health" },
            { name: "Hanging Leg Raise", sets: 3, reps: "12", note: "No swinging" },
            { name: "Standing KB Russian Twist", sets: 3, reps: "10/side", note: "Rotational core" },
            { name: "Dead Hang", sets: 2, reps: "max hold", note: "Decompresses spine, grip" }
          ]
        }
      ]
    },
    {
      id: "day2",
      name: "Lower posterior + core",
      tagline: "Glutes, hams, taller posture",
      blurb: "Open hips = taller posture. Glute shelf makes the waist look smaller.",
      blocks: [
        {
          title: "Lifts",
          exercises: [
            { name: "Romanian Deadlift", sets: 4, reps: "6–8", note: "Hinge. Feel the stretch" },
            { name: "Back Squat", sets: 3, reps: "6–8", note: "Depth over weight" },
            { name: "Barbell Hip Thrust (off bench)", sets: 3, reps: "8–10", note: "Glute thickness" },
            { name: "Bulgarian Split Squat", sets: 3, reps: "8/leg", note: "Single-leg strength" },
            { name: "Hip Abduction & Adduction", sets: 4, reps: "15", note: "Glute medius + adductors" },
            { name: "Single-Leg Calf Raise", sets: 3, reps: "12/side", note: "Achilles prehab" },
            { name: "Dead Bug", sets: 3, reps: "12", note: "Slow, anti-extension" },
            { name: "Side Plank", sets: 3, reps: "30 sec/side", note: "Obliques" },
            { name: "Incline Walk", sets: 1, reps: "15 min", note: "Easy pace, recovery" }
          ]
        }
      ]
    },
    {
      id: "day3",
      name: "Chest + shoulders + arms",
      tagline: "Fill the sleeve",
      blurb: "Dense chest, capped delts, arms that fill a sleeve, forearms under a rolled cuff.",
      blocks: [
        {
          title: "Push",
          exercises: [
            { name: "Incline DB Press", sets: 4, reps: "6–8", note: "Upper chest = lifted look" },
            { name: "Flat DB Press", sets: 3, reps: "8–10", note: "Mid-chest thickness" },
            { name: "Cable Chest Fly (high-to-low)", sets: 3, reps: "10–12", note: "Lower pec line" },
            { name: "Seated DB Shoulder Press", sets: 3, reps: "8–10", note: "Front + side delts" },
            { name: "Cable Lateral Raise", sets: 4, reps: "15", note: "Second weekly hit" }
          ]
        },
        {
          title: "5-Min Arm Finisher · 1 min each, no rest",
          exercises: [
            { name: "DB Wide Curl", sets: 1, reps: "1 min", note: "" },
            { name: "Hammer Curl", sets: 1, reps: "1 min", note: "" },
            { name: "Drag Curl", sets: 1, reps: "1 min", note: "" },
            { name: "Reverse Curl", sets: 1, reps: "1 min", note: "" },
            { name: "Straight Curl", sets: 1, reps: "1 min", note: "" }
          ]
        },
        {
          title: "Triceps",
          exercises: [
            { name: "Single-Arm Cable Side Pushdown", sets: 3, reps: "12/arm", note: "Lateral head — horseshoe" }
          ]
        },
        {
          title: "Forearms",
          exercises: [
            { name: "Wrist Curl (palms up)", sets: 3, reps: "15", note: "Flexor mass" },
            { name: "Reverse Wrist Curl", sets: 3, reps: "12", note: "Extensor width" },
            { name: "Farmer's Carry", sets: 2, reps: "30 sec heavy", note: "Endurance + traps" }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Cable Crunch", sets: 3, reps: "12", note: "Controlled, round spine" },
            { name: "Decline Sit-Ups", sets: 3, reps: "12", note: "Upper abs detail" },
            { name: "Stairmaster", sets: 1, reps: "10 min", note: "Steady" }
          ]
        }
      ]
    },
    {
      id: "day4",
      name: "Power + conditioning",
      tagline: "Heavy. Explosive. Springy.",
      blurb: "Heavy pull, explosive work, metabolic finisher. You feel light after.",
      blocks: [
        {
          title: "Strength",
          exercises: [
            { name: "Barbell Deadlift", sets: 4, reps: "5", note: "Brace hard, stay tight" },
            { name: "Front Squat (or Goblet)", sets: 3, reps: "6–8", note: "Upright torso" },
            { name: "Walking DB Lunge", sets: 3, reps: "10/leg", note: "Long strides" },
            { name: "Hamstring Curl", sets: 3, reps: "12", note: "Slow negative" }
          ]
        },
        {
          title: "Conditioning · 3 rounds, minimal rest",
          exercises: [
            { name: "KB Swings", sets: 3, reps: "15", note: "Hinge, not squat" },
            { name: "Explosive Push-Ups", sets: 3, reps: "10", note: "" },
            { name: "Jump Squats", sets: 3, reps: "10", note: "" },
            { name: "Hanging Knee Raises", sets: 3, reps: "12", note: "" }
          ]
        },
        {
          title: "Core",
          exercises: [
            { name: "Pallof Press", sets: 3, reps: "12/side", note: "Anti-rotation core" }
          ]
        },
        {
          title: "Lat Pulldown · failure triset",
          exercises: [
            { name: "Wide Grip Pulldown", sets: 2, reps: "to failure", note: "Outer lats" },
            { name: "Narrow Grip Pulldown", sets: 2, reps: "to failure", note: "Inner back, biceps" },
            { name: "Reverse Grip Pulldown", sets: 2, reps: "to failure", note: "Lower lats + biceps" }
          ]
        },
        {
          title: "Shoulders · failure",
          exercises: [
            { name: "Shoulder Press", sets: 2, reps: "to failure", note: "Heavy then drop" },
            { name: "Lateral Raise", sets: 2, reps: "to failure", note: "Slow eccentric" },
            { name: "Reverse Delt Fly", sets: 2, reps: "to failure", note: "Squeeze rear delts" }
          ]
        },
        {
          title: "Arms",
          exercises: [
            { name: "Straight Bar Pushdown", sets: 3, reps: "10–12", note: "Overall tricep mass" },
            { name: "Seated Bicep Curl · mid hold", sets: 2, reps: "to failure", note: "Hold at 90° before each rep" },
            { name: "Seated Hammer Curl · mid hold", sets: 2, reps: "to failure", note: "Brachialis · forearm" }
          ]
        },
        {
          title: "Finish",
          exercises: [
            { name: "Stairmaster · moderate", sets: 1, reps: "8 min", note: "Cool down" }
          ]
        }
      ]
    },
    {
      id: "homecore",
      name: "Home core",
      tagline: "Rest day · 10 min",
      blurb: "Optional, high ROI for the goal. Do on rest days.",
      blocks: [
        {
          title: "Circuit",
          exercises: [
            { name: "Hollow Hold", sets: 3, reps: "20 sec", note: "Arms over, legs straight" },
            { name: "Dead Bug", sets: 3, reps: "12", note: "Opposite arm/leg" },
            { name: "Side Plank", sets: 3, reps: "30 sec/side", note: "Hips high" },
            { name: "Plank Reach-Out", sets: 3, reps: "8/side", note: "Don't rotate hips" },
            { name: "Superman Hold", sets: 3, reps: "20 sec", note: "Lower back + glutes" },
            { name: "Push-Ups", sets: 3, reps: "20", note: "" }
          ]
        }
      ]
    }
  ],

  targets: [
    { label: "Calories", value: "2,000–2,200", note: "300–400 deficit" },
    { label: "Protein", value: "135–150 g", note: "1.8–2 g/kg" },
    { label: "Water", value: "3 L+", note: "Singapore humidity" },
    { label: "Steps", value: "8–10K", note: "Daily" },
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
    "Slow 3-sec eccentrics on laterals and core.",
    "8,000–10,000 steps daily — non-negotiable for fat loss.",
    "90–120 sec rest on heavy compounds. 45–60 sec on volume work.",
    "No phone between sets. Log, rest, lift.",
    "Morning lifts preferred. Nothing interrupts 6am.",
    "Slept under 5 hrs? Swap gym for a 30-min walk. No gains on no sleep.",
    "Track every workout. What you don't measure, you don't grow.",
    "Consistency > perfection. 80% for 16 weeks beats 100% for 3.",
    "Protein and veg first. Rice/roti last. Flattens insulin spikes.",
    "Never stack Day 1 + Day 3 (delt overlap).",
    "Never stack Day 2 + Day 4 (leg overlap)."
  ],

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
    { title: "Deload every 5th week", body: "All weights to 80%. Cut sets in half. Form + mobility focus. Come back heavier." }
  ],

  phases: [
    { weeks: "1–4", title: "ADAPTATION", body: "Strength climbs fast. Pumps feel better. Mood + sleep improve. Scale drops 2–3 kg (mostly water). Waist barely moves. Trust it." },
    { weeks: "5–8", title: "VISIBLE SHIFT", body: "Gut visibly shrinks. Shoulders look wider in fitted shirts. Forearms pop. Stamina up. ~71–72 kg." },
    { weeks: "9–12", title: "V-TAPER EMERGES", body: "V-taper visible in a fitted T. Posture transformed — taller without shoes. Upper chest shelf forms. Core holds hollow. ~69–70 kg." },
    { weeks: "13–16", title: "THE LOOK", body: "Jason/Dick composite at your scale. Dense, defined, capable. Dangerous in a fitted shirt. ~68–69 kg @ 12–14% BF." }
  ]
};
