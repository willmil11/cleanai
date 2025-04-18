# Cleanai
## What is this?
This is a project of mine that as of 18.04.2025 I've been working on for about 4 months. This is a transformer architecture with pre-training and training implemented in pure javascript. It only requires tiktoken for tokenization and readline for the interactive console mode as you can see in package.json. Only pure raw javascript and no abstractions. You can see the <a href="./quickstart.md">quickstart</a>

## Why?
I wanted to see how this actually works therfore I decided to put Claude, Chatgpt and Gemini to work to teach me how all of this works, I also used them to implement some parts of the code like training, pre-training and other stuff but I generally understand how it works now. Because this works and this is really cool I am releasing it on github publicly :)

## Can I use this to train my AI?
Absolutely, however you won't get the same kind of speeds as you would get with pytorch or tensorflow, see this is pure single threaded javascript running on CPU. But it will absolutely train the model correctly and run it correctly.

## Did you test this?
I did not test pre-training yet, but I tested just training on the dataset.json that's currently there which is a 10 example greetings dataset. And got decent results after about 200 epochs which was 0.8 loss, the loss will go down very fast at first then very slowly. what might take 2-3 epochs at the start might take 200 later on. Depending on the temperature (closer to 0 is more determinitic) the model gave responses to dataset inputs that were not exactly what was expected but outputs that showed that it was learning like:
```
> Hey
 are you you you how how are, are are?, how are you
```
Even if it is quite random because of the temperature, the absurdly low amount of dataset examples and the fact that loss was still 0.8 which is still quite high to expect perfect responses, you can see the model is starting to understand the pattern and can kind of babble the appropriate response according to the dataset.
<br>
Currently, at 0.8 loss, the model can even slightly infer when a query is not exactly from the dataset:
```
> H.y   !
are you?? how how how how are?? are you
```
As you can see the response is not as good but it still kind of captures the pattern.
<br>
<br>
<strong>Important note:</strong> Here the training was slow and resulted in a not very good model because of the simplified layer normalization implementation which has been fixed, a new more accurate example will be added in the near future.

## What's gonna be in future updates?
Here's a small list of things I'll add:
- Add multicore support
- Add gpu support (eventually but not for now because this is very hard)

## How to support the project?
To support this project you can star the repo and you can send me suggestions through discord (willmil11) or email (willmil111012@gmail.com). Please don't create pull requests as this is a project of mine to learn I therefore want to code and implement everything myself, even if your suggestions are welcome, I want to implement them myself.

## My model keeps overfiting, what do I do?
I suggest enabling anti overfitting optimisations in the config of your model or tinkering with the actual code (you can search where overfitting optimisations are applied by hitting ctrl + f and search "overfiting").

## Why is it saying "Extreme scaling"?
So sometimes numbers get too big, and we're at risk of them being so big that python will crash and turn them into nans while trying to represent them which is bad because it'll destroy all of the calculations where those numbers that turned into nans were supposed to be used. So we scale those numbers down to keep precision without risking nans. If you don't like to see that just don't use the --verbose flag.

## Who am I and what does this project mean to me?
I'm William, a 14 yo french programmer and this is my most ambitious project yet. It took an insane amount of planning, coding and debugging but it was sooo worth it.