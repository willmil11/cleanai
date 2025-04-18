# Quickstart
## To use the code out of the box
- Open a terminal
- Run ```node --max-old-space-size=however much memory you wanna allocate in mb to the ai --expose-gc cleanai.js --new --config config.json --train```

## To do some actual serious training
- Open config.json
- Change the pre-training-paths array to an array of actual paths to text files containing human speech like all wikipedia split into 100mb chunks.
- Open and edit dataset.json to something that actually look like a LOT of various chatbot queries/responses so it learns to be an assistant and not just an autocomplete on steroids. you can make multi turn conversation as in an i/o pair i (inputs) and o (outputs) are arrays (lists) so you can put multiple inputs outputs like for a pair
```json
{
    "inputs": ["Hey", "I'm fine, what about you?"],
    "outputs": ["Hey there, how are you?", "I'm fine too, thanks for asking :D"]
}
```
Or you can just put one if you don't plan your chatbot to handle followups according to context of previous queries.
<br>
Then you'll want to run it with --pretrain too or else it won't run the pre-training like:
```bash
node --max-old-space-size=however much memory you wanna allocate in mb to the ai --expose-gc cleanai.js --new --config config.json --pretrain --train
```

<strong>Important note:</strong> If you plan to pre-train your chatbot on the entirity of wikipedia or some other very large amount of content, I highly recommand you tune the hyperparameters like the layer count, embedding size, head count, context size, max output size, etc in config.json.

## Go further
If you're really serious about this and don't want to switch to the way more complicated but orders of magnitude faster established frameworks like pytorch or tensorflow you may want to change the temperature of the model, it's learning rate, micro batch size or even optimiser to fine tune model learning performance.

## Interactive mode
Interactive mode will trigger every time a new epoch is completed and will expire after a 30 seconds timeout if you don't respond to the "Are you there" prompt. It will also trigger after training and pretraining. In any interractive mode console you can type "/help" and press enter for a list of commands. Default temperature when testing the model will be 0.7 making it lower will make the model more deterministic and predictible, while making it higher will make it more random. 0.7 is a good balence.

## What each file does
- cleanai.js: Code of the ai.
- package.json: Nodejs dependencies.
- dataset.json: For training, making the ai an assistant instead of just an autocomplete on steroids. Currently a 10 examples greetings dataset.
- quickstart.md: What you're reading rn.
- README.md: Main readme, what you land on when you go on the repo on github.
- vocabulary.json: Tiktoken gpt4 vocabulary but cleaned of tokens I didn't like.
- config.json: Configuration for the model, currently an example configuration that works.
