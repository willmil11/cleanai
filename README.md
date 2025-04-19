# Cleanai
## What is this?
This is a project of mine that as of 19.04.2025 I've been working on for about 4 months. This is a transformer architecture with pre-training and training implemented in pure javascript. It only requires tiktoken for tokenization, readline-sync for the interactive console mode, uuid for random string generation and zip librairies (archiver and yauzl) to load/save models. Only pure raw javascript and no abstractions.

## How do I use it
Look at the guide: <a href="./guide.md">guide</a>

## Can I use this to train my AI?
Absolutely, however you won't get the same kind of speeds as you would get with pytorch or tensorflow, see this is pure single threaded javascript running on CPU (for now). But it will absolutely train the model correctly and run it correctly.

## If its slower than pytorch and tensorflow, why would I use this?
Because:
- The CLI is WAYYYY easier to use than pytorch and tensorflow
- You can see how everything works, no black box
- This is made by an actual person working alone not some megacorp like pytorch (Meta) or tensorflow (Google)

## Why?
I wanted to see how this actually works therfore I decided to put Claude, Chatgpt and Gemini to work to teach me how all of this works, I also used them to implement some parts of the code like training, pre-training and other stuff but I generally understand how it works now. Because this works and this is really cool I am releasing it on github publicly :)

## Did you test this?
My model is still training, I will give you guys an example of a good model when mine finishes training. If you're from the github repo and look at the commit history you'll see there was an example previously here and you'll maybe think "tHiS gUy iS cHeAtInG" but no, I just removed it because since I made and put here that example I changed and fixed lots of things in how the training logic works therefore that example is now innacurate.

## What's gonna be in future updates?
Here's a small list of things I'll add:
- Add multicore support
- Add gpu support (eventually but not for now because this is very hard)

## How to support the project?
To support this project you can star the repo and you can send me suggestions through discord (willmil11) or email (willmil111012@gmail.com). Please don't create pull requests as this is a project of mine to learn I therefore want to code and implement everything myself, even if your suggestions are welcome, I want to implement them myself.

## Who am I and what does this project mean to me?
I'm William, a 14 yo french programmer and this is my most ambitious project yet. It took an insane amount of planning, coding and debugging but it was sooo worth it.

## Github repo
If you're on the npm page, check out and perhaps star the <a href="https://github.com/willmil11/cleanai">repo</a>

## Deprecated versions
Refer to the <a href="./deprecated/deprecated.md">deprecated readme</a>

## License
The license for this code is the <a href="./LICENSE">MIT License</a>.