# Maths Castle voices (ElevenLabs)

Records every line Maths Castle (`/maths2`) says as an MP3 clip, with Princess Rosie as the host and a separate voice for each friend. The game plays a clip when one exists and falls back to the device's built-in voice when it doesn't, so it works at every stage.

- Lines: `maths2/js/lines.js` (built from the shop items, rooms and friends in `data.js`)
- Voices: `tools/maths2-voice/voices.json` (a description per character, plus the voice ID once chosen)
- Output: `maths2/audio/<speaker>/<key>.mp3` and `maths2/audio/manifest.json`
- Previews: `maths2/voice-previews/index.html` (listen on your phone once pushed)

About 860 clips and 20,000 characters, which fits the $6 Starter plan's monthly credits along with designing the voices. Run `check` to see the live numbers and your balance.

## 1. ElevenLabs account

1. Subscribe to **Starter** ($6/month). Starter is the lowest plan that allows commercial use. Cancel after recording if you like; the files stay in this repo.
2. Profile → **API keys** → create a key. Give it access to Text to Speech, Voices (write) and Voice Generation, and read access to User.

## 2a. Run it in a Claude Code cloud session

1. In the environment settings (cloud environment menu in the session title bar → Edit):
   - add the environment variable `ELEVENLABS_API_KEY` with the key
   - under Network access, allow `api.elevenlabs.io`
2. Start a new session (it picks up the new settings) and ask: "record the Maths Castle voices".

## 2b. Or run it on your Mac

Needs Node 18 or newer.

```sh
git clone https://github.com/Holzherr/nickholzherr.com && cd nickholzherr.com
export ELEVENLABS_API_KEY=…            # your key
node tools/maths2-voice/generate.mjs check
```

## 3. Steps

```sh
# 1. Design the voices: 3 previews per character (costs a few hundred credits each)
node tools/maths2-voice/generate.mjs design            # or: design rosie
git add maths2/voice-previews && git commit -m "chore(maths2): voice previews" && git push
#    Listen at https://nickholzherr.com/maths2/voice-previews/ and pick one per character.

# 2. Save your picks
node tools/maths2-voice/generate.mjs pick rosie 2
node tools/maths2-voice/generate.mjs pick cat 1          # … and so on
#    Prefer a stock voice? Copy its ID from the ElevenLabs Voice Library:
node tools/maths2-voice/generate.mjs use rosie <voice_id>

# 3. Record Rosie first and try the game
node tools/maths2-voice/generate.mjs speak rosie --limit 20   # quick taste
node tools/maths2-voice/generate.mjs speak rosie
#    (python3 -m http.server, then open http://localhost:8000/maths2/)

# 4. Record everyone else, then publish
node tools/maths2-voice/generate.mjs speak
git add maths2/audio tools/maths2-voice/voices.json && git commit -m "feat(maths2): recorded voices" && git push
```

`speak` only records clips that are missing or whose text, voice or settings changed, so it's safe to re-run. `--dry` lists what it would record without spending credits; `--force` re-records everything.

## Changing lines or voices

- Edit the wording in `maths2/js/lines.js`, then run `speak` again. Only the changed lines are re-recorded.
- Tweak a voice's feel in `voices.json` (`stability` lower = more expressive, `style` higher = more acted, `speed`), then run `speak <speaker> --force`.
- The child's name is recorded from the `NAMES` list in `lines.js` (currently "Tara"). Add names there to have them spoken. Any other name is left out of recorded lines and still shows on screen.
- `model_id` in `voices.json` is `eleven_multilingual_v2`. A cheaper flash model roughly halves the credits, at some cost to quality.
