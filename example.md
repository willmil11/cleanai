# Example

## What's this
This is a very simple example of how you can use my software to train a very simple and basic ai model.

## What kind of example?
We are simply gonna train a model to learn a 10 example greetings dataset without pre-training with only one input and one output by pair, this will result in an extremely simplistic ai model that can only answer the outputs of the dataset or mixes of them to what it understands to be inputs of the dataset or close things.

## Let's get started
If you haven't already installed the cli tool, you can simply run the following command (note that it requires having some disk space, an internet connection, npm and nodejs installed):
```bash
npm install -g cleanai
```
Then you can create a dataset.json file with the following contents:
```jsonc
[
    {
        "inputs": ["Hey!"],
        "outputs": ["Hey, how are you?"]
    },
    {
        "inputs": ["Hey there!"],
        "outputs": ["Hey there, how are you?"]
    },
    {
        "inputs": ["Hey man!"],
        "outputs": ["Hey man, how are you?"]
    },
    {
        "inputs": ["Hey friend!"],
        "outputs": ["Hey friend, how are you?"]
    },
    {
        "inputs": ["Hey stranger!"],
        "outputs": ["Hey stranger, how are you?"]
    },
    {
        "inputs": ["Hey!"],
        "outputs": ["Hey, how are you?"]
    },
    {
        "inputs": ["Hey there!"],
        "outputs": ["Hey there, how are you?"]
    },
    {
        "inputs": ["Hey!"],
        "outputs": ["Hey, how are you?"]
    },
    {
        "inputs": ["Hey you!"],
        "outputs": ["Hey you, how are you?"]
    },
    {
        "inputs": ["Hey!"],
        "outputs": ["Hey, how are you?"]
    }
]
```
After you've done this create a simple config.json file with the following contents:
```jsonc
{
    "training-dataset-path": "dataset.json",
    "pre-train-epochs": 1000,
    "train-epochs": 1000,
    "pre-train-optimizer": "adam",
    "train-optimizer": "adam",
    "contextSize": 128,
    "embeddingSize": 128,
    "learningRate": 0.0001,
    "maxOutputSize": 16,
    "layersAmount": 4,
    "heads": 4,
    "microbatchSize": 24,
    "biasesinitrange": [-0.01, 0.01],
    "embeddinginitrange": [-0.1, 0.1],
    "antiOverfittingOptimisations": true //if your model is not learning well, try setting this to false (this applies only to very small datasets without pre-training that we wanna learn perfectly)
}
```
Note that to train this ai model which is even larger than required to learn this small dataset you will need 3gb of ram at least.

## Let's train the model
Now that you have all the pre-requisites, you may open a terminal where those two files you've created are and inside run the following command:
```bash
cleanai --new --config config.json --train
```

## Ok I see a bunch of random text in the terminal, what happens now?
My software is normally well designed, foolproof and fully automatic, let it do its job. Every once in a while come back and wait till you see "[🧪 Interactive Test Mode]" then you can respond anything you want to the prompt asking you if you're still there by typing anything then pressing enter.
<br>
After you've done this you are in a testing environement. Execute /info to see the current loss and the previous epoch loss to see how fast the loss is decreasing aka how fast the model is learning. You can test the model by typing an input that is not a command (you can see the whole list of command by executing /help), inference execution logs will flash across your screen and if your pc is not a potato in no time you should get an answer back from the ai. As you'll probably see in the /help message the most useful commands are /stop, used to stop the training if satisfied and land in the final console., /save to save the model (you can specify a path with /save [path]), /temperature \<temperature> to specify a temperature (the higher it is the more random the model will be, the lower it is the more deterministic it will be), the sweet spot of temperature is 0.7 but I suggest you try 1, 0.3 and 0 just to see how it works, negative values will crash the system without saving your model so don't use them pls :) you've also got /info to get info about the current state of training and finally /continue that you should use to continue training if you're not satisfied with the current results.

## Why is it so slow?
Ai training is a very slow process especially with the current version of my software which only uses a single core of your cpu instead of all the cores of your cpu + of your gpu to train the model. In future updates this will be fixed. Also keep in mind that the more accurate the model gets the slower it learns (diminishing returns).

## Ok I see the model is learning, what now?
Once you're satisfied with the results you can stop the training by executing /stop and then you can save the model by executing /save [path] in the final console (you can specify a path or just use do /save alone to use the default path which should be model_adam.zip). You then are free to test the model however you want, when you're done you can /exit. and come back whenever you want my loading the model by executing in your terminal
```bash
cleanai --load /path/to/model.zip
```
which assuming you are in the directory where the model it located and are using the default save path, simply
```bash
cleanai --load model_adam.zip
```

## Ok I saved my model and stopped training and exited now I want to continue training, how do i do that?
You will need to remove the following parameters from the config, you can tweak the others. for this example I will add no tweaks, here are the parameters to remove:

- embeddingSize
- layersAmount
- heads
- embeddinginitrange
- biasesinitrange

This will result in this if you don't do any tweaks from the original example config:
```jsonc
{
    "training-dataset-path": "dataset.json",
    "pre-train-epochs": 1000,
    "train-epochs": 1000,
    "pre-train-optimizer": "adam",
    "train-optimizer": "adam",
    "contextSize": 128,
    "learningRate": 0.0001,
    "maxOutputSize": 16,
    "microbatchSize": 24,
    "antiOverfittingOptimisations": true //if your model is not learning well, try setting this to false (this applies only to very small datasets without pre-training that we wanna learn perfectly)
}
```

Then you can run the following command:
```bash
cleanai --load /path/to/model.zip --config config.json --train
```
And you're back in it.

## I went to do further things with pre-training etc.
Well then you've got some reading to do, go back to <a href="https://github.com/willmil11/cleanai/blob/main/guide.md">the guide</a>.