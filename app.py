import tiktoken
from sys import exit
import time
import random as rd
import math
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
    def __init__(self, new=False, parameters=None, path=None, vocab_path="vocabulary.json"):
       print("Trying to read vocabulary file...")
       try:
           self.vocab = json.loads(open("vocabulary.json", "r").read())
       except Exception:
           print("Failed to read vocabulary file, creating error...")
           raise Exception("Failed to read vocabulary file")
       print("Successfully read vocabulary file")

       self.encoder = tiktoken.get_encoding("cl100k_base")  # Same as GPT-4

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
           self.dataset = parameters["dataset"]
           self.embeddinginitrange = parameters["embeddinginitrange"]
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
                   self.transformer["layers"][i]["weights"]["normalize_1"].append([random(self.weightsinitrange), 0, 0])
                   self.transformer["layers"][i]["biases"]["normalize_1"].append([random(self.biasesinitrange), 0, 0])
                   self.transformer["layers"][i]["weights"]["normalize_2"].append([random(self.weightsinitrange), 0, 0])
                   self.transformer["layers"][i]["biases"]["normalize_2"].append([random(self.biasesinitrange), 0, 0])
               
               for j in range(self.heads):
                   for k in range(self.embeddingSize * self.embeddingSize):
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"].append([random(self.weightsinitrange), 0, 0])
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"].append([random(self.weightsinitrange), 0, 0])
                       self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"].append([random(self.weightsinitrange), 0, 0])
                   for k in range(self.embeddingSize):
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"].append([random(self.biasesinitrange), 0, 0])
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"].append([random(self.biasesinitrange), 0, 0])
                       self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"].append([random(self.biasesinitrange), 0, 0])
               
               for j in range(self.embeddingSize * (self.embeddingSize * self.heads)):
                   self.transformer["layers"][i]["weights"]["attention"]["output"].append([random(self.weightsinitrange), 0, 0])
               for j in range(self.embeddingSize):
                   self.transformer["layers"][i]["biases"]["attention"]["output"].append([random(self.biasesinitrange), 0, 0])

               for j in range(self.embeddingSize * (self.embeddingSize * 4)):
                   self.transformer["layers"][i]["weights"]["feed_forward"]["grow"].append([random(self.weightsinitrange), 0, 0])
               for j in range(self.embeddingSize * 4):
                   self.transformer["layers"][i]["biases"]["feed_forward"]["grow"].append([random(self.biasesinitrange), 0, 0])

               for j in range((self.embeddingSize * 4) * self.embeddingSize):
                   self.transformer["layers"][i]["weights"]["feed_forward"]["shrink"].append([random(self.weightsinitrange), 0, 0])
               for j in range(self.embeddingSize):
                   self.transformer["layers"][i]["biases"]["feed_forward"]["shrink"].append([random(self.biasesinitrange), 0, 0])
               print("Initialized weights and biases for layer", i, "in", timer_end(timer), "ms")
           print("Initialized layers in", timer_end(gtimer), "ms")
           
           print("Initializing embeddings...")
           timer = timer_()
           self.transformer["embeddings"] = []
           for i in range(len(self.vocab)):
               embedding = []
               for j in range(self.embeddingSize):
                   embedding.append([random(self.embeddinginitrange), 0, 0])
               self.transformer["embeddings"].append(embedding)
           print("Initialized embeddings in", timer_end(timer), "ms")

           print("Initializing vocabulary projection weights and biases...")
           timer = timer_()
           self.transformer["vocab_projection"] = {
               "weights": [],
               "biases": []
           }
           # Initialize weights (vocab_size * embedding_size)
           for i in range(len(self.vocab) * self.embeddingSize):
               self.transformer["vocab_projection"]["weights"].append([random(self.weightsinitrange), 0, 0])
           # Initialize biases (vocab_size)
           for i in range(len(self.vocab)):
               self.transformer["vocab_projection"]["biases"].append([random(self.biasesinitrange), 0, 0])
           print("Initialized vocabulary projection weights and biases in", timer_end(timer), "ms")

           timer = timer_()
           print("Contextizing dataset...")
           end_token = None
           for token in self.vocab:
               if token[1] == 100257:
                   end_token = token[0]
                   break
           self.contexted_dataset = []
           for item in self.dataset:
               contexted_item = "user:\n" + item["input"] + "\nyou:\n" + item["output"] + end_token
               self.contexted_dataset.append(contexted_item)
           print("Contextized dataset in", timer_end(timer), "ms")
           
           timer = timer_()
           print("Tokenizing contexted dataset...")
           self.tokenized_dataset = []
           for item in self.contexted_dataset:
               self.tokenized_dataset.append(self.tokenize(item))
           print("Tokenized contexted dataset in", timer_end(timer), "ms")
           print("Successfully initialized model")
       else:
           print("Reading model from file...")
           try:
               model = json.load(open(path, "r").read())
               self.transformer = model["transformer"]
               self.contextSize = model["contextSize"]
               self.embeddingSize = model["embeddingSize"]
               self.learningRate = model["learningRate"]
               self.maxOutputSize = model["maxOutputSize"]
               self.layersAmount = model["layersAmount"]
               self.weightsinitrange = model["weightsinitrange"]
               self.biasesinitrange = model["biasesinitrange"]
               self.heads = model["heads"]
               self.dataset = model["dataset"]
               self.embeddinginitrange = model["embeddinginitrange"]

           except Exception:
               print("Failed to read model file, creating error...")
               raise Exception("Failed to read model file")
           print("Successfully read model from file")

    def tokenize(self, text):
        timer = timer_()
        print("Tokenizing text...")
        token_ids = self.encoder.encode(text, allowed_special={'<|endoftext|>'})
        result = []
        for id in token_ids:
            # Search through vocab for matching id
            for token in self.vocab:
                if token[1] == id:
                    result.append([token[0], id])  # Now returning [token, id] pairs
                    break
        print("Tokenized in", timer_end(timer), "ms")
        return result

    def calculate_positional_encoding(self, sequence_length):
        timer = timer_()
        print("Calculating positional encodings...")
        
        positional_encodings = []
        for pos in range(sequence_length):
            embedding = []
            for i in range(self.embeddingSize):
                denominator = pow(10000, (2 * i)/self.embeddingSize)
                if i % 2 == 0:
                    embedding.append(float(math.sin(pos/denominator)))
                else:
                    embedding.append(float(math.cos(pos/denominator)))
            positional_encodings.append(embedding)
        
        print("Calculated positional encodings in", timer_end(timer), "ms")
        return positional_encodings

    def get_embedding(self, token_id):
        return self.transformer["embeddings"][token_id]

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
        
        # Calculate variance and standard deviation
        variance = sum((x - mean) ** 2 for x in vector_list) / len(vector_list)
        std = variance ** 0.5
        
        if std < 1e-6:  # If std is very small
            return [0.0 for _ in range(len(vector_list))]  # Return zero vector
        
        # Return normalized values
        return [(x - mean) / std for x in vector_list]

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
        
        # Calculate sum of exps
        sum_exp = sum(exp_scores)
        
        # Return normalized probabilities
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
            json.dump(transformer, file)
        print("Model saved to", path)

    def calculate_loss(self, predicted_scores, target_token_id):
        # Convert scores to probabilities using softmax
        predicted_probs = self.softmax(predicted_scores)
        
        # Create smoothed target distribution
        epsilon = 0.1
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / (vocab_size - 1)) for _ in range(vocab_size)]
        target_distribution[target_token_id] = 1.0 - epsilon

        # Calculate cross entropy loss
        loss = 0
        for i in range(vocab_size):
            if predicted_probs[i] > 0:  # Avoid log(0)
                loss -= target_distribution[i] * math.log(predicted_probs[i])
        
        return loss

    def initialize_zero_gradients(self, structure):
        if isinstance(structure, list):
            # If it's already a [value, momentum, velocity] list
            if len(structure) > 0 and isinstance(structure[0], list) and len(structure[0]) == 3:
                return [[0, 0, 0] for _ in structure]
            # Otherwise make it one
            return [0, 0, 0]
        elif isinstance(structure, dict):
            zero_dict = {}
            for key, value in structure.items():
                if key == "heads":
                    # Special handling for attention heads
                    zero_dict[key] = [
                        {
                            "query": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)],
                            "key": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)],
                            "value": [[0, 0, 0] for _ in range(self.embeddingSize * self.embeddingSize)]
                        } for _ in range(self.heads)
                    ]
                else:
                    zero_dict[key] = self.initialize_zero_gradients(value)
            return zero_dict
        # Base case - always return a [value, momentum, velocity] list
        return [0, 0, 0]

    def train_step(self, input_tokens, target_token):
        print("Starting training step...")
        gtimer = timer_()
        
        # Run inference to get cache of intermediate values
        print("Running inference to get cache...")
        timer = timer_()
        input_text = ""
        for token, _ in input_tokens:
            input_text += token
        _, cache = self.inference(input_text, True)
        print("Got inference cache in", timer_end(timer), "ms")
        
        # Calculate initial loss using vocab scores from cache
        print("Calculating initial loss...")
        timer = timer_()
        initial_loss = self.calculate_loss(cache["vocab_scores"], target_token[1])
        print("Initial loss:", initial_loss, "calculated in", timer_end(timer), "ms")
        
        # Initialize/update step counter and calculate learning rate
        print("Calculating learning rate...")
        timer = timer_()
        # Replace the current learning rate calculation with:
        warmup_steps = 4000
        if not hasattr(self, 'step_num'):
            self.step_num = 1
        else:
            self.step_num += 1

        base_lr = self.learningRate
        lr = base_lr * min(
            self.step_num ** (-0.5),
            self.step_num * (warmup_steps ** (-1.5))
        ) * (self.embeddingSize ** (-0.5))
        print("Learning rate:", lr, "calculated in", timer_end(timer), "ms")
        
        print("Computing gradients...")
        gtimer2 = timer_()
        
        # Get predicted probabilities and compute error gradients
        predicted_probs = self.softmax(cache["vocab_scores"])
        epsilon = 0.1
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / (vocab_size - 1)) for _ in range(vocab_size)]
        target_distribution[target_token[1]] = 1.0 - epsilon
        
        # Calculate initial error using pure Python
        initial_error = [predicted_probs[i] - target_distribution[i] for i in range(len(predicted_probs))]
        
        # Initialize error gradients with zeros
        error_gradients = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]

        # Propagate gradients through vocabulary projection layer
        for j in range(self.embeddingSize):
            for k in range(len(self.vocab)):
                error_gradients[-1][j] += initial_error[k] * self.transformer["vocab_projection"]["weights"][k * self.embeddingSize + j][0]
        next_grad = error_gradients
        
        # Initialize gradient accumulators
        embedding_gradients = [[0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
        layer_gradients = []
        for _ in range(self.layersAmount):
            layer_grad = {
                "weights": self.initialize_zero_gradients(self.transformer["layers"][0]["weights"]),
                "biases": self.initialize_zero_gradients(self.transformer["layers"][0]["biases"])
            }
            layer_gradients.append(layer_grad)

        # Backpropagate through layers
        next_grad = error_gradients
        for layer_idx in reversed(range(self.layersAmount)):
            layer_cache = cache["layers"][layer_idx]
            
            # Feed Forward gradients
            ff_out_grad = [row[:] for row in next_grad]  # Deep copy
            shrink_grad = [[0.0 for _ in range(self.embeddingSize * 4)] for _ in range(len(input_tokens))]
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * 4):
                        if layer_cache["feed_forward"]["after_relu"][i][k] > 0:
                            shrink_grad[i][k] += ff_out_grad[i][j] * self.transformer["layers"][layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0]
                            layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0] += ff_out_grad[i][j] * layer_cache["feed_forward"]["after_relu"][i][k]
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j][0] += ff_out_grad[i][j]

            # Attention gradients
            att_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
            for head in range(self.heads):
                head_cache = layer_cache["heads"][head]
                
                # Compute gradients for Q, K, V matrices
                q_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                k_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                v_grad = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                
                # Gradient through attention scores
                attention_grad = [[0.0 for _ in range(len(input_tokens))] for _ in range(len(input_tokens))]
                for i in range(len(input_tokens)):
                    for j in range(len(input_tokens)):
                        score_grad = head_cache["attention_probs"][i][j] * (1 - head_cache["attention_probs"][i][j])
                        attention_grad[i][j] = score_grad / (self.embeddingSize ** 0.5)
                        
                        # Update Q, K gradients
                        for k in range(self.embeddingSize):
                            q_grad[i][k] += attention_grad[i][j] * head_cache["k_vectors"][j][k]
                            k_grad[j][k] += attention_grad[i][j] * head_cache["q_vectors"][i][k]
                            
                        # Update V gradients - manual addition of vectors
                        for k in range(self.embeddingSize):
                            v_grad[j][k] += head_cache["attention_probs"][i][j] * next_grad[i][k]
                
                # Update head weights/biases gradients
                for i in range(len(input_tokens)):
                    for j in range(self.embeddingSize):
                        for k in range(self.embeddingSize):
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["query"][j * self.embeddingSize + k][0] += q_grad[i][j] * layer_cache["normalized"][i][k]
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["key"][j * self.embeddingSize + k][0] += k_grad[i][j] * layer_cache["normalized"][i][k]
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["value"][j * self.embeddingSize + k][0] += v_grad[i][j] * layer_cache["normalized"][i][k]
                        
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["query"][j][0] += q_grad[i][j]
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["key"][j][0] += k_grad[i][j]
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["value"][j][0] += v_grad[i][j]
                
                # Accumulate attention gradients using dot product of matrices
                for i in range(len(input_tokens)):
                    for j in range(self.embeddingSize):
                        for k in range(len(input_tokens)):
                            att_grad[i][j] += attention_grad[i][k] * v_grad[k][j]

            # After accumulating attention gradients for each head:
            # Update output projection weights/biases
            for i in range(len(input_tokens)):
                concatenated = []
                for head_idx in range(self.heads):
                    concatenated.extend(head_cache["output"][i])
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * self.heads):
                        layer_gradients[layer_idx]["weights"]["attention"]["output"][j * (self.embeddingSize * self.heads) + k][0] += next_grad[i][j] * concatenated[k]
                    layer_gradients[layer_idx]["biases"]["attention"]["output"][j][0] += next_grad[i][j]
            
            # Layer norm gradients
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_2"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_2"][j][0] += next_grad[i][j]

            # After layer norm gradients
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_1"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_1"][j][0] += next_grad[i][j]

            # And for attention output
            for j in range(self.embeddingSize):
                for k in range(self.embeddingSize * self.heads):
                    layer_gradients[layer_idx]["weights"]["attention"]["output"][j * (self.embeddingSize * self.heads) + k][0] += next_grad[i][j] * concatenated[k]
                layer_gradients[layer_idx]["biases"]["attention"]["output"][j][0] += next_grad[i][j]

            # Combine gradients for next layer
            next_grad = [[next_grad[i][j] + att_grad[i][j] for j in range(self.embeddingSize)] for i in range(len(input_tokens))]
            
            # Update embedding gradients
            for i in range(len(input_tokens)):
                embedding_gradients[i] = self.add_vectors(embedding_gradients[i], next_grad[i])

        print("Computed gradients in", timer_end(gtimer2), "ms")
        
        # Initialize Adam parameters if first step
        if not hasattr(self, 'adam_params'):
            self.adam_params = {
                'beta1': 0.9,
                'beta2': 0.98,
                'epsilon': 1e-9,
                't': 0
            }
        self.adam_params['t'] += 1

        print("Updating parameters...")
        timer = timer_()

        # Update embeddings
        for token_idx, (token, token_id) in enumerate(input_tokens):
            for pos in range(self.embeddingSize):
                grad = embedding_gradients[token_idx][pos]
                param = self.transformer["embeddings"][token_id][pos]  # This is a [value, momentum, velocity] list
                
                # Make sure param has momentum and velocity fields
                if isinstance(param, list) and len(param) >= 3:
                    # Handle grad whether it's a list or float
                    grad_value = grad[0] if isinstance(grad, list) else grad
                    
                    # Update momentum and velocity using list indices
                    param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                    param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                    
                    # Compute bias-corrected estimates
                    m_hat = param[1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                    v_hat = param[2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                    
                    # Update parameter value (at index 0)
                    param[0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                    

        # Update layer parameters
        for layer_idx in range(self.layersAmount):
            layer = self.transformer["layers"][layer_idx]
            layer_grad = layer_gradients[layer_idx]
            
            for param_type in ["weights", "biases"]:
                for key in layer[param_type].keys():
                    if isinstance(layer[param_type][key], list):
                        for i in range(len(layer[param_type][key])):
                            grad = layer_grad[param_type][key][i]
                            param = layer[param_type][key][i]
                            
                            # Make sure param is a list with momentum and velocity values
                            if isinstance(param, list) and len(param) >= 3:
                                # Handle grad whether it's a list or float
                                grad_value = grad[0] if isinstance(grad, list) else grad
                                
                                # Update momentum and velocity
                                param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                                param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                
                                # Compute bias-corrected estimates
                                m_hat = param[1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                v_hat = param[2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                
                                # Update parameter
                                param[0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                                
                    elif isinstance(layer[param_type][key], dict):  # For nested structures like attention heads
                        for subkey in layer[param_type][key].keys():
                            if subkey == "heads":
                                # Special handling for attention heads
                                for head_idx in range(self.heads):
                                    for head_key in ["query", "key", "value"]:
                                        head_params = layer[param_type][key][subkey][head_idx][head_key]
                                        head_grads = layer_grad[param_type][key][subkey][head_idx][head_key]
                                        
                                        for i in range(len(head_params)):
                                            if isinstance(head_params[i], list) and len(head_params[i]) >= 3:
                                                # Get the gradient
                                                grad_value = head_grads[i][0] if isinstance(head_grads[i], list) else head_grads[i]
                                                
                                                # Update momentum and velocity
                                                head_params[i][1] = self.adam_params['beta1'] * head_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                                head_params[i][2] = self.adam_params['beta2'] * head_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                                
                                                # Compute bias-corrected estimates
                                                m_hat = head_params[i][1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                                v_hat = head_params[i][2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                                
                                                # Update parameter
                                                head_params[i][0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                            else:
                                # For other nested dictionaries like "output"
                                nested_params = layer[param_type][key][subkey]
                                nested_grads = layer_grad[param_type][key][subkey]
                                
                                if isinstance(nested_params, list) and isinstance(nested_grads, list):
                                    for i in range(len(nested_params)):
                                        if isinstance(nested_params[i], list) and len(nested_params[i]) >= 3:
                                            # Get the gradient
                                            grad_value = nested_grads[i][0] if isinstance(nested_grads[i], list) else nested_grads[i]
                                            
                                            # Update momentum and velocity
                                            nested_params[i][1] = self.adam_params['beta1'] * nested_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                            nested_params[i][2] = self.adam_params['beta2'] * nested_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                            
                                            # Compute bias-corrected estimates
                                            m_hat = nested_params[i][1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                            v_hat = nested_params[i][2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                            
                                            # Update parameter
                                            nested_params[i][0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])

        print("Updated parameters in", timer_end(timer), "ms")
        print("Training step completed in", timer_end(gtimer), "ms")
        return initial_loss
    
    def train(self, epochs=1):
        for epoch in range(epochs):
            timer = timer_()
            print("Starting epoch", epoch + 1)
            for i in range(len(self.tokenized_dataset)):
                stimer = timer_()
                print("Training on item", i + 1, "/", len(self.tokenized_dataset))
                tokens = self.tokenized_dataset[i]
                for j in range(len(tokens) - 1):
                    input_tokens = tokens[:j+1]
                    target_token = tokens[j+1]
                    loss = self.train_step(input_tokens, target_token)
                    print(f"Loss: {loss:.4f} (sequence position {j+1}/{len(tokens)-1})")
                print("Trained on item", i + 1, "in", timer_end(stimer), "ms")
            print("Epoch", epoch + 1, "completed in", timer_end(timer), "ms")
    
    def inference(self, context, return_cache):
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
                
            # Normalize and apply weights/biases
            normalized = self.normalize_vector(embedding)
            # Apply weights and biases directly here
            for i in range(self.embeddingSize):
                normalized[i] = normalized[i] * self.transformer["layers"][0]["weights"]["normalize_1"][i][0] + self.transformer["layers"][0]["biases"]["normalize_1"][i][0]
                
            final_embeddings.append(normalized)

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
            
            # Store outputs from each head
            head_outputs = []
            
            for head in range(self.heads):
                head_weights = self.transformer["layers"][layer]["weights"]["attention"]["heads"][head]
                head_biases = self.transformer["layers"][layer]["biases"]["attention"]["heads"][head]

                # Lists to store Q,K,V vectors for each token
                q_vectors = []
                k_vectors = []
                v_vectors = []

                # For each token
                for token_embedding in final_embeddings:
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

                # Calculate dot products between each Q and K vector
                attention_scores = []
                for q_vector in q_vectors:
                    token_scores = []
                    for k_vector in k_vectors:
                        score = self.dot_product(q_vector, k_vector)
                        # Scale by sqrt(embedding_size)
                        score /= math.sqrt(self.embeddingSize)
                        token_scores.append(score)
                    attention_scores.append(token_scores)

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

            # Residual connection - add original vectors to output vectors
            for i in range(len(combined_vectors)):
                for j in range(self.embeddingSize):
                    combined_vectors[i][j] += final_embeddings[i][j]

            # Normalize and apply normalize_2 weights/biases
            normalized_vectors = []
            for i in range(len(combined_vectors)):
                normalized = self.normalize_vector(combined_vectors[i])
                # normalized is now guaranteed to be a list of Python floats
                weighted_normalized = []
                for j in range(self.embeddingSize):
                    weighted_value = normalized[j] * self.transformer["layers"][layer]["weights"]["normalize_2"][j][0] + self.transformer["layers"][layer]["biases"]["normalize_2"][j][0]
                    weighted_normalized.append(weighted_value)
                normalized_vectors.append(weighted_normalized)
                
            if return_cache:
                cache["layers"][layer]["normalized"] = normalized_vectors.copy()

            # Feed-forward part - first make vectors bigger
            bigger_vectors = []
            for vector in normalized_vectors:
                bigger_vector = []
                for pos in range(self.embeddingSize * 4):  # 4 times bigger
                    sum = 0
                    for j in range(self.embeddingSize):
                        sum += vector[j] * self.transformer["layers"][layer]["weights"]["feed_forward"]["grow"][pos * self.embeddingSize + j][0]
                    bigger_vector.append(sum + self.transformer["layers"][layer]["biases"]["feed_forward"]["grow"][pos][0])
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

            # Shrink vectors back to original size
            final_vectors = []
            for vector in bigger_vectors:
                final_vector = []
                for pos in range(self.embeddingSize):
                    sum = 0
                    for j in range(self.embeddingSize * 4):
                        sum += vector[j] * self.transformer["layers"][layer]["weights"]["feed_forward"]["shrink"][pos * (self.embeddingSize * 4) + j][0]
                    final_vector.append(sum + self.transformer["layers"][layer]["biases"]["feed_forward"]["shrink"][pos][0])
                final_vectors.append(final_vector)
            
            # Add residual connection
            for i in range(len(final_vectors)):
                for j in range(self.embeddingSize):
                    final_vectors[i][j] += normalized_vectors[i][j]
                    
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

        if return_cache:
            return [self.vocab[next_token][0], next_token], cache
        return [self.vocab[next_token][0], next_token]  # Return [token_string, token_id]
    def generate(self, context):
        current_context = context
        output = ""
        
        for _ in range(self.maxOutputSize):
            next_token = self.inference(current_context, False)
            
            # Check for end token (100257)
            if next_token[1] == 100257:
                break
                
            output += next_token[0]
            current_context += next_token[0]
        
        return output

try:
    dataset = json.loads(open("dataset.json", "r").read())
except Exception:
    print("Failed to read dataset, exiting...")
    exit(1)

transformer = Transformer(True, {
    "contextSize": 64,
    "embeddingSize": 32,
    "learningRate": 0.001,
    "maxOutputSize": 16,
    "layersAmount": 6,
    "heads": 8,
    "weightsinitrange": [-0.1, 0.1],
    "biasesinitrange": [-0.01, 0.01],
    "embeddinginitrange": [-0.1, 0.1],
    "dataset": dataset
})

transformer.train(3)

try:
    while True:
        text = input("> ")
        if text.startswith("/save "):
            transformer.save(text[6:])
            print("Model saved to", text[6:])
            continue
        elif text == "/save":
            transformer.save()
            print("Model saved to model.json")
            continue
        print("Input tokens:", [token[0] for token in transformer.tokenize(text)])
        output = transformer.generate(text)
        print("Generated output:", output)
except KeyboardInterrupt:
    exit(0)