// app.js
//
//* It is way better to download the better comments extension for vscode to view this file because
//* it adds color to the comments depending on how much you should read them thanks to the little symbols
//* like * ! and ? that I put after // on the comments.

// Credits
//
// Me ofc (willmil11)
// Claude
// Chatgpt
//
// Contact me
// Discord: willmil11
// Email: willmil111012@gmail.com
//
// Drop a star on the github repo if you like it :D

var fs = require("fs");
var process = require("process");
var json = JSON;
var path = require("path");
var os = require("os");
var readline = require("readline");
var { Tiktoken } = require("tiktoken/lite");
var cl100k_base = require("tiktoken/encoders/cl100k_base.json");
var uuid = require("uuid");

var args = process.argv.slice(2);

var config = {};

function inputWithTimeout(prompt, timeoutMs) {
    return new Promise(function (resolve) {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        var done = false;

        // Timer to enforce the timeout
        var timer = setTimeout(function () {
            if (!done) {
                done = true;
                rl.close();
                resolve(null); // Return null on timeout
            }
        }, timeoutMs);

        // Ask the question
        rl.question(prompt, function (answer) {
            if (!done) {
                done = true;
                clearTimeout(timer);
                rl.close();
                resolve(answer);
            }
        });
    });
}

function help(issue) {
    if (issue === undefined) {
        issue = "No args found.";
    }
    function spacing() {
        return " ".repeat(("node " + process.argv[1]).length);
    }
    console.log("=====" + "=".repeat(issue.length) + "=====");
    console.log("==== " + issue + " ====");
    console.log("=====" + "=".repeat(issue.length) + "=====");
    console.log("");
    console.log("node " + process.argv[1] + " --new");
    console.log(spacing() + " ".repeat(" --new".length) + "--config path/to/config.json");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json".length) + "--train");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json".length) + " ".repeat("--pretrain".length) + "--pretrain");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json".length) + "--pretrain");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json".length) + " ".repeat("--pretrain".length) + "--train");
    console.log(spacing() + " ".repeat(" --new".length) + "--config path/to/config.json --verbose");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json --verbose".length) + "--train");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json --verbose".length) + " ".repeat("--pretrain".length) + "--pretrain");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json --verbose".length) + "--pretrain");
    console.log(spacing() + " ".repeat(" --new".length) + " ".repeat("--config path/to/config.json --verbose".length) + " ".repeat("--pretrain".length) + "--train");
    console.log(spacing() + " --load path/to/model.json");
    console.log("");
}

var flag = null;
var VERBOSE = false;
var training__ = null;
var pretraining__ = null;
var config__ = false;
var skipnext = false;
var config_location = null;
var model_location = null;

if (args.length === 0) {
    help();
    process.exit(0);
} else {
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (skipnext) {
            skipnext = false;
            continue;
        }
        if (arg === "--new") {
            if (flag === true) {
                help("You can't specify --new multiple times.");
                process.exit(0);
            } else {
                if (flag === false) {
                    help("You can't specify --new and --load at the same time.");
                    process.exit(0);
                }
            }
            flag = true;
        } else if (arg === "--load") {
            if (flag === true) {
                help("You can't specify --new and --load at the same time.");
                process.exit(0);
            } else {
                if (flag === false) {
                    help("You can't specify --load multiple times.");
                    process.exit(0);
                }
            }
            flag = false;
            try {
                if (args[i + 1] !== "--new") {
                    if (args[i + 1] !== "--train") {
                        if (args[i + 1] !== "--pretrain") {
                            if (args[i + 1] !== "--config") {
                                model_location = args[i + 1];
                                if (!fs.existsSync(model_location)) {
                                    help("Model file " + model_location + " does not exist.");
                                    process.exit(0);
                                }
                                if (!fs.statSync(model_location).isFile()) {
                                    help("Model file " + model_location + " is not a file.");
                                    process.exit(0);
                                }
                                if (model_location.slice(-5) !== ".json") {
                                    help("Model file " + model_location + " is not a json file.");
                                    process.exit(0);
                                }
                            } else {
                                help("You need to specify a model file after --load.");
                                process.exit(0);
                            }
                        } else {
                            help("You need to specify a model file after --load.");
                            process.exit(0);
                        }
                    } else {
                        help("You need to specify a model file after --load.");
                        process.exit(0);
                    }
                } else {
                    help("You need to specify a model file after --load.");
                    process.exit(0);
                }
            } catch (e) {
                help("You need to specify a model file after --load.");
                process.exit(0);
            }
        } else if (arg === "--verbose") {
            if (VERBOSE === true) {
                help("You can't specify --verbose multiple times.");
                process.exit(0);
            } else {
                VERBOSE = true;
            }
        } else if (arg === "--train") {
            if (training__ === true) {
                help("You can't specify --train multiple times.");
                process.exit(0);
            } else {
                training__ = true;
            }
        } else if (arg === "--pretrain") {
            if (pretraining__ === true) {
                help("You can't specify --pretrain multiple times.");
                process.exit(0);
            } else {
                pretraining__ = true;
            }
        } else if (arg === "--config") {
            if (config__ === true) {
                help("You can't specify --config multiple times.");
                process.exit(0);
            }
            config__ = true;
            try {
                if (args[i + 1] !== "--new") {
                    if (args[i + 1] !== "--train") {
                        if (args[i + 1] !== "--pretrain") {
                            if (args[i + 1] !== "--config") {
                                config_location = args[i + 1];
                                if (!fs.existsSync(config_location)) {
                                    help("Config file " + config_location + " does not exist.");
                                    process.exit(0);
                                }
                                if (!fs.statSync(config_location).isFile()) {
                                    help("Config file " + config_location + " is not a file.");
                                    process.exit(0);
                                }
                                if (config_location.slice(-5) !== ".json") {
                                    help("Config file " + config_location + " is not a json file.");
                                    process.exit(0);
                                }
                            } else {
                                help("You need to specify a config file after --config.");
                                process.exit(0);
                            }
                        } else {
                            help("You need to specify a config file after --config.");
                            process.exit(0);
                        }
                    } else {
                        help("You need to specify a config file after --config.");
                        process.exit(0);
                    }
                } else {
                    help("You need to specify a config file after --config.");
                    process.exit(0);
                }
            } catch (e) {
                help("You need to specify a config file after --config.");
                process.exit(0);
            }
            skipnext = true;
            continue;
        } else {
            help("Argument " + arg + " not recognised.");
            process.exit(0);
        }
    }
}

if (args.indexOf("--new") !== -1) {
    if (args.indexOf("--config") === -1) {
        help("You need to specify a config file with --config.");
        process.exit(0);
    } else {
        if (args.indexOf("--train") === -1) {
            if (args.indexOf("--pretrain") === -1) {
                help("You need to specify either --train or --pretrain or both with --new.");
                process.exit(0);
            }
        } else {
            if (args.indexOf("--pretrain") === -1) {
                if (args.indexOf("--train") === -1) {
                    help("You need to specify either --train or --pretrain or both with --new.");
                    process.exit(0);
                }
            }
        }
    }
}

if (args.indexOf("--new") === -1 && args.indexOf("--load") === -1) {
    help("You need to specify either --new or --load.");
    process.exit(0);
}

if (!VERBOSE) {
    VERBOSE = false;
}

console.log("Arguments parsed successfully.");
if (args.indexOf("--new") !== -1) {
    console.log("Reading and loading config file...");
    var configtoparse;
    try {
        configtoparse = fs.readFileSync(config_location, "utf-8");
    } catch (error) {
        console.log("Failed to read config file, check if it's corrupted or if you don't have permissions.");
        console.log("JavaScript error:");
        console.log(String(error));
        console.log("Exiting...");
        process.exit(1);
    }
    try {
        configtoparse = json.parse(configtoparse);
    } catch (error) {
        console.log("Failed to load json of config file, check if it's corrupted.");
        console.log("JavaScript error:");
        console.log(String(error));
        console.log("Exiting...");
        process.exit(1);
    }
    var keys = ["pre-training-paths", "training-dataset-path", "contextSize", "embeddingSize", "learningRate", "maxOutputSize", "layersAmount", "heads", "biasesinitrange", "embeddinginitrange"];

    for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (key === "pre-training-paths" || key === "training-dataset-path") {
            if (pretraining__ === null && training__ === null) {
                console.log("Config file missing parameter " + key + ", add it.");
                console.log("Exiting...");
                process.exit(1);
            }
        } else {
            if (!(key in configtoparse)) {
                console.log("Config file missing parameter " + key + ", add it.");
                console.log("Exiting...");
                process.exit(1);
            } else {
                if (pretraining__) {
                    if (key === "pre-training-paths") {
                        if (!(Array.isArray(configtoparse[key]))) {
                            console.log("Config file parameter " + key + " must be an array of strings, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                        for (var j = 0; j < configtoparse[key].length; j++) {
                            if (typeof configtoparse[key][j] !== "string") {
                                console.log("Config file parameter " + key + " must be an array of strings, not an array of " + typeof configtoparse[key][j]);
                                process.exit(1);
                            }
                        }
                    }
                }
                if (training__) {
                    if (key === "training-dataset-path") {
                        if (typeof configtoparse[key] !== "string") {
                            console.log("Config file parameter " + key + " must be a string, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                    }
                }
                if (key === "contextSize") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "embeddingSize") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "learningRate") {
                    if (typeof configtoparse[key] !== "number") {
                        console.log("Config file parameter " + key + " must be a float, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "maxOutputSize") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "layersAmount") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "heads") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "biasesinitrange") {
                    if (!Array.isArray(configtoparse[key])) {
                        console.log("Config file parameter " + key + " must be an array of two floats, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                    if (configtoparse[key].length !== 2) {
                        console.log("Config file parameter " + key + " must be an array of two floats, not an array of " + configtoparse[key].length + " floats");
                        process.exit(1);
                    }
                    for (var j = 0; j < configtoparse[key].length; j++) {
                        if (typeof configtoparse[key][j] !== "number") {
                            console.log("Config file parameter " + key + " must be an array of two floats, not an array of " + typeof configtoparse[key][j]);
                            process.exit(1);
                        }
                    }
                }
                if (key === "embeddinginitrange") {
                    if (!Array.isArray(configtoparse[key])) {
                        console.log("Config file parameter " + key + " must be an array of two floats, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                    if (configtoparse[key].length !== 2) {
                        console.log("Config file parameter " + key + " must be an array of two floats, not an array of " + configtoparse[key].length + " floats");
                        process.exit(1);
                    }
                    for (var j = 0; j < configtoparse[key].length; j++) {
                        if (typeof configtoparse[key][j] !== "number") {
                            console.log("Config file parameter " + key + " must be an array of two floats, not an array of " + typeof configtoparse[key][j]);
                            process.exit(1);
                        }
                    }
                }
                if (pretraining__) {
                    if (key === "pre-train-epochs") {
                        if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                            console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                    }
                }
                if (training__) {
                    if (key === "train-epochs") {
                        if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                            console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                    }
                }
                if (pretraining__) {
                    if (key === "pre-train-optimizer") {
                        if (typeof configtoparse[key] !== "string") {
                            console.log("Config file parameter " + key + " must be a string, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                    }
                }
                if (training__) {
                    if (key === "train-optimizer") {
                        if (typeof configtoparse[key] !== "string") {
                            console.log("Config file parameter " + key + " must be a string, not a " + typeof configtoparse[key]);
                            process.exit(1);
                        }
                    }
                }
                if (key === "antiOverfittingOptimisations") {
                    if (typeof configtoparse[key] !== "boolean") {
                        console.log("Config file parameter " + key + " must be a boolean, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                if (key === "microbatchSize") {
                    if (typeof configtoparse[key] !== "number" || Math.floor(configtoparse[key]) !== configtoparse[key]) {
                        console.log("Config file parameter " + key + " must be an int, not a " + typeof configtoparse[key]);
                        process.exit(1);
                    }
                }
                config[key] = configtoparse[key];
            }
    }
    config = configtoparse;
    console.log("Config file loaded successfully.");
}

var ndprint = console.log;
var print = function() {
    if (VERBOSE) {
        ndprint.apply(null, arguments);
    }
};

function timer_() {
    // Generate random 32 char string as timer id using uuid v4 without dashes
    var timer_id = uuid.v4().replace(/-/g, "");
    timers.push({
        "id": timer_id,
        "start": Date.now() / 1000
    });
    return timer_id;
}

function timer_end(timer_id) {
    for (var i = 0; i < timers.length; i++) {
        if (timers[i]["id"] === timer_id) {
            timers[i]["end"] = Date.now() / 1000;
            // Return time in ms
            return (timers[i]["end"] - timers[i]["start"]) * 1000;
        }
    }
    return null;
}

function random_range(range) {
    // Return random float between range[0] and range[1] (inclusive)
    return Math.random() * (range[1] - range[0]) + range[0];
}

var timers = [];

class Transformer {
    constructor(newFlag, parameters, path, vocab_path) {
        if (vocab_path === undefined) { vocab_path = "vocabulary.json"; }
        this.adam_params = {
            'beta1': 0.9,
            'beta2': 0.98,  // From 0.999 to 0.98 to match paper
            'epsilon': 1e-9,
            't': 0
        };
        ndprint("Trying to read vocabulary file...");
        try {
            this.vocab = json.parse(fs.readFileSync("vocabulary.json", "utf-8"));
        } catch (e) {
            console.log("Failed to read vocabulary file, creating error...");
            throw new Error("Failed to read vocabulary file");
        }
        ndprint("Successfully read vocabulary file");
        ndprint("Computing lookup table...");
        this.id_to_token = {};
        for (var i = 0; i < this.vocab.length; i++) {
            var tok = this.vocab[i];
            this.id_to_token[tok[1]] = tok[0];
        }
        ndprint("Computed lookup table");
        this.encoder = new Tiktoken(
            cl100k_base.bpe_ranks,
            { "<|endoftext|>": 100257 }, // example special token
            cl100k_base.pat_str
        ); 
        this.temperature = 0.7;
        if (newFlag) {
            ndprint("Initializing model...");
            // Calculate total parameters
            var total_params = (
                this.vocab.length * parameters["embeddingSize"] +
                parameters["contextSize"] * parameters["embeddingSize"] +
                parameters["layersAmount"] * (
                    2 * parameters["embeddingSize"] +
                    parameters["heads"] * (3 * parameters["embeddingSize"] * parameters["embeddingSize"] / parameters["heads"] + 3 * parameters["embeddingSize"] / parameters["heads"]) +
                    parameters["embeddingSize"] * parameters["embeddingSize"] + parameters["embeddingSize"] +
                    2 * parameters["embeddingSize"] +
                    parameters["embeddingSize"] * (4 * parameters["embeddingSize"]) + 4 * parameters["embeddingSize"] +
                    (4 * parameters["embeddingSize"]) * parameters["embeddingSize"] + parameters["embeddingSize"]
                )
            );
            var total_ram = total_params * 8; // (64 bit floats take up 8 bytes each)
            ndprint("Model is of size " + total_params + " parameters");
            total_ram = total_params * 8;
            ndprint("                 ~" + (total_params / 1e9).toFixed(2) + "b parameters");
            ndprint("");
            var adam_ram = total_params * 3 * 8;  // Assuming 3 times the parameters for Adam
            ndprint("Would cost the equivalent of " + (total_params * 3) + " parameters if trained with Adam");
            ndprint("                             ~" + ((total_params * 3) / 1e9).toFixed(2) + "b parameters if trained with adam");
            ndprint("");
            var sgd_momentum_ram = total_params * 2 * 8;  // Assuming 2 times the parameters for SGD with momentum
            ndprint("Would cost the equivalent of " + (total_params * 2) + " parameters if trained with SGD with momentum");
            ndprint("                             ~" + ((total_params * 2) / 1e9).toFixed(2) + "b parameters if trained with SGD with momentum");
            ndprint("");
            ndprint("Would not cost more than the original size of the model if trained with vanilla SGD");
            var sgtimer = timer_();
            ndprint("Initializing parameters...");
            var timer = timer_();
            this.contextSize = parameters["contextSize"];
            this.embeddingSize = parameters["embeddingSize"];
            this.learningRate = parameters["learningRate"];
            this.maxOutputSize = parameters["maxOutputSize"];
            this.layersAmount = parameters["layersAmount"];
            if ("use_he_init" in parameters && parameters["use_he_init"]) {
                this.weightsinitrange = this.he_init(this.embeddingSize);
                console.log("Using He initialization with range: " + this.weightsinitrange);
            } else {
                this.weightsinitrange = parameters["weightsinitrange"];
            }
            this.biasesinitrange = parameters["biasesinitrange"];
            this.heads = parameters["heads"];
            this.embeddinginitrange = parameters["embeddinginitrange"];
            this.transformer = {};
            this.step_num = 0;
            ndprint("Initialized parameters in", timer_end(timer), "ms");
            var percentagePrintInterval = 10;
            ndprint("Initializing layers...");
            var gtimer = timer_();
            this.transformer["layers"] = [];
            for (var i = 0; i < this.layersAmount; i++) {
                var timer_layer = timer_();
                console.log("Initializing weights and biases for layer " + i);
                this.transformer["layers"].push({
                    "weights": {
                        "normalize_1": [],
                        "attention": {
                            "heads": (function() {
                                var arr = [];
                                for (var h = 0; h < this.heads; h++) {
                                    arr.push({
                                        "query": [],
                                        "key": [],
                                        "value": []
                                    });
                                }
                                return arr;
                            }).call(this),
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
                            "heads": (function() {
                                var arr = [];
                                for (var h = 0; h < this.heads; h++) {
                                    arr.push({
                                        "query": [],
                                        "key": [],
                                        "value": []
                                    });
                                }
                                return arr;
                            }).call(this),
                            "output": []
                        },
                        "normalize_2": [],
                        "feed_forward": {
                            "grow": [],
                            "shrink": []
                        }
                    }
                });
                var total_params_layer = 2 * this.embeddingSize + 3 * this.heads * (this.embeddingSize * this.embeddingSize + this.embeddingSize) + this.embeddingSize * (this.embeddingSize * this.heads) + this.embeddingSize + 2 * this.embeddingSize + this.embeddingSize * (this.embeddingSize * 4) + (this.embeddingSize * 4) + (this.embeddingSize * 4) * this.embeddingSize + this.embeddingSize;
                var params_done = 0;
                var last_percent = -percentagePrintInterval;
                for (var j = 0; j < this.embeddingSize; j++) {
                    this.transformer["layers"][i]["weights"]["normalize_1"].push([random_range(this.weightsinitrange), 0, 0]);
                    this.transformer["layers"][i]["biases"]["normalize_1"].push([random_range(this.biasesinitrange), 0, 0]);
                    this.transformer["layers"][i]["weights"]["normalize_2"].push([random_range(this.weightsinitrange), 0, 0]);
                    this.transformer["layers"][i]["biases"]["normalize_2"].push([random_range(this.biasesinitrange), 0, 0]);
                    params_done += 4;
                    var percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < this.heads; j++) {
                    for (var k = 0; k < this.embeddingSize * this.embeddingSize; k++) {
                        this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"].push([random_range(this.weightsinitrange), 0, 0]);
                        this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"].push([random_range(this.weightsinitrange), 0, 0]);
                        this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"].push([random_range(this.weightsinitrange), 0, 0]);
                        params_done += 3;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var k = 0; k < this.embeddingSize; k++) {
                        this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"].push([random_range(this.biasesinitrange), 0, 0]);
                        this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"].push([random_range(this.biasesinitrange), 0, 0]);
                        this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"].push([random_range(this.biasesinitrange), 0, 0]);
                        params_done += 3;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                }
                for (var j = 0; j < this.embeddingSize * (this.embeddingSize * this.heads); j++) {
                    this.transformer["layers"][i]["weights"]["attention"]["output"].push([random_range(this.weightsinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < this.embeddingSize; j++) {
                    this.transformer["layers"][i]["biases"]["attention"]["output"].push([random_range(this.biasesinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < this.embeddingSize * (this.embeddingSize * 4); j++) {
                    this.transformer["layers"][i]["weights"]["feed_forward"]["grow"].push([random_range(this.weightsinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < this.embeddingSize * 4; j++) {
                    this.transformer["layers"][i]["biases"]["feed_forward"]["grow"].push([random_range(this.biasesinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < (this.embeddingSize * 4) * this.embeddingSize; j++) {
                    this.transformer["layers"][i]["weights"]["feed_forward"]["shrink"].push([random_range(this.weightsinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                for (var j = 0; j < this.embeddingSize; j++) {
                    this.transformer["layers"][i]["biases"]["feed_forward"]["shrink"].push([random_range(this.biasesinitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Layer " + i + ": " + last_percent + "% complete");
                    }
                }
                console.log("Initialized weights and biases for layer " + i + " in " + timer_end(timer_layer) + " ms");
            }
            ndprint("Initialized layers in", timer_end(gtimer), "ms");

            ndprint("Initializing embeddings...");
            timer = timer_();
            this.transformer["embeddings"] = [];
            params_done = 0;
            total_params_layer = this.vocab.length * this.embeddingSize;
            last_percent = -percentagePrintInterval;
            for (var i = 0; i < this.vocab.length; i++) {
                var embedding = [];
                for (var j = 0; j < this.embeddingSize; j++) {
                    embedding.push([random_range(this.embeddinginitrange), 0, 0]);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Embeddings: " + last_percent + "% complete");
                    }
                }
                this.transformer["embeddings"].push(embedding);
            }
            ndprint("Initialized embeddings in", timer_end(timer), "ms");

            ndprint("Initializing vocabulary projection weights and biases...");
            timer = timer_();
            this.transformer["vocab_projection"] = {
                "weights": [],
                "biases": []
            };
            params_done = 0;
            total_params_layer = this.vocab.length * this.embeddingSize + this.vocab.length;
            last_percent = -percentagePrintInterval;
            for (var i = 0; i < this.vocab.length * this.embeddingSize; i++) {
                this.transformer["vocab_projection"]["weights"].push([random_range(this.weightsinitrange), 0, 0]);
                params_done += 1;
                percent = Math.floor((params_done * 100) / total_params_layer);
                if (percent >= last_percent + percentagePrintInterval) {
                    last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                    ndprint("  Vocab projection: " + last_percent + "% complete");
                }
            }
            for (var i = 0; i < this.vocab.length; i++) {
                this.transformer["vocab_projection"]["biases"].push([random_range(this.biasesinitrange), 0, 0]);
                params_done += 1;
                percent = Math.floor((params_done * 100) / total_params_layer);
                if (percent >= last_percent + percentagePrintInterval) {
                    last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                    ndprint("  Vocab projection: " + last_percent + "% complete");
                }
            }
            ndprint("Initialized vocabulary projection weights and biases in", timer_end(timer), "ms");
            ndprint("Successfully initialized model in", timer_end(sgtimer), "ms");
        } else {
            ndprint("Reading model from file...");
            var timer = timer_();
            try {
                var model = json.parse(fs.readFileSync(path, "utf-8"));
                this.transformer = model["transformer"];
                this.contextSize = model["contextSize"];
                this.embeddingSize = model["embeddingSize"];
                this.learningRate = model["learningRate"];
                this.maxOutputSize = model["maxOutputSize"];
                this.layersAmount = model["layersAmount"];
                this.weightsinitrange = model["weightsinitrange"];
                this.biasesinitrange = model["biasesinitrange"];
                this.heads = model["heads"];
                this.embeddinginitrange = model["embeddinginitrange"];
                if ("adam_params" in model) {
                    this.adam_params = model["adam_params"];
                } else {
                    this.adam_params = {
                        'beta1': 0.9,
                        'beta2': 0.98,
                        'epsilon': 1e-9,
                        't': 0
                    };
                }
                if ("step_num" in model) {
                    this.step_num = model["step_num"];
                } else {
                    this.step_num = 0;
                }
            } catch (e) {
                console.log("Failed to read model file, creating error...");
                throw new Error("Failed to read model file");
            }
            ndprint("Successfully read model from file in", timer_end(timer), "ms");
        }
    }
    he_init(fan_in) {
        var scale = Math.sqrt(2.0 / fan_in);
        return [-scale, scale];
    }
    tokenize(text) {
        var timer_id = timer_();
        console.log("Tokenizing text...");

        // Strip out the literal endoftext token string — it breaks tiktoken in Node.js
        text = text.replace(/<\|endoftext\|>/g, "");

        var token_ids = this.encoder.encode(text, {
            allowed_special: [],
            encode_special_tokens: false
        });

        var result = [];
        for (var i = 0; i < token_ids.length; i++) {
            var id = token_ids[i];
            var token_str = (id in this.id_to_token) ? this.id_to_token[id] : "unknown";
            result.push([token_str, id]);
        }
        console.log("Tokenized in " + timer_end(timer_id) + " ms");
        return result;
    }
    calculate_positional_encoding(sequence_length) {
        var positional_encodings = [];
        for (var pos = 0; pos < sequence_length; pos++) {
            var embedding = [];
            for (var i = 0; i < this.embeddingSize; i++) {
                var denominator = Math.pow(10000, (2 * Math.floor(i / 2)) / this.embeddingSize);
                if (i % 2 === 0) {
                    embedding.push(Math.sin(pos / denominator));
                } else {
                    embedding.push(Math.cos(pos / denominator));
                }
            }
            positional_encodings.push(embedding);
        }
        return positional_encodings;
    }
    get_embedding(token_id) {
        var vocab_idx = null;
        for (var i = 0; i < this.vocab.length; i++) {
            if (this.vocab[i][1] === token_id) {
                vocab_idx = i;
                break;
            }
        }
        if (vocab_idx !== null) {
            return this.transformer["embeddings"][vocab_idx];
        } else {
            var unknown_idx = null;
            for (var i = 0; i < this.vocab.length; i++) {
                if (this.vocab[i][0] === "unknown" && this.vocab[i][1] === 16476) {
                    unknown_idx = i;
                    break;
                }
            }
            if (unknown_idx !== null) {
                console.log("Warning: Token ID " + token_id + " not found in vocabulary, using unknown token instead");
                return this.transformer["embeddings"][unknown_idx];
            } else {
                console.log("Warning: Token ID " + token_id + " not found in vocabulary, using first token as fallback");
                return this.transformer["embeddings"][0];
            }
        }
    }
    normalize_vector(vector) {
        var vector_list = [];
        for (var i = 0; i < vector.length; i++) {
            var x = vector[i];
            try {
                if (typeof x === "number") {
                    vector_list.push(Number(x));
                } else if (Array.isArray(x) && x.length > 0) {
                    vector_list.push(Number(x[0]));
                } else {
                    vector_list.push(Number(x));
                }
            } catch (e) {
                vector_list.push(0.0);
            }
        }
        var mean = vector_list.reduce(function(a, b) { return a + b; }, 0) / vector_list.length;
        var squared_diffs = [];
        for (var i = 0; i < vector_list.length; i++) {
            var diff = vector_list[i] - mean;
            if (diff > 1e6) { diff = 1e6; }
            else if (diff < -1e6) { diff = -1e6; }
            squared_diffs.push(diff * diff);
        }
        var variance = squared_diffs.reduce(function(a, b) { return a + b; }, 0) / vector_list.length;
        var std = Math.sqrt(variance + 1e-10);
        if (std < 1e-6) {
            var zeros = [];
            for (var i = 0; i < vector_list.length; i++) { zeros.push(0.0); }
            return zeros;
        }
        var normalized = [];
        for (var i = 0; i < vector_list.length; i++) {
            var norm_val = (vector_list[i] - mean) / std;
            if (norm_val > 10.0) { norm_val = 10.0; }
            else if (norm_val < -10.0) { norm_val = -10.0; }
            normalized.push(norm_val);
        }
        return normalized;
    }
    dot_product(vec1, vec2) {
        var sum = 0;
        for (var i = 0; i < vec1.length; i++) {
            sum += vec1[i] * vec2[i];
        }
        return sum;
    }
    add_vectors(vec1, vec2) {
        var result = [];
        for (var i = 0; i < vec1.length; i++) {
            result.push(vec1[i] + vec2[i]);
        }
        return result;
    }
    softmax(scores) {
        var float_scores = [];
        for (var i = 0; i < scores.length; i++) {
            try {
                float_scores.push(Number(scores[i]));
            } catch (e) {
                float_scores.push(0.0);
            }
        }
        var max_score = Math.max.apply(null, float_scores);
        var exp_scores = [];
        for (var i = 0; i < float_scores.length; i++) {
            exp_scores.push(Math.exp(float_scores[i] - max_score));
        }
        var sum_exp = exp_scores.reduce(function(a, b) { return a + b; }, 0);
        if (sum_exp === 0) {
            var equal = [];
            for (var i = 0; i < float_scores.length; i++) { equal.push(1.0 / float_scores.length); }
            return equal;
        }
        var probs = [];
        for (var i = 0; i < exp_scores.length; i++) {
            probs.push(exp_scores[i] / sum_exp);
        }
        return probs;
    }
    save(path_out) {
        if (path_out === undefined) { path_out = "model.json"; }
        var transformer_obj = {};
        transformer_obj["contextSize"] = this.contextSize;
        transformer_obj["embeddingSize"] = this.embeddingSize;
        transformer_obj["learningRate"] = this.learningRate;
        transformer_obj["maxOutputSize"] = this.maxOutputSize;
        transformer_obj["layersAmount"] = this.layersAmount;
        transformer_obj["heads"] = this.heads;
        transformer_obj["weightsinitrange"] = this.weightsinitrange;
        transformer_obj["biasesinitrange"] = this.biasesinitrange;
        transformer_obj["embeddinginitrange"] = this.embeddinginitrange;
        transformer_obj["vocab"] = this.vocab;
        transformer_obj["transformer"] = this.transformer;
        transformer_obj["adam_params"] = {
            'beta1': this.adam_params['beta1'],
            'beta2': this.adam_params['beta2'],
            'epsilon': this.adam_params['epsilon'],
            't': this.adam_params['t']
        };
        transformer_obj["step_num"] = this.step_num;
        fs.writeFileSync(path_out, json.stringify(transformer_obj));
        ndprint("Model saved to", path_out);
    }
    calculate_loss(predicted_scores, target_token_id) {
        var predicted_probs = this.softmax(predicted_scores);
        var epsilon = 0;
        if (config["antiOverfittingOptimisations"]) {
            epsilon = 0.1;
        }
        var vocab_size = this.vocab.length;
        var target_distribution = [];
        for (var i = 0; i < vocab_size; i++) {
            target_distribution.push(epsilon / (vocab_size - 1));
        }
        var target_idx = null;
        for (var i = 0; i < this.vocab.length; i++) {
            if (this.vocab[i][1] === target_token_id) {
                target_idx = i;
                break;
            }
        }
        if (target_idx === null) {
            console.log("Warning: Token ID " + target_token_id + " not found in vocabulary");
            target_idx = 0;
        }
        target_distribution[target_idx] = 1.0 - epsilon;
        var loss = 0;
        for (var i = 0; i < vocab_size; i++) {
            if (predicted_probs[i] > 0) {
                loss -= target_distribution[i] * Math.log(predicted_probs[i]);
            }
        }
        return loss;
    }
    initialize_zero_gradients(structure) {
        if (Array.isArray(structure)) {
            if (structure.length > 0 && Array.isArray(structure[0]) && structure[0].length === 3) {
                var newArr = [];
                for (var i = 0; i < structure.length; i++) {
                    newArr.push([0, 0, 0]);
                }
                return newArr;
            }
            return [0, 0, 0];
        } else if (typeof structure === "object") {
            var zero_dict = {};
            for (var key in structure) {
                if (key === "heads") {
                    var arr = [];
                    for (var h = 0; h < this.heads; h++) {
                        arr.push({
                            "query": (function() {
                                var inner = [];
                                for (var i = 0; i < this.embeddingSize * this.embeddingSize; i++) { inner.push([0, 0, 0]); }
                                return inner;
                            }).call(this),
                            "key": (function() {
                                var inner = [];
                                for (var i = 0; i < this.embeddingSize * this.embeddingSize; i++) { inner.push([0, 0, 0]); }
                                return inner;
                            }).call(this),
                            "value": (function() {
                                var inner = [];
                                for (var i = 0; i < this.embeddingSize * this.embeddingSize; i++) { inner.push([0, 0, 0]); }
                                return inner;
                            }).call(this)
                        });
                    }
                    zero_dict[key] = arr;
                } else {
                    zero_dict[key] = this.initialize_zero_gradients(structure[key]);
                }
            }
            return zero_dict;
        }
        return [0, 0, 0];
    }
    add_in_place(target, source) {
        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                if (Array.isArray(target[i])) {
                    this.add_in_place(target[i], source[i]);
                } else {
                    target[i] += source[i];
                }
            }
        } else if (typeof target === "object") {
            for (let key in target) {
                this.add_in_place(target[key], source[key]);
            }
        }
    }
    apply_gradients(optimizer) {
        if (!this.accumulated_embedding_grads) {
            return;
        }
        
        // Extract accumulated gradients
        var embedding_gradients = this.accumulated_embedding_grads;
        var layer_gradients = this.accumulated_layer_grads;
        var vocab_proj_weight_gradients = this.accumulated_vocab_grads.weights;
        var vocab_proj_bias_gradients = this.accumulated_vocab_grads.biases;
    
        // Calculate learning rate (same logic as in train_step)
        var warmup_steps = 100;
        var decay_factor = 0.25;
        var base_lr = this.learningRate;
        var min_lr = 0.0005;
    
        // Update step number and Adam params
        if (optimizer === "adam") {
            this.adam_params['t'] += 1;
        }
        this.step_num += 1;
        
        // Calculate learning rate
        var lr;
        if (this.step_num < warmup_steps) {
            lr = base_lr * (this.step_num / warmup_steps);
        } else {
            lr = base_lr * Math.pow(warmup_steps, 0.5) * Math.pow(this.step_num * decay_factor, -0.5);
        }
        
        // Apply cyclical learning rate adjustment
        var cycle_length = 50;
        var cycle_position = this.step_num % cycle_length;
        var cycle_ratio = cycle_position / cycle_length;
        var cycle_factor = 1.0;
        lr = lr * cycle_factor;
        
        // Apply minimum learning rate
        lr = Math.max(min_lr, lr);
        
        // Weight decay parameter
        var weight_decay = 0;  // L2 regularization factor
        if (config["antiOverfittingOptimisations"]) {
            weight_decay = 1e-5;
        }
        
        // For SGD with momentum
        var momentum_factor = 0.5;  // Classic momentum value
        if (optimizer === "sgd_momentum" && this.momentum_initialized === undefined) {
            console.log("Initializing momentum for first use");
            this.momentum_initialized = true;
        }
    
        // Update embeddings
        var vocab_indices = {};  // Track which token indices we've updated
        
        // FIXED: Process all batches of tokens
        for (var batch = 0; batch < this.accumulated_token_inputs.length; batch++) {
            var batch_tokens = this.accumulated_token_inputs[batch];
            
            for (var token_idx = 0; token_idx < batch_tokens.length; token_idx++) {
                var token = batch_tokens[token_idx][0];
                var token_id = batch_tokens[token_idx][1];
                
                // Find the index in vocabulary
                var vocab_idx = null;
                for (var i = 0; i < this.vocab.length; i++) {
                    if (this.vocab[i][1] === token_id) {
                        vocab_idx = i;
                        break;
                    }
                }
                
                if (vocab_idx !== null) {
                    vocab_indices[vocab_idx] = true;
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var grad = embedding_gradients[token_idx][pos];
                        var param = this.transformer["embeddings"][vocab_idx][pos];
                        
                        // Get gradient value
                        var grad_value = (typeof grad === "number") ? grad : (Array.isArray(grad) ? grad[0] : 0);
                        
                        // Add weight decay (L2 regularization)
                        grad_value += weight_decay * param[0];
                        
                        if (optimizer === "adam") {
                            // Adam update
                            param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                            param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                            
                            // Compute bias-corrected estimates
                            var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                            var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                            
                            // Update parameter value
                            param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                        } else if (optimizer === "sgd_momentum") {
                            // SGD with momentum update
                            param[1] = momentum_factor * param[1] + grad_value;
                            param[0] -= lr * param[1];
                        } else {
                            // Plain SGD update
                            param[0] -= lr * grad_value;
                        }
                    }
                }
            }
        }
    
        // Update layer parameters
        for (var layer_idx = 0; layer_idx < this.layersAmount; layer_idx++) {
            var layer = this.transformer["layers"][layer_idx];
            var layer_grad = layer_gradients[layer_idx];
            
            for (var param_type in layer) {
                if (layer.hasOwnProperty(param_type)) {
                    for (var key in layer[param_type]) {
                        if (Array.isArray(layer[param_type][key])) {
                            for (var i = 0; i < layer[param_type][key].length; i++) {
                                var grad = layer_grad[param_type][key][i];
                                var param = layer[param_type][key][i];
                                
                                // Get gradient value
                                var grad_value = (Array.isArray(grad)) ? grad[0] : grad;
                                
                                // Add weight decay (L2 regularization)
                                if (param_type === "weights") {  // Only apply to weights, not biases
                                    grad_value += weight_decay * param[0];
                                }
                                
                                if (optimizer === "adam") {
                                    // Adam update
                                    param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                                    param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                    
                                    // Compute bias-corrected estimates
                                    var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                    var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                    
                                    // Update parameter
                                    param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                } else if (optimizer === "sgd_momentum") {
                                    // SGD with momentum update
                                    param[1] = momentum_factor * param[1] + grad_value;
                                    param[0] -= lr * param[1];
                                } else {
                                    // SGD update
                                    param[0] -= lr * grad_value;
                                }
                            }
                        } else if (typeof layer[param_type][key] === "object") {  // For nested structures like attention heads
                            for (var subkey in layer[param_type][key]) {
                                if (subkey === "heads") {
                                    // Special handling for attention heads
                                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                                        for (var head_key of ["query", "key", "value"]) {
                                            var head_params = layer[param_type][key]["heads"][head_idx][head_key];
                                            var head_grads = layer_grad[param_type][key]["heads"][head_idx][head_key];
                                            
                                            for (var i = 0; i < head_params.length; i++) {
                                                if (Array.isArray(head_params[i]) && head_params[i].length >= 3) {
                                                    // Get the gradient
                                                    var grad_value = Array.isArray(head_grads[i]) ? head_grads[i][0] : head_grads[i];
                                                    
                                                    // Add weight decay (L2 regularization)
                                                    if (param_type === "weights") {  // Only apply to weights, not biases
                                                        grad_value += weight_decay * head_params[i][0];
                                                    }
                                                    
                                                    if (optimizer === "adam") {
                                                        // Adam update
                                                        head_params[i][1] = this.adam_params['beta1'] * head_params[i][1] + (1 - this.adam_params['beta1']) * grad_value;
                                                        head_params[i][2] = this.adam_params['beta2'] * head_params[i][2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                                        
                                                        // Compute bias-corrected estimates
                                                        var m_hat = head_params[i][1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                                        var v_hat = head_params[i][2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                                        
                                                        // Update parameter
                                                        head_params[i][0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                                    } else if (optimizer === "sgd_momentum") {
                                                        // SGD with momentum update
                                                        head_params[i][1] = momentum_factor * head_params[i][1] + grad_value;
                                                        head_params[i][0] -= lr * head_params[i][1];
                                                    } else {
                                                        // SGD update
                                                        head_params[i][0] -= lr * grad_value;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    // For other nested dictionaries like "output"
                                    var nested_params = layer[param_type][key][subkey];
                                    var nested_grads = layer_grad[param_type][key][subkey];
                                    
                                    if (Array.isArray(nested_params) && Array.isArray(nested_grads)) {
                                        for (var i = 0; i < nested_params.length; i++) {
                                            if (Array.isArray(nested_params[i]) && nested_params[i].length >= 3) {
                                                // Get the gradient
                                                var grad_value = Array.isArray(nested_grads[i]) ? nested_grads[i][0] : nested_grads[i];
                                                
                                                // Add weight decay (L2 regularization)
                                                if (param_type === "weights") {  // Only apply to weights, not biases
                                                    grad_value += weight_decay * nested_params[i][0];
                                                }
                                                
                                                if (optimizer === "adam") {
                                                    // Adam update
                                                    nested_params[i][1] = this.adam_params['beta1'] * nested_params[i][1] + (1 - this.adam_params['beta1']) * grad_value;
                                                    nested_params[i][2] = this.adam_params['beta2'] * nested_params[i][2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                                    
                                                    // Compute bias-corrected estimates
                                                    var m_hat = nested_params[i][1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                                    var v_hat = nested_params[i][2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                                    
                                                    // Update parameter
                                                    nested_params[i][0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                                } else if (optimizer === "sgd_momentum") {
                                                    // SGD with momentum update
                                                    nested_params[i][1] = momentum_factor * nested_params[i][1] + grad_value;
                                                    nested_params[i][0] -= lr * nested_params[i][1];
                                                } else {
                                                    // SGD update
                                                    nested_params[i][0] -= lr * grad_value;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    
        // Update vocabulary projection parameters
        // Update weights
        for (var i = 0; i < this.transformer["vocab_projection"]["weights"].length; i++) {
            var param = this.transformer["vocab_projection"]["weights"][i];
            var grad_value = vocab_proj_weight_gradients[i][0];
            
            // Add weight decay (L2 regularization)
            grad_value += weight_decay * param[0];
            
            if (optimizer === "adam") {
                // Adam update
                param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                
                // Compute bias-corrected estimates
                var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                
                // Update parameter
                param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
            } else if (optimizer === "sgd_momentum") {
                // SGD with momentum update
                param[1] = momentum_factor * param[1] + grad_value;
                param[0] -= lr * param[1];
            } else {
                // SGD update
                param[0] -= lr * grad_value;
            }
        }
    
        // Update biases
        for (var i = 0; i < this.transformer["vocab_projection"]["biases"].length; i++) {
            var param = this.transformer["vocab_projection"]["biases"][i];
            var grad_value = vocab_proj_bias_gradients[i][0];
            
            if (optimizer === "adam") {
                // Adam update
                param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                
                // Compute bias-corrected estimates
                var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                
                // Update parameter
                param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
            } else if (optimizer === "sgd_momentum") {
                // SGD with momentum update
                param[1] = momentum_factor * param[1] + grad_value;
                param[0] -= lr * param[1];
            } else {
                // SGD update
                param[0] -= lr * grad_value;
            }
        }
    
        // Clear accumulated gradients after updating
        this.accumulated_embedding_grads = null;
        this.accumulated_layer_grads = null;
        this.accumulated_vocab_grads = null;
        this.accumulated_token_inputs = null;  // Also clear the token inputs used for embedding lookups
        
        ndprint("Microbatch gradients applied.");
    }
    train_step(input_tokens, target_token, optimizer="sgd", training_mode=true, accumulate=false) {
        if (optimizer === undefined) { optimizer = "sgd"; }
        if (training_mode === undefined) { training_mode = true; }
        ndprint("Starting training step...");
        var gtimer = timer_();
        function compute_global_norm(embedding_grads, layer_grads) {
            var squared_sum = 0.0;
            for (var i = 0; i < embedding_grads.length; i++) {
                for (var j = 0; j < embedding_grads[i].length; j++) {
                    var val = embedding_grads[i][j];
                    squared_sum += val * val;
                }
            }
            function add_squared_grads(grad_struct) {
                if (Array.isArray(grad_struct)) {
                    if (grad_struct.length > 0 && typeof grad_struct[0] === "number") {
                        var val = grad_struct[0];
                        squared_sum += val * val;
                    }
                    return;
                } else if (typeof grad_struct === "object") {
                    for (var key in grad_struct) {
                        add_squared_grads(grad_struct[key]);
                    }
                }
            }
            for (var layer_idx = 0; layer_idx < layer_grads.length; layer_idx++) {
                add_squared_grads(layer_grads[layer_idx]);
            }
            return Math.sqrt(squared_sum);
        }
        console.log("Running inference to get cache...");
        var timer_inf = timer_();
        var input_text = "";
        for (var i = 0; i < input_tokens.length; i++) {
            input_text += input_tokens[i][0];
        }
        var inference_result = this.inference(input_text, true, training_mode);
        var cache = inference_result[1];
        console.log("Got inference cache in " + timer_end(timer_inf) + " ms");
        console.log("Calculating initial loss...");
        timer_inf = timer_();
        var initial_loss = this.calculate_loss(cache["vocab_scores"], target_token[1]);
        console.log("Initial loss: " + initial_loss + " calculated in " + timer_end(timer_inf) + " ms");
        console.log("Calculating learning rate...");
        timer_inf = timer_();
        if (optimizer === "adam") {
            this.adam_params['t'] += 1;
        }
        this.step_num += 1;
        var warmup_steps = 100;
        var decay_factor = 0.25;
        var base_lr = this.learningRate;
        var min_lr = 0.0005;
        var lr;
        if (this.step_num < warmup_steps) {
            lr = base_lr * (this.step_num / warmup_steps);
        } else {
            lr = base_lr * Math.pow(warmup_steps, 0.5) * Math.pow(this.step_num * decay_factor, -0.5);
        }
        var cycle_length = 50;
        var cycle_position = this.step_num % cycle_length;
        var cycle_ratio = cycle_position / cycle_length;
        var cycle_factor = 1.0;
        lr = lr * cycle_factor;
        lr = Math.max(min_lr, lr);
        console.log("Learning rate: " + lr + ", cyclical factor: " + cycle_factor.toFixed(4) + " calculated in " + timer_end(timer_inf) + " ms");
        console.log("Computing gradients...");
        var gtimer2 = timer_();
        var predicted_probs = this.softmax(cache["vocab_scores"]);
        var epsilon_grad = 0;
        var vocab_size = this.vocab.length;
        var target_distribution = [];
        for (var i = 0; i < vocab_size; i++) { target_distribution.push(epsilon_grad / (vocab_size - 1)); }
        var target_idx = null;
        for (var i = 0; i < this.vocab.length; i++) {
            if (this.vocab[i][1] === target_token[1]) { target_idx = i; break; }
        }
        if (target_idx === null) {
            console.log("Warning: Token ID " + target_token[1] + " not found in vocabulary");
            target_idx = 0;
        }
        target_distribution[target_idx] = 1.0 - epsilon_grad;
        var initial_error = [];
        for (var i = 0; i < predicted_probs.length; i++) {
            initial_error.push(predicted_probs[i] - target_distribution[i]);
        }
        console.log("Computing gradients for vocabulary projection parameters...");
        var vocab_proj_weight_gradients = [];
        for (var i = 0; i < this.transformer["vocab_projection"]["weights"].length; i++) { vocab_proj_weight_gradients.push([0, 0, 0]); }
        var vocab_proj_bias_gradients = [];
        for (var i = 0; i < this.transformer["vocab_projection"]["biases"].length; i++) { vocab_proj_bias_gradients.push([0, 0, 0]); }
        for (var vocab_idx = 0; vocab_idx < this.vocab.length; vocab_idx++) {
            var error_val = initial_error[vocab_idx];
            for (var embed_idx = 0; embed_idx < this.embeddingSize; embed_idx++) {
                var weight_idx = vocab_idx * this.embeddingSize + embed_idx;
                var gradient = error_val * cache["layers"][cache["layers"].length - 1]["feed_forward"]["final"][cache["layers"][cache["layers"].length - 1]["feed_forward"]["final"].length - 1][embed_idx];
                vocab_proj_weight_gradients[weight_idx][0] = gradient;
            }
            vocab_proj_bias_gradients[vocab_idx][0] = error_val;
        }
        var error_gradients = [];
        for (var i = 0; i < input_tokens.length; i++) {
            var arr = [];
            for (var j = 0; j < this.embeddingSize; j++) { arr.push(0.0); }
            error_gradients.push(arr);
        }
        for (var j = 0; j < this.embeddingSize; j++) {
            for (var k = 0; k < this.vocab.length; k++) {
                error_gradients[error_gradients.length - 1][j] += initial_error[k] * this.transformer["vocab_projection"]["weights"][k * this.embeddingSize + j][0];
            }
        }
        var embedding_gradients = [];
        for (var i = 0; i < input_tokens.length; i++) {
            var arr = [];
            for (var j = 0; j < this.embeddingSize; j++) { arr.push(0); }
            embedding_gradients.push(arr);
        }
        var layer_gradients = [];
        for (var i = 0; i < this.layersAmount; i++) {
            // Use each layer's own structure as the template for its gradients
            var layer_grad = {
                "weights": this.initialize_zero_gradients(this.transformer["layers"][i]["weights"]),
                "biases": this.initialize_zero_gradients(this.transformer["layers"][i]["biases"])
            };
            layer_gradients.push(layer_grad);
        }
        var next_grad = error_gradients;
        for (var layer_idx = this.layersAmount - 1; layer_idx >= 0; layer_idx--) {
            var layer_cache = cache["layers"][layer_idx];
            var ff_out_grad = [];
            for (var i = 0; i < next_grad.length; i++) {
                ff_out_grad.push(next_grad[i].slice());
            }
            var shrink_grad = [];
            for (var i = 0; i < input_tokens.length; i++) {
                var arr = [];
                for (var j = 0; j < this.embeddingSize * 4; j++) { arr.push(0.0); }
                shrink_grad.push(arr);
            }
            for (var i = 0; i < input_tokens.length; i++) {
                for (var j = 0; j < this.embeddingSize; j++) {
                    for (var k = 0; k < this.embeddingSize * 4; k++) {
                        if (layer_cache["feed_forward"]["after_relu"][i][k] > 0) {
                            shrink_grad[i][k] += ff_out_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) + k][0];
                            layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) + k][0] += ff_out_grad[i][j] * layer_cache["feed_forward"]["after_relu"][i][k];
                        }
                    }
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j][0] += ff_out_grad[i][j];
                }
            }
            var att_grad = [];
            for (var i = 0; i < input_tokens.length; i++) {
                var arr = [];
                for (var j = 0; j < this.embeddingSize; j++) { arr.push(0.0); }
                att_grad.push(arr);
            }
            for (var head = 0; head < this.heads; head++) {
                var head_cache = layer_cache["heads"][head];
                var q_grad = [];
                var k_grad = [];
                var v_grad = [];
                for (var i = 0; i < input_tokens.length; i++) {
                    var arr = [];
                    for (var j = 0; j < this.embeddingSize; j++) { arr.push(0.0); }
                    q_grad.push(arr);
                    k_grad.push(arr.slice());
                    v_grad.push(arr.slice());
                }
                var attention_grad = [];
                for (var i = 0; i < input_tokens.length; i++) {
                    var arr = [];
                    for (var j = 0; j < input_tokens.length; j++) { arr.push(0.0); }
                    attention_grad.push(arr);
                }
                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < input_tokens.length; j++) {
                        var score_grad = head_cache["attention_probs"][i][j] * (1 - head_cache["attention_probs"][i][j]);
                        attention_grad[i][j] = score_grad / Math.pow(this.embeddingSize, 0.5);
                        for (var k = 0; k < this.embeddingSize; k++) {
                            q_grad[i][k] += attention_grad[i][j] * head_cache["k_vectors"][j][k];
                            k_grad[j][k] += attention_grad[i][j] * head_cache["q_vectors"][i][k];
                        }
                        for (var k = 0; k < this.embeddingSize; k++) {
                            v_grad[j][k] += head_cache["attention_probs"][i][j] * next_grad[i][k];
                        }
                    }
                }
                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        for (var k = 0; k < this.embeddingSize; k++) {
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["query"][j * this.embeddingSize + k][0] += q_grad[i][j] * layer_cache["normalized"][i][k];
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["key"][j * this.embeddingSize + k][0] += k_grad[i][j] * layer_cache["normalized"][i][k];
                            layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["value"][j * this.embeddingSize + k][0] += v_grad[i][j] * layer_cache["normalized"][i][k];
                        }
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["query"][j][0] += q_grad[i][j];
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["key"][j][0] += k_grad[i][j];
                        layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["value"][j][0] += v_grad[i][j];
                    }
                }
                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        for (var k = 0; k < input_tokens.length; k++) {
                            att_grad[i][j] += head_cache["attention_probs"][i][k] * v_grad[k][j];
                        }
                    }
                }
            }
            for (var i = 0; i < input_tokens.length; i++) {
                var concatenated = [];
                for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                    concatenated = concatenated.concat(layer_cache["heads"][head_idx]["output"][i]);
                }
                for (var j = 0; j < this.embeddingSize; j++) {
                    for (var k = 0; k < this.embeddingSize * this.heads; k++) {
                        layer_gradients[layer_idx]["weights"]["attention"]["output"][j * (this.embeddingSize * this.heads) + k][0] += next_grad[i][j] * concatenated[k];
                    }
                    layer_gradients[layer_idx]["biases"]["attention"]["output"][j][0] += next_grad[i][j];
                }
            }
            for (var i = 0; i < input_tokens.length; i++) {
                for (var j = 0; j < this.embeddingSize; j++) {
                    layer_gradients[layer_idx]["weights"]["normalize_2"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j];
                    layer_gradients[layer_idx]["biases"]["normalize_2"][j][0] += next_grad[i][j];
                }
            }
            for (var i = 0; i < input_tokens.length; i++) {
                for (var j = 0; j < this.embeddingSize; j++) {
                    layer_gradients[layer_idx]["weights"]["normalize_1"][j][0] += next_grad[i][j] * layer_cache["normalized"][i][j];
                    layer_gradients[layer_idx]["biases"]["normalize_1"][j][0] += next_grad[i][j];
                }
            }
            next_grad = [];
            for (var i = 0; i < input_tokens.length; i++) {
                var arr = [];
                for (var j = 0; j < this.embeddingSize; j++) {
                    arr.push(next_grad[i] ? next_grad[i][j] : att_grad[i][j]);
                }
                next_grad.push(arr);
            }
            for (var i = 0; i < input_tokens.length; i++) {
                embedding_gradients[i] = this.add_vectors(embedding_gradients[i], next_grad[i]);
            }
        }
        console.log("Computed gradients in " + timer_end(gtimer2) + " ms");
        console.log("Applying continuous gradient scaling...");
        timer_inf = timer_();
        var gamma = 5.0;
        var global_grad_norm = compute_global_norm(embedding_gradients, layer_gradients);
        console.log("Global gradient norm: " + global_grad_norm.toFixed(6));
        var scaling_factor;
        if (global_grad_norm === 0) {
            scaling_factor = 1.0;
        } else {
            scaling_factor = Math.tanh(global_grad_norm / gamma) / (global_grad_norm / gamma);
        }
        console.log("Scaling gradients with factor " + scaling_factor.toFixed(6));
        for (var i = 0; i < embedding_gradients.length; i++) {
            for (var j = 0; j < embedding_gradients[i].length; j++) {
                embedding_gradients[i][j] *= scaling_factor;
            }
        }
        function scale_gradients(grad_struct, factor) {
            if (Array.isArray(grad_struct)) {
                if (grad_struct.length > 0 && typeof grad_struct[0] === "number") {
                    grad_struct[0] *= factor;
                }
                return;
            } else if (typeof grad_struct === "object") {
                for (var key in grad_struct) {
                    scale_gradients(grad_struct[key], factor);
                }
            }
        }
        for (var layer_idx = 0; layer_idx < layer_gradients.length; layer_idx++) {
            scale_gradients(layer_gradients[layer_idx], scaling_factor);
        }
        console.log("Applied continuous gradient scaling in " + timer_end(timer_inf) + " ms");
        if (accumulate) {
            if (!this.accumulated_embedding_grads) {
                this.accumulated_embedding_grads = embedding_gradients;
                this.accumulated_layer_grads = layer_gradients;
                this.accumulated_vocab_grads = {
                    weights: vocab_proj_weight_gradients,
                    biases: vocab_proj_bias_gradients
                };
                // FIXED: Store all input tokens not just overwrite
                this.accumulated_token_inputs = [input_tokens]; 
            } else {
                this.add_in_place(this.accumulated_embedding_grads, embedding_gradients);
                this.add_in_place(this.accumulated_layer_grads, layer_gradients);
                this.add_in_place(this.accumulated_vocab_grads.weights, vocab_proj_weight_gradients);
                this.add_in_place(this.accumulated_vocab_grads.biases, vocab_proj_bias_gradients);
                // FIXED: Track each batch's tokens
                this.accumulated_token_inputs.push(input_tokens);
            }
            ndprint("Gradients accumulated, delaying parameter update.");
            return initial_loss;
        }
    
        // Update your parameters as usual here (unchanged from your original logic):
        console.log("Updating parameters...");
        timer_inf = timer_();
        console.log("Using " + optimizer + " optimizer...");
        var weight_decay = 0;
        if (config["antiOverfittingOptimisations"]) {
            weight_decay = 1e-5;
        }
        var momentum_factor = 0.5;
        if (optimizer === "sgd_momentum" && this.momentum_initialized === undefined) {
            console.log("Initializing momentum for first use");
            this.momentum_initialized = true;
        }
        var vocab_indices = {};
        for (var token_idx = 0; token_idx < input_tokens.length; token_idx++) {
            var token = input_tokens[token_idx][0];
            var token_id = input_tokens[token_idx][1];
            var vocab_idx = null;
            for (var i = 0; i < this.vocab.length; i++) {
                if (this.vocab[i][1] === token_id) {
                    vocab_idx = i;
                    break;
                }
            }
            if (vocab_idx !== null) {
                vocab_indices[vocab_idx] = true;
                for (var pos = 0; pos < this.embeddingSize; pos++) {
                    var grad = embedding_gradients[token_idx][pos];
                    var param = this.transformer["embeddings"][vocab_idx][pos];
                    var grad_value = (typeof grad === "number") ? grad : (Array.isArray(grad) ? grad[0] : 0);
                    grad_value += weight_decay * param[0];
                    if (optimizer === "adam") {
                        param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                        param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                        var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                        var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                        param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                    } else if (optimizer === "sgd_momentum") {
                        param[1] = momentum_factor * param[1] + grad_value;
                        param[0] -= lr * param[1];
                    } else {
                        param[0] -= lr * grad_value;
                    }
                }
            }
        }
        for (var layer_idx = 0; layer_idx < this.layersAmount; layer_idx++) {
            var layer = this.transformer["layers"][layer_idx];
            var layer_grad = layer_gradients[layer_idx];
            for (var param_type in layer) {
                if (layer.hasOwnProperty(param_type)) {
                    for (var key in layer[param_type]) {
                        if (Array.isArray(layer[param_type][key])) {
                            for (var i = 0; i < layer[param_type][key].length; i++) {
                                var grad = layer_grad[param_type][key][i];
                                var param = layer[param_type][key][i];
                                var grad_value = (Array.isArray(grad)) ? grad[0] : grad;
                                if (param_type === "weights") {
                                    grad_value += weight_decay * param[0];
                                }
                                if (optimizer === "adam") {
                                    param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                                    param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                    var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                    var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                    param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                } else if (optimizer === "sgd_momentum") {
                                    param[1] = momentum_factor * param[1] + grad_value;
                                    param[0] -= lr * param[1];
                                } else {
                                    param[0] -= lr * grad_value;
                                }
                            }
                        } else if (typeof layer[param_type][key] === "object") {
                            for (var subkey in layer[param_type][key]) {
                                if (subkey === "heads") {
                                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                                        for (var head_key of ["query", "key", "value"]) {
                                            var head_params = layer[param_type][key]["heads"][head_idx][head_key];
                                            var head_grads = layer_grad[param_type][key]["heads"][head_idx][head_key];
                                            for (var i = 0; i < head_params.length; i++) {
                                                if (Array.isArray(head_params[i]) && head_params[i].length >= 3) {
                                                    var grad_value = Array.isArray(head_grads[i]) ? head_grads[i][0] : head_grads[i];
                                                    if (param_type === "weights") {
                                                        grad_value += weight_decay * head_params[i][0];
                                                    }
                                                    if (optimizer === "adam") {
                                                        head_params[i][1] = this.adam_params['beta1'] * head_params[i][1] + (1 - this.adam_params['beta1']) * grad_value;
                                                        head_params[i][2] = this.adam_params['beta2'] * head_params[i][2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                                        var m_hat = head_params[i][1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                                        var v_hat = head_params[i][2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                                        head_params[i][0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                                    } else if (optimizer === "sgd_momentum") {
                                                        head_params[i][1] = momentum_factor * head_params[i][1] + grad_value;
                                                        head_params[i][0] -= lr * head_params[i][1];
                                                    } else {
                                                        head_params[i][0] -= lr * grad_value;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    var nested_params = layer[param_type][key][subkey];
                                    var nested_grads = layer_grad[param_type][key][subkey];
                                    if (Array.isArray(nested_params) && Array.isArray(nested_grads)) {
                                        for (var i = 0; i < nested_params.length; i++) {
                                            if (Array.isArray(nested_params[i]) && nested_params[i].length >= 3) {
                                                var grad_value = Array.isArray(nested_grads[i]) ? nested_grads[i][0] : nested_grads[i];
                                                if (param_type === "weights") {
                                                    grad_value += weight_decay * nested_params[i][0];
                                                }
                                                if (optimizer === "adam") {
                                                    nested_params[i][1] = this.adam_params['beta1'] * nested_params[i][1] + (1 - this.adam_params['beta1']) * grad_value;
                                                    nested_params[i][2] = this.adam_params['beta2'] * nested_params[i][2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                                                    var m_hat = nested_params[i][1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                                                    var v_hat = nested_params[i][2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                                                    nested_params[i][0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
                                                } else if (optimizer === "sgd_momentum") {
                                                    nested_params[i][1] = momentum_factor * nested_params[i][1] + grad_value;
                                                    nested_params[i][0] -= lr * nested_params[i][1];
                                                } else {
                                                    nested_params[i][0] -= lr * grad_value;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        console.log("Updating vocabulary projection parameters...");
        for (var i = 0; i < this.transformer["vocab_projection"]["weights"].length; i++) {
            var param = this.transformer["vocab_projection"]["weights"][i];
            var grad_value = vocab_proj_weight_gradients[i][0];
            grad_value += weight_decay * param[0];
            if (optimizer === "adam") {
                param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
            } else if (optimizer === "sgd_momentum") {
                param[1] = momentum_factor * param[1] + grad_value;
                param[0] -= lr * param[1];
            } else {
                param[0] -= lr * grad_value;
            }
        }
        for (var i = 0; i < this.transformer["vocab_projection"]["biases"].length; i++) {
            var param = this.transformer["vocab_projection"]["biases"][i];
            var grad_value = vocab_proj_bias_gradients[i][0];
            if (optimizer === "adam") {
                param[1] = this.adam_params['beta1'] * param[1] + (1 - this.adam_params['beta1']) * grad_value;
                param[2] = this.adam_params['beta2'] * param[2] + (1 - this.adam_params['beta2']) * (grad_value * grad_value);
                var m_hat = param[1] / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                var v_hat = param[2] / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));
                param[0] -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);
            } else if (optimizer === "sgd_momentum") {
                param[1] = momentum_factor * param[1] + grad_value;
                param[0] -= lr * param[1];
            } else {
                param[0] -= lr * grad_value;
            }
        }
        console.log("Updated parameters in " + timer_end(timer_inf) + " ms");
        var param_to_check = this.transformer["embeddings"][0][0];
        if (optimizer === "adam") {
            console.log("Sample Adam values: momentum=" + param_to_check[1] + ", velocity=" + param_to_check[2]);
            this.check_adam_state();
        } else if (optimizer === "sgd_momentum") {
            console.log("Sample momentum value: " + param_to_check[1]);
        } else {
            console.log("Using SGD - no momentum/velocity values to report");
        }
        
        ndprint("Training step completed in", timer_end(gtimer), "ms");
        return initial_loss;
    }
    check_adam_state() {
        console.log("Adam step count: " + this.adam_params['t']);
        var params = [
            this.transformer["embeddings"][0][0],
            this.transformer["layers"][0]["weights"]["normalize_1"][0],
            this.transformer["vocab_projection"]["weights"][0]
        ];
        for (var i = 0; i < params.length; i++) {
            console.log("Parameter " + i + ": value=" + params[i][0] + ", momentum=" + params[i][1] + ", velocity=" + params[i][2]);
        }
    }
    train(dataset, epochs, optimizer) {
        if (epochs === undefined) { epochs = 1; }
        if (optimizer === undefined) { optimizer = "sgd"; }
        var subtimer = timer_();
        ndprint("Preprocessing dataset...");
        console.log("Loading dataset...");
        var timer_ds = timer_();
        var dataset_obj;
        try {
            dataset_obj = json.parse(fs.readFileSync(dataset, "utf-8"));
            console.log("Dataset loaded in " + timer_end(timer_ds) + " ms");
        } catch (e) {
            console.log("Failed to load dataset: " + e);
            throw new Error("Failed to load dataset: " + e);
        }
        console.log("Contextizing dataset...");
        timer_ds = timer_();
        var contexted_dataset = [];
        var response_token_masks = [];
        var end_token = null;
        for (var i = 0; i < this.vocab.length; i++) {
            if (this.vocab[i][1] === 100257) { end_token = this.vocab[i][0]; break; }
        }
        for (var idx = 0; idx < dataset_obj.length; idx++) {
            var item = dataset_obj[idx];
            var user_inputs = item["inputs"];
            var assistant_outputs = item["outputs"];
            if (user_inputs.length !== assistant_outputs.length) {
                console.log("Warning: inputs and outputs counts don't match in item");
                continue;
            }
            var full_context = "";
            var token_mask = [];
            for (var i = 0; i < user_inputs.length; i++) {
                var user_part = "user:\n" + user_inputs[i] + "\n";
                var user_tokens = this.tokenize(user_part);
                full_context += user_part;
                for (var j = 0; j < user_tokens.length; j++) { token_mask.push(false); }
                var system_marker = "you:\n";
                var system_tokens = this.tokenize(system_marker);
                full_context += system_marker;
                for (var j = 0; j < system_tokens.length; j++) { token_mask.push(false); }
                var assistant_part = assistant_outputs[i] + end_token;
                var assistant_tokens = this.tokenize(assistant_part);
                full_context += assistant_part;
                for (var j = 0; j < assistant_tokens.length; j++) { token_mask.push(true); }
                if (i < user_inputs.length - 1) {
                    full_context += "\n";
                    token_mask.push(false);
                }
            }
            contexted_dataset.push(full_context);
            response_token_masks.push(token_mask);
        }
        console.log("Contextized dataset in " + timer_end(timer_ds) + " ms");
        console.log("Tokenizing contexted dataset...");
        timer_ds = timer_();
        var tokenized_dataset = [];
        for (var i = 0; i < contexted_dataset.length; i++) {
            tokenized_dataset.push(this.tokenize(contexted_dataset[i]));
            var expected_tokens = tokenized_dataset[tokenized_dataset.length - 1].length - 1;
            if (response_token_masks[i].length !== expected_tokens) {
                console.log("Warning: Token mask length mismatch for item " + i + ".");
                console.log("  Expected " + expected_tokens + " mask entries but got " + response_token_masks[i].length);
                if (response_token_masks[i].length < expected_tokens) {
                    for (var j = 0; j < expected_tokens - response_token_masks[i].length; j++) {
                        response_token_masks[i].push(false);
                    }
                } else {
                    response_token_masks[i] = response_token_masks[i].slice(0, expected_tokens);
                }
            }
        }
        console.log("Tokenized contexted dataset in " + timer_end(timer_ds) + " ms");
        ndprint("Preprocessed dataset in " + timer_end(subtimer) + "ms");
        if (["sgd", "sgd_momentum", "adam"].indexOf(optimizer) === -1) {
            ndprint("Unknown optimizer: " + optimizer + ", falling back to SGD");
            optimizer = "sgd";
        }
        ndprint("\n" + "=".repeat(40) + "\nStarting training with " + optimizer + " optimizer\n" + "=".repeat(40) + "\n");
        var sgtimer = timer_();
        var best_loss = Infinity;
        var epoch_losses = [];
        var continue_training = true;
        var loss_history = [];
        var loss_window_size = 10;
        var plateau_patience = 5;
        var plateau_counter = 0;
        var last_best_loss = Infinity;
        var sweet_spot_min = 0;
        var sweet_spot_max = 5.0;
        var last_saved_sweet_spot_loss = Infinity;
        for (var epoch = 0; epoch < epochs; epoch++) {
            if (!continue_training) {
                ndprint("Training stopped at epoch " + epoch + "/" + epochs);
                break;
            }
            ndprint("\n" + "-".repeat(60));
            ndprint("Epoch " + (epoch + 1) + "/" + epochs);
            ndprint("-".repeat(60) + "\n");
            var total_io_pairs = 0;
            for (var i = 0; i < tokenized_dataset.length; i++) {
                var token_mask = response_token_masks[i];
                for (var j = 0; j < token_mask.length; j++) {
                    if (token_mask[j]) { total_io_pairs += 1; }
                }
            }
            var processed_io_pairs = 0;
            timer_ds = timer_();
            ndprint("Starting epoch " + (epoch + 1));
            var batch_losses = [];
            for (var i = 0; i < tokenized_dataset.length; i++) {
                var stimer = timer_();
                console.log("Training on item " + (i + 1) + " / " + tokenized_dataset.length);
                var tokens = tokenized_dataset[i];
                var token_mask = response_token_masks[i];
                var dataset_total_loss = 0.0;
                var sequence_positions = 0;
                var input_text = "";
                for (var j = 0; j < tokens.length - 1; j++) {
                    var input_tokens = tokens.slice(0, j + 1);
                    var target_token = tokens[j + 1];
                    if (j < token_mask.length && token_mask[j]) {
                        var loss = this.train_step(input_tokens, target_token, optimizer, true);                
                        dataset_total_loss += loss;
                        sequence_positions += 1;
                        processed_io_pairs += 1;
                        var response_tokens_in_item = token_mask.reduce(function(a, b) { return a + (b ? 1 : 0); }, 0);
                        var current_position_in_responses = token_mask.slice(0, j + 1).reduce(function(a, b) { return a + (b ? 1 : 0); }, 0);
                        var current_item_progress = (current_position_in_responses / response_tokens_in_item) * 100;
                        var overall_progress = (processed_io_pairs / total_io_pairs) * 100;
                        ndprint("Loss: " + loss.toFixed(4) + " (Response token " + current_position_in_responses + "/" + response_tokens_in_item + ") | " +
                            "Current item progress: " + current_item_progress.toFixed(2) + "% | " +
                            "Overall progress: " + overall_progress.toFixed(2) + "%");
                    }
                }
                if (sequence_positions > 0) {
                    var avg_item_loss = dataset_total_loss / sequence_positions;
                    batch_losses.push(avg_item_loss);
                    ndprint("Average loss for item " + (i + 1) + ": " + avg_item_loss.toFixed(4));
                }
                ndprint("Trained on item " + (i + 1) + " in " + timer_end(stimer) + " ms");
            }
            if (batch_losses.length > 0) {
                var sum_loss = batch_losses.reduce(function(a, b) { return a + b; }, 0);
                var avg_epoch_loss = sum_loss / batch_losses.length;
                epoch_losses.push(avg_epoch_loss);
                loss_history.push(avg_epoch_loss);
                ndprint("Epoch " + (epoch + 1) + " average loss: " + avg_epoch_loss.toFixed(6));
                if (loss_history.length >= loss_window_size) {
                    var recent = loss_history.slice(-loss_window_size);
                    var avg_recent_loss = recent.reduce(function(a, b) { return a + b; }, 0) / loss_window_size;
                    ndprint("Average loss over last " + loss_window_size + " epochs: " + avg_recent_loss.toFixed(6));
                    if (best_loss === last_best_loss) {
                        plateau_counter += 1;
                        if (plateau_counter >= plateau_patience) {
                            ndprint("Warning: Training appears to be plateauing for " + plateau_counter + " epochs");
                        }
                    } else {
                        plateau_counter = 0;
                        last_best_loss = best_loss;
                    }
                }
                var is_best_loss = avg_epoch_loss < best_loss;
                var in_sweet_spot = (avg_epoch_loss >= sweet_spot_min && avg_epoch_loss <= sweet_spot_max);
                var first_time_in_sweet_spot = in_sweet_spot && (last_saved_sweet_spot_loss === Infinity);
                var significant_progress = in_sweet_spot && ((last_saved_sweet_spot_loss - avg_epoch_loss) >= 0.5);
                if (first_time_in_sweet_spot || significant_progress) {
                    var loss_str = avg_epoch_loss.toFixed(2);
                    var save_path = "model_" + (epoch + 1) + "_" + loss_str + "_" + optimizer + "_sweetspot.json";
                    if (first_time_in_sweet_spot) {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("REACHED SWEET SPOT LOSS! Auto-saving model");
                        ndprint("-".repeat(60) + "\n");
                    } else {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("SIGNIFICANT IMPROVEMENT IN SWEET SPOT! Auto-saving model");
                        ndprint("Previous saved: " + last_saved_sweet_spot_loss.toFixed(2) + ", Current: " + avg_epoch_loss.toFixed(2));
                        ndprint("-".repeat(60) + "\n");
                    }
                    try {
                        this.save(save_path);
                        ndprint("Sweet spot model saved to " + save_path);
                        last_saved_sweet_spot_loss = avg_epoch_loss;
                    } catch (e) {
                        ndprint("Error saving sweet spot model: " + e);
                    }
                }
                if (is_best_loss) {
                    if (best_loss !== Infinity) {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("NEW BEST LOSS ACHIEVED! Previous best loss was: " + best_loss.toFixed(6));
                        ndprint("-".repeat(60) + "\n");
                    } else {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("NEW BEST LOSS ACHIEVED!");
                        ndprint("-".repeat(60) + "\n");
                    }
                    best_loss = avg_epoch_loss;
                    ndprint("New best loss: " + best_loss.toFixed(6) + "! Let's test the model:");
                }
                var should_prompt = !is_best_loss;
                if (is_best_loss || should_prompt) {
                    var result = this.interactive_test_loop(epoch, avg_epoch_loss, optimizer);
                    if (result === "STOP_TRAINING") {
                        break;
                    } else {
                        optimizer = result;
                    }
                }
            }
            ndprint("Epoch " + (epoch + 1) + " completed in " + timer_end(timer_ds) + " ms");
        }
        ndprint("\n" + "=".repeat(40) + "\nTraining completed after " + epoch_losses.length + " epochs\nFinal loss: " + epoch_losses[epoch_losses.length - 1].toFixed(6) + "\nBest loss: " + best_loss.toFixed(6) + "\n" + "=".repeat(40) + "\n");
        ndprint("Time elapsed: " + timer_end(sgtimer) + " ms");
        return best_loss;
    }
    pretrain(text_files, epochs, optimizer) {
        if (epochs === undefined) { epochs = 1; }
        if (optimizer === undefined) { optimizer = "sgd"; }
        ndprint("\n" + "=".repeat(40) + "\nStarting pretraining with " + optimizer + " optimizer\n" + "=".repeat(40) + "\n");
        var sgtimer = timer_();
        if (["sgd", "sgd_momentum", "adam"].indexOf(optimizer) === -1) {
            console.log("Unknown optimizer: " + optimizer + ", falling back to SGD");
            optimizer = "sgd";
        }
        var best_loss = Infinity;
        var last_saved_sweet_spot_loss = Infinity;
        var sweet_spot_min = 0.0;
        var sweet_spot_max = 5.0;
        var plateau_patience = 5;
        var plateau_counter = 0;
        var loss_window_size = 10;
        var last_best_loss = Infinity;
        var loss_history = [];
        var max_tokens_per_file = 1e45;
        for (var epoch = 0; epoch < epochs; epoch++) {
            ndprint("\n" + "-".repeat(60));
            ndprint("Epoch " + (epoch + 1) + "/" + epochs);
            ndprint("-".repeat(60) + "\n");
            var context = [];
            var epoch_losses = [];
            var file_states = [];
            for (var i = 0; i < text_files.length; i++) {
                file_states.push({ "path": text_files[i], "loaded": false, "tokens": [] });
            }
            var file_index = 0;
            var token_index = 0;
            while (file_index < file_states.length) {
                var state = file_states[file_index];
                if (!state["loaded"]) {
                    try {
                        var text = fs.readFileSync(state["path"], "utf-8");
                        var tokens = this.tokenize(text);
                        state["tokens"] = tokens;
                        state["loaded"] = true;
                        ndprint("[Info] Loaded and tokenized " + state["path"] + " (" + tokens.length + " tokens)");
                    } catch (e) {
                        ndprint("[Error] Could not read " + state["path"] + ": " + e);
                        file_index += 1;
                        continue;
                    }
                }
                var tokens = state["tokens"];
                var microbatch = [];
        
                while (token_index + this.contextSize < tokens.length) {
                    var input_tokens = tokens.slice(token_index, token_index + this.contextSize);
                    var target_token = tokens[token_index + this.contextSize];
        
                    microbatch.push([input_tokens, target_token]);
        
                    if (microbatch.length === config["microbatchSize"]) {
                        var total_loss = 0.0;
        
                        for (var [input, target] of microbatch) {
                            var loss = this.train_step(input, target, optimizer, true, true);  // true = accumulate
                            total_loss += loss;
                        }
        
                        this.apply_gradients(optimizer);  // apply once
                        microbatch = [];
        
                        var avg_loss = total_loss / config["microbatchSize"];
                        epoch_losses.push(avg_loss);
                        ndprint("Microbatch loss: " + avg_loss.toFixed(4));
                    }
        
                    token_index += this.contextSize;
                }
        
                // FIXED: Process any remaining samples in microbatch
                if (microbatch.length > 0) {
                    var total_loss = 0.0;
                    for (var i = 0; i < microbatch.length; i++) {
                        var loss = this.train_step(microbatch[i][0], microbatch[i][1], optimizer, true, true);
                        total_loss += loss;
                    }
                    
                    this.apply_gradients(optimizer);
                    
                    var avg_loss = total_loss / microbatch.length;
                    epoch_losses.push(avg_loss);
                    ndprint("Final partial microbatch loss: " + avg_loss.toFixed(4));
                    microbatch = [];
                }
        
                file_index += 1;
                token_index = 0;
                for (var i = 0; i < file_states.length; i++) {
                    if (file_states[i]["loaded"]) {
                        var oldest_position = file_index * max_tokens_per_file + token_index - this.contextSize;
                        var file_end_position = i * max_tokens_per_file + file_states[i]["tokens"].length;
                        if (file_end_position < oldest_position) {
                            console.log("[Info] Unloading " + file_states[i]['path'] + " from memory");
                            file_states[i]["loaded"] = false;
                            file_states[i]["tokens"] = [];
                        }
                    }
                }
            }
            if (epoch_losses.length) {
                var sum_loss = epoch_losses.reduce(function(a, b) { return a + b; }, 0);
                var avg_loss = sum_loss / epoch_losses.length;
                ndprint("[Epoch " + (epoch + 1) + "] Average loss: " + avg_loss.toFixed(6));
                loss_history.push(avg_loss);
                if (loss_history.length >= loss_window_size) {
                    var recent = loss_history.slice(-loss_window_size);
                    var avg_recent_loss = recent.reduce(function(a, b) { return a + b; }, 0) / loss_window_size;
                    ndprint("Average loss over last " + loss_window_size + " epochs: " + avg_recent_loss.toFixed(6));
                    if (best_loss === last_best_loss) {
                        plateau_counter += 1;
                        if (plateau_counter >= plateau_patience) {
                            ndprint("Warning: Pretraining appears to be plateauing for " + plateau_counter + " epochs");
                        }
                    } else {
                        plateau_counter = 0;
                        last_best_loss = best_loss;
                    }
                }
                var in_sweet_spot = (avg_loss >= sweet_spot_min && avg_loss <= sweet_spot_max);
                var first_time = in_sweet_spot && (last_saved_sweet_spot_loss === Infinity);
                var improved = in_sweet_spot && ((last_saved_sweet_spot_loss - avg_loss) >= 0.5);
                if (first_time || improved) {
                    var loss_str = avg_loss.toFixed(2);
                    var save_path = "pretrained_" + (epoch + 1) + "_" + loss_str + "_" + optimizer + "_sweetspot.json";
                    if (first_time) {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("REACHED SWEET SPOT LOSS! Auto-saving model");
                        ndprint("-".repeat(60) + "\n");
                    } else {
                        ndprint("\n" + "-".repeat(60));
                        ndprint("SIGNIFICANT IMPROVEMENT IN SWEET SPOT! Auto-saving model");
                        ndprint("Previous saved: " + last_saved_sweet_spot_loss.toFixed(2) + ", Current: " + avg_loss.toFixed(2));
                        ndprint("-".repeat(60) + "\n");
                    }
                    try {
                        this.save(save_path);
                        ndprint("Sweet spot model saved to " + save_path);
                        last_saved_sweet_spot_loss = avg_loss;
                    } catch (e) {
                        ndprint("[Error] Could not save model: " + e);
                    }
                }
                if (avg_loss < best_loss) {
                    best_loss = avg_loss;
                    ndprint("\n" + "-".repeat(60));
                    ndprint("NEW BEST LOSS: " + best_loss.toFixed(6));
                    ndprint("-".repeat(60) + "\n");
                }
            }
            var result = this.interactive_test_loop(epoch, epoch_losses.length ? avg_loss : 0.0, optimizer);
            if (result === "STOP_TRAINING") {
                break;
            } else {
                optimizer = result;
            }
        }
        ndprint("\n" + "=".repeat(40) + "\nPretraining complete\n" + "=".repeat(40) + "\n");
        ndprint("Time elapsed: " + timer_end(sgtimer) + " ms");
    }
    inference(context, return_cache, training_mode) {
        if (training_mode === undefined) { training_mode = false; }
        function scale_activation(vector, base_gamma) {
            if (base_gamma === undefined) { base_gamma = 5.0; }
            var norm = Math.sqrt(vector.reduce(function(sum, x) { return sum + x * x; }, 0));
            if (isNaN(norm)) {
                ndprint("!!CRITICAL ISSUE!! -- Activation norm is NaN, this will cause training or generating responses to be extremely unstable or not work at all.");
                ndprint("!!CRITICAL ISSUE!! -- Do you wish to exit? (y/n): ");
                while (true) {
                    var result = require("readline-sync").question("Do you wish to exit? (y/n): ");
                    if (result.toLowerCase() === "y") {
                        ndprint("Exiting...");
                        process.exit();
                    } else if (result.toLowerCase() === "n") {
                        ndprint("!!CRITICAL ISSUE!! -- Continuing despite NaN activation norm.");
                        break;
                    } else {
                        ndprint("Invalid input. Please enter 'y' or 'n'.");
                    }
                }
            }
            if (norm < 1e-10) { return vector; }
            if (norm > 1000) {
                var target_norm = 5.0;
                var scaling_factor = target_norm / norm;
                console.log("Extreme scaling: norm=" + norm.toExponential(2) + ", factor=" + scaling_factor.toExponential(2));
                return vector.map(function(x) { return x * scaling_factor; });
            } else if (norm > 100) {
                var scaling_factor = Math.tanh(1.0) / norm * 100;
                return vector.map(function(x) { return x * scaling_factor; });
            } else {
                var scaling_factor = Math.tanh(norm / base_gamma) / (norm / base_gamma);
                return vector.map(function(x) { return x * scaling_factor; });
            }
        }
        ndprint("Doing inference...");
        var sgtimer = timer_();
        var tokenized_input = this.tokenize(context);
        var input_length = tokenized_input.length;
        if (input_length > this.contextSize) {
            throw new Error("Input too long");
        }
        var cache = null;
        if (return_cache) {
            cache = {
                "tokenized": tokenized_input,
                "initial_embeddings": [],
                "positional_encodings": this.calculate_positional_encoding(input_length),
                "layers": []
            };
        } else {
            var positional_encodings = this.calculate_positional_encoding(input_length);
        }
        var timer_inf = timer_();
        console.log("Computing embeddings...");
        var final_embeddings = [];
        for (var pos = 0; pos < tokenized_input.length; pos++) {
            var token = tokenized_input[pos][0];
            var token_id = tokenized_input[pos][1];
            var embedding = this.get_embedding(token_id).map(function(x) { return x[0]; });
            if (return_cache) { cache["initial_embeddings"].push(embedding.slice()); }
            var pos_enc = (return_cache ? cache["positional_encodings"] : positional_encodings)[pos];
            for (var i = 0; i < this.embeddingSize; i++) {
                embedding[i] += pos_enc[i];
            }
            final_embeddings.push(embedding);
        }
        console.log("Computed embeddings in " + timer_end(timer_inf) + " ms");
        var gtimer = timer_();
        console.log("Computing layers...");
        for (var layer = 0; layer < this.layersAmount; layer++) {
            timer_inf = timer_();
            console.log("Computing layer " + layer);
            if (return_cache) {
                cache["layers"].push({
                    "heads": [],
                    "combined": null,
                    "normalized": null,
                    "feed_forward": {
                        "bigger": null,
                        "after_relu": null,
                        "final": null
                    }
                });
            }
            var normalized_embeddings = [];
            for (var i = 0; i < final_embeddings.length; i++) {
                var normalized = this.normalize_vector(final_embeddings[i]);
                var weighted_normalized = [];
                for (var j = 0; j < this.embeddingSize; j++) {
                    var weighted_value = normalized[j] * this.transformer["layers"][layer]["weights"]["normalize_1"][j][0] + this.transformer["layers"][layer]["biases"]["normalize_1"][j][0];
                    weighted_normalized.push(weighted_value);
                }
                normalized_embeddings.push(weighted_normalized);
            }
            if (return_cache) {
                cache["layers"][layer]["normalized"] = normalized_embeddings.slice();
            }
            var head_outputs = [];
            for (var head = 0; head < this.heads; head++) {
                var head_weights = this.transformer["layers"][layer]["weights"]["attention"]["heads"][head];
                var head_biases = this.transformer["layers"][layer]["biases"]["attention"]["heads"][head];
                var q_vectors = [];
                var k_vectors = [];
                var v_vectors = [];
                for (var i = 0; i < normalized_embeddings.length; i++) {
                    var token_embedding = normalized_embeddings[i];
                    var q_vector = [];
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var q_sum = 0;
                        for (var j = 0; j < this.embeddingSize; j++) {
                            q_sum += token_embedding[j] * head_weights["query"][pos * this.embeddingSize + j][0];
                        }
                        q_vector.push(q_sum + head_biases["query"][pos][0]);
                    }
                    q_vectors.push(q_vector);
                    var k_vector = [];
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var k_sum = 0;
                        for (var j = 0; j < this.embeddingSize; j++) {
                            k_sum += token_embedding[j] * head_weights["key"][pos * this.embeddingSize + j][0];
                        }
                        k_vector.push(k_sum + head_biases["key"][pos][0]);
                    }
                    k_vectors.push(k_vector);
                    var v_vector = [];
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var v_sum = 0;
                        for (var j = 0; j < this.embeddingSize; j++) {
                            v_sum += token_embedding[j] * head_weights["value"][pos * this.embeddingSize + j][0];
                        }
                        v_vector.push(v_sum + head_biases["value"][pos][0]);
                    }
                    v_vectors.push(v_vector);
                }
                var attention_scores = [];
                for (var i = 0; i < q_vectors.length; i++) {
                    var token_scores = [];
                    for (var j = 0; j < k_vectors.length; j++) {
                        var score = this.dot_product(q_vectors[i], k_vectors[j]);
                        if (j > i) { score = -Infinity; }
                        token_scores.push(score);
                    }
                    attention_scores.push(token_scores);
                }
                for (var i = 0; i < attention_scores.length; i++) {
                    for (var j = 0; j < attention_scores[i].length; j++) {
                        if (attention_scores[i][j] !== -Infinity) {
                            attention_scores[i][j] /= Math.sqrt(this.embeddingSize);
                        }
                    }
                }
                var attention_probs = [];
                for (var i = 0; i < attention_scores.length; i++) {
                    attention_probs.push(this.softmax(attention_scores[i]));
                }
                var post_attention_vectors = [];
                for (var token_idx = 0; token_idx < attention_probs.length; token_idx++) {
                    var final_vector = [];
                    for (var pos = 0; pos < this.embeddingSize; pos++) { final_vector.push(0); }
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        for (var other_token_idx = 0; other_token_idx < attention_probs[token_idx].length; other_token_idx++) {
                            final_vector[pos] += v_vectors[other_token_idx][pos] * attention_probs[token_idx][other_token_idx];
                        }
                    }
                    post_attention_vectors.push(final_vector);
                }
                if (return_cache) {
                    var head_cache = {
                        "q_vectors": q_vectors,
                        "k_vectors": k_vectors,
                        "v_vectors": v_vectors,
                        "attention_scores": attention_scores,
                        "attention_probs": attention_probs,
                        "output": []
                    };
                    for (var token_idx = 0; token_idx < tokenized_input.length; token_idx++) {
                        head_cache["output"].push(post_attention_vectors[token_idx].slice());
                    }
                    cache["layers"][layer]["heads"].push(head_cache);
                }
                head_outputs.push(post_attention_vectors);
            }
            var combined_vectors = [];
            for (var token_idx = 0; token_idx < final_embeddings.length; token_idx++) {
                var concatenated = [];
                for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                    concatenated = concatenated.concat(head_outputs[head_idx][token_idx]);
                }
                var output_vector = [];
                var output_weights = this.transformer["layers"][layer]["weights"]["attention"]["output"];
                var output_biases = this.transformer["layers"][layer]["biases"]["attention"]["output"];
                for (var pos = 0; pos < this.embeddingSize; pos++) {
                    var pos_sum = 0;
                    for (var j = 0; j < this.embeddingSize * this.heads; j++) {
                        pos_sum += concatenated[j] * output_weights[pos * (this.embeddingSize * this.heads) + j][0];
                    }
                    output_vector.push(pos_sum + output_biases[pos][0]);
                }
                combined_vectors.push(output_vector);
            }
            if (return_cache) {
                cache["layers"][layer]["combined"] = combined_vectors.slice();
            }
            if (training_mode) {
                var dropout_rate = 0;
                if (config["antiOverfittingOptimisations"]) {
                    dropout_rate = 0.1;
                }
                for (var i = 0; i < combined_vectors.length; i++) {
                    for (var j = 0; j < combined_vectors[i].length; j++) {
                        if (random_range([0, 1]) < dropout_rate) {
                            combined_vectors[i][j] = 0;
                        } else {
                            combined_vectors[i][j] /= (1 - dropout_rate);
                        }
                    }
                }
            }
            for (var i = 0; i < combined_vectors.length; i++) {
                for (var j = 0; j < this.embeddingSize; j++) {
                    combined_vectors[i][j] += final_embeddings[i][j];
                }
            }
            for (var i = 0; i < combined_vectors.length; i++) {
                combined_vectors[i] = scale_activation(combined_vectors[i], 5.0);
            }
            var normalized_vectors = [];
            for (var i = 0; i < combined_vectors.length; i++) {
                var normalized = this.normalize_vector(combined_vectors[i]);
                var weighted_normalized = [];
                for (var j = 0; j < this.embeddingSize; j++) {
                    var weighted_value = normalized[j] * this.transformer["layers"][layer]["weights"]["normalize_2"][j][0] + this.transformer["layers"][layer]["biases"]["normalize_2"][j][0];
                    weighted_normalized.push(weighted_value);
                }
                normalized_vectors.push(weighted_normalized);
            }
            var bigger_vectors = [];
            for (var i = 0; i < normalized_vectors.length; i++) {
                var bigger_vector = [];
                for (var j = 0; j < this.embeddingSize * 4; j++) {
                    var sum_val = 0;
                    for (var k = 0; k < this.embeddingSize; k++) {
                        sum_val += normalized_vectors[i][k] * this.transformer["layers"][layer]["weights"]["feed_forward"]["grow"][k * (this.embeddingSize * 4) + j][0];
                    }
                    bigger_vector.push(sum_val + this.transformer["layers"][layer]["biases"]["feed_forward"]["grow"][j][0]);
                }
                bigger_vectors.push(bigger_vector);
            }
            if (return_cache) {
                cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.slice();
            }
            for (var i = 0; i < bigger_vectors.length; i++) {
                for (var j = 0; j < this.embeddingSize * 4; j++) {
                    if (bigger_vectors[i][j] < 0) {
                        bigger_vectors[i][j] = 0;
                    }
                }
            }
            if (return_cache) {
                cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.slice();
            }
            if (training_mode) {
                var dropout_rate = 0;
                if (config["antiOverfittingOptimisations"]) {
                    dropout_rate = 0.1;
                }
                for (var i = 0; i < bigger_vectors.length; i++) {
                    for (var j = 0; j < bigger_vectors[i].length; j++) {
                        if (random_range([0, 1]) < dropout_rate) {
                            bigger_vectors[i][j] = 0;
                        } else {
                            bigger_vectors[i][j] /= (1 - dropout_rate);
                        }
                    }
                }
            }
            var final_vectors = [];
            for (var i = 0; i < bigger_vectors.length; i++) {
                var final_vector = [];
                for (var pos = 0; pos < this.embeddingSize; pos++) {
                    var accum = 0;
                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                        accum += bigger_vectors[i][j] * this.transformer["layers"][layer]["weights"]["feed_forward"]["shrink"][pos * (this.embeddingSize * 4) + j][0];
                    }
                    final_vector.push(accum + this.transformer["layers"][layer]["biases"]["feed_forward"]["shrink"][pos][0]);
                }
                final_vectors.push(final_vector);
            }
            for (var i = 0; i < final_vectors.length; i++) {
                for (var j = 0; j < this.embeddingSize; j++) {
                    final_vectors[i][j] += combined_vectors[i][j];
                }
            }
            for (var i = 0; i < final_vectors.length; i++) {
                final_vectors[i] = scale_activation(final_vectors[i], 5.0);
            }
            if (return_cache) {
                cache["layers"][layer]["feed_forward"]["final"] = final_vectors.slice();
            }
            final_embeddings = final_vectors;
            console.log("Computed layer " + layer + " in " + timer_end(timer_inf) + " ms");
        }
        console.log("Computed layers in " + timer_end(gtimer) + " ms");
        timer_inf = timer_();
        console.log("Computing next token...");
        var last_token_embedding = final_embeddings[final_embeddings.length - 1];
        var scores = [];
        for (var token_idx = 0; token_idx < this.vocab.length; token_idx++) {
            var score = 0;
            for (var pos = 0; pos < this.embeddingSize; pos++) {
                score += last_token_embedding[pos] * this.transformer["vocab_projection"]["weights"][token_idx * this.embeddingSize + pos][0];
            }
            score += this.transformer["vocab_projection"]["biases"][token_idx][0];
            scores.push([score, token_idx]);
        }
        if (return_cache) {
            cache["vocab_scores"] = [];
            for (var i = 0; i < scores.length; i++) {
                cache["vocab_scores"].push(scores[i][0]);
            }
        }
        var highest_score = -Infinity;
        var next_token = 0;
        for (var i = 0; i < scores.length; i++) {
            var score = scores[i][0];
            var token_idx = scores[i][1];
            if (score > highest_score) {
                highest_score = score;
                next_token = token_idx;
            }
        }
        console.log("Computed next token in " + timer_end(timer_inf) + " ms");
        ndprint("Did inference in", timer_end(sgtimer), "ms");
        if (return_cache) {
            return [[this.vocab[next_token][0], next_token], cache];
        }
        return [this.vocab[next_token][0], next_token];
    }
    generate(context, temperature) {
        if (temperature === undefined || temperature === false) { temperature = this.temperature; }
        var current_context = context;
        var output = "";
        for (var step = 0; step < this.maxOutputSize; step++) {
            var inference_res = this.inference(current_context, true);
            var next_token = inference_res[0];
            var cache = inference_res[1];
            var scores = cache["vocab_scores"];
            if (temperature < 0.0001) {
                var highest_score = -Infinity;
                var next_token_idx = 0;
                for (var i = 0; i < scores.length; i++) {
                    if (scores[i] > highest_score) {
                        highest_score = scores[i];
                        next_token_idx = i;
                    }
                }
                next_token = [this.vocab[next_token_idx][0], this.vocab[next_token_idx][1]];
                ndprint("Inference predicted token: \"" + next_token[0] + "\" with id " + next_token[1]);
            } else {
                var scaled_scores = [];
                for (var i = 0; i < scores.length; i++) { scaled_scores.push(scores[i] / temperature); }
                var probs = this.softmax(scaled_scores);
                var random_value = random_range([0, 1]);
                var cumulative_prob = 0.0;
                var next_token_idx = 0;
                for (var i = 0; i < probs.length; i++) {
                    cumulative_prob += probs[i];
                    if (random_value <= cumulative_prob) {
                        next_token_idx = i;
                        break;
                    }
                }
                next_token = [this.vocab[next_token_idx][0], this.vocab[next_token_idx][1]];
                ndprint("Inference predicted token: \"" + next_token[0] + "\" with id " + next_token[1]);
            }
            if (next_token[1] === 100257) {
                break;
            }
            output += next_token[0];
            current_context += next_token[0];
        }
        return output;
    }
    async interactive_test_loop(epoch_num, avg_loss, optimizer) {
        ndprint("\n[🧪 Interactive Test Mode]");
        
        try {
            ndprint("If you're still here, type anything to enter testing mode.");
            // Wait up to 30 seconds for a response
            var poke = await inputWithTimeout("Are you there? (30s): ", 30000);
            if (poke === null) {
                ndprint("[Info] Timeout. Skipping testing.");
                return optimizer;
            }
        } catch (e) {
            ndprint("[Info] Timeout or error. Skipping testing.");
            return optimizer;
        }

        // If the user responded before the 30s timeout, we enter the loop:
        while (true) {
            var user_input;
            try {
                // Prompt again for the actual commands, also with a 30s limit
                user_input = await inputWithTimeout("› ", 30000);
                // If the user timed out here, skip interactive mode
                if (user_input === null) {
                    ndprint("\n[Info] Timeout. Skipping interactive testing...");
                    break;
                }
                user_input = user_input.trim();
            } catch (e) {
                ndprint("\n[Info] Skipping interactive testing...");
                break;
            }

            if (user_input === "") {
                ndprint("[Info] Skipping...");
                break;
            } else if (user_input === "/continue") {
                ndprint("[Info] Continuing to next epoch...");
                break;
            } else if (user_input === "/stop") {
                ndprint("[Info] Stopping training.");
                return "STOP_TRAINING";
            } else if (user_input.indexOf("/save") === 0) {
                var parts = user_input.split(" ", 2);
                var save_path = parts.length > 1 ? parts[1] : ("model_" + optimizer + ".json");
                try {
                    this.save(save_path);
                    ndprint("[Info] Model saved to " + save_path);
                } catch (e) {
                    ndprint("[Error] Could not save: " + e);
                }
            } else if (user_input.indexOf("/switch_to_") === 0) {
                var new_opt = user_input.substring("/switch_to_".length);
                if (["adam", "sgd", "sgd_momentum"].indexOf(new_opt) !== -1) {
                    ndprint("[Info] Switching to " + new_opt.toUpperCase());
                    return new_opt;
                } else {
                    ndprint("[Error] Unknown optimizer.");
                }
            } else if (user_input.indexOf("/temperature") === 0) {
                var parts = user_input.split(" ", 2);
                if (parts.length < 2) {
                    ndprint("[Current Temperature] " + this.temperature);
                } else {
                    try {
                        var temp = parseFloat(parts[1]);
                        this.temperature = temp;
                        ndprint("[Info] Set temperature to " + temp);
                    } catch (e) {
                        ndprint("[Error] Invalid value.");
                    }
                }
            } else if (user_input === "/info") {
                ndprint("[Info] Epoch: " + (epoch_num + 1) + 
                        ", Loss: " + avg_loss.toFixed(4) + 
                        ", Optimizer: " + optimizer + 
                        ", Temperature: " + this.temperature);
            } else if (user_input === "/help") {
                ndprint("Available commands:");
                ndprint("  /continue        Continue training");
                ndprint("  /stop            Stop training");
                ndprint("  /save [path]     Save model (optional path)");
                ndprint("  /switch_to_*     Switch optimizer (sgd, adam, sgd_momentum)");
                ndprint("  /temperature X   Set or view temperature");
                ndprint("  /info            Show current training info");
                ndprint("  /help            Show this help message");
            } else {
                var prompt = "user:\n" + user_input + "\nyou:\n";
                try {
                    var output = this.generate(prompt, this.temperature);
                    ndprint(output);
                } catch (e) {
                    ndprint("[Error] Failed to generate: " + e);
                }
            }
        }
        return optimizer;
    }
}

if (flag) {
    var transformer = new Transformer(true, {
        "contextSize": config["contextSize"],
        "embeddingSize": config["embeddingSize"],
        "learningRate": config["learningRate"],
        "maxOutputSize": config["maxOutputSize"],
        "layersAmount": config["layersAmount"],
        "heads": config["heads"],
        "use_he_init": true,
        "biasesinitrange": config["biasesinitrange"],
        "embeddinginitrange": config["embeddinginitrange"]
    });
    if (pretraining__) {
        transformer.pretrain(config["pre-training-paths"], config["pre-train-epochs"], config["pre-train-optimizer"]);
    }
    if (training__) {
        transformer.train(config["training-dataset-path"], config["train-epochs"], config["train-optimizer"]);
    }
} else {
    var transformer = new Transformer(false, null, model_location);
}

try {
    ndprint("\nEntering interactive mode. Type a message or command:");
    ndprint("Commands: /save [path], /temperature [value], /help, /exit");
    function generate_response(text) {
        var formatted_input = "user:\n" + text + "\nyou:\n";
        var tokenized = transformer.tokenize(formatted_input);
        return transformer.generate(formatted_input, transformer.temperature);
    }
    while (true) {
        var text = require("readline-sync").question("› ").trim();
        if (text.indexOf("/save ") === 0) {
            var path_out = text.substring(6);
            transformer.save(path_out);
            ndprint("Model saved to " + path_out);
            continue;
        } else if (text === "/save") {
            transformer.save();
            ndprint("Model saved to model.json");
            continue;
        } else if (text.indexOf("/temperature") === 0) {
            var parts = text.split(" ", 2);
            if (parts.length === 1) {
                ndprint("Current temperature: " + transformer.temperature);
            } else {
                try {
                    transformer.temperature = parseFloat(parts[1]);
                    ndprint("Set temperature to " + transformer.temperature);
                } catch (e) {
                    ndprint("Invalid temperature value.");
                }
            }
            continue;
        } else if (text === "/help") {
            ndprint("Available commands:");
            ndprint("  /save [path]     Save model to file");
            ndprint("  /temperature X   Set or view temperature");
            ndprint("  /exit            Exit interactive mode");
            continue;
        } else if (text === "/exit") {
            console.log("Exiting interactive mode.");
            break;
        }
        var output = generate_response(text);
        ndprint(output);
    }
} catch (e) {
    ndprint("\nExiting interactive mode.");
    process.exit(0);
}}
