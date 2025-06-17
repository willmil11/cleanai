# Cleanai 2.1.0 Nightly
## What is this?
This is a project of mine that as of 28.05.2025 I've been working on for about 4 months (since 27.01.2025). This is a transformer architecture with pre-training and training implemented in pure javascript. It only requires tiktoken for tokenization, readline-sync for the interactive console mode, uuid for random string generation, zip librairies (archiver and yauzl) to load/save models and ws for future remote device support. No ml (machine learning) librairies like pytorch or tensorflow. Only pure raw javascript and no abstractions.

## How do I use it
Look at the guide: <a href="https://github.com/willmil11/cleanai/blob/main/guide.md">guide</a>

## Can I use this to train my AI?
Absolutely, normally it should be as fast as pytorch or tensorflow for cpu only training/pre-training/inference. It will work and it will be easier to use than tensorflow or pytorch too.

## Pytorch and tensorflow already exist, why would I use this?
Because:
- The CLI is WAYYYY easier to use than pytorch and tensorflow
- You can see how everything works, no black box
- There are coming updates that I'm cooking up for this project that will conserve it's ease to use and accelerate it's speed by a lot (remote multithreaded), also adding features that you can not get with pytorch or tensorflow without HEAVY config and a lot of complicated work.
- This is made by an actual person working alone not some megacorp like pytorch (Meta) or tensorflow (Google)

## Why?
I wanted to see how this actually works therefore I decided to put Claude, Chatgpt and Gemini to work to teach me how all of this works, I also used them to implement some parts of the code like training, pre-training and other stuff but I generally understand how it works now. Because this works and this is really cool I am releasing it on github publicly :)

## Did you test this?
My model is still training, I will give you guys an example of a good model when mine finishes training. If you're from the github repo and look at the commit history you'll see there was an example previously here, I just removed it because since I made and put here that example I changed and fixed lots of things in how the training logic works therefore that example is now innacurate.

## What's gonna be in future updates?
Here's a small list of things I'll add:
- Add multithreaded support ✔
- Add remote device multithreaded support
- Add gpu support (eventually but not for now because this is very hard)

## How to support the project?
To support this project you can star the repo and you can send me suggestions through discord (willmil11) or email (willmil111012@gmail.com). Please don't create pull requests as this is a project of mine to learn I therefore want to code and implement everything myself, even if your suggestions are welcome, I want to implement them myself.

## Who am I and what does this project mean to me?
I'm William, a 14 yo french programmer and this is my most ambitious project yet. It took an insane amount of planning, coding and debugging but it was sooo worth it.

## Github repo
If you're on the npm page, check out and perhaps star the <a href="https://github.com/willmil11/cleanai">repo</a>

## Deprecated versions
Refer to the <a href="https://github.com/willmil11/cleanai/blob/main/deprecated/deprecated.md">deprecated readme</a>

## Version history
- 2.0.4 — Fixed critical worker file path bug.
- 2.0.3 — Fixed critical vocabulary file loading bug.
- 2.0.2 — More readme fixes.
- 2.0.1 — Readme fixes.
- 2.0.0 — Added local multithreaded.
- 1.0.1 — Readme fixes.
- 1.0.0 — Original release.

## Nightly versions (only github)
### Nightly versions before 2.1.0 stable:
- 2.1.0 Nightly — Added early beta of webui to monitor training and pre-training runs.
### Nightly versions before 2.0.0 stable:
<strong>Note</strong>: Next Nightly version (2.0.0 Nightly 4) will be uploaded as a nightly then directly as a stable as it will aim to break into chunks some of the functions in worker.js to stop running out of turbofan zone memory which would have for effect to allow me to remove the --no-opt flag from the worker spawn and therefore boost the speed by about 30% which would make the local multithreading as good as it can be and therefore make it a stable version. << This was a very bad idea and made the code about 339% slower, for this 2.0.0 Nightly 4, I simply realized everything was perfect, added a safety check for the optional noSweetSpotSaving config option and shipped.
- 2.0.0 Nightly 4 — Added safety check for optional noSweetSpotSaving config option.
- 2.0.0 Nightly 3 — Removed what 2.0.0 Nightly 2.5 added as it created a bug I could not fix. Also officially added "noSweetSpotSaving" option to the config, it is self explanatory, however I still added it to the guide.
- 2.0.0 Nightly 2.5 — Works exactly as 2.0.0 Nightly 2 except there's a command to change batch size in interactive mode, except it crashes everything, don't use it!
- 2.0.0 Nightly 2 — Stabilized but slow (still faster than single threaded).
- 2.0.0 Nightly — Very unstable, but cpu multicore is almost here. THIS IS <strong>NOT</strong> A STABLE BUILD, DO NOT USE FOR ACTUAL USAGE, USE THE LATEST NPM BUILD FOR THAT PURPOSE.

## License
The license for this code is the <a href="https://github.com/willmil11/cleanai/blob/main/LICENSE">MIT License</a>.
