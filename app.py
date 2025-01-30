import tiktoken
from sys import exit
import time
import random as rd
import numpy
import uuid
import json

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
    def __init__(self, new=False, parameters=None):
        print("Trying to read vocabulary file...")
        try:
            self.vocabulary = json.load(open("vocabulary.json", "r").read())
        except Exception:
            print("Failed to read vocabulary file, creating error...")
            raise Exception("Failed to read vocabulary file")
        print("Successfully read vocabulary file")

        if new:
            print("Initializing model...")
            print("Initializing parameters...")
            timer = timer_()
            self.contextSize = parameters["contextSize"]
            self.embeddingSize = parameters["embeddingSize"]
            self.learningRate = parameters["learningRate"]
            self.maxOutputSize = parameters["maxOutputSize"]
            self.layersAmount = parameters["layersAmount"]
            self.weightsinitrange = parameters["weightsinitrange"]
            self.biasesinitrange = parameters["biasesinitrange"]
            self.heads = parameters["heads"]
            self.transformer = {}
            print("Initialized parameters in", timer_end(timer), "ms")
            print("Initializing layers...")
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

                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["weights"]["normalize_1"].append(random(self.weightsinitrange))
                    self.transformer["layers"][i]["biases"]["normalize_1"].append(random(self.biasesinitrange))
                    self.transformer["layers"][i]["weights"]["normalize_2"].append(random(self.weightsinitrange))
                    self.transformer["layers"][i]["biases"]["normalize_2"].append(random(self.biasesinitrange))
                
                for j in range(self.heads):
                    for k in range(self.embeddingSize * self.embeddingSize):
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"].append(random(self.weightsinitrange))
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"].append(random(self.weightsinitrange))
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"].append(random(self.weightsinitrange))
                    for k in range(self.embeddingSize):
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"].append(random(self.biasesinitrange))
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"].append(random(self.biasesinitrange))
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"].append(random(self.biasesinitrange))
                
                for j in range(self.embeddingSize * self.embeddingSize):
                    self.transformer["layers"][i]["weights"]["attention"]["output"].append(random(self.weightsinitrange))
                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["biases"]["attention"]["output"].append(random(self.biasesinitrange))

                for j in range(self.embeddingSize * (self.embeddingSize * 4)):
                    self.transformer["layers"][i]["weights"]["feed_forward"]["grow"].append(random(self.weightsinitrange))
                for j in range(self.embeddingSize * 4):
                    self.transformer["layers"][i]["biases"]["feed_forward"]["grow"].append(random(self.biasesinitrange))

                for j in range((self.embeddingSize * 4) * self.embeddingSize):
                    self.transformer["layers"][i]["weights"]["feed_forward"]["shrink"].append(random(self.weightsinitrange))
                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["biases"]["feed_forward"]["shrink"].append(random(self.biasesinitrange))
                print("Initialized weights and biases for layer", i, "in", timer_end(timer), "ms")
            print("Initialized layers in", timer_end(gtimer), "ms")


transformer = Transformer(True, {
    "contextSize": 512,
    "embeddingSize": 512,
    "learningRate": 0.0001,
    "maxOutputSize": 512,
    "layersAmount": 6,
    "heads": 8,
    "weightsinitrange": [-0.1, 0.1],
    "biasesinitrange": [-0.01, 0.01]
})