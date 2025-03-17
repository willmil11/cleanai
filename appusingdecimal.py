from decimal import Decimal, getcontext
import decimal
import mpmath as mp
import tiktoken
from sys import exit
import time
import random as rd
import uuid
import json

# Add after imports around line 12
operation_precision_cache = {}
math_base_precision = 16
math_max_precision = 16384
math_precision_step = 8

def compute_adaptive_function(func_name, x, base_precision=math_base_precision, debug_calc_print=False):
    """Compute a mathematical function with adaptive precision."""
    # Store original precision to restore later
    original_precision = getcontext().prec
    
    # Generate a cache key
    key = (func_name, str(x))
    
    # Get cached precision if available, otherwise use base
    precision = operation_precision_cache.get(key, base_precision)
    
    # Handle special cases before computation
    if isinstance(x, str):
        x_lower = x.lower()
        if x_lower in ('-infinity', '-inf'):
            return Decimal('-Infinity')
        elif x_lower in ('infinity', 'inf'):
            return Decimal('Infinity')
        elif x_lower == 'nan':
            return Decimal('NaN')
    
    # Maximum attempts to try
    max_attempts = 5
    attempt = 0
    
    # Try with increasing precision
    while attempt < max_attempts and precision <= math_max_precision:
        try:
            attempt += 1
            
            # Set precision for this calculation
            getcontext().prec = precision
            mp.mp.dps = precision
            if debug_calc_print:
                print(f"[{func_name}] Attempt {attempt}/{max_attempts} with precision {precision}")
            
            # Handle different function types
            if func_name == 'exp':
                # Special handling for exp to avoid overflow
                if float(x) < -1000:
                    result = Decimal('0')
                elif float(x) > 1000:
                    result = Decimal('1e5000')  # A very large but manageable number
                else:
                    result = Decimal(str(mp.exp(mp.mpf(str(x)))))
            elif func_name == 'log':
                # Special handling for log to avoid domain errors
                if float(x) <= 0:
                    raise ValueError(f"Domain error: log({x})")
                result = Decimal(str(mp.log(mp.mpf(str(x)))))
            elif func_name == 'sqrt':
                # Special handling for sqrt to avoid domain errors
                if float(x) < 0:
                    raise ValueError(f"Domain error: sqrt({x})")
                result = Decimal(str(mp.sqrt(mp.mpf(str(x)))))
            elif func_name == 'sin':
                result = Decimal(str(mp.sin(mp.mpf(str(x)))))
            elif func_name == 'cos':
                result = Decimal(str(mp.cos(mp.mpf(str(x)))))
            elif func_name == 'tanh':
                # Special handling for tanh to avoid overflow
                if float(x) < -50:
                    result = Decimal('-1')
                elif float(x) > 50:
                    result = Decimal('1')
                else:
                    result = Decimal(str(mp.tanh(mp.mpf(str(x)))))
            else:
                raise ValueError(f"Unknown function: {func_name}")
            
            # Cache the precision that worked
            operation_precision_cache[key] = precision
            
            # Restore original precision
            getcontext().prec = original_precision
            mp.mp.dps = original_precision
            
            return result
            
        except (decimal.InvalidOperation, OverflowError, ValueError, mp.libmp.libmp.Error) as e:
            print(f"[{func_name}] Error at precision {precision}: {e}")
            precision += math_precision_step
            operation_precision_cache[key] = precision
    
    # If we reach here, all attempts failed
    print(f"[{func_name}] All attempts failed, using fallback value")
    
    # Restore original precision
    getcontext().prec = original_precision
    mp.mp.dps = original_precision
    
    # Provide a sensible fallback based on the function
    if func_name == 'exp':
        return Decimal('0') if float(x) < 0 else Decimal('1e5000')
    elif func_name == 'log':
        return Decimal('-1e5000') if float(x) < 1 else Decimal('1e5000')
    elif func_name == 'sqrt':
        return Decimal('0') if float(x) < 0.001 else Decimal('1e5000')
    elif func_name == 'sin':
        return Decimal('0')
    elif func_name == 'cos':
        return Decimal('1')
    elif func_name == 'tanh':
        return Decimal('-1') if float(x) < 0 else Decimal('1')
    else:
        return Decimal('0')

# Add wrapper functions after compute_adaptive_function
def exp(x):
    return compute_adaptive_function('exp', x)

def log(x):
    return compute_adaptive_function('log', x)

def sqrt(x):
    return compute_adaptive_function('sqrt', x)

def sin(x):
    return compute_adaptive_function('sin', x)

def cos(x):
    return compute_adaptive_function('cos', x)

def tanh(x):
    return compute_adaptive_function('tanh', x)

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

# A helper to generate Decimal random numbers
def random_decimal(range_tuple):
    # Convert bounds to floats then wrap result in Decimal
    return Decimal(str(rd.uniform(float(range_tuple[0]), float(range_tuple[1]))))

# We also override our random function to use our new helper
def random(range_tuple):
    return random_decimal(range_tuple)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

class Transformer:
    def __init__(self, new=False, parameters=None, path=None, vocab_path="vocabulary.json"):
        # Use Decimal for arbitrary precision.
        self.adam_params = {
            'beta1': Decimal('0.9'),
            'beta2': Decimal('0.98'),
            'epsilon': Decimal('1e-9'),
            't': 0
        }
        self.inference_precision_cache = {}
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
            # Some parameters remain as integers
            self.contextSize = parameters["contextSize"]
            self.embeddingSize = parameters["embeddingSize"]
            self.learningRate = Decimal(str(parameters["learningRate"]))
            self.maxOutputSize = parameters["maxOutputSize"]
            self.layersAmount = parameters["layersAmount"]
            if "use_he_init" in parameters and parameters["use_he_init"]:
                self.weightsinitrange = self.he_init(self.embeddingSize)
                print(f"Using He initialization with range: {self.weightsinitrange}")
            else:
                self.weightsinitrange = (Decimal(str(parameters["weightsinitrange"][0])), Decimal(str(parameters["weightsinitrange"][1])))
            self.biasesinitrange = (Decimal(str(parameters["biasesinitrange"][0])), Decimal(str(parameters["biasesinitrange"][1])))
            self.heads = parameters["heads"]
            self.dataset = parameters["dataset"]
            self.embeddinginitrange = (Decimal(str(parameters["embeddinginitrange"][0])), Decimal(str(parameters["embeddinginitrange"][1])))
            self.transformer = {}
            self.step_num = 0
            print("Initialized parameters in", timer_end(timer), "ms")
            print("Initializing layers...")
            gtimer = timer_()
            self.transformer["layers"] = []
            # In every numeric initialization below, we now wrap numeric literals with Decimal.
            for i in range(self.layersAmount):
                timer = timer_()
                print("Initializing weights and biases for layer", i)
                self.transformer["layers"].append({
                    "weights": {
                        "normalize_1": [],
                        "attention": {
                            "heads": [
                                {
                                    "query": [],
                                    "key": [],
                                    "value": []
                                } for _ in range(self.heads)
                            ],
                            "output": []
                        },
                        "normalize_2": [],
                        "feed_forward": {
                            "grow": [],
                            "shrink": []
                        }
                    },
                    "biases": {
                        "normalize_1": [],
                        "attention": {
                            "heads": [
                                {
                                    "query": [],
                                    "key": [],
                                    "value": []
                                } for _ in range(self.heads)
                            ],
                            "output": []
                        },
                        "normalize_2": [],
                        "feed_forward": {
                            "grow": [],
                            "shrink": []
                        }
                    }
                })
                # For loops: when appending, use random() (which now returns Decimal)
                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["weights"]["normalize_1"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                    self.transformer["layers"][i]["biases"]["normalize_1"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                    self.transformer["layers"][i]["weights"]["normalize_2"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                    self.transformer["layers"][i]["biases"]["normalize_2"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.heads):
                    for k in range(self.embeddingSize * self.embeddingSize):
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                        self.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                    for k in range(self.embeddingSize):
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                        self.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.embeddingSize * (self.embeddingSize * self.heads)):
                    self.transformer["layers"][i]["weights"]["attention"]["output"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["biases"]["attention"]["output"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.embeddingSize * (self.embeddingSize * 4)):
                    self.transformer["layers"][i]["weights"]["feed_forward"]["grow"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.embeddingSize * 4):
                    self.transformer["layers"][i]["biases"]["feed_forward"]["grow"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                for j in range((self.embeddingSize * 4) * self.embeddingSize):
                    self.transformer["layers"][i]["weights"]["feed_forward"]["shrink"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
                for j in range(self.embeddingSize):
                    self.transformer["layers"][i]["biases"]["feed_forward"]["shrink"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
                print("Initialized weights and biases for layer", i, "in", timer_end(timer), "ms")
            print("Initialized layers in", timer_end(gtimer), "ms")
            print("Initializing embeddings...")
            timer = timer_()
            self.transformer["embeddings"] = []
            for i in range(len(self.vocab)):
                embedding = []
                for j in range(self.embeddingSize):
                    embedding.append([random(self.embeddinginitrange), Decimal('0'), Decimal('0')])
                self.transformer["embeddings"].append(embedding)
            print("Initialized embeddings in", timer_end(timer), "ms")
            print("Initializing vocabulary projection weights and biases...")
            timer = timer_()
            self.transformer["vocab_projection"] = {
                "weights": [],
                "biases": []
            }
            for i in range(len(self.vocab) * self.embeddingSize):
                self.transformer["vocab_projection"]["weights"].append([random(self.weightsinitrange), Decimal('0'), Decimal('0')])
            for i in range(len(self.vocab)):
                self.transformer["vocab_projection"]["biases"].append([random(self.biasesinitrange), Decimal('0'), Decimal('0')])
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
                # When loading, use an object_hook to convert numeric strings to Decimals
                def decimal_object_hook(dct):
                    for key, value in dct.items():
                        if isinstance(value, str):
                            try:
                                dct[key] = Decimal(value)
                            except:
                                pass
                    return dct
                model = json.loads(open(path, "r").read(), object_hook=decimal_object_hook)
                self.transformer = model["transformer"]
                self.contextSize = model["contextSize"]
                self.embeddingSize = model["embeddingSize"]
                self.learningRate = model["learningRate"]
                self.maxOutputSize = model["maxOutputSize"]
                self.layersAmount = model["layersAmount"]
                self.weightsinitrange = (Decimal(model["weightsinitrange"][0]), Decimal(model["weightsinitrange"][1]))
                self.biasesinitrange = (Decimal(model["biasesinitrange"][0]), Decimal(model["biasesinitrange"][1]))
                self.heads = model["heads"]
                if "dataset" in model:
                    self.dataset = model["dataset"]
                elif parameters and "dataset" in parameters:
                    print("Dataset not found in model file, using provided dataset")
                    self.dataset = parameters["dataset"]
                else:
                    raise Exception("No dataset found in model or parameters")
                self.embeddinginitrange = (Decimal(model["embeddinginitrange"][0]), Decimal(model["embeddinginitrange"][1]))
                self.adam_params = model["adam_params"]
                self.inference_precision_cache = {}
                self.step_num = model["step_num"]
            except Exception as e:
                print("Failed to read model file, creating error...", e)
                raise Exception("Failed to read model file")
            print("Successfully read model from file")
    
    def he_init(self, fan_in):
        # Using our custom sqrt
        scale = sqrt(Decimal('2.0') / Decimal(fan_in))
        return (-scale, scale)

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
                denominator = Decimal('10000') ** (Decimal(2 * (i // 2)) / Decimal(self.embeddingSize))
                if i % 2 == 0:
                    embedding.append(sin(Decimal(pos) / Decimal(str(denominator))))
                else:
                    embedding.append(cos(pos / denominator))
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
                    vector_list.append(Decimal(str(x)))
                elif isinstance(x, list) and len(x) > 0:
                    vector_list.append(Decimal(str(x[0])))
                else:
                    vector_list.append(Decimal(str(x)))

            except:
                # If all else fails, use 0.0
                vector_list.append(Decimal('0'))
        
        # Calculate mean using pure Python
        mean = sum(vector_list) / Decimal(len(vector_list))
        
        # Calculate variance and standard deviation with numerical safeguards
        squared_diffs = []
        for x in vector_list:
            # Clip differences to prevent extreme values
            diff = x - mean
            if diff > Decimal('1e6'):
                diff = Decimal('1e6')
            elif diff < Decimal('-1e6'):
                diff = Decimal('-1e6')
            squared_diffs.append(diff * diff)
        
        variance = sum(squared_diffs) / len(vector_list)
        
        # Ensure std is not too small to prevent division issues
        std = sqrt(variance + Decimal('1e-10'))
        
        if std < Decimal('1e-6'):
            return [Decimal('0') for _ in range(len(vector_list))]
        
        # Return normalized values with clipping for safety
        normalized = []
        for x in vector_list:
            norm_val = (x - mean) / std
            # Clip normalized values to reasonable range
            if norm_val > Decimal('10'):
                norm_val = Decimal('10')
            elif norm_val < Decimal('-10'):
                norm_val = Decimal('-10')
            normalized.append(norm_val)
        
        return normalized

    def dot_product(self, vec1, vec2):
        # Store original precision to restore later
        original_precision = getcontext().prec
        
        # Generate a cache key
        key = ("dot_product", str(vec1[:5]), str(vec2[:5]))  # Use only first 5 elements for key
        
        # Get cached precision if available, otherwise use base
        precision = operation_precision_cache.get(key, math_base_precision)
        
        # Maximum attempts to try
        max_attempts = 5
        attempt = 0
        
        # Try with increasing precision
        while attempt < max_attempts and precision <= math_max_precision:
            try:
                attempt += 1
                
                # Set precision for this calculation
                getcontext().prec = precision
                mp.mp.dps = precision
                print(f"[dot_product] Attempt {attempt}/{max_attempts} with precision {precision}")
                
                # Compute dot product manually with careful type handling
                result = Decimal('0')
                for a, b in zip(vec1, vec2):
                    product = Decimal(str(a)) * Decimal(str(b))
                    result += product
                
                # Check if result is finite
                if not result.is_finite():
                    raise OverflowError(f"Non-finite dot product result: {result}")
                
                # Cache the precision that worked
                operation_precision_cache[key] = precision
                
                # Restore original precision
                getcontext().prec = original_precision
                mp.mp.dps = original_precision
                
                return result
                
            except (decimal.InvalidOperation, OverflowError, ValueError, mp.libmp.libmp.Error) as e:
                print(f"[dot_product] Error at precision {precision}: {e}")
                precision += math_precision_step
                operation_precision_cache[key] = precision
        
        # If we reach here, all attempts failed
        print(f"[dot_product] All attempts failed, using fallback value")
        
        # Restore original precision
        getcontext().prec = original_precision
        mp.mp.dps = original_precision
        
        # Provide a sensible fallback
        return Decimal('0')

    def add_vectors(self, vec1, vec2):
        # Manual implementation of vector addition
        return [a + b for a, b in zip(vec1, vec2)]

    def softmax(self, scores):
        # Get current global precision
        current_precision = getcontext().prec
        
        # Convert all scores to Decimal objects
        decimal_scores = [Decimal(str(score)) for score in scores]
        
        # Find the maximum score to subtract (for numerical stability)
        max_score = max(decimal_scores)
        # Normalize by subtracting the maximum
        shifted_scores = [score - max_score for score in decimal_scores]
        
        # Calculate exp values with variable precision
        exp_scores = []
        for score in shifted_scores:
            exp_scores.append(exp(score))
        
        # Calculate sum of exponential values
        sum_exp = sum(exp_scores)
        
        # Handle division by zero
        if sum_exp == Decimal('0'):
            # If all exp values are zero, return uniform distribution
            return [Decimal('1') / Decimal(len(scores)) for _ in scores]
        
        # Calculate softmax probabilities
        result = [exp_score / sum_exp for exp_score in exp_scores]
        
        return result

    def save(self, path="model.json"):
        # Save the model using our DecimalEncoder to convert Decimal objects to strings.
        transformer = {
            "contextSize": self.contextSize,
            "embeddingSize": self.embeddingSize,
            "learningRate": self.learningRate,
            "maxOutputSize": self.maxOutputSize,
            "layersAmount": self.layersAmount,
            "heads": self.heads,
            "weightsinitrange": [str(self.weightsinitrange[0]), str(self.weightsinitrange[1])],
            "biasesinitrange": [str(self.biasesinitrange[0]), str(self.biasesinitrange[1])],
            "embeddinginitrange": [str(self.embeddinginitrange[0]), str(self.embeddinginitrange[1])],
            "vocab": self.vocab,
            "transformer": self.transformer,
            "adam_params": {
                'beta1': self.adam_params['beta1'],
                'beta2': self.adam_params['beta2'],
                'epsilon': self.adam_params['epsilon'],
                't': self.adam_params['t']
            },
            "step_num": self.step_num
        }
        with open(path, "w") as file:
            json.dump(transformer, file, cls=DecimalEncoder)
        print("Model saved to", path)

    def calculate_loss(self, predicted_scores, target_token_id):
        # Convert scores to probabilities using softmax
        predicted_probs = self.softmax(predicted_scores)
        
        # Create smoothed target distribution
        epsilon = Decimal('0') #Changed from 0.1 to 0 for better overfitting
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / Decimal(vocab_size - 1)) for _ in range(vocab_size)]
        
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
        
        target_distribution[target_idx] = Decimal('1.0') - epsilon

        # Calculate cross entropy loss
        loss = Decimal('0')
        for i in range(vocab_size):
            if predicted_probs[i] > 0:  # Avoid log(0)
                loss -= target_distribution[i] * log(predicted_probs[i])
        
        return loss

    def initialize_zero_gradients(self, structure):
        if isinstance(structure, list):
            # If it's already a [value, momentum, velocity] list
            if len(structure) > 0 and isinstance(structure[0], list) and len(structure[0]) == 3:
                return [[Decimal('0'), Decimal('0'), Decimal('0')] for _ in structure]
            # Otherwise make it one
            return [Decimal('0'), Decimal('0'), Decimal('0')]
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
            squared_sum = Decimal('0')
            
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
                
            return sqrt(squared_sum)
        
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
        min_lr = Decimal('0.0005')  # Add minimum learning rate

        if self.step_num < warmup_steps:
            lr = base_lr * (Decimal(self.step_num) / Decimal(warmup_steps))
        else:
            # Ensure warmup_steps and decay_factor are Decimals:
            warmup_steps_D = Decimal(str(warmup_steps))
            decay_factor_D = Decimal(str(decay_factor))
            step_D = Decimal(self.step_num)
            # Compute lr = base_lr * sqrt(warmup_steps) * ( (self.step_num * decay_factor) ** -0.5 )
            lr = base_lr * sqrt(warmup_steps_D) * (Decimal('1') / sqrt(step_D * decay_factor_D))
        
        # Apply cyclical learning rate adjustment
        cycle_length_D = Decimal('50')
        cycle_position_D = Decimal(self.step_num % 50)  # or convert the int to Decimal
        # cycle_ratio might be used later, so:
        cycle_ratio = cycle_position_D / cycle_length_D
        cycle_factor = Decimal('1')  # since it's constant 1
        lr = lr * cycle_factor

        # Apply minimum learning rate
        lr = max(min_lr, lr)
        
        print(f"Learning rate: {lr}, cyclical factor: {cycle_factor:.4f} calculated in", timer_end(timer), "ms")
        
        print("Computing gradients...")
        gtimer2 = timer_()
        
        # Get predicted probabilities and compute error gradients
        predicted_probs = self.softmax(cache["vocab_scores"])
        epsilon = Decimal('0') #Changed from 0.05 to 0 for better overfitting
        vocab_size = len(self.vocab)
        target_distribution = [(epsilon / Decimal(vocab_size - 1)) for _ in range(vocab_size)]
        
        # Find the index of target_token[1] in the vocabulary
        target_idx = None
        for i, token in enumerate(self.vocab):
            if token[1] == target_token[1]:
                target_idx = i
                break
        
        if target_idx is None:
            print(f"Warning: Token ID {target_token[1]} not found in vocabulary")
            target_idx = 0
        
        target_distribution[target_idx] = Decimal('1.0') - epsilon
        
        # Calculate initial error using pure Python
        initial_error = [predicted_probs[i] - target_distribution[i] for i in range(len(predicted_probs))]
        
        # Initialize error gradients with zeros
        error_gradients = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]

        # Propagate gradients through vocabulary projection layer
        for j in range(self.embeddingSize):
            for k in range(len(self.vocab)):
                error_gradients[-1][j] += initial_error[k] * self.transformer["vocab_projection"]["weights"][k * self.embeddingSize + j][0]
        
        # Initialize gradient accumulators
        embedding_gradients = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
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
            shrink_grad = [[Decimal('0') for _ in range(self.embeddingSize * 4)] for _ in range(len(input_tokens))]
            
            for i in range(len(input_tokens)):
                for j in range(self.embeddingSize):
                    for k in range(self.embeddingSize * 4):
                        if layer_cache["feed_forward"]["after_relu"][i][k] > 0:
                            shrink_grad[i][k] += ff_out_grad[i][j] * self.transformer["layers"][layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0]
                            layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (self.embeddingSize * 4) + k][0] += ff_out_grad[i][j] * layer_cache["feed_forward"]["after_relu"][i][k]
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j][0] += ff_out_grad[i][j]

            # Attention gradients
            att_grad = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
            
            # Accumulate gradients from all heads
            for head in range(self.heads):
                head_cache = layer_cache["heads"][head]
                
                # Compute gradients for Q, K, V matrices
                q_grad = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                k_grad = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                v_grad = [[Decimal('0') for _ in range(self.embeddingSize)] for _ in range(len(input_tokens))]
                
                # Gradient through attention scores
                attention_grad = [[Decimal('0') for _ in range(len(input_tokens))] for _ in range(len(input_tokens))]
                for i in range(len(input_tokens)):
                    for j in range(len(input_tokens)):
                        score_grad = head_cache["attention_probs"][i][j] * (Decimal('1') - head_cache["attention_probs"][i][j])
                        attention_grad[i][j] = score_grad / sqrt(Decimal(self.embeddingSize))
                        
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
        gamma = Decimal('5.0')  # You can adjust gamma based on training dynamics

        # Compute the global gradient norm using your helper function
        global_grad_norm = compute_global_norm(embedding_gradients, layer_gradients)
        print(f"Global gradient norm: {global_grad_norm:.6f}")

        # Compute a continuous scaling factor:
        # When global_grad_norm is small, tanh(x)/x is near 1.
        if global_grad_norm == 0:
            scaling_factor = Decimal('1.0')
        else:
            scaling_factor = tanh(global_grad_norm / gamma) / (global_grad_norm / gamma)

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
                        param[0] -= lr * m_hat / (sqrt(v_hat) + self.adam_params['epsilon'])
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
                                param[0] -= lr * m_hat / (sqrt(v_hat) + self.adam_params['epsilon'])
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
                                                    head_params[i][0] -= lr * m_hat / (sqrt(v_hat) + self.adam_params['epsilon'])
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
                                                nested_params[i][0] -= lr * m_hat / (sqrt(v_hat) + self.adam_params['epsilon'])
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
                
            timer = timer_()
            print("Starting epoch", epoch + 1)
            
            # Track losses for this epoch
            batch_losses = []
            
            for i in range(len(self.tokenized_dataset)):
                stimer = timer_()
                print("Training on item", i + 1, "/", len(self.tokenized_dataset))
                tokens = self.tokenized_dataset[i]
                
                # Track dataset loss
                dataset_total_loss = Decimal('0')  # Now it's a Decimal
                sequence_positions = Decimal('0')  # This should also be a Decimal
                
                for j in range(len(tokens) - 1):
                    input_tokens = tokens[:j+1]
                    target_token = tokens[j+1]
                    loss = self.train_step(input_tokens, target_token, optimizer, training_mode=True)
                    
                    dataset_total_loss += loss
                    sequence_positions += 1
                    
                    print(f"Loss: {loss:.4f} (sequence position {j+1}/{len(tokens)-1})")
                
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
                best_loss = avg_epoch_loss
                
                # Add a clear separator for visibility
                print("\n" + "-"*60)
                print("NEW BEST LOSS ACHIEVED!")
                print("-"*60 + "\n")
                
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
    
    def _raw_inference(self, context, return_cache, training_mode=False):
        def scale_activation(vector, base_gamma=5.0):
            # Convert base_gamma to Decimal
            base_gamma = Decimal(str(base_gamma))
            norm = sqrt(sum(x * x for x in vector))
            print(f"Activation norm: {norm}")
            
            if norm < Decimal('1e-10'):
                return vector
            
            if norm > Decimal('1000'):
                target_norm = Decimal('5')
                scaling_factor = target_norm / norm
                print(f"Extreme scaling: norm={norm:.2e}, factor={scaling_factor:.2e}")
                return [x * scaling_factor for x in vector]
            elif norm > Decimal('100'):
                scaling_factor = tanh(Decimal('1')) / norm * Decimal('100')
                return [x * scaling_factor for x in vector]
            else:
                scaling_factor = tanh(norm / base_gamma) / (norm / base_gamma)
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
                        q_sum = Decimal('0')
                        for j in range(self.embeddingSize):
                            q_sum += token_embedding[j] * head_weights["query"][pos * self.embeddingSize + j][0]
                        q_vector.append(q_sum + head_biases["query"][pos][0])
                    q_vectors.append(q_vector)

                    # Calculate K vector for this token
                    k_vector = []
                    for pos in range(self.embeddingSize):
                        k_sum = Decimal('0')
                        for j in range(self.embeddingSize):
                            k_sum += token_embedding[j] * head_weights["key"][pos * self.embeddingSize + j][0]
                        k_vector.append(k_sum + head_biases["key"][pos][0])
                    k_vectors.append(k_vector)

                    # Calculate V vector for this token
                    v_vector = []
                    for pos in range(self.embeddingSize):
                        v_sum = Decimal('0')
                        for j in range(self.embeddingSize):
                            v_sum += token_embedding[j] * head_weights["value"][pos * self.embeddingSize + j][0]
                        v_vector.append(v_sum + head_biases["value"][pos][0])
                    v_vectors.append(v_vector)

                # Calculate dot products between each Q and K vector with causal masking
                attention_scores = []
                for i, q_vector in enumerate(q_vectors):
                    token_scores = []
                    for j, k_vector in enumerate(k_vectors):
                        score = self.dot_product(q_vector, k_vector)
                        # Scale by sqrt(embedding_size)
                        score /= sqrt(self.embeddingSize)
                        
                        # Apply causal masking - prevent attending to future tokens
                        if j > i:  # If this is a future token
                            score = float('-inf')  # Set score to negative infinity
                            
                        token_scores.append(score)
                    attention_scores.append(token_scores)

                # Apply softmax to each token's attention scores
                attention_probs = []
                for token_scores in attention_scores:
                    for idx, score in enumerate(token_scores):
                        try:
                            test_exp = exp(score)
                        except Exception as e:
                            print(f"Debug - Problematic value at idx={idx}, score={score}: {e}")

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
                    pos_sum = Decimal('0')
                    for j in range(self.embeddingSize * self.heads):
                        pos_sum += concatenated[j] * output_weights[pos * (self.embeddingSize * self.heads) + j][0]
                    output_vector.append(pos_sum + output_biases[pos][0])
                combined_vectors.append(output_vector)

            if return_cache:
                cache["layers"][layer]["combined"] = combined_vectors.copy()

            # Apply dropout to feed forward if in training mode
            if training_mode:
                # Set dropout_rate as a Decimal. (Even if it’s 0, do this for consistency.)
                dropout_rate = Decimal('0')
                for i in range(len(combined_vectors)):
                    for j in range(len(combined_vectors[i])):
                        if random([0, 1]) < dropout_rate:
                            combined_vectors[i][j] = Decimal('0')
                        else:
                            # Divide by (1 - dropout_rate) as a Decimal
                            combined_vectors[i][j] /= (Decimal('1') - dropout_rate)

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

            # Residual connection - add original vectors to output vectors
            for i in range(len(combined_vectors)):
                for j in range(self.embeddingSize):
                    combined_vectors[i][j] += final_embeddings[i][j]

            for i in range(len(combined_vectors)): #Added scaling because numbers would explode into NaNs
                combined_vectors[i] = scale_activation(combined_vectors[i], base_gamma=5.0)

            # Feed‑forward part – first make vectors bigger
            bigger_vectors = []
            for vector in normalized_vectors:
                bigger_vector = []
                for pos in range(self.embeddingSize * 4):  # 4 times bigger
                    accum = Decimal('0')
                    for j in range(self.embeddingSize):
                        accum += vector[j] * self.transformer["layers"][layer]["weights"]["feed_forward"]["grow"][pos * self.embeddingSize + j][0]
                    bigger_vector.append(accum + self.transformer["layers"][layer]["biases"]["feed_forward"]["grow"][pos][0])
                bigger_vectors.append(bigger_vector)

            if return_cache:
                cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.copy()

            # Apply ReLU to bigger_vectors
            for i in range(len(bigger_vectors)):
                for j in range(self.embeddingSize * 4):
                    if bigger_vectors[i][j] < 0:
                        bigger_vectors[i][j] = 0

            if return_cache:
                cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.copy()

            # Apply dropout to feed forward if in training mode
            if training_mode:
                dropout_rate = Decimal('0')
                for i in range(len(bigger_vectors)):
                    for j in range(len(bigger_vectors[i])):
                        if random([0, 1]) < dropout_rate:
                            bigger_vectors[i][j] = Decimal('0')
                        else:
                            bigger_vectors[i][j] /= (Decimal('1') - dropout_rate)

            # Shrink vectors back to original size
            final_vectors = []
            for vector in bigger_vectors:
                final_vector = []
                for pos in range(self.embeddingSize):
                    accum = Decimal('0')
                    for j in range(self.embeddingSize * 4):
                        accum += vector[j] * self.transformer["layers"][layer]["weights"]["feed_forward"]["shrink"][pos * (self.embeddingSize * 4) + j][0]
                    final_vector.append(accum + self.transformer["layers"][layer]["biases"]["feed_forward"]["shrink"][pos][0])
                final_vectors.append(final_vector)

            # Add residual connection
            for i in range(len(final_vectors)):
                for j in range(self.embeddingSize):
                    final_vectors[i][j] += normalized_vectors[i][j]

            for i in range(len(final_vectors)): #last scaling
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
            score = Decimal('0')
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
    def inference(self, context, return_cache, training_mode=False):
        """
        Adaptive precision version of inference.
        If inference fails due to numeric issues, it increases precision and retries.
        """
        key = ("inference", context)
        prec = self.inference_precision_cache.get(key, math_base_precision)
        
        # Set precision directly
        getcontext().prec = prec
        mp.mp.dps = prec
        
        attempt_count = 0
        max_attempts = 5  # Limit retries to prevent infinite loops

        while attempt_count < max_attempts:
            try:
                result = self._raw_inference(context, return_cache, training_mode)

                # Cache successful precision level
                self.inference_precision_cache[key] = prec
                # No need to reset precision here - we'll manage it elsewhere
                return result
                
            except (decimal.InvalidOperation, OverflowError, mp.libmp.libmp.Error, ValueError) as e:
                attempt_count += 1
                
                # Manual precision increase instead of math.increase_precision()
                old_prec = prec
                prec = min(prec + math_precision_step, math_max_precision)
                
                print(f"Warning: Inference overflow at precision {old_prec}, increasing to {prec} (attempt {attempt_count}/{max_attempts}): {e}")
                
                # Set the new precision
                getcontext().prec = prec
                mp.mp.dps = prec
                
                # Update cache with new precision
                self.inference_precision_cache[key] = prec
        
        # If we exit the loop, we've hit max attempts
        raise RuntimeError(f"Failed to complete inference after {max_attempts} attempts with precision up to {prec}")

    def generate(self, context, temperature=0.8):
        getcontext().prec = math_base_precision
        mp.mp.dps = math_base_precision
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
                scaled_scores = [Decimal(str(score)) / Decimal(str(temperature)) for score in scores]
                probs = self.softmax(scaled_scores)
                
                random_value = random([0, 1])
                print(f"Debug - Random value for sampling: {random_value}")
                
                cumulative_prob = Decimal('0')
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

try:
    if flag:
        transformer = Transformer(True, {
            "contextSize": 64,              
            "embeddingSize": 32,            
            "learningRate": 0.05,           
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
except KeyboardInterrupt:
    exit(0)

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