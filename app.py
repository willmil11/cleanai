import tiktoken
from sys import exit
import time
import random as rd
import math
import uuid
import json

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
           if "use_he_init" in parameters and parameters["use_he_init"]:
               self.weightsinitrange = self.he_init(self.embeddingSize)
               print(f"Using He initialization with range: {self.weightsinitrange}")
           else:
               self.weightsinitrange = parameters["weightsinitrange"]
           self.biasesinitrange = parameters["biasesinitrange"]
           self.heads = parameters["heads"]
           self.dataset = parameters["dataset"]
           self.embeddinginitrange = parameters["embeddinginitrange"]
           self.transformer = {}
           self.step_num = 0
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
               if "dataset" in model:
                   self.dataset = model["dataset"]
               elif parameters and "dataset" in parameters:
                  print("Dataset not found in model file, using provided dataset")
                  self.dataset = parameters["dataset"]
               else:
                  raise Exception("No dataset found in model or parameters")
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
           print("Successfully read model from file")

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
            # Search through vocab for matching id
            for token in self.vocab:
                if token[1] == id:
                    result.append([token[0], id])  # Now returning [token, id] pairs
                    break
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
        print("Model saved to", path)

    def calculate_loss(self, predicted_scores, target_token_id):
        # Convert scores to probabilities using softmax
        predicted_probs = self.softmax(predicted_scores)
        
        # Create smoothed target distribution
        epsilon = 0 #Changed from 0.1 to 0 for better overfitting
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

    def train_step(self, input_tokens, target_token, optimizer="sgd", training_mode=True):
        print("Starting training step...")
        gtimer = timer_()
        
        # Helper function to compute global gradient norm
        def compute_global_norm(embedding_grads, layer_grads):
            """Compute the global norm across all parameter gradients"""
            squared_sum = 0.0
            
            # Handle embedding gradients
            for i in range(len(embedding_grads)):
                for j in range(len(embedding_grads[i])):
                    val = embedding_grads[i][j]
                    squared_sum += val * val
            
            # Handle layer gradients - recursive traversal
            def add_squared_grads(grad_struct):
                nonlocal squared_sum
                if isinstance(grad_struct, list):
                    # If it's a list with gradients
                    if len(grad_struct) > 0 and isinstance(grad_struct[0], (int, float)):
                        val = grad_struct[0] if isinstance(grad_struct[0], (int, float)) else 0
                        squared_sum += val * val
                    return
                elif isinstance(grad_struct, dict):
                    # Recursively process dictionary
                    for key, value in grad_struct.items():
                        add_squared_grads(value)
            
            # Process all layer gradients
            for layer_idx in range(len(layer_grads)):
                add_squared_grads(layer_grads[layer_idx])
                
            return math.sqrt(squared_sum)
        
        # Run inference to get cache of intermediate values
        print("Running inference to get cache...")
        timer = timer_()
        input_text = ""
        for token, _ in input_tokens:
            input_text += token
        _, cache = self.inference(input_text, True, training_mode=training_mode)  # Pass training mode
        print("Got inference cache in", timer_end(timer), "ms")
        
        # Calculate initial loss using vocab scores from cache
        print("Calculating initial loss...")
        timer = timer_()
        initial_loss = self.calculate_loss(cache["vocab_scores"], target_token[1])
        print("Initial loss:", initial_loss, "calculated in", timer_end(timer), "ms")
        
        # Initialize/update step counter and calculate learning rate
        print("Calculating learning rate...")
        timer = timer_()
        if optimizer == "adam":
            self.adam_params['t'] += 1
        self.step_num += 1

        # Learning rate schedule is the same for all optimizers
        warmup_steps = 100  # Reduced from 200
        decay_factor = 0.25  # From 0.5 to 0.25 for slower decay
        base_lr = self.learningRate
        min_lr = 0.0005  # Add minimum learning rate

        if self.step_num < warmup_steps:
            lr = base_lr * (self.step_num / warmup_steps)
        else:
            lr = base_lr * (warmup_steps ** 0.5) * ((self.step_num * decay_factor) ** -0.5)
        
        # Apply cyclical learning rate adjustment
        cycle_length = 50  # Steps per cycle
        cycle_position = self.step_num % cycle_length
        cycle_ratio = cycle_position / cycle_length
        cycle_factor = 1.0  # Set to constant 1.0 instead of using sine wave
        lr = lr * cycle_factor
        
        # Apply minimum learning rate
        lr = max(min_lr, lr)
        
        print(f"Learning rate: {lr}, cyclical factor: {cycle_factor:.4f} calculated in", timer_end(timer), "ms")
        
        print("Computing gradients...")
        gtimer2 = timer_()
        
        # Get predicted probabilities and compute error gradients
        predicted_probs = self.softmax(cache["vocab_scores"])
        epsilon = 0 #Changed from 0.05 to 0 for better overfitting
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / (vocab_size - 1)) for _ in range(vocab_size)]
        
        # Find the index of target_token[1] in the vocabulary
        target_idx = None
        for i, token in enumerate(self.vocab):
            if token[1] == target_token[1]:
                target_idx = i
                break
        
        if target_idx is None:
            print(f"Warning: Token ID {target_token[1]} not found in vocabulary")
            target_idx = 0
        
        target_distribution[target_idx] = 1.0 - epsilon
        
        # Calculate initial error using pure Python
        initial_error = [predicted_probs[i] - target_distribution[i] for i in range(len(predicted_probs))]
        
        # Initialize error gradients with zeros
        error_gradients = [[0.0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]

        # Propagate gradients through vocabulary projection layer
        for j in range(self.embeddingSize):
            for k in range(len(self.vocab)):
                error_gradients[-1][j] += initial_error[k] * self.transformer["vocab_projection"]["weights"][k * self.embeddingSize + j][0]
        
        # Initialize gradient accumulators
        embedding_gradients = [[0 for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
        layer_gradients = []
        for _ in range(self.layersAmount):
            layer_grad = {
                "weights": self.initialize_zero_gradients(self.transformer["layers"][0]["weights"]),
                "biases": self.initialize_zero_gradients(self.transformer["layers"][0]["biases"])
            }
            layer_gradients.append(layer_grad)

        # Backpropagation through layers
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
            
            # Accumulate gradients from all heads
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
                            att_grad[i][j] += head_cache["attention_probs"][i][k] * v_grad[k][j]

            # Fixed: Properly combine all head outputs
            for i in range(len(input_tokens)):
                concatenated = []
                # Get outputs from ALL heads, not just the last one
                for head_idx in range(self.heads):
                    concatenated.extend(layer_cache["heads"][head_idx]["output"][i])
                    
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * self.heads):
                        layer_gradients[layer_idx]["weights"]["attention"]["output"][j * (self.embeddingSize * self.heads) + k][0] += next_grad[i][j] * concatenated[k]
                    layer_gradients[layer_idx]["biases"]["attention"]["output"][j][0] += next_grad[i][j]
            
            # Layer norm gradients
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_2"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_2"][j][0] += next_grad[i][j]

            # First layer normalization gradients
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    layer_gradients[layer_idx]["weights"]["normalize_1"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j]
                    layer_gradients[layer_idx]["biases"]["normalize_1"][j][0] += next_grad[i][j]

            # Combine gradients for next layer
            next_grad = [[next_grad[i][j] + att_grad[i][j] for j in range(self.embeddingSize)] for i in range(len(input_tokens))]
            
            # Update embedding gradients
            for i in range(len(input_tokens)):
                embedding_gradients[i] = self.add_vectors(embedding_gradients[i], next_grad[i])

        print("Computed gradients in", timer_end(gtimer2), "ms")

        print("Applying continuous gradient scaling...")
        timer = timer_()

        # Define a hyperparameter to control scaling aggressiveness
        gamma = 5.0  # You can adjust gamma based on training dynamics

        # Compute the global gradient norm using your helper function
        global_grad_norm = compute_global_norm(embedding_gradients, layer_gradients)
        print(f"Global gradient norm: {global_grad_norm:.6f}")

        # Compute a continuous scaling factor:
        # When global_grad_norm is small, tanh(x)/x is near 1.
        if global_grad_norm == 0:
            scaling_factor = 1.0
        else:
            scaling_factor = math.tanh(global_grad_norm / gamma) / (global_grad_norm / gamma)

        print(f"Scaling gradients with factor {scaling_factor:.6f}")

        # Scale embedding gradients uniformly
        for i in range(len(embedding_gradients)):
            for j in range(len(embedding_gradients[i])):
                embedding_gradients[i][j] *= scaling_factor

        # Recursive function to scale nested layer gradients
        def scale_gradients(grad_struct, factor):
            if isinstance(grad_struct, list):
                if len(grad_struct) > 0 and isinstance(grad_struct[0], (int, float)):
                    grad_struct[0] *= factor
                return
            elif isinstance(grad_struct, dict):
                for key, value in grad_struct.items():
                    scale_gradients(value, factor)

        # Scale all layer gradients uniformly
        for layer_idx in range(len(layer_gradients)):
            scale_gradients(layer_gradients[layer_idx], scaling_factor)

        print("Applied continuous gradient scaling in", timer_end(timer), "ms")

        
        print("Updating parameters...")
        timer = timer_()
        
        # Decide which optimizer to use
        print(f"Using {optimizer} optimizer...")
        
        # Weight decay parameter
        weight_decay = 0  # L2 regularization factor, changed from 1e-5 to 0 for faster overfitting

        # For SGD with momentum
        momentum_factor = 0.5  # Classic momentum value
        if optimizer == "sgd_momentum" and not hasattr(self, 'momentum_initialized'):
            print("Initializing momentum for first use")
            self.momentum_initialized = True

        # Update embeddings
        vocab_indices = {}  # Track which token indices we've updated
        for token_idx, (token, token_id) in enumerate(input_tokens):
            # Find the index in vocabulary
            vocab_idx = None
            for i, vocab_token in enumerate(self.vocab):
                if vocab_token[1] == token_id:
                    vocab_idx = i
                    break
            
            if vocab_idx is not None:
                vocab_indices[vocab_idx] = True  # Mark this index as updated
                for pos in range(self.embeddingSize):
                    grad = embedding_gradients[token_idx][pos]
                    param = self.transformer["embeddings"][vocab_idx][pos]
                    
                    # Get gradient value
                    grad_value = grad if isinstance(grad, (int, float)) else grad[0] if isinstance(grad, list) else 0
                    
                    # Add weight decay (L2 regularization)
                    grad_value += weight_decay * param[0]
                    
                    if optimizer == "adam":
                        # Adam update
                        param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                        param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                        
                        # Compute bias-corrected estimates
                        m_hat = param[1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                        v_hat = param[2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                        
                        # Update parameter value (at index 0)
                        param[0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                    elif optimizer == "sgd_momentum":
                        # SGD with momentum update
                        param[1] = momentum_factor * param[1] + grad_value
                        param[0] -= lr * param[1]
                    else:
                        # Plain SGD update
                        param[0] -= lr * grad_value

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
                            
                            # Get gradient value
                            grad_value = grad[0] if isinstance(grad, list) else grad
                            
                            # Add weight decay (L2 regularization)
                            if param_type == "weights":  # Only apply to weights, not biases
                                grad_value += weight_decay * param[0]
                            
                            if optimizer == "adam":
                                # Adam update
                                param[1] = self.adam_params['beta1'] * param[1] + (1 - self.adam_params['beta1']) * grad_value
                                param[2] = self.adam_params['beta2'] * param[2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                
                                # Compute bias-corrected estimates
                                m_hat = param[1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                v_hat = param[2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                
                                # Update parameter
                                param[0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                            elif optimizer == "sgd_momentum":
                                # SGD with momentum update
                                param[1] = momentum_factor * param[1] + grad_value
                                param[0] -= lr * param[1]
                            else:
                                # SGD update
                                param[0] -= lr * grad_value
                                
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
                                                
                                                # Add weight decay (L2 regularization)
                                                if param_type == "weights":  # Only apply to weights, not biases
                                                    grad_value += weight_decay * head_params[i][0]
                                                
                                                if optimizer == "adam":
                                                    # Adam update
                                                    head_params[i][1] = self.adam_params['beta1'] * head_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                                    head_params[i][2] = self.adam_params['beta2'] * head_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                                    
                                                    # Compute bias-corrected estimates
                                                    m_hat = head_params[i][1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                                    v_hat = head_params[i][2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                                    
                                                    # Update parameter
                                                    head_params[i][0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                                                elif optimizer == "sgd_momentum":
                                                    # SGD with momentum update
                                                    head_params[i][1] = momentum_factor * head_params[i][1] + grad_value
                                                    head_params[i][0] -= lr * head_params[i][1]
                                                else:
                                                    # SGD update
                                                    head_params[i][0] -= lr * grad_value
                            else:
                                # For other nested dictionaries like "output"
                                nested_params = layer[param_type][key][subkey]
                                nested_grads = layer_grad[param_type][key][subkey]
                                
                                if isinstance(nested_params, list) and isinstance(nested_grads, list):
                                    for i in range(len(nested_params)):
                                        if isinstance(nested_params[i], list) and len(nested_params[i]) >= 3:
                                            # Get the gradient
                                            grad_value = nested_grads[i][0] if isinstance(nested_grads[i], list) else nested_grads[i]
                                            
                                            # Add weight decay (L2 regularization)
                                            if param_type == "weights":  # Only apply to weights, not biases
                                                grad_value += weight_decay * nested_params[i][0]
                                            
                                            if optimizer == "adam":
                                                # Adam update
                                                nested_params[i][1] = self.adam_params['beta1'] * nested_params[i][1] + (1 - self.adam_params['beta1']) * grad_value
                                                nested_params[i][2] = self.adam_params['beta2'] * nested_params[i][2] + (1 - self.adam_params['beta2']) * (grad_value ** 2)
                                                
                                                # Compute bias-corrected estimates
                                                m_hat = nested_params[i][1] / (1 - self.adam_params['beta1'] ** self.adam_params['t'])
                                                v_hat = nested_params[i][2] / (1 - self.adam_params['beta2'] ** self.adam_params['t'])
                                                
                                                # Update parameter
                                                nested_params[i][0] -= lr * m_hat / (math.sqrt(v_hat) + self.adam_params['epsilon'])
                                            elif optimizer == "sgd_momentum":
                                                # SGD with momentum update
                                                nested_params[i][1] = momentum_factor * nested_params[i][1] + grad_value
                                                nested_params[i][0] -= lr * nested_params[i][1]
                                            else:
                                                # SGD update
                                                nested_params[i][0] -= lr * grad_value

        print("Updated parameters in", timer_end(timer), "ms")
        param_to_check = self.transformer["embeddings"][0][0]
        if optimizer == "adam":
            print(f"Sample Adam values: momentum={param_to_check[1]}, velocity={param_to_check[2]}")
            self.check_adam_state()
        elif optimizer == "sgd_momentum":
            print(f"Sample momentum value: {param_to_check[1]}")
        else:
            print("Using SGD - no momentum/velocity values to report")
        print("Training step completed in", timer_end(gtimer), "ms")
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
    
    def train(self, epochs=1, optimizer="sgd"):
        """
        Train the model for the specified number of epochs using the specified optimizer.
        
        Args:
            epochs: Number of epochs to train for
            optimizer: Which optimizer to use - "sgd", "sgd_momentum", or "adam"
        """
        import threading
        import time
        
        if optimizer not in ["sgd", "sgd_momentum", "adam"]:
            print(f"Unknown optimizer: {optimizer}, falling back to SGD")
            optimizer = "sgd"
        
        print(f"\n{'='*40}\nStarting training with {optimizer} optimizer\n{'='*40}\n")
        
        # Initialize loss tracking
        best_loss = float('inf')
        epoch_losses = []
        continue_training = True
        self.loss_history = []
        loss_window_size = 10
        
        # For detecting plateaus
        plateau_patience = 5
        plateau_counter = 0
        last_best_loss = float('inf')
        
        # Define sweet spot range
        sweet_spot_min = 2.0
        sweet_spot_max = 5.0
        last_saved_sweet_spot_loss = float('inf')  # Track last saved loss
        
        for epoch in range(epochs):
            if not continue_training:
                print(f"Training stopped at epoch {epoch}/{epochs}")
                break
            
            # Add the separator for each epoch
            print("\n" + "-"*60)
            print(f"Epoch {epoch + 1}/{epochs}")
            print("-"*60 + "\n")
                
            # Calculate total IO pairs in the dataset
            total_io_pairs = sum(len(tokens) - 1 for tokens in self.tokenized_dataset)
            processed_io_pairs = 0

            timer = timer_()
            print("Starting epoch", epoch + 1)

            # Track losses for this epoch
            batch_losses = []

            for i in range(len(self.tokenized_dataset)):
                stimer = timer_()
                print("Training on item", i + 1, "/", len(self.tokenized_dataset))
                tokens = self.tokenized_dataset[i]
                
                # Track dataset loss for the current item
                dataset_total_loss = 0.0
                sequence_positions = 0
                
                for j in range(len(tokens) - 1):
                    input_tokens = tokens[:j+1]
                    target_token = tokens[j+1]
                    loss = self.train_step(input_tokens, target_token, optimizer, training_mode=True)
                    
                    dataset_total_loss += loss
                    sequence_positions += 1
                    
                    processed_io_pairs += 1
                    
                    # Compute progress for the current IO pair within the current item
                    current_item_progress = ((j+1) / (len(tokens) - 1)) * 100
                    # Compute overall progress across all IO pairs in the dataset
                    overall_progress = (processed_io_pairs / total_io_pairs) * 100
                    
                    print(f"Loss: {loss:.4f} (IO pair {j+1}/{len(tokens)-1}) | " +
                        f"Current IO pair progress: {current_item_progress:.2f}% | " +
                        f"Overall IO pairs progress: {overall_progress:.2f}%", flush=True)
                
                # Calculate average loss for this dataset item
                avg_item_loss = dataset_total_loss / sequence_positions
                batch_losses.append(avg_item_loss)
                print(f"Average loss for item {i+1}: {avg_item_loss:.4f}")
                print("Trained on item", i + 1, "in", timer_end(stimer), "ms")
                
            # Calculate epoch average loss
            avg_epoch_loss = sum(batch_losses) / len(batch_losses)
            epoch_losses.append(avg_epoch_loss)
            self.loss_history.append(avg_epoch_loss)
            print(f"Epoch {epoch + 1} average loss: {avg_epoch_loss:.6f}")
            
            # Check for plateaus
            if len(self.loss_history) >= loss_window_size:
                avg_recent_loss = sum(self.loss_history[-loss_window_size:]) / loss_window_size
                print(f"Average loss over last {loss_window_size} epochs: {avg_recent_loss:.6f}")
                
                # Check for plateaus
                if best_loss == last_best_loss:
                    plateau_counter += 1
                    if plateau_counter >= plateau_patience:
                        print(f"Warning: Training appears to be plateauing for {plateau_counter} epochs")
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
                    print("\n" + "-"*60)
                    print(f"REACHED SWEET SPOT LOSS! Auto-saving model")
                    print("-"*60 + "\n")
                else:
                    print("\n" + "-"*60)
                    print(f"SIGNIFICANT IMPROVEMENT IN SWEET SPOT! Auto-saving model")
                    print(f"Previous saved: {last_saved_sweet_spot_loss:.2f}, Current: {avg_epoch_loss:.2f}")
                    print("-"*60 + "\n")
                
                try:
                    self.save(save_path)
                    print(f"Sweet spot model saved to {save_path}")
                    last_saved_sweet_spot_loss = avg_epoch_loss  # Update last saved loss
                except Exception as e:
                    print(f"Error saving sweet spot model: {e}")
            
            # Update best loss if needed
            if is_best_loss:
                # If best_loss isn't infinity, report the previous best loss
                if best_loss != float('inf'):
                    print("\n" + "-"*60)
                    print(f"NEW BEST LOSS ACHIEVED! Previous best loss was: {best_loss:.6f}")
                    print("-"*60 + "\n")
                else:
                    print("\n" + "-"*60)
                    print("NEW BEST LOSS ACHIEVED!")
                    print("-"*60 + "\n")
                
                best_loss = avg_epoch_loss  # Update best_loss
                print(f"New best loss: {best_loss:.6f}! Let's test the model:")
            
            # Allow testing after each epoch completion (if not already prompting for best loss)
            should_prompt = not is_best_loss  # Only prompt if we're not already prompting for best loss
            
            # Prompt testing interface (used for both best loss and end of epoch)
            if is_best_loss or should_prompt:
                # Let user test the model with a timeout
                continue_testing = True
                
                while continue_testing:
                    # Construct appropriate prompt based on whether it's best loss or regular epoch end
                    prompt_text = "Enter test input" if is_best_loss else f"Epoch {epoch+1} complete. Enter test input"
                    
                    # Get available optimizer alternatives
                    optimizer_options = []
                    if optimizer != "sgd":
                        optimizer_options.append("sgd")
                    if optimizer != "sgd_momentum":
                        optimizer_options.append("sgd_momentum")
                    if optimizer != "adam":
                        optimizer_options.append("adam")
                    
                    optimizer_switch_options = " or ".join([f"/switch_to_{opt}" for opt in optimizer_options])
                    
                    # Use a thread-based approach for input with timeout
                    user_input = [None]
                    input_received = [False]
                    
                    def input_thread_func():
                        try:
                            user_input[0] = input(f"{prompt_text} within 30 seconds (or /stop_training, /continue, /save, or {optimizer_switch_options}): ")
                            input_received[0] = True
                        except:
                            pass
                    
                    # Start input thread
                    input_thread = threading.Thread(target=input_thread_func)
                    input_thread.daemon = True
                    input_thread.start()
                    
                    # Wait for input or timeout
                    timeout = 30
                    start_time = time.time()
                    while not input_received[0] and time.time() - start_time < timeout:
                        time.sleep(0.1)
                    
                    if not input_received[0]:
                        # Properly handle timeout - explicitly break out of this testing loop
                        print("\nTimeout reached. Automatically continuing training...")
                        continue_testing = False
                        # Don't need to continue past this point if timed out
                        break
                    
                    # Process user input
                    test_input = user_input[0]
                    
                    if test_input == "/stop_training":
                        continue_training = False
                        continue_testing = False
                        print("Training will stop after this epoch")
                    elif test_input == "/continue":
                        continue_testing = False
                        print("Continuing training...")
                    elif test_input.startswith("/switch_to_") and test_input[11:] in ["sgd", "sgd_momentum", "adam"]:
                        new_optimizer = test_input[11:]
                        continue_testing = False
                        optimizer = new_optimizer
                        print(f"Switching to {new_optimizer.upper()} optimizer for next epochs")
                    elif test_input == "/save":
                        # New thread for save path input
                        save_input = [None]
                        save_received = [False]
                        
                        def save_thread_func():
                            try:
                                save_input[0] = input(f"Enter save path within 30 seconds (or press Enter for default 'model_{optimizer}.json'): ")
                                save_received[0] = True
                            except:
                                pass
                        
                        # Start save input thread
                        save_thread = threading.Thread(target=save_thread_func)
                        save_thread.daemon = True
                        save_thread.start()
                        
                        # Wait for input or timeout
                        start_time = time.time()
                        while not save_received[0] and time.time() - start_time < timeout:
                            time.sleep(0.1)
                        
                        if not save_received[0]:
                            # Timeout occurred
                            print(f"\nTimeout reached. Using default path 'model_{optimizer}.json'")
                            save_path = f"model_{optimizer}.json"
                        else:
                            save_path = save_input[0] if save_input[0] else f"model_{optimizer}.json"
                        
                        try:
                            self.save(save_path)
                            print(f"Model saved to {save_path}")
                        except Exception as e:
                            print(f"Error saving model: {e}")
                    else:
                        try:
                            def generate_response(text, temp=1e-10):
                                # In your interactive loop:
                                formatted_input = f"user:\n{text}\nyou:\n"
                                print(f"Debug - Formatted input: '{formatted_input}'")
                                tokenized = self.tokenize(formatted_input)
                                print(f"Debug - Tokenized input: {tokenized}")
                                output = self.generate(formatted_input, temperature=1e-10)
                            output = generate_response(test_input)
                            print(f"Generated output: {output}")
                        except Exception as e:
                            print(f"Error generating output: {e}")
                
            print("Epoch", epoch + 1, "completed in", timer_end(timer), "ms")
        
        print(f"\n{'='*40}\nTraining completed after {len(epoch_losses)} epochs\nFinal loss: {epoch_losses[-1]:.6f}\nBest loss: {best_loss:.6f}\n{'='*40}\n")
        return best_loss
    
    def inference(self, context, return_cache, training_mode=False):
        def scale_activation(vector, base_gamma=5.0):
            global printdontprint
            """Dramatically more aggressive scaling for extreme values"""
            norm = math.sqrt(sum(x * x for x in vector))
            if printdontprint:
                print(f"Activation norm: {norm}")
            printdontprint = not printdontprint

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
                dropout_rate = 0  # 10% dropout, changed to 0 because we wanna overfit
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
                dropout_rate = 0  # 0% dropout for overfitting
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

        if return_cache:
            return [self.vocab[next_token][0], next_token], cache
        return [self.vocab[next_token][0], next_token]  # Return [token_string, token_id]
    def generate(self, context, temperature=0.8):
        current_context = context
        output = ""
        
        print(f"Debug - Starting generation with context: '{context}'")
        print(f"Debug - Using temperature: {temperature}")
        
        for step in range(self.maxOutputSize):
            next_token, cache = self.inference(current_context, True)
            print(f"Debug - Step {step}, inference returned token: {next_token}")
            
            # Get vocab scores
            scores = cache["vocab_scores"]
            
            # For near-zero temperature, directly pick highest probability token
            if temperature < 0.0001:
                highest_score = float('-inf')
                next_token_idx = 0
                
                # Print top 5 scores for debugging
                top_scores = [(i, scores[i]) for i in range(len(scores))]
                top_scores.sort(key=lambda x: x[1], reverse=True)
                print(f"Debug - Top 5 token scores:")
                for i in range(min(5, len(top_scores))):
                    idx, score = top_scores[i]
                    token_info = self.vocab[idx]
                    print(f"  {i+1}. Token '{token_info[0]}' (ID: {token_info[1]}): {score}")
                
                # Find highest scoring token
                for i, score in enumerate(scores):
                    if score > highest_score:
                        highest_score = score
                        next_token_idx = i
                
                next_token = [self.vocab[next_token_idx][0], self.vocab[next_token_idx][1]]
                print(f"Debug - Selected highest probability token: {next_token}")
            else:
                # Normal temperature-based sampling
                scaled_scores = [score / temperature for score in scores]
                probs = self.softmax(scaled_scores)
                
                random_value = random([0, 1])
                print(f"Debug - Random value for sampling: {random_value}")
                
                cumulative_prob = 0.0
                next_token_idx = 0
                
                for i, prob in enumerate(probs):
                    cumulative_prob += prob
                    if random_value <= cumulative_prob:
                        next_token_idx = i
                        break
                
                next_token = [self.vocab[next_token_idx][0], self.vocab[next_token_idx][1]]
                print(f"Debug - Selected token through sampling: {next_token}")
            
            # Check for end token (100257)
            if next_token[1] == 100257:
                print("Debug - End token detected, breaking generation loop")
                break
            
            # Add token to output
            output += next_token[0]
            current_context += next_token[0]
            print(f"Debug - Current output: '{output}'")
        
        print(f"Debug - Final generated output: '{output}'")
        return output

try:
    dataset = json.loads(open("dataset.json", "r").read())
except Exception:
    print("Failed to read dataset, exiting...")
    exit(1)

flag = True

if flag:
    transformer = Transformer(True, {
        "contextSize": 64,              
        "embeddingSize": 32,            
        "learningRate": 0.001,           
        "maxOutputSize": 16,            
        "layersAmount": 2,              
        "heads": 2,                     
        "use_he_init": True,            # Add this to use He initialization
        "biasesinitrange": [-0.01, 0.01],
        "embeddinginitrange": [-0.1, 0.1],
        "dataset": dataset
    })

    # Start training with SGD + Momentum
    transformer.train(1000, optimizer="sgd")
else:
    transformer = Transformer(new=False, path="model_sgd.json", parameters={
        "dataset": dataset
    })

try:
    print("\nEntering interactive mode. Type a message or command:")
    print("Commands: /save [path]")
    
    def generate_response(text, temp=1e-10):
        # In your interactive loop:
        formatted_input = f"user:\n{text}\nyou:\n"
        print(f"Debug - Formatted input: '{formatted_input}'")
        tokenized = transformer.tokenize(formatted_input)
        print(f"Debug - Tokenized input: {tokenized}")
        output = transformer.generate(formatted_input, temperature=1e-10)
    
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
        
        print("Input tokens:", [token[0] for token in transformer.tokenize(f"user:\n{text}\nyou:\n")])
        output = generate_response(text)
        print("Generated output:", output)
except KeyboardInterrupt:
    exit(0)