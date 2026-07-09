"""Application-wide constants and seed data."""

DAILY_WATER_GOAL_ML = 2500.0
DAILY_CALORIE_GOAL = 2000.0
DAILY_PROTEIN_GOAL_G = 150.0

MOTIVATIONAL_QUOTES = [
    "Every rep counts. Every meal matters. Keep going.",
    "Progress, not perfection.",
    "Your only competition is who you were yesterday.",
    "Small steps every day lead to big results.",
    "The pain you feel today is the strength you'll feel tomorrow.",
]

DEFAULT_EXERCISES = [
    {"name": "Push-Up", "category": "strength", "muscle_groups": "chest,triceps,shoulders", "difficulty": "beginner", "calories_per_minute": 7.0, "instructions": "Start in plank position. Lower chest to floor, push back up."},
    {"name": "Pull-Up", "category": "strength", "muscle_groups": "back,biceps", "difficulty": "intermediate", "calories_per_minute": 8.0, "instructions": "Hang from bar, pull chest to bar, lower slowly."},
    {"name": "Squat", "category": "strength", "muscle_groups": "legs,glutes", "difficulty": "beginner", "calories_per_minute": 6.0, "instructions": "Feet shoulder-width apart. Lower hips back and down, knees tracking toes."},
    {"name": "Deadlift", "category": "strength", "muscle_groups": "back,legs,glutes", "difficulty": "intermediate", "calories_per_minute": 9.0, "instructions": "Hinge at hips, grip bar, drive hips forward to stand."},
    {"name": "Plank", "category": "core", "muscle_groups": "core", "difficulty": "beginner", "calories_per_minute": 4.0, "instructions": "Forearms on ground. Hold body in straight line. Brace core."},
    {"name": "Burpee", "category": "hiit", "muscle_groups": "full_body", "difficulty": "intermediate", "calories_per_minute": 12.0, "instructions": "Squat, kick feet back to plank, push-up, jump feet forward, jump up."},
    {"name": "Lunges", "category": "strength", "muscle_groups": "legs,glutes", "difficulty": "beginner", "calories_per_minute": 5.5, "instructions": "Step forward, lower back knee toward floor. Alternate legs."},
    {"name": "Dumbbell Row", "category": "strength", "muscle_groups": "back,biceps", "difficulty": "beginner", "calories_per_minute": 6.0, "instructions": "Brace on bench, pull dumbbell to hip. Keep elbow close."},
    {"name": "Overhead Press", "category": "strength", "muscle_groups": "shoulders,triceps", "difficulty": "intermediate", "calories_per_minute": 7.0, "instructions": "Press barbell/dumbbells from shoulder height overhead."},
    {"name": "Bench Press", "category": "strength", "muscle_groups": "chest,triceps,shoulders", "difficulty": "intermediate", "calories_per_minute": 7.0, "instructions": "Lie on bench. Lower bar to chest, press up explosively."},
    {"name": "Running", "category": "cardio", "muscle_groups": "legs,cardio", "difficulty": "beginner", "calories_per_minute": 11.0, "instructions": "Maintain upright posture. Land mid-foot. Breathe rhythmically."},
    {"name": "Cycling", "category": "cardio", "muscle_groups": "legs,cardio", "difficulty": "beginner", "calories_per_minute": 9.0, "instructions": "Maintain consistent cadence. Adjust resistance for intensity."},
    {"name": "Mountain Climber", "category": "hiit", "muscle_groups": "core,legs", "difficulty": "intermediate", "calories_per_minute": 10.0, "instructions": "In plank, drive knees to chest alternately at speed."},
    {"name": "Tricep Dip", "category": "strength", "muscle_groups": "triceps,chest", "difficulty": "beginner", "calories_per_minute": 6.0, "instructions": "Hands on bench behind you. Lower body by bending elbows, press back up."},
    {"name": "Bicep Curl", "category": "strength", "muscle_groups": "biceps", "difficulty": "beginner", "calories_per_minute": 4.0, "instructions": "Stand with dumbbells. Curl to shoulder height. Lower slowly."},
    {"name": "Leg Press", "category": "strength", "muscle_groups": "legs,glutes", "difficulty": "beginner", "calories_per_minute": 6.5, "instructions": "Press platform away with feet. Don't lock knees at top."},
    {"name": "Lat Pulldown", "category": "strength", "muscle_groups": "back,biceps", "difficulty": "beginner", "calories_per_minute": 6.0, "instructions": "Pull bar to upper chest. Squeeze lats. Slow return."},
    {"name": "Jump Rope", "category": "cardio", "muscle_groups": "cardio,legs", "difficulty": "beginner", "calories_per_minute": 13.0, "instructions": "Keep elbows close, jump on balls of feet. Maintain rhythm."},
    {"name": "Glute Bridge", "category": "strength", "muscle_groups": "glutes,core", "difficulty": "beginner", "calories_per_minute": 4.0, "instructions": "Lie on back, feet flat. Drive hips up, squeeze glutes at top."},
    {"name": "Russian Twist", "category": "core", "muscle_groups": "core", "difficulty": "beginner", "calories_per_minute": 5.0, "instructions": "Sit with knees bent, lean back. Rotate torso side to side."},
]
