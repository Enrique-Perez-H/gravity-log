# Gravity Log

A calisthenics training log for the phone. It is built on leverage progressions: each movement has a ladder of harder variations, and an exercise moves up a level when all three sets reach the top of their range. It runs three full-body sessions a week, alternating Day A and Day B, each about 45 minutes.

The whole app is static files in `docs/`. There is no server and no account. Your training log is stored in the phone's browser, and you move it to a PC with backup files.

## Publish it with GitHub Pages

1. Create a **public** repository on github.com, for example `gravity-log`. On a free plan, Pages only serves public repositories. Only the code is published; your log is never in the repository.
2. Upload this folder's contents, keeping the `docs/` folder. You can drag the files in through **Add file > Upload files**, or push with git:

   ```bash
   git init -b main
   git add .
   git commit -m "Gravity Log"
   git remote add origin https://github.com/<your-username>/gravity-log.git
   git push -u origin main
   ```

3. Under **Settings > Pages**, set **Source** to "Deploy from a branch", choose `main` and the `/docs` folder, and save.
4. After a minute the address appears at the top of that page. It is usually `https://<your-username>.github.io/gravity-log/`.

## Install on the phone

Open the Pages address on the phone, then:
- iPhone (Safari): Share, then **Add to Home Screen**.
- Android (Chrome): menu, then **Install app** or **Add to Home screen**.

The app then opens full screen and works offline after the first visit.

## Keeping your progress

- The log is kept in `localStorage` on that phone, in the browser that installed the app. It survives app updates and restarts.
- It is lost if you clear the browser's data for the site or delete the home-screen app on iPhone. iOS can also clear storage for a site you haven't opened for several weeks. The app asks the browser to protect its storage, and Progress shows whether that was granted.
- **Progress > Your data > Save backup (JSON)** writes the complete log to a file. On a phone it opens the share sheet, so you can save it to Files or Drive, or email it to yourself. **Restore from backup** reads it back and merges it, so sessions that are already there are not duplicated.
- After you finish a session, if your last backup is a week old, the phone's share sheet opens with the backup file so you can save it to Drive, Files or email (at most once a week; a switch under Your data turns it off).
- The app reminds you on the Train tab when you have 3 or more sessions and no backup in the last 14 days.

## Analysing on a PC

**Export sets (CSV)** writes one row per set:

| Column | Meaning |
|---|---|
| `date`, `day` | session date and Day A or B |
| `exercise`, `pattern` | movement name and pattern, such as "Vertical pull" |
| `level`, `level_name` | ladder level (1-based) and the variation |
| `set`, `value`, `unit` | set number, reps or seconds, and the unit |
| `done` | 1 if the set was ticked as done |
| `substitute_for` | the planned exercise when an alternative was used, otherwise empty. Alternatives have an empty `level` |

```python
import pandas as pd
df = pd.read_csv("gravity-log-sets-2026-11-30.csv", parse_dates=["date"])
done = df[df.done == 1]
done.groupby(["exercise", "date"]).value.max().unstack(0).plot()
```

The JSON backup has the same data plus your current levels: `{"levels": {...}, "sessions": [{"date", "day", "entries": {exercise: {"level", "sets", "done"}}, "levelUps"}]}`.

## Routines

The Routine tab holds the active routine. **Calisthenics** is the built-in one. **Home training** is generated from your inputs: days per week (2 to 6), session length (short about 30 minutes, mid about 45, long 60 to 75), goal (general fitness, muscle, strength), experience, and anything to work around (wrist, shoulder, knee or lower-back pain). Bodyweight only, with a floor, a wall, and a chair or table.

- The plan sets weekly hard sets per muscle from the goal and experience (`TARGETS`), fits them to the time you chose, spreads each muscle over the days that train it about twice a week where possible (`SPLITS`), and shows a weekly table with direct sets, indirect sets and the target. Longer sessions add volume up to 1.5 times the target.
- Exercises come from the same ladders as the calisthenics routine plus calf raise, plank and underhand row. Chair dips, fist push-ups and chair squats are used as preselected alternatives.
- Each rule has its sources and a confidence note in the Routine tab (`EVIDENCE` in `docs/index.html`). The figures come from articles that summarise Israetel, Nippard and Ethier and from the studies they cite; they are general guidelines, not medical advice.
- Switching routines keeps each routine's own history. The saved plan and the active routine are part of the backup file.
- **Gym training** is generated the same way, from days, session length, goal, experience and the equipment you can use (barbell, dumbbells, cables, machines). It covers the key patterns (squat, hinge, horizontal and vertical push, horizontal and vertical pull, single-leg) plus accessories (chest fly, triceps, biceps, side and rear delts, hamstring curl, leg extension, calves, core), with 3 to 5 movements for each pattern (`GYM` in `docs/index.html`). Muscle gain gets the full accessories; general fitness and strength get fewer.
  - You log the weight and reps of every set. Double progression suggests the next weight: when every set reaches the top of the range it adds 2.5 kg (2 kg for dumbbells) and starts at the bottom again.
  - Blocks are 5 weeks of training with one extra set on the main lifts from week 3, then a lighter week (2 sets at about 85% of the weight). The movement for each pattern rotates every block, and the Swap movement button changes it any time (it stays until you tap Back to auto-rotation).
  - Photos are from free-exercise-db; weights are in kg.
- Cardio routines are planned.

## Editing history

In Progress > History, **Edit** opens a finished session: change the date, the day, each set's number and done tick, the level or alternative recorded, or remove an exercise. Saving never changes your current levels or level-up history.

## Timers

- **Rest timer:** starts when you tick a set. Tap the seconds button next to it to switch between 60, 90, 120 and 180 s; the choice is remembered. It vibrates when it ends on phones that support it (not iPhone Safari).
- **Hold timer:** timed exercises (front lever, planche, L-sit, handstand, hollow) have a ▶ button on each set. Tap it to start counting up and again to stop; the seconds go into that set. It vibrates once when you pass the top of the range.

## Equipment swaps and exercise visuals

Each exercise card on Train has two buttons:
- **Show me** opens a drawn anatomical figure that moves between the start and end of the movement (or holds the position), with the working muscles coloured: main muscles red, supporting ones amber. Tap Pause to freeze it. Where a real photo exists, Show me plays a start and end photo instead (about 20 levels plus some alternatives; the rest use the drawn figure). It also has a tap-to-load YouTube player. The player needs internet; the animation works offline. Levels without a video id get a YouTube search link instead.
- **No equipment?** lets you mark the pull-up bar, parallettes or chair/table as missing and shows alternatives that don't need them. The swap lasts for the session only. The alternative is logged under its own name, shown in its own cards under Swaps in Progress, and the original exercise's level never changes. In the backup JSON it is stored as `alt:<id>` with a `subFor` field.

To edit them, see `NEEDS`, `ALT`, `ALTMAP`, `POSE`, `VIS`, `MUSCLES` and `VIDEO` in `docs/index.html`. Video ids in `VIDEO` were found by search and are not verified; replace any that don't play.

## Photo credits

The exercise photos in `docs/photos/` come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, public domain by the maintainer's declaration; the project says it restructured data from `wrkout/exercises.json`, and I could not verify who took the original photos). They are resized to 480 px wide. To change which photo goes with which level, edit `PHOTO` and `PHOTO_ALT` in `docs/index.html`.

## Changing the program

Everything is in `docs/index.html`, in the script near the top:
- `EX`: the movements and their ladders. Each level is `[name, cue, min, max]`.
- `START`: the starting level for each movement on a fresh log.
- `DAYS`: which pairs go on Day A and Day B.
- `WARMUP`, `SETS` and `DELOAD_EVERY`: the warm-up checklist, sets per exercise, and deload frequency.

Push a change and the phone picks it up the next time the app opens online. Pages load from the network first and from the cache only when offline. Your log is not affected. If you change the icons or the manifest, also change `CACHE` in `docs/sw.js` so the old files are dropped.

Renaming or adding a ladder level shifts the meaning of the stored level numbers, so add new levels at the end of a ladder where possible.

Every `*.github.io` project of your account shares one browser storage area. The app's keys all start with `gravity-log:`, so other projects you host there won't collide with it.
