#
#* It is way better to download the better comments extension for vscode to view this file because
#* it adds color to the comments depending on how much you should read them thanks to the little symbols
#* like * ! and ? that I put after # on the comments.

# Credits
#
# Me ofc (willmil11)
# Claude
# Chatgpt
#

# Contact me
# Discord: willmil11
# Email: willmil111012@gmail.com
#

#Drop a star on the github repo if you like it :D

#? The code is not super clean and optimised but it's prety user friendly and easy to understand,
#? it works well too. You can expect it to get better in future updates

import sys
import os
import json

args = sys.argv[1:]

config = {}

def help(issue="No args found."):
    def spacing():
        return " " * len("python " + sys.argv[0])
    print("=====" + "=" * len(issue) + "=====")
    print("==== " + issue + " ====")
    print("=====" + "=" * len(issue) + "=====")
    print("")
    print("python " + sys.argv[0] + " --new")
    print(spacing() + " " * len(" --new") + "--config path/to/config.json")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json") + "--train")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json") + " " * len("--pretrain") + "--pretrain")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json") + "--pretrain")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json") + " " * len("--pretrain") + "--train")
    print(spacing() + " " * len(" --new") + "--config path/to/config.json --verbose")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json --verbose") + "--train")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json --verbose") + " " * len("--pretrain") + "--pretrain")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json --verbose") + "--pretrain")
    print(spacing() + " " * len(" --new") + " " * len("--config path/to/config.json --verbose") + " " * len("--pretrain") + "--train")
    print(spacing() + " --load path/to/model.json")
    print("")

flag = None
VERBOSE = False
training__ = None
pretraining__ = None
config__ = False
skipnext = False
config_location = None
model_location = None

if len(args) == 0:
    help()
    exit(0)
else:
    for i, arg in enumerate(args):
        if skipnext:
            skipnext = False
            continue
        if arg == "--new":
            if flag == True:
                help("You can't specify --new multiple times.")
                exit(0)
            else:
                if flag == False:
                    help("You can't specify --new and --load at the same time.")
                    exit(0)
            flag = True
        else:
            if arg == "--load":
                if flag == True:
                    help("You can't specify --new and --load at the same time.")
                    exit(0)
                else:
                    if flag == False:
                        help("You can't specify --load multiple times.")
                        exit(0)
                flag = False
                try:
                    if args[i + 1] != "--new":
                        if args[i + 1] != "--train":
                            if args[i + 1] != "--pretrain":
                                if args[i + 1] != "--config":
                                    model_location = args[i + 1]
                                    if not os.path.exists(model_location):
                                        help(f"Model file {model_location} does not exist.")
                                        exit(0)
                                    if not os.path.isfile(model_location):
                                        help(f"Model file {model_location} is not a file.")
                                        exit(0)
                                    if not model_location.endswith(".json"):
                                        help(f"Model file {model_location} is not a json file.")
                                        exit(0)
                                else:
                                    help("You need to specify a model file after --load.")
                                    exit(0)
                            else:
                                help("You need to specify a model file after --load.")
                                exit(0)
                        else:
                            help("You need to specify a model file after --load.")
                            exit(0)
                    else:
                        help("You need to specify a model file after --load.")
                        exit(0)
                except IndexError:
                    help("You need to specify a model file after --load.")
                    exit(0)
            else:
                if arg == "--verbose":
                    if VERBOSE == True:
                        help("You can't specify --verbose multiple times.")
                        exit(0)
                    else:
                        VERBOSE = True
                else:
                    if arg == "--train":
                        if training__ == True:
                            help("You can't specify --train multiple times.")
                            exit(0)
                        else:
                            training__ = True
                    else:
                        if arg == "--pretrain":
                            if pretraining__ == True:
                                help("You can't specify --pretrain multiple times.")
                                exit(0)
                            else:
                                pretraining__ = True
                        else:
                            if arg == "--config":
                                if config__ == True:
                                    help("You can't specify --config multiple times.")
                                    exit(0)
                                config__ = True
                                try:
                                    if args[i + 1] != "--new":
                                        if args[i + 1] != "--train":
                                            if args[i + 1] != "--pretrain":
                                                if args[i + 1] != "--config":
                                                    config_location = args[i + 1]
                                                    if not os.path.exists(config_location):
                                                        help(f"Config file {config_location} does not exist.")
                                                        exit(0)
                                                    if not os.path.isfile(config_location):
                                                        help(f"Config file {config_location} is not a file.")
                                                        exit(0)
                                                    if not config_location.endswith(".json"):
                                                        help(f"Config file {config_location} is not a json file.")
                                                        exit(0)
                                                else:
                                                    help("You need to specify a config file after --config.")
                                                    exit(0)
                                            else:
                                                help("You need to specify a config file after --config.")
                                                exit(0)
                                        else:
                                            help("You need to specify a config file after --config.")
                                            exit(0)
                                    else:
                                        help("You need to specify a config file after --config.")
                                        exit(0)
                                except IndexError:
                                    help("You need to specify a config file after --config.")
                                    exit(0)
                                skipnext = True
                                continue
                            else:
                                help(f"Argument {arg} not recognised.")
                                exit(0)

if "--new" in args:
    if not "--config" in args:
        help("You need to specify a config file with --config.")
        exit(0)
    else:
        if not "--train" in args:
            if not "--pretrain" in args:
                help("You need to specify either --train or --pretrain or both with --new.")
                exit(0)
        else:
            if not "--pretrain" in args:
                if not "--train" in args:
                    help("You need to specify either --train or --pretrain or both with --new.")
                    exit(0)

# Check if either --new or --load is specified
if not "--new" in args and not "--load" in args:
    help("You need to specify either --new or --load.")
    exit(0)

if not VERBOSE:
    VERBOSE = False

print("Arguments parsed successfully.")
if "--new" in args:
    print("Reading and loading config file...")
    try:
        configtoparse = open(config_location, "r").read()
    except Exception as error:
        print("Failed to read config file, check if it's corrupted or if you don't have permissions.")
        print("Python error:")
        print(str(error))
        print("Exiting...")
        exit(1)

    try:
        configtoparse = json.loads(configtoparse)
    except Exception as error:
        print("Failed to load json of config file, check if it's corrupted.")
        print("Python error:")
        print(str(error))
        print("Exiting...")
        exit(1)

    keys = ["pre-training-paths", "training-dataset-path", "contextSize", "embeddingSize", "learningRate", "maxOutputSize", "layersAmount", "heads", "biasesinitrange", "embeddinginitrange"]

    for key in keys:
        if key in ["pre-training-paths", "training-dataset-path"]:
            if pretraining__ == None and training__ == None:
                print(f"Config file missing parameter {key}, add it.")
                print("Exiting...")
                exit(1)
        else:
            if not key in configtoparse:
                print(f"Config file missing parameter {key}, add it.")
                print("Exiting...")
                exit(1)
            else:
                if pretraining__:
                    if key == "pre-training-paths":
                        if not isinstance(configtoparse[key], list):
                            print(f"Config file parameter {key} must be an array of strings, not a {type(configtoparse[key])}")
                            exit(1)
                        for item in configtoparse[key]:
                            if not isinstance(item, str):
                                 print(f"Config file parameter {key} must be an array of strings, not an array of {type(item)}")
                                 exit(1)
                if training__:
                    if key == "training-dataset-path":
                        if not isinstance(configtoparse[key], str):
                            print(f"Config file parameter {key} must be a string, not a {type(configtoparse[key])}")
                            exit(1)
                if key == "contextSize":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "embeddingSize":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "learningRate":
                    if not isinstance(configtoparse[key], float):
                        print(f"Config file parameter {key} must be a float, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "maxOutputSize":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "layersAmount":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "heads":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "biasesinitrange":
                    if not isinstance(configtoparse[key], list):
                        print(f"Config file parameter {key} must be an array of two floats, not a {type(configtoparse[key])}")
                        exit(1)
                    if len(configtoparse[key]) != 2:
                        print(f"Config file parameter {key} must be an array of two floats, not an array of {len(configtoparse[key])} floats")
                        exit(1)
                    for item in configtoparse[key]:
                        if not isinstance(item, float):
                             print(f"Config file parameter {key} must be an array of two floats, not an array of {type(item)}")
                             exit(1)
                if key == "embeddinginitrange":
                    if not isinstance(configtoparse[key], list):
                        print(f"Config file parameter {key} must be an array of two floats, not a {type(configtoparse[key])}")
                        exit(1)
                    if len(configtoparse[key]) != 2:
                        print(f"Config file parameter {key} must be an array of two floats, not an array of {len(configtoparse[key])} floats")
                        exit(1)
                    for item in configtoparse[key]:
                        if not isinstance(item, float):
                             print(f"Config file parameter {key} must be an array of two floats, not an array of {type(item)}")
                             exit(1)
                if pretraining__:
                    if key == "pre-train-epochs":
                        if not isinstance(configtoparse[key], int):
                            print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                            exit(1)
                if training__:
                    if key == "train-epochs":
                        if not isinstance(configtoparse[key], int):
                            print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                            exit(1)
                if pretraining__:
                    if key == "pre-train-optimizer":
                        if not isinstance(configtoparse[key], str):
                            print(f"Config file parameter {key} must be a string, not a {type(configtoparse[key])}")
                            exit(1)
                if training__:
                    if key == "train-optimizer":
                        if not isinstance(configtoparse[key], str):
                            print(f"Config file parameter {key} must be a string, not a {type(configtoparse[key])}")
                            exit(1)
                if key == "antiOverfittingOptimisations":
                    if not isinstance(configtoparse[key], bool):
                        print(f"Config file parameter {key} must be a boolean, not a {type(configtoparse[key])}")
                        exit(1)
                if key == "microbatchSize":
                    if not isinstance(configtoparse[key], int):
                        print(f"Config file parameter {key} must be an int, not a {type(configtoparse[key])}")
                        exit(1)
                config[key] = configtoparse[key]

    config = configtoparse


    print("Config file loaded successfully.")

ndprint = print
print = None
def print(*args, sep=' ', end='\n', file=None, flush=False):
    if VERBOSE:
        ndprint(*args, sep=sep, end=end, file=file, flush=flush)

from sys import exit
import time
import random as rd
import math
import uuid
import platform

try:
    import tiktoken
except Exception:
    print("Failed to import tiktoken for tokenization, do you wish to try to auto install it?")
    if platform.system() == "Linux":
        print("Note: You need pip installed and it will be ran in --break-system-packages mode, I am not liable for any damages.")
    else:
        print("Note: You need pip installed, and I am not liable for any damages.")
    while True:
        answer = input("Do you wish to continue? (y/n) ")
        if answer.lower() == "y":
            from subprocess import run
            try:
                print("Trying to install tiktoken using pip...")
                try:
                    if platform.system() == "Linux":
                        run(["pip", "install", "tiktoken", "--break-system-packages"], check=True)
                    else:
                        run(["pip", "install", "tiktoken"], check=True)
                except KeyboardInterrupt:
                    print("You hit Ctrl+C, exiting...")
                    exit(0)
                print("Successfully installed tiktoken")
                print("Trying to import tiktoken...")
                try:
                    import tiktoken
                except Exception:
                    print("Failed to import tiktoken even after installing it, exiting...")
                    exit(1)
                break
            except Exception as e:
                print(f"Failed to install tiktoken: {e}")
                exit(1)
        else:
            if answer.lower() == "n":
                print("Exiting...")
                exit(1)
            else:
                print("Invalid answer, valid answers are 'y' and 'n'")
                continue


try:
    from inputimeout import inputimeout, TimeoutOccurred
except Exception:
    print("Failed to import inputimeout for interactive mode, do you wish to try to auto install it?")
    if platform.system() == "Linux":
        print("Note: You need pip installed and it will be ran in --break-system-packages mode, I am not liable for any damages.")
    else:
        print("Note: You need pip installed, and I am not liable for any damages.")
    while True:
        answer = input("Do you wish to continue? (y/n) ")
        if answer.lower() == "y":
            from subprocess import run
            try:
                print("Trying to install inputimeout using pip...")
                try:
                    if platform.system() == "Linux":
                        run(["pip", "install", "inputimeout", "--break-system-packages"], check=True)
                    else:
                        run(["pip", "install", "inputimeout"], check=True)
                except KeyboardInterrupt:
                    print("You hit Ctrl+C, exiting...")
                    exit(0)
                print("Successfully installed inputimeout")
                print("Trying to import inputimeout...")
                try:
                    from inputimeout import inputimeout, TimeoutOccurred
                except Exception:
                    print("Failed to import inputimeout even after installing it, exiting...")
                    exit(1)
                break
            except Exception as e:
                print(f"Failed to install inputimeout: {e}")
                exit(1)
        else:
            if answer.lower() == "n":
                print("Exiting...")
                exit(1)
            else:
                print("Invalid answer, valid answers are 'y' and 'n'")
                continue

printdontprint = True

timers = []
def timer_():
    global timers
    #Generate random 32 char string to id timer
    timer_id = str(uuid.uuid4().hex)
    timers.append({
        "id": timer_id,
        "start": time.time()
    })
    return timer_id

def timer_end(timer_id):
    global timers
    for timer in timers:
        if timer["id"] == timer_id:
            timer["end"] = time.time()
            #Return time in ms
            return (timer["end"] - timer["start"]) * 1000
    return None

def random(range):
    #Return random float between range (inclusive)
    return rd.uniform(range[0], range[1])

class Transformer:
    def __init__(self, new=False, parameters=None, path=None, vocab_path="vocabulary.json"):
       self.adam_params = {
           'beta1': 0.9,
           'beta2': 0.98,  # From 0.999 to 0.98 to match paper
           'epsilon': 1e-9,
           't': 0
       }
       ndprint("Trying to read vocabulary file...")
       try:
           self.vocab = json.loads(open("vocabulary.json", "r").read())
       except Exception:
           print("Failed to read vocabulary file, creating error...")
           raise Exception("Failed to read vocabulary file")
       ndprint("Successfully read vocabulary file")
       ndprint("Computing lookup table...")
       self.id_to_token = {tok[1]: tok[0] for tok in self.vocab}
       ndprint("Computed lookup table")
       self.encoder = tiktoken.get_encoding("cl100k_base")  # Same as GPT-4
       self.temperature = 0.7

       if new:
           ndprint("Initializing model...")
           # Calculate total parameters
           total_params = (
               # Token embeddings: vocab_size * embedding_size
               len(self.vocab) * parameters["embeddingSize"] +
               # Position embeddings: context_size * embedding_size
               parameters["contextSize"] * parameters["embeddingSize"] +
               # For each layer
               parameters["layersAmount"] * (
                   # Layer norm 1: 2 * embedding_size (weights and biases)
                   2 * parameters["embeddingSize"] +
                   # Attention: For each head (query, key, value weights and biases)
                   parameters["heads"] * (3 * parameters["embeddingSize"] * parameters["embeddingSize"] // parameters["heads"] + 3 * parameters["embeddingSize"] // parameters["heads"]) +
                   # Attention output projection: embedding_size * embedding_size + embedding_size
                   parameters["embeddingSize"] * parameters["embeddingSize"] + parameters["embeddingSize"] +
                   # Layer norm 2: 2 * embedding_size (weights and biases)
                   2 * parameters["embeddingSize"] +
                   # Feed forward grow: embedding_size * (4 * embedding_size) + 4 * embedding_size
                   parameters["embeddingSize"] * (4 * parameters["embeddingSize"]) + 4 * parameters["embeddingSize"] +
                   # Feed forward shrink: (4 * embedding_size) * embedding_size + embedding_size
                   (4 * parameters["embeddingSize"]) * parameters["embeddingSize"] + parameters["embeddingSize"]
               )
           )

           total_ram = total_params * 8 #(64 bit floats take up 8 bytes each)

           ndprint("Model is of size " + str(total_params) + " parameters")
           total_ram = total_params * 8  # 64 bit floats take up 8 bytes each
           ndprint(f"                 ~{total_params / 1e9:.2f}b parameters")
           ndprint("")
           adam_ram = total_params * 3 * 8  # Assuming 3 times the parameters for Adam
           ndprint("Would cost the equivalent of " + str(total_params * 3) + " parameters if trained with Adam")
           ndprint(f"                             ~{total_params * 3 / 1e9:.2f}b parameters if trained with adam")
           ndprint("")
           sgd_momentum_ram = total_params * 2 * 8  # Assuming 2 times the parameters for SGD with momentum
           ndprint("Would cost the equivalent of " + str(total_params * 2) + " parameters if trained with SGD with momentum")
           ndprint(f"                             ~{total_params * 2 / 1e9:.2f}b parameters if trained with SGD with momentum")
           ndprint("")
           ndprint("Would not cost more than the original size of the model if trained with vanilla SGD")
           sgtimer = timer_()
           ndprint("Initializing parameters...")
           timer = timer_()
           self.contextSize = parameters["contextSize"]
           self.embeddingSize = parameters["embeddingSize"]
           self.learningRate = parameters["learningRate"]
           self.maxOutputSize = parameters["maxOutputSize"]
           self.layersAmount = parameters["layersAmount"]
           if "use_he_init" in parameters and parameters["use_he_init"]:
               self.weightsinitrange = self.he_init(self.embeddingSize)
               print(f"Using He initialization with range: {self.weightsinitrange}")
           else:
               self.weightsinitrange = parameters["weightsinitrange"]
           self.biasesinitrange = parameters["biasesinitrange"]
           self.heads = parameters["heads"]
           self.embeddinginitrange = parameters["embeddinginitrange"]
           self.transformer = {}
           self.step_num = 0
           ndprint("Initialized parameters in", timer_end(timer), "ms")
           percentagePrintInterval = 10
           ndprint("Initializing layers...")
           gtimer = timer_()
           self.transformer["layers"] = []
           for i in range(self.layersAmount):
               timer = timer_()
               print("Initializing weights and biases for layer", i)
               self.transformer["layers"].append({
                   "weights": {
                       "normalize_1": [],  # weights to multiply with after normalization
                       "attention": {
                           "heads": [      # list of heads, each head has its own weights
                               {
                                   "query": [],  # weights for computing query vectors for this head
                                   "key": [],    # weights for computing key vectors for this head
                                   "value": []   # weights for computing value vectors for this head
                               } for _ in range(self.heads)
                           ],
                           "output": []    # weights for final projection after combining heads
                       },
                       "normalize_2": [],  # weights to multiply with after normalization
                       "feed_forward": {
                           "grow": [],     # weights for first transformation
                           "shrink": []    # weights for second transformation
                       }
                   },
                   "biases": {
                       "normalize_1": [],  # biases to add after weight multiplication
                       "attention": {
                           "heads": [      # list of heads, each head has its own biases
                               {
                                   "query": [],  # biases for query vectors for this head
                                   "key": [],    # biases for key vectors for this head
                                   "value": []   # biases for value vectors for this head
                               } for _ in range(self.heads)
                           ],
                           "output": []    # biases for final projection
                       },
                       "normalize_2": [],  # biases to add after weight multiplication
                       "feed_forward": {
                           "grow": [],     # biases for first transformation
                           "shrink": []    # biases for second transformation
                       }
                   }
               })
               
               #For normalization, each needs embedding_size weights and biases
               #For attention:
                   #For each head:
                       #Query: embedding_size * embedding_size weights and embedding_size biases
                       #Key: embedding_size * embedding_size weights and embedding_size biases
                       #Value: embedding_size * embedding_size weights and embedding_size biases
               #Output (after combining heads): embedding_size * embedding_size weights and embedding_size biases
               #For feed forward:
                   #Grow: embedding_size * (embedding_size * 4) weights and (embedding_size * 4) biases
                   #Shrink: (embedding_size * 4) * embedding_size weights and embedding_size biases

               # Calculate total parameters for progress tracking
               total_params = 2 * self.embeddingSize + 3 * self.heads * (self.embeddingSize * self.embeddingSize + self.embeddingSize) + self.embeddingSize * (self.embeddingSize * self.heads) + self.embeddingSize + 2 * self.embeddingSize + self.embeddingSize * (self.embeddingSize * 4) + (self.embeddingSize * 4) + (self.embeddingSize * 4) * self.embeddingSize + self.embeddingSize
               params_done = 0
               last_percent = -percentagePrintInterval  # Start at -percentagePrintInterval to ensure first 0% is printed

               for j in range(self.embeddingSize):
                   self.transformer["layers"][i]["weights"]["normalize_1"].append([random(self.weightsinitrange), 0, 0])
                   self.transformer["layers"][i]["biases"]["normalize_1"].append([random(self.biasesinitrange), 0, 0])
                   self.transformer["layers"][i]["weights"]["normalize_2"].append([random(self.weightsinitrange), 0, 0])
                   self.transformer["layers"][i]["biases"]["normalize_2"].append([random(self.biasesinitrange), 0, 0])
                   params_done += 4
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")
               
               for j in range(self.heads):
                   for k in range(self.embeddingSize * self.embeddingSize):
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"].append([random(self.weightsinitrange), 0, 0])
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"].append([random(self.weightsinitrange), 0, 0])
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"].append([random(self.weightsinitrange), 0, 0])
                       params_done += 3
                       percent = (params_done * 100) // total_params
                       if percent >= last_percent + percentagePrintInterval:
                           last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                           ndprint(f"  Layer {i}: {last_percent}% complete")
                   for k in range(self.embeddingSize):
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"].append([random(self.biasesinitrange), 0, 0])
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"].append([random(self.biasesinitrange), 0, 0])
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"].append([random(self.biasesinitrange), 0, 0])
                       params_done += 3
                       percent = (params_done * 100) // total_params
                       if percent >= last_percent + percentagePrintInterval:
                           last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                           ndprint(f"  Layer {i}: {last_percent}% complete")
               
               for j in range(self.embeddingSize * (self.embeddingSize * self.heads)):
                   self.transformer["layers"][i]["weights"]["attention"]["output"].append([random(self.weightsinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")
               for j in range(self.embeddingSize):
                   self.transformer["layers"][i]["biases"]["attention"]["output"].append([random(self.biasesinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")

               for j in range(self.embeddingSize * (self.embeddingSize * 4)):
                   self.transformer["layers"][i]["weights"]["feed_forward"]["grow"].append([random(self.weightsinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")
               for j in range(self.embeddingSize * 4):
                   self.transformer["layers"][i]["biases"]["feed_forward"]["grow"].append([random(self.biasesinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")

               for j in range((self.embeddingSize * 4) * self.embeddingSize):
                   self.transformer["layers"][i]["weights"]["feed_forward"]["shrink"].append([random(self.weightsinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")
               for j in range(self.embeddingSize):
                   self.transformer["layers"][i]["biases"]["feed_forward"]["shrink"].append([random(self.biasesinitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Layer {i}: {last_percent}% complete")
               print("Initialized weights and biases for layer", i, "in", timer_end(timer), "ms")
           ndprint("Initialized layers in", timer_end(gtimer), "ms")

           ndprint("Initializing embeddings...")
           timer = timer_()
           self.transformer["embeddings"] = []
           params_done = 0
           total_params = len(self.vocab) * self.embeddingSize
           last_percent = -percentagePrintInterval  # Start at -percentagePrintInterval to ensure first 0% is printed

           for i in range(len(self.vocab)):
               embedding = []
               for j in range(self.embeddingSize):
                   embedding.append([random(self.embeddinginitrange), 0, 0])
                   params_done += 1
                   percent = (params_done * 100) // total_params
                   if percent >= last_percent + percentagePrintInterval:
                       last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                       ndprint(f"  Embeddings: {last_percent}% complete")
               self.transformer["embeddings"].append(embedding)
           ndprint("Initialized embeddings in", timer_end(timer), "ms")

           ndprint("Initializing vocabulary projection weights and biases...")
           timer = timer_()
           self.transformer["vocab_projection"] = {
               "weights": [],
               "biases": []
           }
           params_done = 0
           total_params = len(self.vocab) * self.embeddingSize + len(self.vocab)
           last_percent = -percentagePrintInterval  # Start at -percentagePrintInterval to ensure first 0% is printed
           
           # Initialize weights (vocab_size * embedding_size)
           for i in range(len(self.vocab) * self.embeddingSize):
               self.transformer["vocab_projection"]["weights"].append([random(self.weightsinitrange), 0, 0])
               params_done += 1
               percent = (params_done * 100) // total_params
               if percent >= last_percent + percentagePrintInterval:
                   last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                   ndprint(f"  Vocab projection: {last_percent}% complete")
           # Initialize biases (vocab_size)
           for i in range(len(self.vocab)):
               self.transformer["vocab_projection"]["biases"].append([random(self.biasesinitrange), 0, 0])
               params_done += 1
               percent = (params_done * 100) // total_params
               if percent >= last_percent + percentagePrintInterval:
                   last_percent = (percent // percentagePrintInterval) * percentagePrintInterval
                   ndprint(f"  Vocab projection: {last_percent}% complete")
           ndprint("Initialized vocabulary projection weights and biases in", timer_end(timer), "ms")
           ndprint("Successfully initialized model in", timer_end(sgtimer), "ms")
       else:
           ndprint("Reading model from file...")
           timer = timer_()
           try:
               model = json.loads(open(path, "r").read())  # If using read()
               self.transformer = model["transformer"]
               self.contextSize = model["contextSize"]
               self.embeddingSize = model["embeddingSize"]
               self.learningRate = model["learningRate"]
               self.maxOutputSize = model["maxOutputSize"]
               self.layersAmount = model["layersAmount"]
               self.weightsinitrange = model["weightsinitrange"]
               self.biasesinitrange = model["biasesinitrange"]
               self.heads = model["heads"]
               self.embeddinginitrange = model["embeddinginitrange"]
               
               # Add this block to load Adam parameters
               if "adam_params" in model:
                   self.adam_params = model["adam_params"]
               else:
                   self.adam_params = {
                       'beta1': 0.9,
                       'beta2': 0.98,
                       'epsilon': 1e-9,
                       't': 0
                   }

               if "step_num" in model:
                   self.step_num = model["step_num"]
               else:
                   self.step_num = 0

           except Exception:
               print("Failed to read model file, creating error...")
               raise Exception("Failed to read model file")
           ndprint("Successfully read model from file in", timer_end(timer), "ms")

    def he_init(self, fan_in):
        """
        He initialization for weights with ReLU activations.
        Returns a range for random initialization.
        """
        scale = math.sqrt(2.0 / fan_in)
        return [-scale, scale]

    def tokenize(self, text):
        timer = timer_()
        print("Tokenizing text...")
        token_ids = self.encoder.encode(text, allowed_special={'<|endoftext|>'})
        result = []
        for id in token_ids:
            token_str = self.id_to_token.get(id, "unknown")
            result.append([token_str, id])
        print("Tokenized in", timer_end(timer), "ms")
        return result

    def calculate_positional_encoding(self, sequence_length):
        positional_encodings = []
        for pos in range(sequence_length):
            embedding = []
            for i in range(self.embeddingSize):
                # Use i//2 to pair dimensions
                denominator = 10000 ** (2 * (i // 2) / self.embeddingSize)
                if i % 2 == 0:
                    embedding.append(math.sin(pos / denominator))
                else:
                    embedding.append(math.cos(pos / denominator))
            positional_encodings.append(embedding)
        return positional_encodings
        
        print("Calculated positional encodings in", timer_end(timer), "ms")
        return positional_encodings

    def get_embedding(self, token_id):
        # Find the token in vocabulary
        vocab_idx = None
        for i, token in enumerate(self.vocab):
            if token[1] == token_id:
                vocab_idx = i
                break
        
        # If token is found in vocabulary, return its embedding
        if vocab_idx is not None:
            return self.transformer["embeddings"][vocab_idx]
        else:
            # Look for unknown token in vocabulary
            unknown_idx = None
            for i, token in enumerate(self.vocab):
                if token[0] == "unknown" and token[1] == 16476:
                    unknown_idx = i
                    break
            
            # Use unknown token if found, otherwise use first token
            if unknown_idx is not None:
                print(f"Warning: Token ID {token_id} not found in vocabulary, using unknown token instead")
                return self.transformer["embeddings"][unknown_idx]
            else:
                print(f"Warning: Token ID {token_id} not found in vocabulary, using first token as fallback")
                return self.transformer["embeddings"][0]

    def normalize_vector(self, vector):
        # Extract float values only, handling any data type appropriately
        vector_list = []
        for x in vector:
            try:
                if isinstance(x, (int, float)):
                    vector_list.append(float(x))
                elif isinstance(x, list) and len(x) > 0:
                    vector_list.append(float(x[0]))
                else:
                    # Last resort - try direct conversion
                    vector_list.append(float(x))
            except:
                # If all else fails, use 0.0
                vector_list.append(0.0)
        
        # Calculate mean using pure Python
        mean = sum(vector_list) / len(vector_list)
        
        # Calculate variance and standard deviation with numerical safeguards
        squared_diffs = []
        for x in vector_list:
            # Clip differences to prevent extreme values
            diff = x - mean
            if diff > 1e6:  # Clip extremely large differences
                diff = 1e6
            elif diff < -1e6:
                diff = -1e6
            squared_diffs.append(diff * diff)
        
        variance = sum(squared_diffs) / len(vector_list)
        
        # Ensure std is not too small to prevent division issues
        std = math.sqrt(variance + 1e-10)  # Add epsilon to prevent sqrt of very small number
        
        if std < 1e-6:  # If std is very small
            return [0.0 for _ in range(len(vector_list))]  # Return zero vector
        
        # Return normalized values with clipping for safety
        normalized = []
        for x in vector_list:
            norm_val = (x - mean) / std
            # Clip normalized values to reasonable range
            if norm_val > 10.0:
                norm_val = 10.0
            elif norm_val < -10.0:
                norm_val = -10.0
            normalized.append(norm_val)
        
        return normalized

    def dot_product(self, vec1, vec2):
        # Manual implementation of dot product
        return sum(a * b for a, b in zip(vec1, vec2))

    def add_vectors(self, vec1, vec2):
        # Manual implementation of vector addition
        return [a + b for a, b in zip(vec1, vec2)]

    def softmax(self, scores):
        # Convert all inputs to Python floats
        float_scores = []
        for score in scores:
            try:
                float_scores.append(float(score))
            except:
                float_scores.append(0.0)
        
        # Find max for numerical stability
        max_score = max(float_scores)
        
        # Calculate exp of shifted scores
        exp_scores = [math.exp(score - max_score) for score in float_scores]
        
        sum_exp = sum(exp_scores)
        if sum_exp == 0:
            return [1.0 / len(float_scores) for _ in float_scores]
        return [exp / sum_exp for exp in exp_scores]

    def save(self, path="model.json"):
        with open(path, "w") as file:
            transformer = {}
            transformer["contextSize"] = self.contextSize
            transformer["embeddingSize"] = self.embeddingSize
            transformer["learningRate"] = self.learningRate
            transformer["maxOutputSize"] = self.maxOutputSize
            transformer["layersAmount"] = self.layersAmount
            transformer["heads"] = self.heads
            transformer["weightsinitrange"] = self.weightsinitrange
            transformer["biasesinitrange"] = self.biasesinitrange
            transformer["embeddinginitrange"] = self.embeddinginitrange
            transformer["vocab"] = self.vocab
            transformer["transformer"] = self.transformer
            transformer["adam_params"] = {
                'beta1': self.adam_params['beta1'],
                'beta2': self.adam_params['beta2'],
                'epsilon': self.adam_params['epsilon'],
                't': self.adam_params['t']
            }
            transformer["step_num"] = self.step_num
            json.dump(transformer, file)
        ndprint("Model saved to", path)

    def calculate_loss(self, predicted_scores, target_token_id):
        # Convert scores to probabilities using softmax
        predicted_probs = self.softmax(predicted_scores)
        
        # Create smoothed target distribution
        #! Set to 0 for better overfiting, for actual training set epsilon to 0.1 again.
        epsilon = 0 #Changed from 0.1 to 0 for better overfitting
        if config["antiOverfittingOptimisations"]:
            epsilon = 0.1
            
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / (vocab_size - 1)) for _ in range(vocab_size)]
        
        # Find index of target_token_id in self.vocab
        target_idx = None
        for i, token in enumerate(self.vocab):
            if token[1] == target_token_id:
                target_idx = i
                break
        
        if target_idx is None:
            # Handle the case where the token ID is not found in vocabulary
            print(f"Warning: Token ID {target_token_id} not found in vocabulary")
            # Use a fallback to prevent error
            target_idx = 0
        
        target_distribution[target_idx] = 1.0 - epsilon

        # Calculate cross entropy loss
        loss = 0
        for i in range(vocab_size):
            if predicted_probs[i] > 0:  # Avoid log(0)
                loss -= target_distribution[i] * math.log(predicted_probs[i])
        
        return loss

    def initialize_zero_gradients(self, structure):
        if isinstance(structure, list):
            if len(structure) > 0 and isinstance(structure[0], list) and len(structure[0]) == 3:
                newArr = []
                for i in range(len(structure)):
                    newArr.append([0, 0, 0])
                return newArr
            return [0, 0, 0]
        elif isinstance(structure, dict):
            zero_dict = {}
            for key in structure:
                if key == "heads":
                    arr = []
                    for h in range(self.heads):
                        arr.append({
                            "query": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)],
                            "key": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)],
                            "value": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)],
                        })
                    zero_dict[key] = arr
                else:
                    zero_dict[key] = self.initialize_zero_gradients(structure[key])
            return zero_dict
        return [0, 0, 0]
    def add_in_place(self, target, source):
        target_type = type(target)
        source_type = type(source)
        target_is_list = isinstance(target, list)
        source_is_list = isinstance(source, list)

        if target_type != source_type or target_is_list != source_is_list or target is None or source is None:
            if target is None or source is None:
                print("CRITICAL Accumulation Error: Encountered null gradient structure.")
                return
            if target_type != source_type or target_is_list != source_is_list:
                print("CRITICAL Accumulation Error: Type mismatch between target and source.")
                print(f"Target: type={target_type}, isList={target_is_list}")
                print(f"Source: type={source_type}, isList={source_is_list}")
                return

        if target_is_list:
            if len(target) == 3 and isinstance(target[0], (int, float)) and len(source) == 3:
                target[0] += source[0]
                return
            else:
                if len(target) != len(source):
                    print(f"CRITICAL Accumulation Error: Array length mismatch ({len(target)} vs {len(source)}).")
                    return
                for i in range(len(target)):
                    self.add_in_place(target[i], source[i])
        elif isinstance(target, dict):
            for key in target:
                if key in source:
                    self.add_in_place(target[key], source[key])

    def updateParamArray(self, params, grads, optimizer, lr, weight_decay, momentum_factor, apply_weight_decay):
        if not params or not grads or len(params) != len(grads):
            return

        for i in range(len(params)):
            param = params[i]
            grad_value = grads[i][0] if isinstance(grads[i], list) else grads[i]

            if apply_weight_decay:
                grad_value += weight_decay * param[0]

            if optimizer == "adam":
                param[1] = self.adam_params["beta1"] * param[1] + (1 - self.adam_params["beta1"]) * grad_value
                param[2] = self.adam_params["beta2"] * param[2] + (1 - self.adam_params["beta2"]) * (grad_value ** 2)
                m_hat = param[1] / (1 - self.adam_params["beta1"] ** self.adam_params["t"])
                v_hat = param[2] / (1 - self.adam_params["beta2"] ** self.adam_params["t"])
                param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params["epsilon"])
            elif optimizer == "sgd_momentum":
                param[1] = momentum_factor * param[1] + grad_value
                param[0] -= lr * param[1]
            else:
                param[0] -= lr * grad_value

    def apply_gradients(self, optimizer):
        if self.accumulated_embedding_grads is None:
            return  # Nothing to apply

        print("Before gradients:", self.transformer["layers"][0]["weights"]["attention"]["heads"][0]["query"][0][0])

        embedding_gradients = self.accumulated_embedding_grads
        layer_gradients = self.accumulated_layer_grads
        vocab_proj_weight_gradients = self.accumulated_vocab_grads["weights"]
        vocab_proj_bias_gradients = self.accumulated_vocab_grads["biases"]

        warmup_steps = 100
        decay_factor = 0.25
        base_lr = self.learningRate
        min_lr = 0.0005

        if optimizer == "adam":
            self.adam_params["t"] += 1
        self.step_num += 1

        if self.step_num < warmup_steps:
            lr = base_lr * (self.step_num / warmup_steps)
        else:
            lr = base_lr * (warmup_steps ** 0.5) * ((self.step_num * decay_factor) ** -0.5)
        lr = max(min_lr, lr)

        weight_decay = 1e-5 if config["antiOverfittingOptimisations"] else 0
        momentum_factor = 0.5

        if optimizer == "sgd_momentum" and not hasattr(self, "momentum_initialized"):
            print("Initializing momentum for first use")
            self.momentum_initialized = True

        vocab_indices = {}

        for batch in range(len(self.accumulated_token_inputs)):
            batch_tokens = self.accumulated_token_inputs[batch]

            for token_idx in range(len(batch_tokens)):
                token = batch_tokens[token_idx][0]
                token_id = batch_tokens[token_idx][1]

                vocab_idx = next((i for i, (_, id_) in enumerate(self.vocab) if id_ == token_id), -1)

                if vocab_idx != -1:
                    vocab_indices[vocab_idx] = True
                    for pos in range(self.embeddingSize):
                        grad = embedding_gradients[token_idx][pos]
                        param = self.transformer["embeddings"][vocab_idx][pos]
                        grad_value = grad if isinstance(grad, (int, float)) else (grad[0] if isinstance(grad, list) else 0)
                        grad_value += weight_decay * param[0]

                        if optimizer == "adam":
                            param[1] = self.adam_params["beta1"] * param[1] + (1 - self.adam_params["beta1"]) * grad_value
                            param[2] = self.adam_params["beta2"] * param[2] + (1 - self.adam_params["beta2"]) * (grad_value ** 2)
                            m_hat = param[1] / (1 - (self.adam_params["beta1"] ** self.adam_params["t"]))
                            v_hat = param[2] / (1 - (self.adam_params["beta2"] ** self.adam_params["t"]))
                            param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params["epsilon"])
                        elif optimizer == "sgd_momentum":
                            param[1] = momentum_factor * param[1] + grad_value
                            param[0] -= lr * param[1]
                        else:
                            param[0] -= lr * grad_value

        for layer_idx in range(self.layersAmount):
            layer = self.transformer["layers"][layer_idx]
            layer_grad = layer_gradients[layer_idx]

            for param_type in ["weights", "biases"]:
                self.updateParamArray(layer[param_type]["normalize_1"], layer_grad[param_type]["normalize_1"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")
                self.updateParamArray(layer[param_type]["normalize_2"], layer_grad[param_type]["normalize_2"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")

                for head_idx in range(self.heads):
                    self.updateParamArray(layer[param_type]["attention"]["heads"][head_idx]["query"], layer_grad[param_type]["attention"]["heads"][head_idx]["query"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")
                    self.updateParamArray(layer[param_type]["attention"]["heads"][head_idx]["key"], layer_grad[param_type]["attention"]["heads"][head_idx]["key"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")
                    self.updateParamArray(layer[param_type]["attention"]["heads"][head_idx]["value"], layer_grad[param_type]["attention"]["heads"][head_idx]["value"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")

                self.updateParamArray(layer[param_type]["attention"]["output"], layer_grad[param_type]["attention"]["output"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")
                self.updateParamArray(layer[param_type]["feed_forward"]["grow"], layer_grad[param_type]["feed_forward"]["grow"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")
                self.updateParamArray(layer[param_type]["feed_forward"]["shrink"], layer_grad[param_type]["feed_forward"]["shrink"], optimizer, lr, weight_decay, momentum_factor, param_type == "weights")

        self.updateParamArray(self.transformer["vocab_projection"]["weights"], vocab_proj_weight_gradients, optimizer, lr, weight_decay, momentum_factor, True)
        self.updateParamArray(self.transformer["vocab_projection"]["biases"], vocab_proj_bias_gradients, optimizer, lr, weight_decay, momentum_factor, False)

        self.accumulated_embedding_grads = None
        self.accumulated_layer_grads = None
        self.accumulated_vocab_grads = None
        self.accumulated_token_inputs = None

        print("After gradients:", self.transformer["layers"][0]["weights"]["attention"]["heads"][0]["query"][0][0])
        print("Accumulated gradient:", layer_gradients[0]["weights"]["attention"]["heads"][0]["query"][0][0])
        ndprint("Microbatch gradients applied.")

    def train_step(self, input_tokens, target_token, optimizer="sgd", training_mode=True, accumulate=False):
        if optimizer is None:
            optimizer = "sgd"
        if training_mode is None:
            training_mode = True
        ndprint("Starting training step...")
        gtimer = timer_()

        def compute_global_norm(embedding_grads, layer_grads):
            squared_sum = 0.0
            for i in range(len(embedding_grads)):
                for j in range(len(embedding_grads[i])):
                    val = embedding_grads[i][j]
                    squared_sum += val * val
            def add_squared_grads(grad_struct):
                nonlocal squared_sum
                if isinstance(grad_struct, list):
                    if len(grad_struct) > 0 and isinstance(grad_struct[0], (int, float)):
                        val = grad_struct[0]
                        squared_sum += val * val
                    return
                elif isinstance(grad_struct, dict):
                    for key in grad_struct:
                        add_squared_grads(grad_struct[key])
            for layer_idx in range(len(layer_grads)):
                add_squared_grads(layer_grads[layer_idx])
            return squared_sum ** 0.5

        print("Running inference to get cache...")
        timer_inf = timer_()
        input_text = ""
        for i in range(len(input_tokens)):
            input_text += input_tokens[i][0]
        inference_result = self.inference(input_text, True, training_mode)
        cache = inference_result[1]
        print("Got inference cache in", timer_end(timer_inf), "ms")

        print("Calculating initial loss...")
        timer_inf = timer_()
        initial_loss = self.calculate_loss(cache["vocab_scores"], target_token[1])
        print("Initial loss:", initial_loss, "calculated in", timer_end(timer_inf), "ms")

        print("Calculating learning rate...")
        timer_inf = timer_()
        if optimizer == "adam":
            self.adam_params["t"] += 1
        self.step_num += 1
        warmup_steps = 100
        decay_factor = 0.25
        base_lr = self.learningRate
        min_lr = 0.0005
        if self.step_num < warmup_steps:
            lr = base_lr * (self.step_num / warmup_steps)
        else:
            lr = base_lr * (warmup_steps ** 0.5) * ((self.step_num * decay_factor) ** -0.5)
        cycle_length = 50
        cycle_position = self.step_num % cycle_length
        cycle_ratio = cycle_position / cycle_length
        cycle_factor = 1.0
        lr *= cycle_factor
        lr = max(min_lr, lr)
        print("Learning rate:", lr, ", cyclical factor:", round(cycle_factor, 4), "calculated in", timer_end(timer_inf), "ms")

        print("Computing gradients...")
        gtimer2 = timer_()
        predicted_probs = self.softmax(cache["vocab_scores"])
        epsilon_grad = 0
        vocab_size = len(self.vocab)
        target_distribution = [epsilon_grad / (vocab_size - 1) for _ in range(vocab_size)]
        target_idx = next((i for i, v in enumerate(self.vocab) if v[1] == target_token[1]), None)
        if target_idx is None:
            print("Warning: Token ID", target_token[1], "not found in vocabulary")
            target_idx = 0
        target_distribution[target_idx] = 1.0 - epsilon_grad
        initial_error = [predicted_probs[i] - target_distribution[i] for i in range(len(predicted_probs))]

        print("Computing gradients for vocabulary projection parameters...")
        vocab_proj_weight_gradients = [[0, 0, 0] for _ in self.transformer["vocab_projection"]["weights"]]
        vocab_proj_bias_gradients = [[0, 0, 0] for _ in self.transformer["vocab_projection"]["biases"]]
        for vocab_idx in range(vocab_size):
            error_val = initial_error[vocab_idx]
            for embed_idx in range(self.embeddingSize):
                weight_idx = vocab_idx * self.embeddingSize + embed_idx
                gradient = error_val * cache["layers"][-1]["feed_forward"]["final"][-1][embed_idx]
                vocab_proj_weight_gradients[weight_idx][0] = gradient
            vocab_proj_bias_gradients[vocab_idx][0] = error_val

        error_gradients = [[0.0 for _ in range(self.embeddingSize)] for _ in input_tokens]
        for j in range(self.embeddingSize):
            for k in range(vocab_size):
                error_gradients[-1][j] += initial_error[k] * self.transformer["vocab_projection"]["weights"][k * self.embeddingSize + j][0]

        embedding_gradients = [[0 for _ in range(self.embeddingSize)] for _ in input_tokens]
        layer_gradients = []
        for i in range(self.layersAmount):
            layer_gradients.append({
                "weights": self.initialize_zero_gradients(self.transformer["layers"][i]["weights"]),
                "biases": self.initialize_zero_gradients(self.transformer["layers"][i]["biases"]),
            })

        next_grad = error_gradients
        for layer_idx in reversed(range(self.layersAmount)):
            layer_cache = cache["layers"][layer_idx]
            ff_out_grad = [list(grad) for grad in next_grad]
            shrink_grad = [[0.0 for _ in range(self.embeddingSize * 4)] for _ in input_tokens]
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * 4):
                        if layer_cache["feed_forward"]["after_relu"][i][k] > 0:
                            shrink_grad[i][k] += ff_out_grad[i][j] * self.transformer["layers"][layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0]
                            layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0] += ff_out_grad[i][j] * layer_cache["feed_forward"]["after_relu"][i][k]
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j][0] += ff_out_grad[i][j]

            att_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in input_tokens]
            for head in range(self.heads):
                head_cache = layer_cache["heads"][head]
                q_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in input_tokens]
                k_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in input_tokens]
                v_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in input_tokens]
                attention_grad = [[0.0 for _ in range(len(input_tokens))] for _ in input_tokens]

                for i in range(len(input_tokens)):
                    for j in range(len(input_tokens)):
                        score_grad = head_cache["attention_probs"][i][j] * (1 - head_cache["attention_probs"][i][j])
                        attention_grad[i][j] = score_grad / (self.embeddingSize ** 0.5)
                        for k in range(self.embeddingSize):
                            q_grad[i][k] += attention_grad[i][j] * head_cache["k_vectors"][j][k]
                            k_grad[j][k] += attention_grad[i][j] * head_cache["q_vectors"][i][k]
                        for k in range(self.embeddingSize):
                            v_grad[j][k] += head_cache["attention_probs"][i][j] * next_grad[i][k]

                for i in range(len(input_tokens)):
                    for j in range(self.embeddingSize):
                        for k in range(self.embeddingSize):
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["query"][j * self.embeddingSize + k][0] += q_grad[i][j] * layer_cache["normalized"][i][k]
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["key"][j * self.embeddingSize + k][0] += k_grad[i][j] * layer_cache["normalized"][i][k]
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["value"][j * self.embeddingSize + k][0] += v_grad[i][j] * layer_cache["normalized"][i][k]
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["query"][j][0] += q_grad[i][j]
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["key"][j][0] += k_grad[i][j]
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["value"][j][0] += v_grad[i][j]

                for i in range(len(input_tokens)):
                    for j in range(self.embeddingSize):
                        for k in range(len(input_tokens)):
                            att_grad[i][j] += head_cache["attention_probs"][i][k] * v_grad[k][j]

            for i in range(len(input_tokens)):
                concatenated = []
                for head_idx in range(self.heads):
                    concatenated.extend(layer_cache["heads"][head_idx]["output"][i])
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * self.heads):
                        layer_gradients[layer_idx]["weights"]["attention"]["output"][j * (self.embeddingSize * self.heads) + k][0] += next_grad[i][j] * concatenated[k]
                    layer_gradients[layer_idx]["biases"]["attention"]["output"][j][0] += next_grad[i][j]

            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_2"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_2"][j][0] += next_grad[i][j]
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_1"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_1"][j][0] += next_grad[i][j]

            new_next_grad = []
            for i in range(len(input_tokens)):
                arr = []
                for j in range(self.embeddingSize):
                    arr.append(att_grad[i][j])
                new_next_grad.append(arr)

            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    embedding_gradients[i][j] += new_next_grad[i][j]
            next_grad = new_next_grad

        print("Computed gradients in", timer_end(gtimer2), "ms")
        print("Applying continuous gradient scaling...")
        timer_inf = timer_()
        gamma = 5.0
        global_grad_norm = compute_global_norm(embedding_gradients, layer_gradients)
        print("Global gradient norm:", round(global_grad_norm, 6))
        if global_grad_norm == 0:
            scaling_factor = 1.0
        else:
            scaling_factor = math.tanh(global_grad_norm / gamma) / (global_grad_norm / gamma)
        print("Scaling gradients with factor", round(scaling_factor, 6))

        for i in range(len(embedding_gradients)):
            for j in range(len(embedding_gradients[i])):
                embedding_gradients[i][j] *= scaling_factor

        def scale_gradients(grad_struct, factor):
            if isinstance(grad_struct, list):
                if len(grad_struct) > 0 and isinstance(grad_struct[0], (int, float)):
                    grad_struct[0] *= factor
                return
            elif isinstance(grad_struct, dict):
                for key in grad_struct:
                    scale_gradients(grad_struct[key], factor)

        for layer_idx in range(len(layer_gradients)):
            scale_gradients(layer_gradients[layer_idx], scaling_factor)

        print("Applied continuous gradient scaling in", timer_end(timer_inf), "ms")

        if accumulate:
            if self.accumulated_embedding_grads is None:
                self.accumulated_embedding_grads = embedding_gradients
                self.accumulated_layer_grads = layer_gradients
                self.accumulated_vocab_grads = {
                    "weights": vocab_proj_weight_gradients,
                    "biases": vocab_proj_bias_gradients
                }
                self.accumulated_token_inputs = [input_tokens]
            else:
                self.add_in_place(self.accumulated_embedding_grads, embedding_gradients)
                self.add_in_place(self.accumulated_layer_grads, layer_gradients)
                self.add_in_place(self.accumulated_vocab_grads["weights"], vocab_proj_weight_gradients)
                self.add_in_place(self.accumulated_vocab_grads["biases"], vocab_proj_bias_gradients)
                self.accumulated_token_inputs.append(input_tokens)
            ndprint("Gradients accumulated, delaying parameter update.")
            return initial_loss

        # Update parameters section (this part is executed when not accumulating)
        print("Updating parameters...")
        timer_inf = timer_()
        print("Using", optimizer, "optimizer...")
        weight_decay = 0
        if config["antiOverfittingOptimisations"]:
            weight_decay = 1e-5
        momentum_factor = 0.5
        if optimizer == "sgd_momentum" and not hasattr(self, "momentum_initialized"):
            print("Initializing momentum for first use")
            self.momentum_initialized = True

        vocab_indices = {}
        for token_idx in range(len(input_tokens)):
            token = input_tokens[token_idx][0]
            token_id = input_tokens[token_idx][1]
            vocab_idx = next((i for i, (_, id_) in enumerate(self.vocab) if id_ == token_id), None)
            if vocab_idx is not None:
                vocab_indices[vocab_idx] = True
                for pos in range(self.embeddingSize):
                    grad = embedding_gradients[token_idx][pos]
                    param = self.transformer["embeddings"][vocab_idx][pos]
                    grad_value = grad if isinstance(grad, (int, float)) else (grad[0] if isinstance(grad, list) else 0)
                    grad_value += weight_decay * param[0]
                    if optimizer == "adam":
                        param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                        param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                        m_hat = param[1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                        v_hat = param[2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                        param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
                    elif optimizer == "sgd_momentum":
                        param[1] = momentum_factor * param[1] + grad_value
                        param[0] -= lr * param[1]
                    else:
                        param[0] -= lr * grad_value

        for layer_idx in range(self.layersAmount):
            layer = self.transformer["layers"][layer_idx]
            layer_grad = layer_gradients[layer_idx]
            
            for param_type in layer:
                if param_type in layer:
                    for key in layer[param_type]:
                        if isinstance(layer[param_type][key], list):
                            for i in range(len(layer[param_type][key])):
                                grad = layer_grad[param_type][key][i]
                                param = layer[param_type][key][i]
                                grad_value = grad[0] if isinstance(grad, list) else grad
                                if param_type == "weights":
                                    grad_value += weight_decay * param[0]
                                if optimizer == "adam":
                                    param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                                    param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                    m_hat = param[1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                                    v_hat = param[2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                                    param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
                                elif optimizer == "sgd_momentum":
                                    param[1] = momentum_factor * param[1] + grad_value
                                    param[0] -= lr * param[1]
                                else:
                                    param[0] -= lr * grad_value
                        elif isinstance(layer[param_type][key], dict):
                            for subkey in layer[param_type][key]:
                                if subkey == "heads":
                                    for head_idx in range(self.heads):
                                        for head_key in ["query", "key", "value"]:
                                            head_params = layer[param_type][key]["heads"][head_idx][head_key]
                                            head_grads = layer_grad[param_type][key]["heads"][head_idx][head_key]
                                            for i in range(len(head_params)):
                                                if isinstance(head_params[i], list) and len(head_params[i]) >= 3:
                                                    grad_value = head_grads[i][0] if isinstance(head_grads[i], list) else head_grads[i]
                                                    if param_type == "weights":
                                                        grad_value += weight_decay * head_params[i][0]
                                                    if optimizer == "adam":
                                                        head_params[i][1] = self.adam_params['beta1'] * head_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                                        head_params[i][2] = self.adam_params['beta2'] * head_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                                        m_hat = head_params[i][1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                                                        v_hat = head_params[i][2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                                                        head_params[i][0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
                                                    elif optimizer == "sgd_momentum":
                                                        head_params[i][1] = momentum_factor * head_params[i][1] + grad_value
                                                        head_params[i][0] -= lr * head_params[i][1]
                                                    else:
                                                        head_params[i][0] -= lr * grad_value
                                else:
                                    nested_params = layer[param_type][key][subkey]
                                    nested_grads = layer_grad[param_type][key][subkey]
                                    if isinstance(nested_params, list) and isinstance(nested_grads, list):
                                        for i in range(len(nested_params)):
                                            if isinstance(nested_params[i], list) and len(nested_params[i]) >= 3:
                                                grad_value = nested_grads[i][0] if isinstance(nested_grads[i], list) else nested_grads[i]
                                                if param_type == "weights":
                                                    grad_value += weight_decay * nested_params[i][0]
                                                if optimizer == "adam":
                                                    nested_params[i][1] = self.adam_params['beta1'] * nested_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                                    nested_params[i][2] = self.adam_params['beta2'] * nested_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                                    m_hat = nested_params[i][1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                                                    v_hat = nested_params[i][2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                                                    nested_params[i][0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
                                                elif optimizer == "sgd_momentum":
                                                    nested_params[i][1] = momentum_factor * nested_params[i][1] + grad_value
                                                    nested_params[i][0] -= lr * nested_params[i][1]
                                                else:
                                                    nested_params[i][0] -= lr * grad_value

        print("Updating vocabulary projection parameters...")
        for i in range(len(self.transformer["vocab_projection"]["weights"])):
            param = self.transformer["vocab_projection"]["weights"][i]
            grad_value = vocab_proj_weight_gradients[i][0]
            grad_value += weight_decay * param[0]
            if optimizer == "adam":
                param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                m_hat = param[1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                v_hat = param[2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
            elif optimizer == "sgd_momentum":
                param[1] = momentum_factor * param[1] + grad_value
                param[0] -= lr * param[1]
            else:
                param[0] -= lr * grad_value

        for i in range(len(self.transformer["vocab_projection"]["biases"])):
            param = self.transformer["vocab_projection"]["biases"][i]
            grad_value = vocab_proj_bias_gradients[i][0]
            if optimizer == "adam":
                param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                m_hat = param[1] / (1 - (self.adam_params['beta1'] ** self.adam_params['t']))
                v_hat = param[2] / (1 - (self.adam_params['beta2'] ** self.adam_params['t']))
                param[0] -= lr * m_hat / (v_hat ** 0.5 + self.adam_params['epsilon'])
            elif optimizer == "sgd_momentum":
                param[1] = momentum_factor * param[1] + grad_value
                param[0] -= lr * param[1]
            else:
                param[0] -= lr * grad_value

        print("Updated parameters in", timer_end(timer_inf), "ms")
        
        param_to_check = self.transformer["embeddings"][0][0]
        if optimizer == "adam":
            print("Sample Adam values: momentum=", param_to_check[1], ", velocity=", param_to_check[2])
            self.check_adam_state()
        elif optimizer == "sgd_momentum":
            print("Sample momentum value:", param_to_check[1])
        else:
            print("Using SGD - no momentum/velocity values to report")
        
        ndprint("Training step completed in", timer_end(gtimer), "ms")
        return initial_loss
    
    def check_adam_state(self):
        """Print the state of some parameters to verify Adam is working"""
        print(f"Adam step count: {self.adam_params['t']}")
        
        # Check a parameter from different parts of the model
        params = [
            self.transformer["embeddings"][0][0],
            self.transformer["layers"][0]["weights"]["normalize_1"][0],
            self.transformer["vocab_projection"]["weights"][0]
        ]
        
        for i, param in enumerate(params):
            print(f"Parameter {i}: value={param[0]}, momentum={param[1]}, velocity={param[2]}")
    
    def train(self, dataset, epochs=1, optimizer="sgd"):
        """
        Train the model for the specified number of epochs using the specified optimizer.
        
        Args:
            epochs: Number of epochs to train for
            optimizer: Which optimizer to use - "sgd", "sgd_momentum", or "adam"
        """
        subtimer = timer_()
        ndprint("Preprocessing dataset...")
        print("Loading dataset...")
        timer = timer_()
        
        try:
            dataset = json.loads(open(dataset).read())
            print("Dataset loaded in", timer_end(timer), "ms")
        except Exception as e:
            print(f"Failed to load dataset: {e}")
            raise Exception(f"Failed to load dataset: {e}")
        print("Contextizing dataset...")
        timer = timer_()
        contexted_dataset = []
        response_token_masks = []  # For tracking which tokens are response tokens

        # Find end token
        end_token = None
        for token in self.vocab:
            if token[1] == 100257:
                end_token = token[0]
                break

        for item in dataset:
            # Get all input/output pairs from the item
            user_inputs = item["inputs"]
            assistant_outputs = item["outputs"]
            
            # Make sure both lists have the same length
            if len(user_inputs) != len(assistant_outputs):
                print(f"Warning: inputs and outputs counts don't match in item")
                continue
            
            # Full context string for this item
            full_context = ""
            # Mask to track which tokens are part of assistant responses (for training)
            token_mask = []
            
            # Process each conversation turn
            for i, (user_text, assistant_text) in enumerate(zip(user_inputs, assistant_outputs)):
                # Format user part
                user_part = f"user:\n{user_text}\n"
                user_tokens = self.tokenize(user_part)
                full_context += user_part
                # We don't train on predicting user tokens
                token_mask.extend([False] * len(user_tokens))
                
                # Format system marker and assistant part
                system_marker = "you:\n"
                system_tokens = self.tokenize(system_marker)
                full_context += system_marker
                # We don't train on predicting system marker tokens
                token_mask.extend([False] * len(system_tokens))
                
                # Add assistant response with end token
                assistant_part = assistant_text + end_token
                assistant_tokens = self.tokenize(assistant_part)
                full_context += assistant_part
                # We train on predicting ALL assistant tokens INCLUDING the end token
                token_mask.extend([True] * len(assistant_tokens))
                
                # Only add a newline after the assistant response if it's not the last turn
                if i < len(user_inputs) - 1:
                    full_context += "\n"
                    # We don't train on predicting newline tokens
                    token_mask.extend([False])
            
            # Add the fully formatted conversation to the dataset
            contexted_dataset.append(full_context)
            response_token_masks.append(token_mask)
                    
        print("Contextized dataset in", timer_end(timer), "ms")

        print("Tokenizing contexted dataset...")
        timer = timer_()
        tokenized_dataset = []
        for i, item in enumerate(contexted_dataset):
            tokenized_dataset.append(self.tokenize(item))
            
            # Verify that our masks match the expected token count
            expected_tokens = len(tokenized_dataset[-1]) - 1  # -1 because we predict next tokens
            if len(response_token_masks[i]) != expected_tokens:
                print(f"Warning: Token mask length mismatch for item {i}.")
                print(f"  Expected {expected_tokens} mask entries but got {len(response_token_masks[i])}")
                
                # Adjust the mask if needed to avoid errors
                if len(response_token_masks[i]) < expected_tokens:
                    # Extend with False (don't train on extra tokens)
                    response_token_masks[i].extend([False] * (expected_tokens - len(response_token_masks[i])))
                else:
                    # Truncate if too long
                    response_token_masks[i] = response_token_masks[i][:expected_tokens]
                
        print("Tokenized contexted dataset in", timer_end(timer), "ms")
        ndprint("Preprocessed dataset in " + str(timer_end(subtimer)) + "ms")
        import threading
        import time
        
        if optimizer not in ["sgd", "sgd_momentum", "adam"]:
            ndprint(f"Unknown optimizer: {optimizer}, falling back to SGD")
            optimizer = "sgd"
        
        ndprint(f"\n{'='*40}\nStarting training with {optimizer} optimizer\n{'='*40}\n")
        sgtimer = timer_()
        
        # Initialize loss tracking
        best_loss = float('inf')
        epoch_losses = []
        continue_training = True
        loss_history = []
        loss_window_size = 10
        
        # For detecting plateaus
        plateau_patience = 5
        plateau_counter = 0
        last_best_loss = float('inf')
        
        # Define sweet spot range
        sweet_spot_min = 0
        sweet_spot_max = 5.0
        last_saved_sweet_spot_loss = float('inf')  # Track last saved loss
        
        for epoch in range(epochs):
            if not continue_training:
                ndprint(f"Training stopped at epoch {epoch}/{epochs}")
                break
            
            # Add the separator for each epoch
            ndprint("\n" + "-"*60)
            ndprint(f"Epoch {epoch + 1}/{epochs}")
            ndprint("-"*60 + "\n")
                
            # Calculate total IO pairs in the dataset (only response tokens)
            total_io_pairs = 0
            for i, tokens in enumerate(tokenized_dataset):
                token_mask = response_token_masks[i]
                total_io_pairs += sum(token_mask)
            
            processed_io_pairs = 0

            timer = timer_()
            ndprint("Starting epoch", epoch + 1)

            # Track losses for this epoch
            batch_losses = []

            for i in range(len(tokenized_dataset)):
                stimer = timer_()
                print("Training on item", i + 1, "/", len(tokenized_dataset))
                tokens = tokenized_dataset[i]
                token_mask = response_token_masks[i]
                
                # Track dataset loss for the current item
                dataset_total_loss = 0.0
                sequence_positions = 0
                
                input_text = ""
                
                for j in range(len(tokens) - 1):
                    input_tokens = tokens[:j+1]
                    target_token = tokens[j+1]
                    
                    # Check if we should train on this token
                    if j < len(token_mask) and token_mask[j]:
                        # This is a response token we should train on
                        loss = self.train_step(input_tokens, target_token, optimizer, training_mode=True)
                        
                        dataset_total_loss += loss
                        sequence_positions += 1
                        
                        processed_io_pairs += 1
                        
                        # Compute progress for the current IO pair within the current item
                        # Count only the response tokens
                        response_tokens_in_item = sum(token_mask)
                        current_position_in_responses = sum(token_mask[:j+1])
                        current_item_progress = (current_position_in_responses / response_tokens_in_item) * 100
                        
                        # Compute overall progress across all IO pairs in the dataset
                        overall_progress = (processed_io_pairs / total_io_pairs) * 100
                        
                        ndprint(f"Loss: {loss:.4f} (Response token {current_position_in_responses}/{response_tokens_in_item}) | " +
                              f"Current item progress: {current_item_progress:.2f}% | " +
                              f"Overall progress: {overall_progress:.2f}%", flush=True)
                    else:
                        # For non-response tokens, just run inference without training
                        # This advances the context without updating weights
                        # We actually don't need to run inference since train_step will
                        # do a forward pass anyway for the next response token
                        pass
                
                # Skip items where we didn't train on any tokens
                if sequence_positions > 0:
                    # Calculate average loss for this dataset item
                    avg_item_loss = dataset_total_loss / sequence_positions
                    batch_losses.append(avg_item_loss)
                    ndprint(f"Average loss for item {i+1}: {avg_item_loss:.4f}")
                    
                ndprint("Trained on item", i + 1, "in", timer_end(stimer), "ms")
                
            # Calculate epoch average loss
            if len(batch_losses) > 0:  # Check that we had some valid batches
                avg_epoch_loss = sum(batch_losses) / len(batch_losses)
                epoch_losses.append(avg_epoch_loss)
                loss_history.append(avg_epoch_loss)
                ndprint(f"Epoch {epoch + 1} average loss: {avg_epoch_loss:.6f}")
                
                # Check for plateaus
                if len(loss_history) >= loss_window_size:
                    avg_recent_loss = sum(loss_history[-loss_window_size:]) / loss_window_size
                    ndprint(f"Average loss over last {loss_window_size} epochs: {avg_recent_loss:.6f}")
                    
                    # Check for plateaus
                    if best_loss == last_best_loss:
                        plateau_counter += 1
                        if plateau_counter >= plateau_patience:
                            ndprint(f"Warning: Training appears to be plateauing for {plateau_counter} epochs")
                    else:
                        plateau_counter = 0
                        last_best_loss = best_loss
                
                # Check if new best loss - if so, we'll prompt for testing
                is_best_loss = avg_epoch_loss < best_loss
                
                # Auto-save when in sweet spot with significant progress
                in_sweet_spot = sweet_spot_min <= avg_epoch_loss <= sweet_spot_max
                first_time_in_sweet_spot = in_sweet_spot and last_saved_sweet_spot_loss == float('inf')
                significant_progress = in_sweet_spot and (last_saved_sweet_spot_loss - avg_epoch_loss >= 0.5)
                
                if first_time_in_sweet_spot or significant_progress:
                    # Format loss with 2 decimal places for filename
                    loss_str = f"{avg_epoch_loss:.2f}"
                    save_path = f"model_{epoch+1}_{loss_str}_{optimizer}_sweetspot.json"
                    
                    if first_time_in_sweet_spot:
                        ndprint("\n" + "-"*60)
                        ndprint(f"REACHED SWEET SPOT LOSS! Auto-saving model")
                        ndprint("-"*60 + "\n")
                    else:
                        ndprint("\n" + "-"*60)
                        ndprint(f"SIGNIFICANT IMPROVEMENT IN SWEET SPOT! Auto-saving model")
                        ndprint(f"Previous saved: {last_saved_sweet_spot_loss:.2f}, Current: {avg_epoch_loss:.2f}")
                        ndprint("-"*60 + "\n")
                    
                    try:
                        self.save(save_path)
                        ndprint(f"Sweet spot model saved to {save_path}")
                        last_saved_sweet_spot_loss = avg_epoch_loss  # Update last saved loss
                    except Exception as e:
                        ndprint(f"Error saving sweet spot model: {e}")
                
                # Update best loss if needed
                if is_best_loss:
                    # If best_loss isn't infinity, report the previous best loss
                    if best_loss != float('inf'):
                        ndprint("\n" + "-"*60)
                        ndprint(f"NEW BEST LOSS ACHIEVED! Previous best loss was: {best_loss:.6f}")
                        ndprint("-"*60 + "\n")
                    else:
                        ndprint("\n" + "-"*60)
                        ndprint("NEW BEST LOSS ACHIEVED!")
                        ndprint("-"*60 + "\n")
                    
                    best_loss = avg_epoch_loss  # Update best_loss
                    ndprint(f"New best loss: {best_loss:.6f}! Let's test the model:")
                
                # Allow testing after each epoch completion (if not already prompting for best loss)
                should_prompt = not is_best_loss  # Only prompt if we're not already prompting for best loss
                
                # Prompt testing interface (used for both best loss and end of epoch)
                if is_best_loss or should_prompt:
                    result = self.interactive_test_loop(epoch, avg_epoch_loss, optimizer)
                    if result == "STOP_TRAINING":
                        break
                    else:
                        optimizer = result
                    
            ndprint("Epoch", epoch + 1, "completed in", timer_end(timer), "ms")
        
        ndprint(f"\n{'='*40}\nTraining completed after {len(epoch_losses)} epochs\nFinal loss: {epoch_losses[-1]:.6f}\nBest loss: {best_loss:.6f}\n{'='*40}\n")
        ndprint("Time elapsed: " + str(timer_end(sgtimer)) + "ms")
        return best_loss

    def pretrain(self, text_files, epochs=1, optimizer="sgd"):
        """
        Pretrain the model using raw text files, training on next-token prediction.

        Args:
            text_files: List of file paths (strings) to use for pretraining.
            epochs: Number of passes over the dataset
            optimizer: Optimizer to use - "sgd", "sgd_momentum", or "adam"
        """
        ndprint(f"\n{'='*40}\nStarting pretraining with {optimizer} optimizer\n{'='*40}\n")
        sgtimer = timer_()

        if optimizer not in ["sgd", "sgd_momentum", "adam"]:
            print(f"Unknown optimizer: {optimizer}, falling back to SGD")
            optimizer = "sgd"

        best_loss = float('inf')
        last_saved_sweet_spot_loss = float('inf')
        sweet_spot_min = 0.0
        sweet_spot_max = 5.0

        plateau_patience = 5
        plateau_counter = 0
        loss_window_size = 10
        last_best_loss = float('inf')
        loss_history = []

        max_tokens_per_file = 10_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000

        for epoch in range(epochs):
            ndprint("\n" + "-"*60)
            ndprint(f"Epoch {epoch + 1}/{epochs}")
            ndprint("-"*60 + "\n")

            context = []
            epoch_losses = []

            file_states = []
            for file_path in text_files:
                file_states.append({
                    "path": file_path,
                    "loaded": False,
                    "tokens": []
                })

            file_index = 0
            token_index = 0

            while file_index < len(file_states):
                state = file_states[file_index]
                if not state["loaded"]:
                    try:
                        with open(state["path"], "r", encoding="utf-8") as f:
                            text = f.read()
                        tokens = self.tokenize(text)
                        state["tokens"] = tokens
                        state["loaded"] = True
                        ndprint(f"[Info] Loaded and tokenized {state['path']} ({len(tokens)} tokens)")
                    except Exception as e:
                        ndprint(f"[Error] Could not read {state['path']}: {e}")
                        file_index += 1
                        continue

                tokens = state["tokens"]
                microbatch = []

                while token_index + self.contextSize < len(tokens):
                    input_tokens = tokens[token_index : token_index + self.contextSize]
                    target_token = tokens[token_index + self.contextSize]
                    
                    microbatch.append((input_tokens, target_token))

                    if len(microbatch) == config["microbatchSize"]:
                        # Accumulate gradients for all samples
                        total_loss = 0.0
                        for input_tokens, target_token in microbatch:
                            loss = self.train_step(input_tokens, target_token, optimizer, training_mode=True, accumulate=True)
                            total_loss += loss

                        # Apply update once
                        self.apply_gradients(optimizer)
                        
                        avg_loss = total_loss / config["microbatchSize"]
                        epoch_losses.append(avg_loss)
                        ndprint(f"Microbatch loss: {avg_loss:.4f}")
                        
                        # Clear the microbatch
                        microbatch = []

                    token_index += self.contextSize

                # FIXED: Process any remaining samples in the last microbatch
                if microbatch:  # Non-empty check
                    # Process remaining samples
                    total_loss = 0.0
                    for input_tokens, target_token in microbatch:
                        loss = self.train_step(input_tokens, target_token, optimizer, training_mode=True, accumulate=True)
                        total_loss += loss

                    # Apply accumulated gradients
                    self.apply_gradients(optimizer)
                    
                    avg_loss = total_loss / len(microbatch)
                    epoch_losses.append(avg_loss)
                    ndprint(f"Final partial microbatch loss: {avg_loss:.4f}")
                    microbatch = []

                file_index += 1
                token_index = 0

                for i in range(len(file_states)):
                    if file_states[i]["loaded"]:
                        # Compute global position of current token
                        current_position = sum(len(file_states[j]["tokens"]) for j in range(file_index)) + token_index

                        # Compute end position of this file
                        file_end_position = sum(len(file_states[j]["tokens"]) for j in range(i + 1))

                        # If the file has been fully passed by the sliding window
                        if file_end_position < current_position - self.contextSize:
                            print(f"[Info] Unloading {file_states[i]['path']} from memory")
                            file_states[i]["loaded"] = False
                            file_states[i]["tokens"] = []

            if epoch_losses:
                avg_loss = sum(epoch_losses) / len(epoch_losses)
                ndprint(f"[Epoch {epoch + 1}] Average loss: {avg_loss:.6f}")

                loss_history.append(avg_loss)
                if len(loss_history) >= loss_window_size:
                    avg_recent_loss = sum(loss_history[-loss_window_size:]) / loss_window_size
                    ndprint(f"Average loss over last {loss_window_size} epochs: {avg_recent_loss:.6f}")

                    if best_loss == last_best_loss:
                        plateau_counter += 1
                        if plateau_counter >= plateau_patience:
                            ndprint(f"Warning: Pretraining appears to be plateauing for {plateau_counter} epochs")
                    else:
                        plateau_counter = 0
                        last_best_loss = best_loss

                in_sweet_spot = sweet_spot_min <= avg_loss <= sweet_spot_max
                first_time = in_sweet_spot and last_saved_sweet_spot_loss == float('inf')
                improved = in_sweet_spot and (last_saved_sweet_spot_loss - avg_loss >= 0.5)

                if first_time or improved:
                    loss_str = f"{avg_loss:.2f}"
                    save_path = f"pretrained_{epoch+1}_{loss_str}_{optimizer}_sweetspot.json"

                    if first_time:
                        ndprint("\n" + "-"*60)
                        ndprint("REACHED SWEET SPOT LOSS! Auto-saving model")
                        ndprint("-"*60 + "\n")
                    else:
                        ndprint("\n" + "-"*60)
                        ndprint("SIGNIFICANT IMPROVEMENT IN SWEET SPOT! Auto-saving model")
                        ndprint(f"Previous saved: {last_saved_sweet_spot_loss:.2f}, Current: {avg_loss:.2f}")
                        ndprint("-"*60 + "\n")

                    try:
                        self.save(save_path)
                        ndprint(f"Sweet spot model saved to {save_path}")
                        last_saved_sweet_spot_loss = avg_loss
                    except Exception as e:
                        ndprint(f"[Error] Could not save model: {e}")

                if avg_loss < best_loss:
                    best_loss = avg_loss
                    ndprint(f"\n{'-'*60}\nNEW BEST LOSS: {best_loss:.6f}\n{'-'*60}\n")

            result = self.interactive_test_loop(epoch, avg_loss if epoch_losses else 0.0, optimizer)
            if result == "STOP_TRAINING":
                break
            else:
                optimizer = result

        ndprint(f"\n{'='*40}\nPretraining complete\n{'='*40}\n")
        ndprint("Time elapsed: " + str(timer_end(sgtimer)) + "ms")
    
    def inference(self, context, return_cache, training_mode=False):
        def scale_activation(vector, base_gamma=5.0):
            global printdontprint
            """Dramatically more aggressive scaling for extreme values"""
            norm = math.sqrt(sum(x * x for x in vector))
            if math.isnan(norm):
                ndprint("!!CRITICAL ISSUE!! -- Activation norm is NaN, this will cause training or generating responses to be extremely unstable or not work at all.")
                ndprint("!!CRITICAL ISSUE!! -- Do you wish to exit? (In case you're training or pre-training, your model will not be saved but there's nothing you can do to save it now anyways. In case you're purely running a model, it is corrupted.)")
                while True:
                    result = input("Do you wish to exit? (y/n) ")
                    if result.lower() == "y":
                        ndprint("Exiting...")
                        exit()
                    else:
                        if result.lower() == "n":
                            ndprint("!!CRITICAL ISSUE!! -- Continuing despite NaN activation norm.")
                            break
                        else:
                            ndprint("Invalid input. Please enter 'y' or 'n'.")

            if norm < 1e-10:  # Avoid division by zero
                return vector
            
            # Super aggressive adaptive gamma
            if norm > 1000:
                # For large norms, use much stronger scaling
                # This gives a factor of 1/norm which normalizes the vector to roughly unit length
                target_norm = 5.0  # Target reasonable norm
                scaling_factor = target_norm / norm
                print(f"Extreme scaling: norm={norm:.2e}, factor={scaling_factor:.2e}")
                return [x * scaling_factor for x in vector]
            elif norm > 100:
                # Moderately aggressive for somewhat large norms
                scaling_factor = math.tanh(1.0) / norm * 100
                return [x * scaling_factor for x in vector]
            else:
                # Standard tanh-based scaling for normal ranges
                scaling_factor = math.tanh(norm / base_gamma) / (norm / base_gamma)
                return [x * scaling_factor for x in vector]

        ndprint("Doing inference...")
        sgtimer = timer_()

        tokenized_input = self.tokenize(context)
        input_length = len(tokenized_input)
        if input_length > self.contextSize:
            raise Exception("Input too long")
        
        cache = None
        if return_cache:
            cache = {
                "tokenized": tokenized_input,
                "initial_embeddings": [],
                "positional_encodings": self.calculate_positional_encoding(input_length),
                "layers": []
            }
        else:
            positional_encodings = self.calculate_positional_encoding(input_length)
            
        timer = timer_()
        print("Computing embeddings...")
        
        final_embeddings = []

        # For each token, get its embedding and add positional encoding
        for pos, (token, token_id) in enumerate(tokenized_input):
            # Get embedding and convert to list of values only
            embedding = [x[0] for x in self.get_embedding(token_id)]
            if return_cache:
                cache["initial_embeddings"].append(embedding.copy())
                
            # Add positional encoding element by element
            for i in range(self.embeddingSize):
                embedding[i] += (cache["positional_encodings"] if return_cache else positional_encodings)[pos][i]
                
            final_embeddings.append(embedding)

        print("Computed embeddings in", timer_end(timer), "ms")
        gtimer = timer_()
        print("Computing layers...")

        for layer in range(self.layersAmount):
            timer = timer_()
            print("Computing layer", layer)
            
            if return_cache:
                cache["layers"].append({
                    "heads": [],
                    "combined": None,
                    "normalized": None,
                    "feed_forward": {
                        "bigger": None,
                        "after_relu": None,
                        "final": None
                    }
                })
            
            # CHANGE 1: Apply normalization BEFORE attention
            normalized_embeddings = []
            for i in range(len(final_embeddings)):
                normalized = self.normalize_vector(final_embeddings[i])
                weighted_normalized = []
                for j in range(self.embeddingSize):
                    weighted_value = normalized[j] * self.transformer["layers"][layer]["weights"]["normalize_1"][j][0] + self.transformer["layers"][layer]["biases"]["normalize_1"][j][0]
                    weighted_normalized.append(weighted_value)
                normalized_embeddings.append(weighted_normalized)
            
            if return_cache:
                cache["layers"][layer]["normalized"] = normalized_embeddings.copy()
            
            # Store outputs from each head
            head_outputs = []
            
            for head in range(self.heads):
                head_weights = self.transformer["layers"][layer]["weights"]["attention"]["heads"][head]
                head_biases = self.transformer["layers"][layer]["biases"]["attention"]["heads"][head]

                # Lists to store Q,K,V vectors for each token
                q_vectors = []
                k_vectors = []
                v_vectors = []

                # For each token - CHANGED: use normalized_embeddings here
                for token_embedding in normalized_embeddings:
                    # Calculate Q vector for this token
                    q_vector = []
                    for pos in range(self.embeddingSize):
                        q_sum = 0
                        for j in range(self.embeddingSize):
                            q_sum += token_embedding[j] * head_weights["query"][pos * self.embeddingSize + j][0]
                        q_vector.append(q_sum + head_biases["query"][pos][0])
                    q_vectors.append(q_vector)

                    # Calculate K vector for this token
                    k_vector = []
                    for pos in range(self.embeddingSize):
                        k_sum = 0
                        for j in range(self.embeddingSize):
                            k_sum += token_embedding[j] * head_weights["key"][pos * self.embeddingSize + j][0]
                        k_vector.append(k_sum + head_biases["key"][pos][0])
                    k_vectors.append(k_vector)

                    # Calculate V vector for this token
                    v_vector = []
                    for pos in range(self.embeddingSize):
                        v_sum = 0
                        for j in range(self.embeddingSize):
                            v_sum += token_embedding[j] * head_weights["value"][pos * self.embeddingSize + j][0]
                        v_vector.append(v_sum + head_biases["value"][pos][0])
                    v_vectors.append(v_vector)

                # Calculate dot products between each Q and K vector with causal masking
                # Step 1: Calculate raw dot products and apply causal masking
                attention_scores = []
                for i, q_vector in enumerate(q_vectors):
                    token_scores = []
                    for j, k_vector in enumerate(k_vectors):
                        score = self.dot_product(q_vector, k_vector)
                        if j > i:  # Apply causal masking: future tokens get -inf
                            score = float('-inf')
                        token_scores.append(score)
                    attention_scores.append(token_scores)

                # Step 2: Scale the non-masked scores by 1/sqrt(embeddingSize)
                for i in range(len(attention_scores)):
                    for j in range(len(attention_scores[i])):
                        if attention_scores[i][j] != float('-inf'):
                            attention_scores[i][j] /= math.sqrt(self.embeddingSize)

                # Apply softmax to each token's attention scores
                attention_probs = []
                for token_scores in attention_scores:
                    attention_probs.append(self.softmax(token_scores))   

                # Calculate final vectors post attention
                post_attention_vectors = []
                for token_idx, token_probs in enumerate(attention_probs):
                    # Will store final vector for this token
                    final_vector = [0] * self.embeddingSize
                    
                    # For each position in the vector
                    for pos in range(self.embeddingSize):
                        # Sum up the weighted values from each token
                        for other_token_idx, prob in enumerate(token_probs):
                            final_vector[pos] += v_vectors[other_token_idx][pos] * prob
                    
                    post_attention_vectors.append(final_vector)
                    
                if return_cache:
                    head_cache = {
                        "q_vectors": q_vectors,
                        "k_vectors": k_vectors,
                        "v_vectors": v_vectors,
                        "attention_scores": attention_scores,
                        "attention_probs": attention_probs,
                        "output": []
                    }
                    
                    # Store the complete output vectors for this head
                    for token_idx in range(len(tokenized_input)):
                        head_cache["output"].append(post_attention_vectors[token_idx].copy())
                        
                    cache["layers"][layer]["heads"].append(head_cache)
                    
                # Store this head's output
                head_outputs.append(post_attention_vectors)
            
            # Combine head outputs
            combined_vectors = []
            for token_idx in range(len(final_embeddings)):
                # Concatenate vectors from each head for this token
                concatenated = []
                for head_idx in range(self.heads):
                    concatenated.extend(head_outputs[head_idx][token_idx])
                    
                # Project concatenated vector
                output_vector = []
                output_weights = self.transformer["layers"][layer]["weights"]["attention"]["output"]
                output_biases = self.transformer["layers"][layer]["biases"]["attention"]["output"]
                
                for pos in range(self.embeddingSize):
                    pos_sum = 0
                    for j in range(self.embeddingSize * self.heads):
                        pos_sum += concatenated[j] * output_weights[pos * (self.embeddingSize * self.heads) + j][0]
                    output_vector.append(pos_sum + output_biases[pos][0])
                combined_vectors.append(output_vector)

            if return_cache:
                cache["layers"][layer]["combined"] = combined_vectors.copy()

            # Apply dropout to attention output if in training mode
            if training_mode:
                #! Set to 0 for overfiting, for actual training, set this back to 0.1 or something like 0.2 (dropout 1)
                dropout_rate = 0  # 10% dropout, changed to 0 because we wanna overfit
                if config["antiOverfittingOptimisations"]:
                    dropout_rate = 0.1
                    
                for i in range(len(combined_vectors)):
                    for j in range(len(combined_vectors[i])):
                        if random([0, 1]) < dropout_rate:
                            combined_vectors[i][j] = 0
                        else:
                            # Scale to maintain expected value
                            combined_vectors[i][j] /= (1 - dropout_rate)

            # Add residual connection after attention
            for i in range(len(combined_vectors)):
                for j in range(self.embeddingSize):
                    combined_vectors[i][j] += final_embeddings[i][j]

            # REMOVED: Redundant normalization after residual connection
            
            # Optional safeguard scaling after combining
            for i in range(len(combined_vectors)):
                combined_vectors[i] = scale_activation(combined_vectors[i], base_gamma=5.0)

            # CHANGE 2: Apply normalization BEFORE feed-forward
            normalized_vectors = []
            for i in range(len(combined_vectors)):
                normalized = self.normalize_vector(combined_vectors[i])
                weighted_normalized = []
                for j in range(self.embeddingSize):
                    weighted_value = normalized[j] * self.transformer["layers"][layer]["weights"]["normalize_2"][j][0] + self.transformer["layers"][layer]["biases"]["normalize_2"][j][0]
                    weighted_normalized.append(weighted_value)
                normalized_vectors.append(weighted_normalized)

            # Feed-forward network - GROW stage (using normalized vectors)
            bigger_vectors = []
            for i in range(len(normalized_vectors)):
                bigger_vector = []
                for j in range(self.embeddingSize * 4):
                    sum_val = 0
                    for k in range(self.embeddingSize):
                        sum_val += normalized_vectors[i][k] * self.transformer["layers"][layer]["weights"]["feed_forward"]["grow"][k * (self.embeddingSize * 4) + j][0]
                    bigger_vector.append(sum_val + self.transformer["layers"][layer]["biases"]["feed_forward"]["grow"][j][0])
                bigger_vectors.append(bigger_vector)

            if return_cache:
                cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.copy()

            # Apply ReLU to bigger vectors
            for i in range(len(bigger_vectors)):
                for j in range(self.embeddingSize * 4):
                    if bigger_vectors[i][j] < 0:
                        bigger_vectors[i][j] = 0
                        
            if return_cache:
                cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.copy()

            # Apply dropout if in training mode
            if training_mode:
                #! Set to 0 for overfiting, for actual training, set this back to 0.1 or something like 0.2 (dropout 2)
                dropout_rate = 0  # 0% dropout for overfitting
                if config["antiOverfittingOptimisations"]:
                    dropout_rate = 0.1

                for i in range(len(bigger_vectors)):
                    for j in range(len(bigger_vectors[i])):
                        if random([0, 1]) < dropout_rate:
                            bigger_vectors[i][j] = 0
                        else:
                            bigger_vectors[i][j] /= (1 - dropout_rate)

            # Shrink vectors back to original size - SHRINK stage
            final_vectors = []
            for vector in bigger_vectors:
                final_vector = []
                for pos in range(self.embeddingSize):
                    accum = 0
                    for j in range(self.embeddingSize * 4):
                        accum += vector[j] * self.transformer["layers"][layer]["weights"]["feed_forward"]["shrink"][pos * (self.embeddingSize * 4) + j][0]
                    final_vector.append(accum + self.transformer["layers"][layer]["biases"]["feed_forward"]["shrink"][pos][0])
                final_vectors.append(final_vector)

            # Residual connection for feed-forward (using combined_vectors)
            for i in range(len(final_vectors)):
                for j in range(self.embeddingSize):
                    final_vectors[i][j] += combined_vectors[i][j]

            # REMOVED: Redundant normalization after feed-forward residual

            # Optional safeguard scaling
            for i in range(len(final_vectors)):
                final_vectors[i] = scale_activation(final_vectors[i], base_gamma=5.0)
                
            if return_cache:
                cache["layers"][layer]["feed_forward"]["final"] = final_vectors.copy()

            # Update final_embeddings for next layer
            final_embeddings = final_vectors
            print("Computed layer", layer, "in", timer_end(timer), "ms")
        print("Computed layers in", timer_end(gtimer), "ms")
        timer = timer_()
        print("Computing next token...")

        # Get embedding vector of last token
        last_token_embedding = final_embeddings[-1]

        # Calculate score for each token in vocabulary
        scores = []
        for token_idx in range(len(self.vocab)):
            score = 0
            # For each position in embedding, multiply with corresponding weight
            for pos in range(self.embeddingSize):
                score += last_token_embedding[pos] * self.transformer["vocab_projection"]["weights"][token_idx * self.embeddingSize + pos][0]
            # Add bias for this token
            score += self.transformer["vocab_projection"]["biases"][token_idx][0]
            scores.append([score, token_idx])
            
        if return_cache:
            cache["vocab_scores"] = [score[0] for score in scores]

        # Find token with highest score
        highest_score = float('-inf')
        next_token = 0
        for i, (score, token_idx) in enumerate(scores):
            if score > highest_score:
                highest_score = score
                next_token = token_idx

        print("Computed next token in", timer_end(timer), "ms")
        ndprint("Did inference in", timer_end(sgtimer), "ms") 

        if return_cache:
            return [self.vocab[next_token][0], next_token], cache
        return [self.vocab[next_token][0], next_token]  # Return [token_string, token_id]
    def generate(self, context, temperature=False):
        if temperature == False:
            temperature = self.temperature
        current_context = context
        output = ""
        
        for step in range(self.maxOutputSize):
            next_token, cache = self.inference(current_context, True)
            
            # Get vocab scores
            scores = cache["vocab_scores"]
            
            # For near-zero temperature, directly pick highest probability token
            if temperature < 0.0001:
                highest_score = float('-inf')
                next_token_idx = 0
                
                # Find highest scoring token
                for i, score in enumerate(scores):
                    if score > highest_score:
                        highest_score = score
                        next_token_idx = i
                
                next_token = [self.vocab[next_token_idx][0], self.vocab[next_token_idx][1]]
                ndprint("Inference predicted token:", "\"" + next_token[0] + "\"", "with id", next_token[1])
            else:
                # Normal temperature-based sampling
                scaled_scores = [score / temperature for score in scores]
                probs = self.softmax(scaled_scores)
                
                random_value = random([0, 1])
                
                cumulative_prob = 0.0
                next_token_idx = 0
                
                for i, prob in enumerate(probs):
                    cumulative_prob += prob
                    if random_value <= cumulative_prob:
                        next_token_idx = i
                        break
                
                next_token = [self.vocab[next_token_idx][0], self.vocab[next_token_idx][1]]
                ndprint("Inference predicted token:", "\"" + next_token[0] + "\"", "with id", next_token[1])
            
            # Check for end token (100257)
            if next_token[1] == 100257:
                break
            
            # Add token to output
            output += next_token[0]
            current_context += next_token[0]
        
        return output
    def interactive_test_loop(self, epoch_num, avg_loss, optimizer):
        ndprint("\n[🧪 Interactive Test Mode]")
        try:
            ndprint("If you're still here, type anything to enter testing mode.")
            poke = inputimeout(prompt="Are you there? (30s): ", timeout=30)
        except TimeoutOccurred:
            ndprint("[Info] Timeout. Skipping testing.")
            return optimizer

        while True:
            try:
                user_input = input("› ").strip()
            except KeyboardInterrupt:
                ndprint("\n[Info] Skipping interactive testing...")
                break

            if user_input == "":
                ndprint("[Info] Skipping...")
                break
            elif user_input == "/continue":
                ndprint("[Info] Continuing to next epoch...")
                break
            elif user_input == "/stop":
                ndprint("[Info] Stopping training.")
                return "STOP_TRAINING"
            elif user_input.startswith("/save"):
                parts = user_input.split(" ", 1)
                save_path = parts[1] if len(parts) > 1 else f"model_{optimizer}.json"
                try:
                    self.save(save_path)
                    ndprint(f"[Info] Model saved to {save_path}")
                except Exception as e:
                    ndprint(f"[Error] Could not save: {e}")
            elif user_input.startswith("/switch_to_"):
                new_opt = user_input[len("/switch_to_"):]
                if new_opt in ["adam", "sgd", "sgd_momentum"]:
                    ndprint(f"[Info] Switching to {new_opt.upper()}")
                    return new_opt
                else:
                    ndprint("[Error] Unknown optimizer.")
            elif user_input.startswith("/temperature"):
                parts = user_input.split(" ", 1)
                if len(parts) < 2:
                    ndprint(f"[Current Temperature] {self.temperature}")
                else:
                    try:
                        temp = float(parts[1])
                        self.temperature = temp
                        ndprint(f"[Info] Set temperature to {temp}")
                    except:
                        ndprint("[Error] Invalid value.")
            elif user_input == "/info":
                ndprint(f"[Info] Epoch: {epoch_num+1}, Loss: {avg_loss:.4f}, Optimizer: {optimizer}, Temperature: {self.temperature}")
            elif user_input == "/help":
                ndprint("Available commands:")
                ndprint("  /continue        Continue training")
                ndprint("  /stop            Stop training")
                ndprint("  /save [path]     Save model (optional path)")
                ndprint("  /switch_to_*     Switch optimizer (sgd, adam, sgd_momentum)")
                ndprint("  /temperature X   Set or view temperature")
                ndprint("  /info            Show current training info")
                ndprint("  /help            Show this help message")
            else:
                prompt = f"user:\n{user_input}\nyou:\n"
                try:
                    output = self.generate(prompt, temperature=self.temperature)
                    ndprint(output)
                except Exception as e:
                    ndprint(f"[Error] Failed to generate: {e}")

        return optimizer

if flag:
    transformer = Transformer(True, {
        "contextSize": config["contextSize"],
        "embeddingSize": config["embeddingSize"],
        "learningRate": config["learningRate"],
        "maxOutputSize": config["maxOutputSize"],
        "layersAmount": config["layersAmount"],
        "heads": config["heads"],                  
        "use_he_init": True,
        "biasesinitrange": config["biasesinitrange"],
        "embeddinginitrange": config["embeddinginitrange"],
    })
    if pretraining__:
        transformer.pretrain(config["pre-training-paths"], epochs=config["pre-train-epochs"], optimizer=config["pre-train-optimizer"])
    if training__:
        transformer.train(config["training-dataset-path"], config["train-epochs"], optimizer=config["train-optimizer"])
else:
    transformer = Transformer(new=False, path=model_location)

try:
    ndprint("\nEntering interactive mode. Type a message or command:")
    ndprint("Commands: /save [path], /temperature [value], /help, /exit")

    def generate_response(text):
        formatted_input = f"user:\n{text}\nyou:\n"
        tokenized = transformer.tokenize(formatted_input)
        return transformer.generate(formatted_input, temperature=transformer.temperature)

    while True:
        text = input("› ").strip()

        if text.startswith("/save "):
            path = text[6:]
            transformer.save(path)
            ndprint("Model saved to", path)
            continue

        elif text == "/save":
            transformer.save()
            ndprint("Model saved to model.json")
            continue

        elif text.startswith("/temperature"):
            parts = text.split(" ", 1)
            if len(parts) == 1:
                ndprint("Current temperature:", transformer.temperature)
            else:
                try:
                    transformer.temperature = float(parts[1])
                    ndprint("Set temperature to", transformer.temperature)
                except:
                    ndprint("Invalid temperature value.")
            continue
        
        elif text == "/help":
            ndprint("Available commands:")
            ndprint("  /save [path]     Save model to file")
            ndprint("  /temperature X   Set or view temperature")
            ndprint("  /exit            Exit interactive mode")
            continue

        elif text == "/exit":
            print("Exiting interactive mode.")
            break

        # Generate output
        output = generate_response(text)
        ndprint(output)

except KeyboardInterrupt:
    ndprint("\nExiting interactive mode.")
    exit(0)
