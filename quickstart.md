# Quickstart
## To use the code out of the box
- Hit ctrl + f in app.py
- Search for ```transformer.pretrain(["pre-training1.txt", "pre-training2.txt"], epochs=1000, optimizer="adam")```
- Comment that line by putting a # at the start of it
- Run the code using python app.py
- Congrats, you are now training an ai model to respond to basic greetings on the dataset.json dataset without pre-training which will take you about 3-5 days at rasberry pi 5 speeds for perfect accuracy.

## To do some actual serious training
- Hit ctrl + f in app.py
- Search for ```transformer.pretrain(["pre-training1.txt", "pre-training2.txt"], epochs=1000, optimizer="adam")```
- Edit pre-training1.txt and pre-training2.txt to your actual text file(s) that contain a dump of human speech data, for exemple if you <a href="https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-pages-articles.xml.bz2">downloaded wikipedia</a> uncompressed it and used a tool to separate it in a lots of 100mb text files, put their paths.
- Edit dataset.json to something that actually look like a LOT of various chatbot queries/responses so it learns to be an assistant and not just an autocomplete on steroids. you can make multi turn conversation as in an i/o pair i (inputs) and o (outputs) are arrays (lists) so you can put multiple inputs outputs like for a pair
```json
{
    "inputs": ["Hey", "I'm fine, what about you?"],
    "outputs": ["Hey there, how are you?", "I'm fine too, thanks for asking :D"]
}
```
Or you can just put one if you don't plan your chatbot to handle followups according to context of previous queries.

<strong>Important note:</strong> If you plan to pre-train your chatbot on the entirity of wikipedia, I highly recommand you tune the hyperparameters like the layer count, embedding size, head count, context size, max output size, etc between line 2004 and line 2022 (exact line count may change in future updates). I left comments explaining in further details what purpose those hyperparameters serve which you can see in color if you install the better comments vscode extension.

## Go further
If you're really serious about this and somehow didn't switch to a well established framework like pytorch or tensorflow, I recommend trying to tune the learning rate or switch optimizers during training and play with the temperature when running the model with /temperature.

## Interactive mode
Interactive mode will trigger every time a new epoch is completed and will expire after a 30 seconds timeout if you don't respond to the "Are you there" prompt. It will also trigger after training and pretraining. In any interractive mode console you can type "/help" and press enter for a list of commands. Default temperature when testing the model will be 0.7 making it lower will make the model more deterministic and predictible, while making it higher will make it more random. 0.7 is a good balence.