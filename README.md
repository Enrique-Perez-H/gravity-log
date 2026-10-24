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

## Equipment swaps and exercise visuals

Each exercise card on Train has two buttons:
- **Show me** opens a stick-figure animation of the start and end of the movement (or the hold position) and a tap-to-load YouTube player. The player needs internet; the animation works offline. Levels without a video id get a YouTube search link instead.
- **No equipment?** lets you mark the pull-up bar, parallettes or chair/table as missing and shows alternatives that don't need them. The swap lasts for the session only. The alternative is logged under its own name, and the original exercise's level never changes. In the backup JSON it is stored as `alt:<id>` with a `subFor` field.

To edit them, see `NEEDS`, `ALT`, `ALTMAP`, `POSE`, `VIS` and `VIDEO` in `docs/index.html`. Video ids in `VIDEO` were found by search and are not verified; replace any that don't play.

## Changing the program

Everything is in `docs/index.html`, in the script near the top:
- `EX`: the movements and their ladders. Each level is `[name, cue, min, max]`.
- `START`: the starting level for each movement on a fresh log.
- `DAYS`: which pairs go on Day A and Day B.
- `WARMUP`, `SETS` and `DELOAD_EVERY`: the warm-up checklist, sets per exercise, and deload frequency.

Push a change and the phone picks it up the next time the app opens online. Pages load from the network first and from the cache only when offline. Your log is not affected. If you change the icons or the manifest, also change `CACHE` in `docs/sw.js` so the old files are dropped.

Renaming or adding a ladder level shifts the meaning of the stored level numbers, so add new levels at the end of a ladder where possible.

Every `*.github.io` project of your account shares one browser storage area. The app's keys all start with `gravity-log:`, so other projects you host there won't collide with it.
