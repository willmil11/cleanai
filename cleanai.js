// app.js
//
//* It is way better to download the better comments extension for vscode to view this file because
//* it adds color to the comments depending on how much you should read them thanks to the little symbols
//* like * ! and ? that I put after // on the comments.

// Credits
//
// Me ofc (willmil11)
// Claude (3.5 sonnet, 3.7 sonnet)
// Chatgpt (4o, o1, o3, o3-mini-high, o4-mini-high)
// Gemini (2.5 flash, 2.5 pro. aistudio versions)
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
const { validateHeaderValue } = require("http");
var spawnchild = require("child_process").spawn;

var readline_async_synclike = async function(query){
    return await new Promise((resolve) => {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(query, function(answer) {
            rl.close();
            resolve(answer);
        });
    });
}

var wait = async function(ms){
    await new Promise(function(resolve){
        setTimeout(function(){
            resolve();
        }, ms)
    })
}

var resolveDependency = async function(dependency){
    console.log("Missing dependency: " + dependency)
    console.log("Would you like to auto-install all dependencies?")
    console.log("Dependencies are:")
    console.log("  - readline-sync")
    console.log("  - tiktoken")
    console.log("  - archiver")
    console.log("  - yauzl")
    console.log("  - uuid")
    console.log("I am not liable if auto-installing the dependencies using the command below causes any damage of any sort to your system.")
    console.log("Command: \"npm install readline-sync tiktoken archiver yauzl uuid\"")
    console.log("Correct answers to the following prompt are \"y\" for yes and \"n\" for no without the quotes.")
    while (true){
        res = await readline_async_synclike("Auto-install? (y/n) › ")
        if (res === "y"){
            console.log("Auto-installing dependencies...")
            const install = spawnchild('npm', [
                'install',
                'readline-sync',
                'tiktoken',
                'archiver',
                'yauzl',
                'uuid'
            ], {
                stdio: 'inherit' // This is the key: pipes stdout, stderr, and stdin
            });
            
            finishedJob = false;

            install.on('exit', code => {
                if (code === 0) {
                    console.log("Dependencies auto-installed successfully.");
                    finishedJob = true;
                } 
                else {
                    console.log("Failed to auto-install dependencies.");
                    console.log("Please check you have npm installed, an internet connection and enough disk space available then retry running the command, perhaps try running it manually.");
                    console.log("Exiting...")
                    process.exit(1);
                }
            });

            while (!finishedJob) {
                await wait(100);
            }
            if (finishedJob){
                break
            }
        }
        else{
            if (res === "n"){
                console.log("Dependencies not installed, and you refused to install them automatically. Cannot continue.")
                console.log("Exiting...")
                process.exit(1);
            }
            else{
                console.log("Invalid answer, valid answers are \"y\" for yes and \"n\" for no without the quotes. Please try again.")
            }
        }
    }
}

;(async function(){
    try{
        var readlineSync = require("readline-sync");
    }
    catch (error){
        await resolveDependency("readline-sync")
        try{
            var readlineSync = require("readline-sync");
        }
        catch (error){
            console.log("Even though auto-installation was successful, the readline-sync dependency could not be loaded.")
            console.log("Exiting...")
            process.exit(1);
        }
    }

    try{
        var Tiktoken = require("tiktoken/lite").Tiktoken;
    }
    catch (error){
        await resolveDependency("tiktoken")
        try{
            var Tiktoken = require("tiktoken/lite").Tiktoken;
        }
        catch (error){
            console.log("Even though auto-installation was successful, the tiktoken dependency could not be loaded.")
            console.log("Exiting...")
            process.exit(1);
        }
    }

    var cl100k_base = require("tiktoken/encoders/cl100k_base.json");
    
    try{
        var uuid = require("uuid");
    }
    catch (error){
        await resolveDependency("uuid")
        try{
            var uuid = require("uuid");
        }
        catch (error){
            console.log("Even though auto-installation was successful, the uuid dependency could not be loaded.")
            console.log("Exiting...")
            process.exit(1);
        }
    }

    try{
        var archiver = require('archiver');
    }
    catch (error){
        await resolveDependency("archiver")
        try{
            var archiver = require('archiver');
        }
        catch (error){
            console.log("Even though auto-installation was successful, the archiver dependency could not be loaded.")
            console.log("Exiting...")
            process.exit(1);
        }
    }

    try{
        var yauzl = require('yauzl');
    }
    catch (error){
        await resolveDependency("yauzl")
        try{
            var yauzl = require('yauzl');
        }
        catch (error){
            console.log("Even though auto-installation was successful, the yauzl dependency could not be loaded.")
            console.log("Exiting...")
            process.exit(1);
        }
    }

    var args = process.argv.slice(2);

    var config = {};

    const CHUNK_THRESHOLD_BYTES = 100 * 1024 * 1024;

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
        console.log(spacing() + " --load path/to/model.zip");
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
                                    if (model_location.slice(-4) !== ".zip") {
                                        help("Model file " + model_location + " is not a zip file.");
                                        process.exit(0);
                                    }
                                    skipnext = true;
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
            this.nan_checks_enabled = true; // Control logging easily
            this.nan_count_this_step = 0;
            this.nan_forward_pass_count_epoch = 0;
            this.nan_backprop_calc_count_epoch = 0;
            this.nan_final_gradient_count_epoch = 0;
            this.steps_with_nan_epoch = 0;
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
                var total_ram = total_params * 4; // (32 bit floats take up 4 bytes each)
                ndprint("Model is of size " + total_params + " parameters");
                total_ram = total_params * 4;
                ndprint("                 ~" + (total_params / 1e9).toFixed(2) + "b parameters");
                ndprint("");
                var adam_ram = total_params * 3 * 4;  // Assuming 3 times the parameters for Adam
                ndprint("Would cost the equivalent of " + (total_params * 3) + " parameters if trained with Adam");
                ndprint("                             ~" + ((total_params * 3) / 1e9).toFixed(2) + "b parameters if trained with adam");
                ndprint("");
                var sgd_momentum_ram = total_params * 2 * 4;  // Assuming 2 times the parameters for SGD with momentum
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
                            "normalize_1": new Float32Array(this.embeddingSize * 3).fill(0),
                            "attention": {
                                "heads": (function() {
                                    var arr = [];
                                    for (var h = 0; h < this.heads; h++) {
                                        arr.push({
                                            "query": new Float32Array(this.embeddingSize * this.embeddingSize * 3).fill(0),
                                            "key": new Float32Array(this.embeddingSize * this.embeddingSize * 3).fill(0),
                                            "value": new Float32Array(this.embeddingSize * this.embeddingSize * 3).fill(0)
                                        });
                                    }
                                    return arr;
                                }).call(this),
                                "output": new Float32Array(this.embeddingSize * (this.embeddingSize * this.heads) * 3).fill(0)
                            },
                            "normalize_2": new Float32Array(this.embeddingSize * 3).fill(0),
                            "feed_forward": {
                                "grow": new Float32Array(this.embeddingSize * (this.embeddingSize * 4) * 3).fill(0),
                                "shrink": new Float32Array((this.embeddingSize * 4) * this.embeddingSize * 3).fill(0)
                            }
                        },
                        "biases": {
                            "normalize_1": new Float32Array(this.embeddingSize * 3).fill(0),
                            "attention": {
                                "heads": (function() {
                                    var arr = [];
                                    for (var h = 0; h < this.heads; h++) {
                                        arr.push({
                                            "query": new Float32Array(this.embeddingSize * 3).fill(0),
                                            "key": new Float32Array(this.embeddingSize * 3).fill(0),
                                            "value": new Float32Array(this.embeddingSize * 3).fill(0)
                                        });
                                    }
                                    return arr;
                                }).call(this),
                                "output": new Float32Array(this.embeddingSize * 3).fill(0)
                            },
                            "normalize_2": new Float32Array(this.embeddingSize * 3).fill(0),
                            "feed_forward": {
                                "grow": new Float32Array((this.embeddingSize * 4) * 3).fill(0),
                                "shrink": new Float32Array(this.embeddingSize * 3).fill(0)
                            }
                        }
                    });
                    var total_params_layer = 2 * this.embeddingSize + 3 * this.heads * (this.embeddingSize * this.embeddingSize + this.embeddingSize) + this.embeddingSize * (this.embeddingSize * this.heads) + this.embeddingSize + 2 * this.embeddingSize + this.embeddingSize * (this.embeddingSize * 4) + (this.embeddingSize * 4) + (this.embeddingSize * 4) * this.embeddingSize + this.embeddingSize;
                    var params_done = 0;
                    var last_percent = -percentagePrintInterval;

                    for (var j = 0; j < this.embeddingSize; j++) {
                        this.transformer["layers"][i]["weights"]["normalize_1"][j * 3] = random_range(this.weightsinitrange);
                        this.transformer["layers"][i]["biases"]["normalize_1"][j * 3] = random_range(this.biasesinitrange);
                        this.transformer["layers"][i]["weights"]["normalize_2"][j * 3] = random_range(this.weightsinitrange);
                        this.transformer["layers"][i]["biases"]["normalize_2"][j * 3] = random_range(this.biasesinitrange);
                        params_done += 4;
                        var percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < this.heads; j++) {
                        for (var k = 0; k < this.embeddingSize * this.embeddingSize; k++) {
                            this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["query"][k * 3] = random_range(this.weightsinitrange);
                            this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["key"][k * 3] = random_range(this.weightsinitrange);
                            this.transformer["layers"][i]["weights"]["attention"]["heads"][j]["value"][k * 3] = random_range(this.weightsinitrange);
                            params_done += 3;
                            percent = Math.floor((params_done * 100) / total_params_layer);
                            if (percent >= last_percent + percentagePrintInterval) {
                                last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                                ndprint("  Layer " + i + ": " + last_percent + "% complete");
                            }
                        }
                        for (var k = 0; k < this.embeddingSize; k++) {
                            this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["query"][k * 3] = random_range(this.biasesinitrange);
                            this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["key"][k * 3] = random_range(this.biasesinitrange);
                            this.transformer["layers"][i]["biases"]["attention"]["heads"][j]["value"][k * 3] = random_range(this.biasesinitrange);
                            params_done += 3;
                            percent = Math.floor((params_done * 100) / total_params_layer);
                            if (percent >= last_percent + percentagePrintInterval) {
                                last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                                ndprint("  Layer " + i + ": " + last_percent + "% complete");
                            }
                        }
                    }
                    for (var j = 0; j < this.embeddingSize * (this.embeddingSize * this.heads); j++) {
                        this.transformer["layers"][i]["weights"]["attention"]["output"][j * 3] = random_range(this.weightsinitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < this.embeddingSize; j++) {
                        this.transformer["layers"][i]["biases"]["attention"]["output"][j * 3] = random_range(this.biasesinitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < this.embeddingSize * (this.embeddingSize * 4); j++) {
                        this.transformer["layers"][i]["weights"]["feed_forward"]["grow"][j * 3] = random_range(this.weightsinitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                        this.transformer["layers"][i]["biases"]["feed_forward"]["grow"][j * 3] = random_range(this.biasesinitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < (this.embeddingSize * 4) * this.embeddingSize; j++) {
                        this.transformer["layers"][i]["weights"]["feed_forward"]["shrink"][j * 3] = random_range(this.weightsinitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Layer " + i + ": " + last_percent + "% complete");
                        }
                    }
                    for (var j = 0; j < this.embeddingSize; j++) {
                        this.transformer["layers"][i]["biases"]["feed_forward"]["shrink"][j * 3] = random_range(this.biasesinitrange);
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
                this.transformer["embeddings"] = Array.from({ length: this.vocab.length }, () => new Float32Array(this.embeddingSize * 3).fill(0));
                params_done = 0;
                total_params_layer = this.vocab.length * this.embeddingSize;
                last_percent = -percentagePrintInterval;
                for (var i = 0; i < this.vocab.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        this.transformer["embeddings"][i][j * 3] = random_range(this.embeddinginitrange);
                        params_done += 1;
                        percent = Math.floor((params_done * 100) / total_params_layer);
                        if (percent >= last_percent + percentagePrintInterval) {
                            last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                            ndprint("  Embeddings: " + last_percent + "% complete");
                        }
                    }
                }
                ndprint("Initialized embeddings in", timer_end(timer), "ms");

                ndprint("Initializing vocabulary projection weights and biases...");
                timer = timer_();
                this.transformer["vocab_projection"] = {
                    "weights": new Float32Array(this.vocab.length * this.embeddingSize * 3).fill(0),
                    "biases": new Float32Array(this.vocab.length * 3).fill(0)
                };
                params_done = 0;
                total_params_layer = this.vocab.length * this.embeddingSize + this.vocab.length;
                last_percent = -percentagePrintInterval;
                for (var i = 0; i < this.vocab.length * this.embeddingSize; i++) {
                    this.transformer["vocab_projection"]["weights"][i * 3] = random_range(this.weightsinitrange);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Vocab projection: " + last_percent + "% complete");
                    }
                }
                for (var i = 0; i < this.vocab.length; i++) {
                    this.transformer["vocab_projection"]["biases"][i * 3] = random_range(this.biasesinitrange);
                    params_done += 1;
                    percent = Math.floor((params_done * 100) / total_params_layer);
                    if (percent >= last_percent + percentagePrintInterval) {
                        last_percent = Math.floor(percent / percentagePrintInterval) * percentagePrintInterval;
                        ndprint("  Vocab projection: " + last_percent + "% complete");
                    }
                }
                ndprint("Initialized vocabulary projection weights and biases in", timer_end(timer), "ms");
                ndprint("Successfully initialized model in", timer_end(sgtimer), "ms");
            } else { // Load from ZIP archive
                const modelZipPath = model_location;
                ndprint("Reading model from single archive:", modelZipPath);
        
                // Return a Promise because loading is asynchronous
                return new Promise((resolve, reject) => {
                    const loadedBuffers = {}; // Store loaded buffers { 'zip/path': Buffer }
        
                    yauzl.open(modelZipPath, { lazyEntries: true }, (err, zipfile) => {
                        if (err) {
                            console.error(`Error opening zip file ${modelZipPath}: ${err.message}`);
                            return reject(new Error(`Failed to open zip file ${modelZipPath}: ${err.message}`));
                        }
        
                        zipfile.readEntry(); // Start reading
        
                        zipfile.on('entry', (entry) => {
                            // ndprint(`Reading entry: ${entry.fileName}`); // Debug logging
                            if (/\/$/.test(entry.fileName)) { // Skip directories
                                zipfile.readEntry();
                            } else { // File entry
                                zipfile.openReadStream(entry, (err, readStream) => {
                                    if (err) {
                                        console.error(`Error opening stream for entry ${entry.fileName}: ${err.message}`);
                                        return reject(new Error(`Error reading entry ${entry.fileName}: ${err.message}`));
                                    }
                                    const chunks = [];
                                    readStream.on('data', chunk => chunks.push(chunk));
                                    readStream.on('end', () => {
                                        // ndprint(`Finished reading entry: ${entry.fileName}`); // Debug logging
                                        loadedBuffers[entry.fileName] = Buffer.concat(chunks);
                                        zipfile.readEntry(); // Read next
                                    });
                                    readStream.on('error', streamErr => {
                                        console.error(`Stream error for ${entry.fileName}: ${streamErr.message}`);
                                        reject(new Error(`Stream error for ${entry.fileName}: ${streamErr.message}`))
                                    });
                                });
                            }
                        });
        
                        zipfile.on('end', async () => { // Use async here for await inside
                            ndprint("All ZIP entries read. Reconstructing model...");
                            try {
                                if (!loadedBuffers['model_meta.json']) {
                                    throw new Error("model_meta.json not found in archive.");
                                }
                                const metadata = JSON.parse(loadedBuffers['model_meta.json'].toString('utf-8'));
                                ndprint("Metadata loaded.");
        
                                // --- Load Config and State ---
                                this.contextSize = metadata.contextSize;
                                this.embeddingSize = metadata.embeddingSize;
                                this.learningRate = metadata.learningRate;
                                this.maxOutputSize = metadata.maxOutputSize;
                                this.layersAmount = metadata.layersAmount;
                                this.heads = metadata.heads;
                                this.biasesinitrange = metadata.biasesinitrange;
                                this.embeddinginitrange = metadata.embeddinginitrange;
                                this.adam_params = metadata.adam_params || { beta1: 0.9, beta2: 0.98, epsilon: 1e-9, t: 0 }; // Load or default
                                this.step_num = metadata.step_num || 0;
                                ndprint("Configuration and state loaded.");
        
        
                                // --- Recursive Function to Load Parameters ---
                                const loadNode = (metaNode) => {
                                    // Check if it's the leaf node structure (array of strings)
                                    if (Array.isArray(metaNode) && metaNode.length > 0 && typeof metaNode[0] === 'string') {
                                        const paths = metaNode;
                                        // --- Handle Float32Array reconstruction ---
                                        if (paths.length === 1) {
                                            // --- Not Chunked ---
                                            const buffer = loadedBuffers[paths[0]];
                                            if (!buffer) throw new Error(`Buffer not found for path: ${paths[0]}`);
                                            if (buffer.length % Float32Array.BYTES_PER_ELEMENT !== 0) {
                                                throw new Error(`Buffer length ${buffer.length} for ${paths[0]} not multiple of Float32 size.`);
                                            }
                                            return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / Float32Array.BYTES_PER_ELEMENT);
                                        } else {
                                            // --- Chunked ---
                                            let totalBytes = 0;
                                            const chunkBuffers = paths.map(p => {
                                                const buf = loadedBuffers[p];
                                                if (!buf) throw new Error(`Buffer not found for chunk path: ${p}`);
                                                totalBytes += buf.length;
                                                return buf;
                                            });
        
                                            if (totalBytes === 0) {
                                                console.warn(`Warning: 0 total bytes for chunked parameter ${paths[0]}. Returning empty array.`);
                                                return new Float32Array(0);
                                            }
                                            if (totalBytes % Float32Array.BYTES_PER_ELEMENT !== 0) {
                                                throw new Error(`Total bytes ${totalBytes} from chunks is not multiple of Float32 size for ${paths[0]}`);
                                            }
        
                                            const finalArray = new Float32Array(totalBytes / Float32Array.BYTES_PER_ELEMENT);
                                            let offsetElements = 0; // Track offset in elements, not bytes
                                            for (const chunkBuffer of chunkBuffers) {
                                                const chunkArray = new Float32Array(chunkBuffer.buffer, chunkBuffer.byteOffset, chunkBuffer.length / Float32Array.BYTES_PER_ELEMENT);
                                                finalArray.set(chunkArray, offsetElements);
                                                offsetElements += chunkArray.length;
                                            }
                                            if (offsetElements !== finalArray.length) { // Check element count match
                                                console.warn(`Chunk assembly element count mismatch: expected ${finalArray.length}, got ${offsetElements} for ${paths[0]}`);
                                            }
                                            // ndprint(`Reassembled chunked parameter ${paths[0].substring(0, paths[0].lastIndexOf('_'))} (${totalBytes} bytes)`);
                                            return finalArray;
                                        }
                                    } else if (Array.isArray(metaNode)) {
                                        // --- Array Node ---
                                        // ndprint("Loading array node..."); // Debug
                                        return metaNode.map(item => loadNode(item)); // Recurse
                                    } else if (typeof metaNode === 'object' && metaNode !== null) {
                                        // --- Object Node ---
                                        // ndprint("Loading object node..."); // Debug
                                        const loadedObj = {};
                                        for (const key in metaNode) {
                                            if (Object.hasOwnProperty.call(metaNode, key)) {
                                                loadedObj[key] = loadNode(metaNode[key]); // Recurse
                                            }
                                        }
                                        return loadedObj;
                                    } else {
                                        // --- Primitive or unexpected ---
                                        console.warn("Unexpected node type during loading:", metaNode);
                                        return metaNode; // Return as is
                                    }
                                }; // End loadNode function
        
        
                                // --- Reconstruct the main transformer object ---
                                ndprint("Reconstructing transformer structure...");
                                this.transformer = loadNode(metadata.transformer_structure);
                                ndprint("Transformer structure reconstructed.");
        
        
                                ndprint("Model loaded successfully from archive:", modelZipPath);
                                resolve(this); // Resolve the promise with the loaded instance
        
                            } catch (processingErr) {
                                console.error("Error processing loaded archive data:", processingErr);
                                reject(processingErr);
                            }
                        }); // end zipfile.on('end')
        
                        zipfile.on('error', (zipErr) => {
                            console.error(`Zip file reading error: ${zipErr.message}`);
                            reject(new Error(`Zip file reading error: ${zipErr.message}`))
                        });
        
                    }); // end yauzl.open
                }); // End Promise wrapper
            } // End else (loading part)
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
                var embedding = new Float32Array(this.embeddingSize);
                for (var i = 0; i < this.embeddingSize; i++) {
                    var denominator = Math.pow(10000, (2 * Math.floor(i / 2)) / this.embeddingSize);
                    if (i % 2 === 0) {
                        embedding[i] = Math.sin(pos / denominator);
                    } else {
                        embedding[i] = Math.cos(pos / denominator);
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
        _calculate_x_hat_only(vector) {
            function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }

            // Replicates steps 1-6 of normalize_vector WITHOUT gamma/beta/clamping
            // NOTE: Uses original NaN checks but doesn't increment class counters from here
            var vector_list = new Float32Array(vector.length);
            var input_nan_found_internal = false;
            for (var i = 0; i < vector.length; i++) {
                vector_list[i] = finiteOrZero(vector[i]);
                if (vector_list[i] === 0 && !Number.isFinite(vector[i])) { 
                    if(this.nan_checks_enabled) { console.warn(`--- WARNING: Input NaN in _calculate_x_hat_only (idx ${i}) ---`); }
                    vector_list[i] = 0;
                    input_nan_found_internal = true;
                }
            }

            var mean = vector_list.reduce((a, b) => a + b, 0) / vector_list.length;
            if (isNaN(mean)) {
                if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED in _calculate_x_hat_only: Mean !!!"); }
                // Don't increment class counters from helper
                return new Float32Array(vector_list.length).fill(0.0);
            }

            var variance = 0;
            for (var i = 0; i < vector_list.length; i++) {
                var diff = vector_list[i] - mean;
                variance += diff * diff;
            }
            variance /= vector_list.length;
            if (isNaN(variance)) {
                if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED in _calculate_x_hat_only: Variance !!!"); }
                // Don't increment class counters from helper
                return new Float32Array(vector_list.length).fill(0.0);
            }

            var epsilon = 1e-8;
            var std = Math.sqrt(variance + epsilon);
            if (isNaN(std)) {
                if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED in _calculate_x_hat_only: Std !!!"); }
                // Don't increment class counters from helper
                return new Float32Array(vector_list.length).fill(0.0);
            }

            // Use original threshold for consistency, return 0 for x_hat if std is near zero
            if (std < 1e-6) {
                return new Float32Array(vector_list.length).fill(0.0);
            }

            var x_hat = new Float32Array(vector_list.length);
            var x_hat_nan_found_internal = false;
            for (var i = 0; i < vector_list.length; i++) {
                x_hat[i] = (vector_list[i] - mean) / std;
                if (isNaN(x_hat[i])) {
                    if(this.nan_checks_enabled) { console.error(`!!! NaN DETECTED during _calculate_x_hat_only calculation (idx ${i}) !!!`); }
                    x_hat[i] = 0;
                    x_hat_nan_found_internal = true;
                }
            }
            // Log if NaN appeared *during* calc, but don't increment class counters
            // if (x_hat_nan_found_internal && !input_nan_found_internal && this.nan_checks_enabled) {
            //      console.warn("--- NaN appeared during x_hat calculation in helper ---");
            // }
            return x_hat;
        }
        normalize_vector(vector, gamma, beta) { // Added gamma, beta params
            // 1. Convert to Float32Array and handle NaNs in input (Keep this part)
            function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }
            var vector_list = new Float32Array(vector.length);
            var nan_count_before = this.nan_count_this_step; // Track NaNs before this specific call
            for (var i = 0; i < vector.length; i++) {
                vector_list[i] = finiteOrZero(vector[i]); // Simplified conversion
                if (vector_list[i] === 0 && !Number.isFinite(vector[i])) { 
                    if(this.nan_checks_enabled) {
                        console.warn(`--- WARNING: Input vector contained NaN at index ${i} for normalize_vector ---`);
                    }
                    this.nan_count_this_step++;
                    this.nan_forward_pass_count_epoch++;
                    vector_list[i] = 0; // Replace NaN with 0
                }
            }
            var input_nan_found = (this.nan_count_this_step > nan_count_before); // Check if NaN was added here

            // 2. Calculate Mean (Keep this part)
            var mean = vector_list.reduce((a, b) => a + b, 0) / vector_list.length;
            if (isNaN(mean)) {
                if(this.nan_checks_enabled) {
                    console.error("!!! NaN DETECTED in normalize_vector: Mean calculation !!!");
                }
                this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
                return new Float32Array(vector_list.length).fill(0.0);
            }

            // 3. Calculate Variance (Keep this part)
            var variance = 0;
            for (var i = 0; i < vector_list.length; i++) {
                var diff = vector_list[i] - mean;
                variance += diff * diff;
            }
            variance /= vector_list.length;
            if (isNaN(variance)) {
                if(this.nan_checks_enabled) {
                    console.error("!!! NaN DETECTED in normalize_vector: Variance calculation !!!");
                }
                this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
                return new Float32Array(vector_list.length).fill(0.0);
            }

            // 4. Calculate Standard Deviation (with epsilon) (Keep this part)
            var epsilon = 1e-8;
            var std = Math.sqrt(variance + epsilon);
            if (isNaN(std)) {
                if(this.nan_checks_enabled) {
                    console.error("!!! NaN DETECTED in normalize_vector: Std calculation !!!");
                }
                this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
                return new Float32Array(vector_list.length).fill(0.0);
            }

            // 5. Handle near-zero std dev (Keep original return zero for simplicity)
            if (std < 1e-6) { // Kept original threshold
                // Returning zeros is the simplest behavior matching the original near-zero handling
                return new Float32Array(vector_list.length).fill(0.0);
            }

            // 6. Normalize: (x - mean) / std (Keep this part, result is x_hat)
            var x_hat = new Float32Array(vector_list.length);
            var x_hat_nan_found = false;
            for (var i = 0; i < vector_list.length; i++) {
                var norm_val = (vector_list[i] - mean) / std;

                // --- REMOVED CLAMPING ---
                // if (norm_val > 10.0) { norm_val = 10.0; } // REMOVED
                // else if (norm_val < -10.0) { norm_val = -10.0; } // REMOVED
                // --- END REMOVED CLAMPING ---

                x_hat[i] = norm_val;
                if (isNaN(x_hat[i])) { // Check during calculation
                    if (this.nan_checks_enabled) {
                        console.error(`!!! NaN DETECTED during normalization calculation (index ${i}) !!!`);
                    }
                    x_hat[i] = 0; // Replace NaN with 0
                    x_hat_nan_found = true;
                }
            }
            if (x_hat_nan_found && !input_nan_found) { // Log only if NaN appeared *during* this calc
                this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
            }

            // 7. --- NEW: Apply Gamma (Scale) and Beta (Shift) ---
            var final_output = new Float32Array(x_hat.length);
            var output_nan_found = false;
            nan_count_before = this.nan_count_this_step; // Track before gamma/beta application
            for (var i = 0; i < x_hat.length; i++) {
                // gamma and beta store [value, m, v] triplets. Use the value at index i*3.
                var gamma_val = gamma[i * 3];
                var beta_val = beta[i * 3];
                final_output[i] = x_hat[i] * gamma_val + beta_val; // y = gamma * x_hat + beta

                // Final check on the output of gamma/beta application
                if (isNaN(final_output[i])) {
                    if (this.nan_checks_enabled) {
                        console.error(`!!! NaN DETECTED AFTER applying gamma/beta (index ${i}) !!! x_hat=${x_hat[i]}, gamma=${gamma_val}, beta=${beta_val}`);
                    }
                    final_output[i] = 0; // Replace NaN with 0
                    output_nan_found = true;
                }
            }
            if (output_nan_found) {
                // Increment counters only if NaN appeared specifically during gamma/beta step
                if (this.nan_count_this_step === nan_count_before) { // Check if counter wasn't already incremented by x_hat check
                    this.nan_count_this_step++;
                    this.nan_forward_pass_count_epoch++;
                }
            }
            // --- END NEW ---

            // Return the final scaled and shifted result ('y')
            return final_output;
        }
        dot_product(vec1, vec2) {
            var sum = 0;
            for (var i = 0; i < vec1.length; i++) {
                sum += vec1[i] * vec2[i];
            }
            return sum;
        }
        add_vectors(vec1, vec2) {
            var result = new Float32Array(vec1.length);
            for (var i = 0; i < vec1.length; i++) {
                result[i] = vec1[i] + vec2[i];
            }
            return result;
        }
        softmax(scores) {
            var float_scores = new Float32Array(scores.length);
            for (var i = 0; i < scores.length; i++) {
                try {
                    float_scores[i] = Number(scores[i]);
                } catch (e) {
                    float_scores[i] = 0.0;
                }
            }
            var max_score = -Infinity;
            for(var i = 0; i < float_scores.length; i++) {
                if(float_scores[i] > max_score) max_score = float_scores[i];
            }

            var exp_scores = new Float32Array(float_scores.length);
            for (var i = 0; i < float_scores.length; i++) {
                exp_scores[i] = Math.exp(float_scores[i] - max_score);
            }
            var sum_exp = exp_scores.reduce(function(a, b) { return a + b; }, 0);
            if (sum_exp === 0) {
                var equal = new Float32Array(float_scores.length);
                equal.fill(1.0 / float_scores.length);
                return equal;
            }
            var probs = new Float32Array(exp_scores.length);
            for (var i = 0; i < exp_scores.length; i++) {
                probs[i] = exp_scores[i] / sum_exp;
            }
            return probs;
        }
        async save(filePath) { // Make save async potentially due to intensive operations
            filePath = filePath || "model.zip"; // Default to .zip extension
            ndprint("Saving model to single archive:", filePath);
        
            const metadata = {
                // --- Basic Config ---
                contextSize: this.contextSize,
                embeddingSize: this.embeddingSize,
                learningRate: this.learningRate, // Note: Might be overwritten by scheduler
                maxOutputSize: this.maxOutputSize,
                layersAmount: this.layersAmount,
                heads: this.heads,
                biasesinitrange: this.biasesinitrange, // Keep initial config
                embeddinginitrange: this.embeddinginitrange, // Keep initial config
                // --- Runtime State ---
                adam_params: { // Save current optimizer state
                    beta1: this.adam_params.beta1,
                    beta2: this.adam_params.beta2,
                    epsilon: this.adam_params.epsilon,
                    t: this.adam_params.t
                },
                step_num: this.step_num,
                // --- Structure Map ---
                transformer_structure: {} // This will be populated recursively
            };
        
            const output = fs.createWriteStream(filePath);
            const archive = archiver('zip', {
                zlib: { level: 1 } // Use fast compression
            });
        
            // --- Promise wrapper for archive finalization ---
            const archiveFinalized = new Promise((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject); // Reject on archiver error
                output.on('error', reject); // Reject on stream write error
            });
        
            archive.pipe(output);
        
            // --- Recursive Function to Process Parameters ---
            const processNode = async (node, metaNode, currentPathParts) => {
                if (node instanceof Float32Array) {
                    // --- Leaf Node: Handle Float32Array ---
                    const paramName = currentPathParts.join('_'); // e.g., params_layers_0_weights_normalize_1
                    const paramPathPrefix = path.join(...currentPathParts).replace(/\\/g, '/'); // zip path e.g., params/layers/0/weights/normalize_1
        
                    const totalBytes = node.byteLength;
                    const zipEntryPaths = [];
        
                    if (totalBytes < CHUNK_THRESHOLD_BYTES) {
                        // --- Not Chunked ---
                        const zipPath = `${paramPathPrefix}.bin`;
                        const buffer = Buffer.from(node.buffer, node.byteOffset, node.byteLength);
                        archive.append(buffer, { name: zipPath });
                        zipEntryPaths.push(zipPath);
                        metaNode['__is_chunked__'] = false; // Explicitly mark non-chunked
                        metaNode['__total_bytes__'] = totalBytes;
                    } else {
                        // --- Chunked ---
                        metaNode['__is_chunked__'] = true;
                        metaNode['__total_bytes__'] = totalBytes;
                        const chunkSize = CHUNK_THRESHOLD_BYTES; // Or slightly smaller if preferred
                        const numChunks = Math.ceil(totalBytes / chunkSize);
                        metaNode['__num_chunks__'] = numChunks;
        
                        ndprint(`Chunking ${paramName} (${totalBytes} bytes) into ${numChunks} chunks...`);
        
                        for (let i = 0; i < numChunks; i++) {
                            const startByte = i * chunkSize;
                            const endByte = Math.min(startByte + chunkSize, totalBytes);
                            const chunkByteLength = endByte - startByte;
                            const zipPath = `${paramPathPrefix}_chunk_${i}.bin`;
        
                            // Create a Buffer view for the chunk WITHOUT copying memory
                            const chunkBuffer = Buffer.from(node.buffer, node.byteOffset + startByte, chunkByteLength);
        
                            archive.append(chunkBuffer, { name: zipPath });
                            zipEntryPaths.push(zipPath);
                        }
                    }
                    // Assign the array of paths (always an array)
                    return zipEntryPaths; // Return the path array to be assigned by the caller
        
                } else if (Array.isArray(node)) {
                    // --- Array Node ---
                    metaNode = []; // Initialize metadata as an array
                    for (let i = 0; i < node.length; i++) {
                        const result = await processNode(node[i], {}, [...currentPathParts, i.toString()]);
                        metaNode.push(result); // Push result (path array or nested structure)
                    }
                    return metaNode;
                } else if (typeof node === 'object' && node !== null) {
                    // --- Object Node ---
                    metaNode = {}; // Initialize metadata as an object
                    for (const key in node) {
                        if (Object.hasOwnProperty.call(node, key)) {
                            const result = await processNode(node[key], {}, [...currentPathParts, key]);
                            metaNode[key] = result; // Assign result (path array or nested structure)
                        }
                    }
                    return metaNode;
                } else {
                    // --- Primitive or unexpected type ---
                    return node; // Just return primitives directly (shouldn't happen for params)
                }
            };
        
            // --- Start the recursive processing ---
            metadata.transformer_structure = await processNode(this.transformer, {}, ['params']);
        
            // --- Add metadata JSON at the end ---
            const metadataString = JSON.stringify(metadata, null, 2); // Pretty print
            archive.append(metadataString, { name: 'model_meta.json' });
        
            // --- Finalize and wait ---
            ndprint("Finalizing archive...");
            await archive.finalize();
            await archiveFinalized; // Wait for the stream to close
            ndprint(`Model saved successfully to ${filePath} (${archive.pointer()} total bytes)`);
        
        } // End save method
        calculate_loss(predicted_scores, target_token_id) {
            var predicted_probs = this.softmax(predicted_scores);
            var epsilon = 0;
            if (config["antiOverfittingOptimisations"]) {
                epsilon = 0.1;
            }
            var vocab_size = this.vocab.length;
            var target_distribution = new Float32Array(vocab_size);
            target_distribution.fill(epsilon / (vocab_size - 1));
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
            if (structure instanceof Float32Array) {
                // Return a new Float32Array of the same length, filled with zeros
                return new Float32Array(structure.length).fill(0);
            } else if (Array.isArray(structure)) {
                // Handle arrays of Float32Arrays or nested structures
                var newArr = [];
                for(var i = 0; i < structure.length; i++) {
                    newArr.push(this.initialize_zero_gradients(structure[i]));
                }
                return newArr;
            } else if (typeof structure === "object" && structure !== null) {
                // Handle objects with nested structures
                var zero_dict = {};
                for (var key in structure) {
                    if (Object.hasOwnProperty.call(structure, key)) {
                        zero_dict[key] = this.initialize_zero_gradients(structure[key]);
                    }
                }
                return zero_dict;
            }
            // If it's a primitive or unexpected type, return null or throw error?
            // For now, return null as it's safer.
            return null;
        }
        add_in_place(target, source) {
            if (target instanceof Float32Array && source instanceof Float32Array && target.length === source.length) {
                // This is a leaf node containing gradient and optimizer state (m, v)
                // We only add the gradient (index 0)
                target[0] += source[0]; // Accumulate gradient
                // Do NOT accumulate Adam moments (m, v) across microbatches
                return;
            } else if (Array.isArray(target) && Array.isArray(source) && target.length === source.length) {
                // This is an array of structures (e.g., layers, heads)
                for (var i = 0; i < target.length; i++) {
                    this.add_in_place(target[i], source[i]);
                }
            } else if (typeof target === 'object' && typeof source === 'object' && target !== null && source !== null) {
                // This is an object (like weights, biases, attention, feed_forward, head)
                for (var key in target) {
                    if (Object.hasOwnProperty.call(target, key) && Object.hasOwnProperty.call(source, key)) {
                        this.add_in_place(target[key], source[key]);
                    } else if (Object.hasOwnProperty.call(target, key) && !Object.hasOwnProperty.call(source, key)) {
                        console.error(`CRITICAL Accumulation Error: Key "${key}" missing in source gradient object.`);
                    }
                }
            } else {
                // Mismatch or unexpected structure
                console.error("CRITICAL Accumulation Error: Type or structure mismatch.");
                console.error("Target:", target);
                console.error("Source:", source);
            }
        }
        apply_gradients(optimizer) {
            if (!this.accumulated_embedding_grads) return; // Nothing to apply
        
            console.log("Before gradients:", this.transformer.layers[0].weights.attention.heads[0].query[0]);
        
            var embedding_gradients = this.accumulated_embedding_grads;
            var layer_gradients = this.accumulated_layer_grads;
            var vocab_proj_weight_gradients = this.accumulated_vocab_grads.weights;
            var vocab_proj_bias_gradients = this.accumulated_vocab_grads.biases;
        
            // Learning rate scheduling
            var warmup_steps = 100;
            var decay_factor = 0.25;
            var base_lr = this.learningRate;
            var min_lr = 0.0005;
        
            if (optimizer === "adam") this.adam_params['t'] += 1;
            this.step_num += 1;
        
            var lr = this.step_num < warmup_steps
                ? base_lr * (this.step_num / warmup_steps)
                : base_lr * Math.pow(warmup_steps, 0.5) * Math.pow(this.step_num * decay_factor, -0.5);
        
            lr = Math.max(min_lr, lr);
        
            var weight_decay = config["antiOverfittingOptimisations"] ? 1e-5 : 0;
            var momentum_factor = 0.5;
        
            if (optimizer === "sgd_momentum" && this.momentum_initialized === undefined) {
                console.log("Initializing momentum for first use");
                this.momentum_initialized = true;
            }
        
            // === APPLY EMBEDDING GRADIENTS ===
            // Need to handle embeddings accumulation per token ID, not per position in input sequence
            // Re-aggregate accumulated_embedding_grads by vocab ID
            var aggregated_embedding_grads = Array.from({ length: this.vocab.length }, () => new Float32Array(this.embeddingSize));
            var token_counts = new Uint32Array(this.vocab.length).fill(0);
        
            if (this.accumulated_token_inputs && this.accumulated_embedding_grads) {
                for (var batch_idx = 0; batch_idx < this.accumulated_token_inputs.length; batch_idx++) {
                    var batch_tokens = this.accumulated_token_inputs[batch_idx];
                    // Ensure gradient data exists for this batch index
                    if (!this.accumulated_embedding_grads[batch_idx]) {
                        continue;
                    }
                    var batch_grads = this.accumulated_embedding_grads[batch_idx];
        
                    for (var token_pos = 0; token_pos < batch_tokens.length; token_pos++) {
                        // Ensure gradient data exists for this token position
                        if (!batch_grads[token_pos]) {
                            continue;
                        }
                        var token_id = batch_tokens[token_pos][1];
                        var vocab_idx = this.vocab.findIndex(([_, id]) => id === token_id);
        
                        if (vocab_idx !== -1) {
                            token_counts[vocab_idx]++;
                            for (var embed_dim = 0; embed_dim < this.embeddingSize; embed_dim++) {
                                aggregated_embedding_grads[vocab_idx][embed_dim] += batch_grads[token_pos][embed_dim];
                            }
                        }
                    }
                }
            }
        
            // Apply updates to embeddings that were used
            var AGC_LAMBDA_EMBED = 0.005; // Using a distinct constant name just in case
            var EPS_EMBED = 1e-6;
            // Need l2normFloat32 helper here for pNorm calculation
            function l2normFloat32Embed(arr) { // Renamed slightly to avoid potential scope issues if defined elsewhere
                let s = 0;
                // Assumes arr has [v,m,v,...] structure
                for (let i = 0; i < arr.length; i += 3) {
                    let val = arr[i];
                    // Handle potential NaN/Inf in parameter value itself during norm calc
                    if (!isFinite(val)) val = 0;
                    s += val * val;
                }
                return Math.sqrt(s);
            }
        
            for (var vocab_idx = 0; vocab_idx < this.vocab.length; vocab_idx++) {
                if (token_counts[vocab_idx] > 0) {
                    var param = this.transformer.embeddings[vocab_idx]; // This is a Float32Array [v,m,v, v,m,v...]
                    var raw_grad_vector = aggregated_embedding_grads[vocab_idx]; // Float32Array [g, g, g...]
        
                    // --- In-loop AGC Calculation for Embeddings ---
                    var pNorm = Math.max(l2normFloat32Embed(param), EPS_EMBED);
        
                    let gNormSq = 0;
                    for (let i = 0; i < raw_grad_vector.length; i++) {
                        let grad_val = raw_grad_vector[i];
                        if (!isFinite(grad_val)) grad_val = 0; // Treat NaN/Inf gradient as 0 for norm calculation
                        gNormSq += grad_val * grad_val;
                    }
                    var gNorm = Math.sqrt(gNormSq);
        
                    var maxGrad = AGC_LAMBDA_EMBED * pNorm;
                    let scale = 1.0;
                    if (gNorm > maxGrad) {
                        // Prevent division by zero or near-zero gNorm, though unlikely if gNorm > maxGrad > 0
                        scale = maxGrad / (gNorm + 1e-12);
                    }
                    // --- End In-loop AGC Calculation ---
        
                    for (var embed_dim = 0; embed_dim < this.embeddingSize; embed_dim++) {
                        var original_grad_value = raw_grad_vector[embed_dim];
                        // Handle NaN/Inf in original gradient before scaling/use
                        if (!isFinite(original_grad_value)){
                            original_grad_value = 0;
                        }
        
                        var scaled_grad_value = original_grad_value * scale;
                        // Final check on scaled value just in case scale calculation was unstable
                        if (!isFinite(scaled_grad_value)) {
                            scaled_grad_value = 0;
                        }
        
                        // Add weight decay AFTER scaling
                        var final_grad_value = scaled_grad_value;
                        if (weight_decay > 0) {
                            var current_param_value = param[embed_dim * 3];
                            // Ensure parameter value used for decay is finite
                            if (!isFinite(current_param_value)) current_param_value = 0;
                            final_grad_value += weight_decay * current_param_value;
                        }
                        // Final check on grad after weight decay
                        if (!isFinite(final_grad_value)) {
                            final_grad_value = 0;
                        }
        
                        // --- Optimizer Update Logic ---
                        if (optimizer === "adam") {
                            param[embed_dim * 3 + 1] = this.adam_params.beta1 * param[embed_dim * 3 + 1] + (1 - this.adam_params.beta1) * final_grad_value; // m
                            param[embed_dim * 3 + 2] = this.adam_params.beta2 * param[embed_dim * 3 + 2] + (1 - this.adam_params.beta2) * (final_grad_value * final_grad_value); // v
                            var m_hat = param[embed_dim * 3 + 1] / (1 - Math.pow(this.adam_params.beta1, this.adam_params.t));
                            var v_hat = param[embed_dim * 3 + 2] / (1 - Math.pow(this.adam_params.beta2, this.adam_params.t));
                            // Final check before division
                            let update_val = 0;
                            let sqrt_v_hat = Math.sqrt(v_hat);
                            if (isFinite(m_hat) && isFinite(sqrt_v_hat) && (sqrt_v_hat + this.adam_params.epsilon !== 0)) {
                            update_val = lr * m_hat / (sqrt_v_hat + this.adam_params.epsilon);
                            }
                            param[embed_dim * 3] -= update_val;
                        } else if (optimizer === "sgd_momentum") {
                            param[embed_dim * 3 + 1] = momentum_factor * param[embed_dim * 3 + 1] + final_grad_value; // m
                            param[embed_dim * 3] -= lr * param[embed_dim * 3 + 1];
                        } else { // Vanilla SGD
                            param[embed_dim * 3] -= lr * final_grad_value;
                        }
                        // Final check on parameter value after update
                        if (!isFinite(param[embed_dim * 3])) {
                            param[embed_dim * 3] = 0;
                            param[embed_dim * 3 + 1] = 0; // Reset optimizer states too
                            param[embed_dim * 3 + 2] = 0;
                        }
                    }
                }
            }
        
        
            // === APPLY LAYER GRADIENTS ===
            for (var layer_idx = 0; layer_idx < this.layersAmount; layer_idx++) {
                var layer = this.transformer.layers[layer_idx];
                var layer_grad = layer_gradients[layer_idx]; // This is the accumulated gradient structure
        
                // Update Weights
                this.updateParamFloat32Array(layer.weights.normalize_1, layer_grad.weights.normalize_1, optimizer, lr, weight_decay, momentum_factor);
                this.updateParamFloat32Array(layer.weights.normalize_2, layer_grad.weights.normalize_2, optimizer, lr, weight_decay, momentum_factor);
        
                for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                    this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].query, layer_grad.weights.attention.heads[head_idx].query, optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].key,   layer_grad.weights.attention.heads[head_idx].key,   optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].value, layer_grad.weights.attention.heads[head_idx].value, optimizer, lr, weight_decay, momentum_factor);
                }
        
                this.updateParamFloat32Array(layer.weights.attention.output,      layer_grad.weights.attention.output,      optimizer, lr, weight_decay, momentum_factor);
                this.updateParamFloat32Array(layer.weights.feed_forward.grow,     layer_grad.weights.feed_forward.grow,     optimizer, lr, weight_decay, momentum_factor);
                this.updateParamFloat32Array(layer.weights.feed_forward.shrink,   layer_grad.weights.feed_forward.shrink,   optimizer, lr, weight_decay, momentum_factor);
        
                // Update Biases (no weight decay)
                this.updateParamFloat32Array(layer.biases.normalize_1, layer_grad.biases.normalize_1, optimizer, lr, 0, momentum_factor); // weight_decay = 0 for biases
                this.updateParamFloat32Array(layer.biases.normalize_2, layer_grad.biases.normalize_2, optimizer, lr, 0, momentum_factor);
        
                for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                    this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].query, layer_grad.biases.attention.heads[head_idx].query, optimizer, lr, 0, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].key,   layer_grad.biases.attention.heads[head_idx].key,   optimizer, lr, 0, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].value, layer_grad.biases.attention.heads[head_idx].value, optimizer, lr, 0, momentum_factor);
                }
        
                this.updateParamFloat32Array(layer.biases.attention.output,      layer_grad.biases.attention.output,      optimizer, lr, 0, momentum_factor);
                this.updateParamFloat32Array(layer.biases.feed_forward.grow,     layer_grad.biases.feed_forward.grow,     optimizer, lr, 0, momentum_factor);
                this.updateParamFloat32Array(layer.biases.feed_forward.shrink,   layer_grad.biases.feed_forward.shrink,   optimizer, lr, 0, momentum_factor);
            }
        
            // === VOCAB PROJECTION ===
            this.updateParamFloat32Array(this.transformer.vocab_projection.weights, vocab_proj_weight_gradients, optimizer, lr, weight_decay, momentum_factor);
            this.updateParamFloat32Array(this.transformer.vocab_projection.biases,  vocab_proj_bias_gradients,   optimizer, lr, 0, momentum_factor); // weight_decay = 0 for biases
        
            // === Clear Accumulated Gradients ===
            this.accumulated_embedding_grads = Array.from({ length: config.microbatchSize }, () => Array.from({ length: this.contextSize }, () => new Float32Array(this.embeddingSize).fill(0)));
            this.accumulated_layer_grads = [];
            for (var i = 0; i < this.layersAmount; i++) {
                var layer_grad = {
                    "weights": this.initialize_zero_gradients(this.transformer["layers"][i]["weights"]),
                    "biases": this.initialize_zero_gradients(this.transformer["layers"][i]["biases"])
                };
                this.accumulated_layer_grads.push(layer_grad);
            }
            this.accumulated_vocab_grads = {
                "weights": new Float32Array(this.vocab.length * this.embeddingSize * 3).fill(0),
                "biases": new Float32Array(this.vocab.length * 3).fill(0)
            };
            this.accumulated_token_inputs = []; // Clear token inputs
        
            // DEBUG OUTPUTS
            console.log("After gradients:", this.transformer.layers[0].weights.attention.heads[0].query[0]);
            ndprint("Microbatch gradients applied.");
        
            if (global.gc) {
                console.log(`Heap used before GC: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
                global.gc();
                console.log(`Heap used after GC: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
            } else {
                console.warn("GC not exposed! Run with: node --expose-gc app.js");
            }
        }

        // Helper method to update parameters stored in a single Float32Array
        updateParamFloat32Array(param_array, grad_array, optimizer, lr, weight_decay, momentum_factor) {
            // --- Adaptive Gradient Clipping (per Brock et al. 2021) ---
            var AGC_LAMBDA = 0.005;       // aggression knob (try 0.01, 0.005, 0.001)
            var EPS        = 1e-6;

            function l2normFloat32(arr) {    // only use value slots (i, i+3, …)
                let s = 0;
                for (let i = 0; i < arr.length; i += 3) s += arr[i] * arr[i];
                return Math.sqrt(s);
            }
            function agc(paramArr, gradArr) {
                var pNorm = Math.max(l2normFloat32(paramArr), EPS);
                var gNorm = l2normFloat32(gradArr);
                var maxGrad = AGC_LAMBDA * pNorm;
                if (gNorm > maxGrad) {
                    var scale = maxGrad / (gNorm + 1e-12);
                    for (let i = 0; i < gradArr.length; i += 3) gradArr[i] *= scale;   // scale only the ‘value’ slot
                }
            }

            agc(param_array, grad_array); // Apply AGC to the parameter and gradient arrays

            if (!param_array || !grad_array || param_array.length !== grad_array.length) {
                console.error("Mismatched param and grad arrays or missing arrays in updateParamFloat32Array");
                return; // Skip if arrays don't exist or don't match
            }

            // Iterate through the parameter array in steps of 3 (value, m, v)
            for (var i = 0; i < param_array.length; i += 3) {
                var param_value = param_array[i];
                var param_m = param_array[i + 1];
                var param_v = param_array[i + 2];
                var grad_value = grad_array[i]; // Only the gradient value is stored in the grad array

                // Add weight decay if applicable (applies only to the parameter value)
                if (weight_decay > 0) {
                    grad_value += weight_decay * param_value;
                }

                if (optimizer === "adam") {
                    // Adam update
                    param_m = this.adam_params['beta1'] * param_m + (1 - this.adam_params['beta1']) * grad_value;
                    param_v = this.adam_params['beta2'] * param_v + (1 - this.adam_params['beta2']) * (grad_value * grad_value);

                    // Compute bias-corrected estimates
                    var m_hat = param_m / (1 - Math.pow(this.adam_params['beta1'], this.adam_params['t']));
                    var v_hat = param_v / (1 - Math.pow(this.adam_params['beta2'], this.adam_params['t']));

                    // Update parameter
                    param_value -= lr * m_hat / (Math.sqrt(v_hat) + this.adam_params['epsilon']);

                    // Update the original Float32Array
                    param_array[i] = param_value;
                    param_array[i + 1] = param_m;
                    param_array[i + 2] = param_v;

                } else if (optimizer === "sgd_momentum") {
                    // SGD with momentum update
                    param_m = momentum_factor * param_m + grad_value;
                    param_value -= lr * param_m;

                    // Update the original Float32Array
                    param_array[i] = param_value;
                    param_array[i + 1] = param_m;
                    // param_array[i + 2] (velocity) is unused in SGD momentum, leave it at 0

                } else {
                    // Vanilla SGD
                    param_value -= lr * grad_value;

                    // Update the original Float32Array
                    param_array[i] = param_value;
                    // param_array[i + 1] (momentum) and param_array[i + 2] (velocity) are unused, leave them at 0
                }
            }
        }
        train_step(input_tokens, target_token, optimizer="sgd", training_mode=true, accumulate=false) {
            if (optimizer === undefined) { optimizer = "sgd"; }
            if (training_mode === undefined) { training_mode = true; }
            ndprint("Starting training step...");
            var gtimer = timer_();

            // compute_global_norm definition unchanged from original
            var that = this;
            function compute_global_norm(embedding_grads, layer_grads) {
                var squared_sum = 0.0;
                for (var i = 0; i < embedding_grads.length; i++) {
                    if (!embedding_grads[i] || typeof embedding_grads[i].forEach !== 'function'){ continue; }
                    for (var j = 0; j < embedding_grads[i].length; j++) {
                        var val = embedding_grads[i][j];
                        if(isNaN(val) || !isFinite(val)){
                            if(that.nan_checks_enabled) { console.error(`!!! NaN/Infinity Gradient value found in embedding_grads[${i}][${j}] !!!`); }
                            that.nan_count_this_step++; that.nan_final_gradient_count_epoch++;
                        } else {
                            squared_sum += Number(val) * Number(val);
                        }
                    }
                }
                function add_squared_grads_recursive(grad_struct, path = "root") {
                    if (grad_struct instanceof Float32Array) {
                        if (grad_struct.length === 0) return;
                        var grad_val = grad_struct[0];
                        if (isNaN(grad_val) || !isFinite(grad_val)) {
                            if (that.nan_checks_enabled) { console.error(`!!! NaN/Infinity Gradient value found in compute_global_norm at path: ${path}[0] !!!`); }
                            that.nan_count_this_step++; that.nan_final_gradient_count_epoch++;
                            return;
                        }
                        squared_sum += Number(grad_val) * Number(grad_val);
                    } else if (Array.isArray(grad_struct)) {
                        for (var k = 0; k < grad_struct.length; k++) {
                            add_squared_grads_recursive(grad_struct[k], `${path}[${k}]`);
                        }
                    } else if (typeof grad_struct === "object" && grad_struct !== null) {
                        for (var key in grad_struct) {
                            if (Object.hasOwnProperty.call(grad_struct, key)) {
                                add_squared_grads_recursive(grad_struct[key], `${path}.${key}`);
                            }
                        }
                    }
                }
                if (layer_grads && typeof layer_grads.forEach === 'function') {
                    for (var layer_idx = 0; layer_idx < layer_grads.length; layer_idx++) {
                        add_squared_grads_recursive(layer_grads[layer_idx], `layer[${layer_idx}]`);
                    }
                } else {
                    if(that.nan_checks_enabled) {console.error("!!! Invalid layer_grads structure passed to compute_global_norm !!!");}
                }
                if (isNaN(squared_sum) || !isFinite(squared_sum)) {
                    if(that.nan_checks_enabled) { console.error("!!! NaN/Infinity DETECTED in compute_global_norm: squared_sum became invalid !!!");}
                    return NaN;
                }
                if (squared_sum < 0) {
                    if(that.nan_checks_enabled) {console.error("!!! Negative squared_sum detected in compute_global_norm: ", squared_sum, " !!!");}
                    return NaN;
                }
                return Math.sqrt(squared_sum);
            } // End of compute_global_norm

            // --- Forward pass to get cache START --- (Unchanged Logic)
            console.log("Running inference to get cache...");
            var timer_inf = timer_();
            var input_text = "";
            for (var i = 0; i < input_tokens.length; i++) {
                input_text += input_tokens[i][0];
            }
            // Ensure inference is called with return_cache=true and training_mode=true
            var inference_result = this.inference(input_text, true, training_mode);
            var cache = inference_result[1]; // Cache now includes 'normX_x_hat'
            console.log("Got inference cache in " + timer_end(timer_inf) + " ms");
            // --- Forward pass to get cache END ---


            // --- Initial Loss Calculation START --- (Unchanged Logic)
            console.log("Calculating initial loss...");
            timer_inf = timer_();
            var initial_loss = this.calculate_loss(cache["vocab_scores"], target_token[1]);
            console.log("Initial loss: " + initial_loss + " calculated in " + timer_end(timer_inf) + " ms");
            // --- Initial Loss Calculation END ---


            console.log("Computing gradients...");
            var gtimer2 = timer_();

            // --- Initial Error Calculation START --- (Unchanged Logic)
            var predicted_probs = this.softmax(cache["vocab_scores"]);
            var epsilon_grad = 0; // Keep original epsilon setting for gradients
            var vocab_size = this.vocab.length;
            var target_distribution = new Float32Array(vocab_size);
            target_distribution.fill(epsilon_grad / (vocab_size - 1)); // Use epsilon_grad here
            var target_idx = null;
            for (var i = 0; i < this.vocab.length; i++) {
                if (this.vocab[i][1] === target_token[1]) { target_idx = i; break; }
            }
            if (target_idx === null) {
                console.log("Warning: Token ID " + target_token[1] + " not found in vocabulary");
                target_idx = 0;
            }
            target_distribution[target_idx] = 1.0 - epsilon_grad;
            var initial_error = new Float32Array(predicted_probs.length);
            for (var i = 0; i < predicted_probs.length; i++) {
                initial_error[i] = predicted_probs[i] - target_distribution[i];
            }
            // --- Initial Error Calculation END ---


            // --- Vocab Projection Gradients START --- (Unchanged Logic)
            console.log("Computing gradients for vocabulary projection parameters...");
            var vocab_proj_weight_gradients = new Float32Array(this.transformer["vocab_projection"]["weights"].length).fill(0);
            var vocab_proj_bias_gradients = new Float32Array(this.transformer["vocab_projection"]["biases"].length).fill(0);
            for (var vocab_idx = 0; vocab_idx < this.vocab.length; vocab_idx++) {
                var error_val = initial_error[vocab_idx];
                // Use the final activation of the last layer from cache
                var final_layer_activation;
                // Defensive check for cache structure
                if (cache && cache["layers"] && cache["layers"][this.layersAmount - 1] && cache["layers"][this.layersAmount - 1]["feed_forward"] && cache["layers"][this.layersAmount - 1]["feed_forward"]["final"]) {
                    final_layer_activation = cache["layers"][this.layersAmount - 1]["feed_forward"]["final"];
                    // Check if final_layer_activation has the last token's data
                    if (final_layer_activation.length > 0) {
                        var last_token_activations = final_layer_activation[final_layer_activation.length - 1];
                        for (var embed_idx = 0; embed_idx < this.embeddingSize; embed_idx++) {
                            var weight_idx_in_flat_array = vocab_idx * this.embeddingSize + embed_idx;
                            var activation_val = last_token_activations[embed_idx];
                            var gradient = error_val * activation_val;
                            vocab_proj_weight_gradients[weight_idx_in_flat_array * 3] = gradient; // Store only grad
                        }
                    } else if (this.nan_checks_enabled) { console.error("Vocab Proj Grad: Final layer cache exists but is empty."); }
                } else if (this.nan_checks_enabled) { console.error("Vocab Proj Grad: Cache structure missing for final layer activation."); }

                vocab_proj_bias_gradients[vocab_idx * 3] = error_val; // Store only grad
            }
            // --- Vocab Projection Gradients END ---


            // --- Error Backpropagation from Vocab START --- (Unchanged Logic)
            var error_gradients = []; // Gradients w.r.t the final output ('y') of the last layer
            for (var i = 0; i < input_tokens.length; i++) { // Initialize for all tokens
                var arr = new Float32Array(this.embeddingSize).fill(0.0);
                error_gradients.push(arr);
            }
            // Calculate gradient flowing into the last layer's final output ('y')
            var last_layer_final_output_grad = new Float32Array(this.embeddingSize).fill(0.0);
            for (var j = 0; j < this.embeddingSize; j++) { // Dimension index
                for (var k = 0; k < this.vocab.length; k++) { // Vocab index
                    // Use the weight value (index * 3)
                    last_layer_final_output_grad[j] += initial_error[k] * this.transformer["vocab_projection"]["weights"][k * this.embeddingSize * 3 + j * 3];
                }
            }
            // Assign this gradient only to the last token position in the sequence
            if (error_gradients.length > 0) {
                error_gradients[error_gradients.length - 1] = last_layer_final_output_grad;
            }
            // --- Error Backpropagation from Vocab END ---


            // --- Gradient Initializations START --- (Unchanged Logic)
            var embedding_gradients = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0));
            var layer_gradients = [];
            for (var i = 0; i < this.layersAmount; i++) {
                var layer_grad = {
                    "weights": this.initialize_zero_gradients(this.transformer["layers"][i]["weights"]),
                    "biases": this.initialize_zero_gradients(this.transformer["layers"][i]["biases"])
                };
                layer_gradients.push(layer_grad);
            }
            // --- Gradient Initializations END ---


            // --- Backpropagation Loop START ---
            var next_grad = error_gradients; // Starts as gradient w.r.t final layer output 'y'

            for (var layer_idx = this.layersAmount - 1; layer_idx >= 0; layer_idx--) {
                var layer_cache = cache["layers"][layer_idx];

                // --- Backprop through FFN Residual START --- (Unchanged Logic)
                // next_grad is dLoss/dFinalOutputY
                var grad_into_ffn_shrink = next_grad; // Path back through FFN
                var grad_into_ffn_residual = next_grad; // Path back through residual skip connection
                // --- Backprop through FFN Residual END ---


                // --- FFN Shrink Backprop START --- (Unchanged Logic)
                // Input: grad_into_ffn_shrink (dLoss/dOutputY)
                // Output: shrink_grad (dLoss/dReluOutput), calculates shrink layer param grads
                var shrink_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize * 4).fill(0.0));
                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        // Ensure cache exists and has data
                        var after_relu_cache = (layer_cache && layer_cache["feed_forward"] && layer_cache["feed_forward"]["after_relu"]) ? layer_cache["feed_forward"]["after_relu"][i] : null;
                        if (!after_relu_cache) {
                            if (this.nan_checks_enabled) console.error(`FFN Shrink Backprop: Missing after_relu cache layer ${layer_idx} token ${i}`);
                            continue; // Skip if cache missing
                        }
                        for (var k = 0; k < this.embeddingSize * 4; k++) {
                            if (after_relu_cache[k] > 0) { // ReLU derivative = 1
                                shrink_grad[i][k] += grad_into_ffn_shrink[i][j] * this.transformer["layers"][layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) * 3 + k * 3];
                                layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) * 3 + k * 3] += grad_into_ffn_shrink[i][j] * after_relu_cache[k];
                            }
                        }
                        // Bias gradient calculation needs correction - should sum over tokens, not reduce inside loop
                        // Corrected bias grad calculation (example - needs verification based on original intent)
                        // layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j * 3] += grad_into_ffn_shrink[i][j]; // Accumulate per token
                    }
                }
                // Correct summation for bias gradients (after token loop)
                for(var j = 0; j < this.embeddingSize; j++) {
                    var bias_grad_sum = 0;
                    for(var i = 0; i < input_tokens.length; i++) {
                        bias_grad_sum += grad_into_ffn_shrink[i][j];
                    }
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j*3] += bias_grad_sum;
                }
                // --- FFN Shrink Backprop END ---


                // --- FFN Grow / ReLU Backprop START --- (Unchanged Logic)
                // Input: shrink_grad (dLoss/dReluOutput)
                // Output: grow_grad (dLoss/dNorm2OutputY), calculates grow layer param grads
                var relu_grad = shrink_grad;
                var grow_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0));
                for (var i = 0; i < input_tokens.length; i++) {
                    // Ensure cache exists and has data
                    var norm2_output_cache = (layer_cache && layer_cache["normalized"]) ? layer_cache["normalized"][i] : null; // Should be output of Norm2 ('y') which is input to FFN grow
                    if (!norm2_output_cache) {
                        if (this.nan_checks_enabled) console.error(`FFN Grow Backprop: Missing normalized cache layer ${layer_idx} token ${i}`);
                        continue; // Skip if cache missing
                    }
                    for (var j = 0; j < this.embeddingSize * 4; j++) { // Output dim of Grow
                        for (var k = 0; k < this.embeddingSize; k++) { // Input dim of Grow (Output dim of Norm2)
                            // Backprop through Grow layer
                            grow_grad[i][k] += relu_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["feed_forward"]["grow"][k * (this.embeddingSize * 4) * 3 + j * 3];
                            // Gradient for Grow weights
                            layer_gradients[layer_idx]["weights"]["feed_forward"]["grow"][k * (this.embeddingSize * 4) * 3 + j * 3] += relu_grad[i][j] * norm2_output_cache[k];
                        }
                        // Correct bias grad calculation
                        // layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j * 3] += relu_grad[i][j]; // Accumulate per token
                    }
                }
                // Correct summation for bias gradients (after token loop)
                for(var j = 0; j < this.embeddingSize * 4; j++) {
                    var bias_grad_sum = 0;
                    for(var i = 0; i < input_tokens.length; i++) {
                        bias_grad_sum += relu_grad[i][j];
                    }
                    layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j*3] += bias_grad_sum;
                }
                // --- FFN Grow / ReLU Backprop END ---


                // --- Normalize_2 Backprop START --- (MODIFIED)
                // Input: grow_grad (dLoss/dNorm2OutputY)
                // Output: grad_into_norm2_input (dLoss/dNorm2Input), calculates norm2 param grads
                var norm2_output_grad = grow_grad;
                var grad_into_norm2_input = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm2Input

                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        // --- Use cached x_hat for gamma gradient --- (MODIFIED)
                        if (!layer_cache || !layer_cache["norm2_x_hat"] || !layer_cache["norm2_x_hat"][i]) {
                            if(this.nan_checks_enabled) console.error(`Norm2 Backprop: Missing norm2_x_hat cache layer ${layer_idx}, token ${i}`);
                            continue; // Skip if cache missing
                        }
                        var x_hat_val_2 = layer_cache["norm2_x_hat"][i][j];

                        // Gradient for weight (gamma) = dLoss/dOutputY * x_hat (MODIFIED)
                        layer_gradients[layer_idx]["weights"]["normalize_2"][j * 3] += norm2_output_grad[i][j] * x_hat_val_2;

                        // Gradient for bias (beta) = dLoss/dOutputY * 1 (Unchanged)
                        layer_gradients[layer_idx]["biases"]["normalize_2"][j * 3] += norm2_output_grad[i][j];

                        // --- Approximate backprop through normalization --- (NEW - Approximation)
                        var gamma2_val = this.transformer["layers"][layer_idx]["weights"]["normalize_2"][j * 3];
                        grad_into_norm2_input[i][j] = norm2_output_grad[i][j] * gamma2_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                    }
                }
                // --- Normalize_2 Backprop END ---


                // --- Combine gradients before Norm2 START --- (MODIFIED)
                var combined_grad_before_norm2 = []; // Gradient for the output of (Attention + Residual)
                for(var i = 0; i < input_tokens.length; i++) {
                    var row_grad = new Float32Array(this.embeddingSize);
                    for(var j = 0; j < this.embeddingSize; j++) {
                        // Sum gradient from Norm2 input path and gradient from the FFN residual path
                        row_grad[j] = grad_into_norm2_input[i][j] + grad_into_ffn_residual[i][j]; // grad w.r.t attn_out+res
                    }
                    combined_grad_before_norm2.push(row_grad);
                }
                // --- Combine gradients before Norm2 END ---


                // --- Attention Output Backprop START --- (Unchanged Logic)
                // Input: combined_grad_before_norm2 (dLoss/dAttnOut+Res) -> only dLoss/dAttnOut matters here
                // Output: attention_output_input_grad (dLoss/dConcatHeads), calculates attn output layer param grads
                var attention_output_grad = combined_grad_before_norm2; // Use the combined gradient flowing into this point
                var attention_output_input_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize * this.heads).fill(0.0));
                // ... (Existing Attention Output backprop logic using attention_output_grad) ...
                // ... (Calculates attention_output_input_grad and gradients for Attn Output layer params) ...
                // Note: The `concatenated_input` used here for weight gradients should correctly come from the head outputs in the forward pass cache.
                // Ensure layer_cache.heads[head_idx].output[i] is used correctly inside the loop.
                for (var i = 0; i < input_tokens.length; i++) {
                    var concatenated_input = new Float32Array(this.embeddingSize * this.heads);
                    var current_offset = 0;
                    for(var head_idx = 0; head_idx < this.heads; head_idx++) {
                        if (layer_cache && layer_cache.heads && layer_cache.heads[head_idx] && layer_cache.heads[head_idx].output && layer_cache.heads[head_idx].output[i]) {
                            concatenated_input.set(layer_cache.heads[head_idx].output[i], current_offset);
                        } else if (this.nan_checks_enabled) { console.error(`Attn Output Backprop: Missing head output cache layer ${layer_idx} head ${head_idx} token ${i}`); }
                        current_offset += this.embeddingSize;
                    }
                    for (var j = 0; j < this.embeddingSize; j++) { // Output dim
                        for (var k = 0; k < this.embeddingSize * this.heads; k++) { // Input dim
                            attention_output_input_grad[i][k] += attention_output_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["attention"]["output"][j * (this.embeddingSize * this.heads) * 3 + k * 3];
                            var weight_grad_delta = attention_output_grad[i][j] * concatenated_input[k];
                            if (isNaN(weight_grad_delta) || !isFinite(weight_grad_delta)) {
                                if(this.nan_checks_enabled) console.error(`NaN/Inf in Attn Output Weight Grad Calc: L${layer_idx} T${i} O${j} I${k}`);
                                weight_grad_delta = 0; this.nan_count_this_step++; this.nan_backprop_calc_count_epoch++;
                            }
                            layer_gradients[layer_idx]["weights"]["attention"]["output"][(j * (this.embeddingSize * this.heads) + k) * 3] += weight_grad_delta;
                        }
                    }
                    // Correct bias accumulation
                    for (var j = 0; j < this.embeddingSize; j++) {
                        layer_gradients[layer_idx]["biases"]["attention"]["output"][j * 3] += attention_output_grad[i][j];
                    }
                }
                // --- Attention Output Backprop END ---


                // --- Attention Heads Backprop START --- (Unchanged Logic)
                // Input: attention_output_input_grad (dLoss/dConcatHeads)
                // Output: head_input_grads (dLoss/dHeadInput = dLoss/dNorm1OutputY), calculates Q/K/V layer param grads
                var head_input_grads = Array.from({ length: this.heads }, () => Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0)));
                for (var head = 0; head < this.heads; head++) {
                    var head_cache = (layer_cache && layer_cache.heads && layer_cache.heads[head]) ? layer_cache.heads[head] : null;
                    if (!head_cache) {
                        if(this.nan_checks_enabled) console.error(`Attn Head Backprop: Missing head cache layer ${layer_idx} head ${head}`);
                        continue;
                    }
                    var head_grad_from_output = [];
                    for(var i = 0; i < input_tokens.length; i++) { head_grad_from_output.push(attention_output_input_grad[i].slice(head * this.embeddingSize, (head + 1) * this.embeddingSize)); }

                    // Backprop through V and attention probs
                    var v_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0));
                    var attention_prob_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(input_tokens.length).fill(0.0));
                    for (var i = 0; i < input_tokens.length; i++) {
                        for (var j = 0; j < this.embeddingSize; j++) {
                            for (var k = 0; k < input_tokens.length; k++) {
                                if (!head_cache.attention_probs || !head_cache.attention_probs[i] || !head_cache.v_vectors || !head_cache.v_vectors[k]) continue; // Cache check
                                v_grad[k][j] += head_grad_from_output[i][j] * head_cache["attention_probs"][i][k];
                                attention_prob_grad[i][k] += head_grad_from_output[i][j] * head_cache["v_vectors"][k][j];
                            }
                        }
                    }
                    // Backprop through softmax
                    var attention_score_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(input_tokens.length).fill(0.0));
                    for(var i = 0; i < input_tokens.length; i++) {
                        for(var j = 0; j < input_tokens.length; j++) {
                            if (!head_cache.attention_probs || !head_cache.attention_probs[i]) continue; // Cache check
                            var d_score = 0;
                            for(var k = 0; k < input_tokens.length; k++) {
                                if (!head_cache.attention_probs[i][k] === undefined || head_cache.attention_probs[i][j] === undefined) continue;
                                d_score += attention_prob_grad[i][k] * head_cache["attention_probs"][i][k] * ((k === j ? 1 : 0) - head_cache["attention_probs"][i][j]);
                            }
                            attention_score_grad[i][j] = d_score;
                        }
                    }
                    // Backprop through Q/K dot product and scaling
                    var q_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0));
                    var k_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0));
                    var scale = Math.sqrt(this.embeddingSize);
                    for (var i = 0; i < input_tokens.length; i++) {
                        for (var j = 0; j < input_tokens.length; j++) {
                            if (j <= i) { // Masking check
                                if (!head_cache.k_vectors || !head_cache.k_vectors[j] || !head_cache.q_vectors || !head_cache.q_vectors[i]) continue; // Cache check
                                var score_grad = attention_score_grad[i][j] / scale;
                                for (var k = 0; k < this.embeddingSize; k++) {
                                    q_grad[i][k] += score_grad * head_cache["k_vectors"][j][k];
                                    k_grad[j][k] += score_grad * head_cache["q_vectors"][i][k];
                                }
                            }
                        }
                    }
                    // Backprop through Q, K, V linear layers
                    var norm1_output_cache = (layer_cache && layer_cache["normalized"]) ? layer_cache["normalized"] : null; // Input to QKV layers is output 'y' of Norm1
                    for (var i = 0; i < input_tokens.length; i++) {
                        if (!norm1_output_cache || !norm1_output_cache[i]) {
                            if(this.nan_checks_enabled) console.error(`Attn Head Backprop: Missing normalized cache (Norm1 output) layer ${layer_idx} token ${i}`);
                            continue; // Skip token if cache missing
                        }
                        var normalized_input_embedding = norm1_output_cache[i]; // Use 'y' from Norm1
                        for (var j = 0; j < this.embeddingSize; j++) { // Output dim
                            for (var k = 0; k < this.embeddingSize; k++) { // Input dim
                                layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["query"][j * this.embeddingSize * 3 + k * 3] += q_grad[i][j] * normalized_input_embedding[k];
                                layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["key"][j * this.embeddingSize * 3 + k * 3] += k_grad[i][j] * normalized_input_embedding[k];
                                layer_gradients[layer_idx]["weights"]["attention"]["heads"][head]["value"][j * this.embeddingSize * 3 + k * 3] += v_grad[i][j] * normalized_input_embedding[k];
                            }
                            // Bias grads remain unchanged
                            layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["query"][j * 3] += q_grad[i][j];
                            layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["key"][j * 3] += k_grad[i][j];
                            layer_gradients[layer_idx]["biases"]["attention"]["heads"][head]["value"][j * 3] += v_grad[i][j];
                        }
                        // Calculate gradient flowing back to the input of QKV layers (output of Norm1)
                        for(var k = 0; k < this.embeddingSize; k++) { // Input dimension (output of Norm1)
                            var grad_sum_k = 0;
                            for(var j = 0; j < this.embeddingSize; j++) { // Output dimension
                                grad_sum_k += q_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["attention"]["heads"][head]["query"][j * this.embeddingSize * 3 + k * 3];
                                grad_sum_k += k_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["attention"]["heads"][head]["key"][j * this.embeddingSize * 3 + k * 3];
                                grad_sum_k += v_grad[i][j] * this.transformer["layers"][layer_idx]["weights"]["attention"]["heads"][head]["value"][j * this.embeddingSize * 3 + k * 3];
                            }
                            head_input_grads[head][i][k] = grad_sum_k; // Store dLoss/dNorm1OutputY for this head
                        }
                    }
                } // End head backprop loop
                // --- Attention Heads Backprop END ---


                // --- Sum head gradients START --- (Unchanged Logic)
                var total_attention_input_grad = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0));
                for(var i = 0; i < input_tokens.length; i++) {
                    for(var j = 0; j < this.embeddingSize; j++) {
                        for(var head = 0; head < this.heads; head++) {
                            total_attention_input_grad[i][j] += head_input_grads[head][i][j]; // Sum dLoss/dNorm1OutputY from all heads
                        }
                    }
                }
                // --- Sum head gradients END ---


                // --- Normalize_1 Backprop START --- (MODIFIED)
                // Input: total_attention_input_grad (dLoss/dNorm1OutputY)
                // Output: grad_into_norm1_input (dLoss/dNorm1Input), calculates norm1 param grads
                var norm1_output_grad = total_attention_input_grad;
                var grad_into_norm1_input = Array.from({ length: input_tokens.length }, () => new Float32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm1Input

                for (var i = 0; i < input_tokens.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        // --- Use cached x_hat for gamma gradient --- (MODIFIED)
                        if (!layer_cache || !layer_cache["norm1_x_hat"] || !layer_cache["norm1_x_hat"][i]) {
                            if(this.nan_checks_enabled) console.error(`Norm1 Backprop: Missing norm1_x_hat cache layer ${layer_idx}, token ${i}`);
                            continue; // Skip if cache missing
                        }
                        var x_hat_val_1 = layer_cache["norm1_x_hat"][i][j];

                        // Gradient for weight (gamma) = dLoss/dOutputY * x_hat (MODIFIED)
                        layer_gradients[layer_idx]["weights"]["normalize_1"][j * 3] += norm1_output_grad[i][j] * x_hat_val_1;

                        // Gradient for bias (beta) = dLoss/dOutputY * 1 (Unchanged)
                        layer_gradients[layer_idx]["biases"]["normalize_1"][j * 3] += norm1_output_grad[i][j];

                        // --- Approximate backprop through normalization --- (NEW - Approximation)
                        var gamma1_val = this.transformer["layers"][layer_idx]["weights"]["normalize_1"][j * 3];
                        grad_into_norm1_input[i][j] = norm1_output_grad[i][j] * gamma1_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                    }
                }
                // --- Normalize_1 Backprop END ---


                // --- Combine gradients before Norm1 START --- (MODIFIED)
                // Gradient flowing back to the output of the previous layer OR the initial embedding
                var grad_into_previous_layer_output = [];
                for(var i = 0; i < input_tokens.length; i++) {
                    var row_grad = new Float32Array(this.embeddingSize);
                    for(var j = 0; j < this.embeddingSize; j++) {
                        // Sum gradient from Norm1 input path and gradient from the residual path skipping attn (combined_grad_before_norm2)
                        row_grad[j] = grad_into_norm1_input[i][j] + combined_grad_before_norm2[i][j];
                    }
                    grad_into_previous_layer_output.push(row_grad);
                }
                // --- Combine gradients before Norm1 END ---


                // Update the gradient that will be passed to the previous layer/embedding
                next_grad = grad_into_previous_layer_output;

                // Accumulate gradients for the embeddings - Unchanged Logic
                if (layer_idx === 0) {
                    for (var i = 0; i < input_tokens.length; i++) {
                        for(var j = 0; j < this.embeddingSize; j++) {
                            embedding_gradients[i][j] += next_grad[i][j]; // Add final gradient flowing out of layer 0
                        }
                    }
                }
            } // --- End backprop layer loop ---

            console.log("Computed gradients in " + timer_end(gtimer2) + " ms");

            // // --- Gradient Scaling START --- (Unchanged Logic)
            // console.log("Applying continuous gradient scaling...");
            // timer_inf = timer_();
            // var gamma_scale = 5.0; // Renamed from gamma to avoid confusion
            // var global_grad_norm = compute_global_norm(embedding_gradients, layer_gradients);
            // // Handle potential NaN from compute_global_norm
            // if (isNaN(global_grad_norm)) {
            //     if(this.nan_checks_enabled) console.error("!!! Global Gradient Norm is NaN. Skipping scaling. !!!");
            //     global_grad_norm = 0; // Set to 0 to avoid scaling if norm is NaN
            // }
            // console.log("Global gradient norm: " + global_grad_norm.toFixed(6));
            // var scaling_factor;
            // if (global_grad_norm === 0 || global_grad_norm / gamma_scale === 0) { // Avoid division by zero
            //     scaling_factor = 1.0;
            // } else {
            //     // Ensure tanh argument is valid
            //     var tanh_arg = global_grad_norm / gamma_scale;
            //     if (!isFinite(tanh_arg)) {
            //          if(this.nan_checks_enabled) console.error("!!! Invalid argument for tanh in scaling. Skipping scaling. !!!");
            //          scaling_factor = 1.0;
            //     } else {
            //          scaling_factor = Math.tanh(tanh_arg) / tanh_arg;
            //     }
            // }
            // // Ensure scaling_factor is valid
            // if (isNaN(scaling_factor) || !isFinite(scaling_factor)) {
            //     if(this.nan_checks_enabled) console.error("!!! Scaling factor is NaN/Infinity. Skipping scaling. !!!");
            //     scaling_factor = 1.0;
            // }
            // console.log("Scaling gradients with factor " + scaling_factor.toFixed(6));

            // // Scale embedding gradients
            // for (var i = 0; i < embedding_gradients.length; i++) {
            //      if (!embedding_gradients[i]) continue; // Skip if undefined
            //      for (var j = 0; j < embedding_gradients[i].length; j++) {
            //          if (isFinite(embedding_gradients[i][j])) { // Only scale finite values
            //               embedding_gradients[i][j] *= scaling_factor;
            //          }
            //      }
            // }

            // // Scale layer gradients recursively
            // function scale_gradients_recursive(grad_struct, factor) {
            //     if (grad_struct instanceof Float32Array) {
            //         if (grad_struct.length > 0 && isFinite(grad_struct[0])) { // Check length and finite grad
            //              grad_struct[0] *= factor; // Scale only gradient at index 0
            //         }
            //     } else if (Array.isArray(grad_struct)) {
            //         for (var k = 0; k < grad_struct.length; k++) {
            //             scale_gradients_recursive(grad_struct[k], factor);
            //         }
            //     } else if (typeof grad_struct === "object" && grad_struct !== null) {
            //         for (var key in grad_struct) {
            //             if (Object.hasOwnProperty.call(grad_struct, key)) {
            //                 scale_gradients_recursive(grad_struct[key], factor);
            //             }
            //         }
            //     }
            // }
            // for (var layer_idx = 0; layer_idx < layer_gradients.length; layer_idx++) {
            //     scale_gradients_recursive(layer_gradients[layer_idx], scaling_factor);
            // }

            // // Scale vocab projection gradients
            //  for(var i = 0; i < vocab_proj_weight_gradients.length; i += 3) {
            //       if (isFinite(vocab_proj_weight_gradients[i])) { // Check finite grad
            //            vocab_proj_weight_gradients[i] *= scaling_factor;
            //       }
            //  }
            //  for(var i = 0; i < vocab_proj_bias_gradients.length; i += 3) {
            //        if (isFinite(vocab_proj_bias_gradients[i])) { // Check finite grad
            //            vocab_proj_bias_gradients[i] *= scaling_factor;
            //        }
            //  }
            // console.log("Applied continuous gradient scaling in " + timer_end(timer_inf) + " ms");
            // // --- Gradient Scaling END ---

            // --- Gradient Accumulation / Application START --- (Unchanged Logic)
            if (accumulate) {
                // Initialize accumulators if first microbatch
                if (!this.accumulated_embedding_grads) {
                    // Initialize using original logic
                    this.accumulated_embedding_grads = Array.from({ length: config.microbatchSize }, () => Array.from({ length: this.contextSize }, () => new Float32Array(this.embeddingSize).fill(0)));
                    this.accumulated_layer_grads = [];
                    for (var i = 0; i < this.layersAmount; i++) {
                        this.accumulated_layer_grads.push({
                            "weights": this.initialize_zero_gradients(this.transformer["layers"][i]["weights"]),
                            "biases": this.initialize_zero_gradients(this.transformer["layers"][i]["biases"])
                        });
                    }
                    this.accumulated_vocab_grads = {
                        "weights": new Float32Array(this.vocab.length * this.embeddingSize * 3).fill(0),
                        "biases": new Float32Array(this.vocab.length * 3).fill(0)
                    };
                    this.accumulated_token_inputs = [];
                }

                // Accumulate embedding gradients
                if (this.accumulated_token_inputs.length < config.microbatchSize) {
                    // Ensure embedding_gradients structure matches expected
                    if (embedding_gradients && embedding_gradients.length === input_tokens.length) { // Use actual input length for check
                        // Store the calculated embedding gradients for this step/token sequence
                        // The accumulator structure seems designed per microbatch item, then per token position
                        this.accumulated_embedding_grads[this.accumulated_token_inputs.length] = embedding_gradients;
                    } else {
                        console.error("CRITICAL Accumulation Error: Embedding gradient structure mismatch or missing.");
                    }
                } else {
                    console.error("CRITICAL Accumulation Error: Exceeded allocated microbatch size for embedding gradients.");
                }

                // Accumulate layer gradients
                this.add_in_place(this.accumulated_layer_grads, layer_gradients);

                // Accumulate vocab projection gradients
                for(var i = 0; i < vocab_proj_weight_gradients.length; i+=3) {
                    this.accumulated_vocab_grads.weights[i] += vocab_proj_weight_gradients[i]; // Accumulate only grad
                }
                for(var i = 0; i < vocab_proj_bias_gradients.length; i+=3) {
                    this.accumulated_vocab_grads.biases[i] += vocab_proj_bias_gradients[i]; // Accumulate only grad
                }

                this.accumulated_token_inputs.push(input_tokens);

                // FLUSH IF MICRO-BATCH COMPLETE
                if (this.accumulated_token_inputs.length >= config.microbatchSize) {
                    this.apply_gradients(optimizer); // apply_gradients is unchanged
                } else {
                    ndprint("Gradients accumulated, delaying parameter update.");
                }

                // Logging and NaN reset unchanged
                ndprint("Training step completed in", timer_end(gtimer), "ms (accumulated)");
                if (this.nan_count_this_step > 0) {
                    if (this.nan_checks_enabled) {
                        console.warn(`--- Step ${this.step_num}: Detected ${this.nan_count_this_step} NaN/Infinity values during calculations. Affected gradients set to 0. ---`);
                    }
                    this.steps_with_nan_epoch++;
                }
                this.nan_count_this_step = 0;

                return initial_loss;
            } else { // --- Immediate Application Logic (Unchanged) ---
                // Re-aggregate embedding gradients (Unchanged)
                var aggregated_embedding_grads = Array.from({ length: this.vocab.length }, () => new Float32Array(this.embeddingSize));
                var token_counts = new Uint32Array(this.vocab.length).fill(0);
                if (embedding_gradients) {
                    for (var token_pos = 0; token_pos < input_tokens.length; token_pos++) {
                        var token_id = input_tokens[token_pos][1];
                        var vocab_idx = this.vocab.findIndex(([_, id]) => id === token_id);
                        if (vocab_idx !== -1 && embedding_gradients[token_pos]) { // Check token_pos exists in grads
                            token_counts[vocab_idx]++;
                            for (var embed_dim = 0; embed_dim < this.embeddingSize; embed_dim++) {
                                aggregated_embedding_grads[vocab_idx][embed_dim] += embedding_gradients[token_pos][embed_dim];
                            }
                        }
                    }
                }

                // Optimizer setup (Unchanged)
                var weight_decay = config["antiOverfittingOptimisations"] ? 1e-5 : 0;
                var momentum_factor = 0.5;
                if (optimizer === "sgd_momentum" && this.momentum_initialized === undefined) { this.momentum_initialized = true; console.log("Initializing momentum for first use"); }
                var warmup_steps = 100; var decay_factor = 0.25; var base_lr = this.learningRate; var min_lr = 0.0005;
                if (optimizer === "adam") this.adam_params['t'] += 1;
                this.step_num += 1;
                var lr = this.step_num < warmup_steps ? base_lr * (this.step_num / warmup_steps) : base_lr * Math.pow(warmup_steps, 0.5) * Math.pow(this.step_num * decay_factor, -0.5);
                lr = Math.max(min_lr, lr);

                // Apply Embedding Gradients (Unchanged Logic)
                for(var vocab_idx = 0; vocab_idx < this.vocab.length; vocab_idx++) {
                    if(token_counts[vocab_idx] > 0) {
                        var param = this.transformer.embeddings[vocab_idx];
                        for (var embed_dim = 0; embed_dim < this.embeddingSize; embed_dim++) {
                            var grad_value = aggregated_embedding_grads[vocab_idx][embed_dim];
                            this.updateParamFloat32Array(param.slice(embed_dim*3, embed_dim*3+3), [grad_value,0,0], optimizer, lr, weight_decay, momentum_factor); // Pass slice and grad structure
                            // Directly update the original array from the modified slice (conceptually)
                            // The actual update happens inside updateParamFloat32Array by modifying the passed slice (which refers back)
                        }
                    }
                }
                // Apply Layer Gradients (Unchanged Logic)
                for (var layer_idx = 0; layer_idx < this.layersAmount; layer_idx++) {
                    var layer = this.transformer.layers[layer_idx];
                    var layer_grad = layer_gradients[layer_idx]; // Use the gradients from *this* step
                    this.updateParamFloat32Array(layer.weights.normalize_1, layer_grad.weights.normalize_1, optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.weights.normalize_2, layer_grad.weights.normalize_2, optimizer, lr, weight_decay, momentum_factor);
                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                        this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].query, layer_grad.weights.attention.heads[head_idx].query, optimizer, lr, weight_decay, momentum_factor);
                        this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].key,   layer_grad.weights.attention.heads[head_idx].key,   optimizer, lr, weight_decay, momentum_factor);
                        this.updateParamFloat32Array(layer.weights.attention.heads[head_idx].value, layer_grad.weights.attention.heads[head_idx].value, optimizer, lr, weight_decay, momentum_factor);
                    }
                    this.updateParamFloat32Array(layer.weights.attention.output,      layer_grad.weights.attention.output,      optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.weights.feed_forward.grow,     layer_grad.weights.feed_forward.grow,     optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.weights.feed_forward.shrink,   layer_grad.weights.feed_forward.shrink,   optimizer, lr, weight_decay, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.normalize_1, layer_grad.biases.normalize_1, optimizer, lr, 0, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.normalize_2, layer_grad.biases.normalize_2, optimizer, lr, 0, momentum_factor);
                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                        this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].query, layer_grad.biases.attention.heads[head_idx].query, optimizer, lr, 0, momentum_factor);
                        this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].key,   layer_grad.biases.attention.heads[head_idx].key,   optimizer, lr, 0, momentum_factor);
                        this.updateParamFloat32Array(layer.biases.attention.heads[head_idx].value, layer_grad.biases.attention.heads[head_idx].value, optimizer, lr, 0, momentum_factor);
                    }
                    this.updateParamFloat32Array(layer.biases.attention.output,      layer_grad.biases.attention.output,      optimizer, lr, 0, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.feed_forward.grow,     layer_grad.biases.feed_forward.grow,     optimizer, lr, 0, momentum_factor);
                    this.updateParamFloat32Array(layer.biases.feed_forward.shrink,   layer_grad.biases.feed_forward.shrink,   optimizer, lr, 0, momentum_factor);
                }
                // Apply Vocab Projection Gradients (Unchanged Logic)
                this.updateParamFloat32Array(this.transformer.vocab_projection.weights, vocab_proj_weight_gradients, optimizer, lr, weight_decay, momentum_factor);
                this.updateParamFloat32Array(this.transformer.vocab_projection.biases,  vocab_proj_bias_gradients,   optimizer, lr, 0, momentum_factor);

                // Logging and return unchanged
                // --- Original Logging ---
                // console.log("Updated parameters in " + timer_inf + " ms"); // timer_inf not defined here
                var param_to_check = this.transformer["embeddings"][0];
                if (optimizer === "adam") { console.log("Sample Adam values (embedding 0, dim 0): value=" + param_to_check[0] + ", momentum=" + param_to_check[1] + ", velocity=" + param_to_check[2]); this.check_adam_state(); }
                else if (optimizer === "sgd_momentum") { console.log("Sample momentum value (embedding 0, dim 0): " + param_to_check[1]); }
                else { console.log("Using SGD - no momentum/velocity values to report"); }
                ndprint("Training step completed in", timer_end(gtimer), "ms");
                // --- End Original Logging ---

                // NaN reset unchanged
                if (this.nan_count_this_step > 0) {
                    if (this.nan_checks_enabled) {
                        console.warn(`--- Step ${this.step_num}: Detected ${this.nan_count_this_step} NaN/Infinity values during calculations. Affected gradients set to 0. ---`);
                    }
                    this.steps_with_nan_epoch++;
                }
                this.nan_count_this_step = 0;

                return initial_loss;
            }
            // --- Gradient Accumulation / Application END ---
        }
        check_adam_state() {
            console.log("Adam step count: " + this.adam_params['t']);
            // Check first element of some representative Float32Arrays
            var params = [
                this.transformer["embeddings"][0], // Embedding 0
                this.transformer["layers"][0]["weights"]["normalize_1"], // Layer 0 norm1 weights
                this.transformer["vocab_projection"]["weights"] // Vocab proj weights
            ];
            for (var i = 0; i < params.length; i++) {
                // Each param is a Float32Array storing [value, m, v] blocks
                if (params[i] && params[i].length >= 3) {
                    console.log("Parameter " + i + " (first block): value=" + params[i][0] + ", momentum=" + params[i][1] + ", velocity=" + params[i][2]);
                } else {
                    console.log("Parameter " + i + ": Data not available or insufficient length.");
                }
            }
        }
        async train(dataset, epochs, optimizer) {
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
                this.nan_forward_pass_count_epoch = 0;
                this.nan_backprop_calc_count_epoch = 0;
                this.nan_final_gradient_count_epoch = 0;
                this.steps_with_nan_epoch = 0;
                var steps_in_this_epoch = 0;
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
                    var microbatch_samples = []; // Store samples for the microbatch
                    for (var j = 0; j < tokens.length - 1; j++) {
                        var input_tokens_step = tokens.slice(Math.max(0, j + 1 - this.contextSize), j + 1);
                        var target_token_step = tokens[j + 1];

                        if (j < token_mask.length && token_mask[j]) {
                            microbatch_samples.push([input_tokens_step, target_token_step]);

                            if (microbatch_samples.length >= config.microbatchSize) {
                                steps_in_this_epoch++
                                var microbatch_total_loss = 0;
                                for (var k = 0; k < microbatch_samples.length; k++) {
                                    var [input, target] = microbatch_samples[k];
                                    var isLast = k === microbatch_samples.length - 1;
                                    await wait(1)
                                    microbatch_total_loss += this.train_step(input, target, optimizer, true, !isLast);
                                    await wait(1)
                                }
                                // Apply gradients after the microbatch
                                this.apply_gradients(optimizer);
                                dataset_total_loss += microbatch_total_loss;
                                sequence_positions += microbatch_samples.length;
                                processed_io_pairs += microbatch_samples.length;
                                microbatch_samples = []; // Clear the microbatch

                                var response_tokens_in_item = token_mask.reduce(function(a, b) { return a + (b ? 1 : 0); }, 0);
                                var current_position_in_responses = token_mask.slice(0, j + 1).reduce(function(a, b) { return a + (b ? 1 : 0); }, 0);
                                var current_item_progress = (current_position_in_responses / response_tokens_in_item) * 100;
                                var overall_progress = (processed_io_pairs / total_io_pairs) * 100;
                                ndprint("Microbatch completed. Loss: " + (microbatch_total_loss / config.microbatchSize).toFixed(4) + " (Response token " + current_position_in_responses + "/" + response_tokens_in_item + ") | " +
                                    "Current item progress: " + current_item_progress.toFixed(2) + "% | " +
                                    "Overall progress: " + overall_progress.toFixed(2) + "%");
                            }
                        }
                    }

                    // Process any remaining samples in the microbatch at the end of an item
                    if (microbatch_samples.length > 0) {
                        steps_in_this_epoch++
                        var microbatch_total_loss = 0;
                        for (var k = 0; k < microbatch_samples.length; k++) {
                            var [input, target] = microbatch_samples[k];
                            var isLast = k === microbatch_samples.length - 1;
                            await wait(1)
                            microbatch_total_loss += this.train_step(input, target, optimizer, true, true); // Accumulate until the end of the item
                            await wait(1)
                        }
                        // Apply gradients for the final partial microbatch
                        this.apply_gradients(optimizer);
                        dataset_total_loss += microbatch_total_loss;
                        sequence_positions += microbatch_samples.length;
                        processed_io_pairs += microbatch_samples.length;
                        microbatch_samples = []; // Clear the microbatch

                        var response_tokens_in_item = token_mask.reduce(function(a, b) { return a + (b ? 1 : 0); }, 0);
                        var current_position_in_responses = token_mask.reduce(function(a, b) { return a + (b ? 1 : 0); }, 0); // Assume all were processed by the end
                        var current_item_progress = 100; // Item is finished
                        var overall_progress = (processed_io_pairs / total_io_pairs) * 100;
                        ndprint("Final partial microbatch completed. Loss: " + (microbatch_total_loss / microbatch_samples.length).toFixed(4) + " (Response token " + current_position_in_responses + "/" + response_tokens_in_item + ") | " +
                            "Current item progress: " + current_item_progress.toFixed(2) + "% | " +
                            "Overall progress: " + overall_progress.toFixed(2) + "%");
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
                        var save_path = "model_" + (epoch + 1) + "_" + loss_str + "_" + optimizer + "_sweetspot.zip";
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
                            await this.save(save_path);
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
                        var result = await this.interactive_test_loop(epoch, avg_epoch_loss, optimizer, loss_history, best_loss)
                        if (result === "STOP_TRAINING") {
                            break;
                        } else {
                            optimizer = result;
                        }
                    }
                }
                ndprint("-".repeat(60)); // Optional separator
                if (steps_in_this_epoch > 0) {
                        var nan_step_percentage = (this.steps_with_nan_epoch / steps_in_this_epoch) * 100;
                        ndprint(`Epoch ${epoch + 1} NaN Summary:`);
                        ndprint(`  - Steps with any NaN/Inf: ${this.steps_with_nan_epoch} / ${steps_in_this_epoch} (${nan_step_percentage.toFixed(2)}%)`);
                        // You can uncomment these for more detail if needed:
                        ndprint(`    - Forward Checks Triggered: ${this.nan_forward_pass_count_epoch}`);
                        ndprint(`    - Backprop Checks Triggered: ${this.nan_backprop_calc_count_epoch}`);
                        ndprint(`    - Final Grad Checks Triggered: ${this.nan_final_gradient_count_epoch}`);
                } else {
                        ndprint(`Epoch ${epoch + 1}: No training steps counted.`);
                }
                ndprint("-".repeat(60)); // Optional separator

                ndprint("Epoch " + (epoch + 1) + " completed in " + timer_end(timer_ds) + " ms");
            }
            ndprint("\n" + "=".repeat(40) + "\nTraining completed after " + epoch_losses.length + " epochs\nFinal loss: " + epoch_losses[epoch_losses.length - 1].toFixed(6) + "\nBest loss: " + best_loss.toFixed(6) + "\n" + "=".repeat(40) + "\n");
            ndprint("Time elapsed: " + timer_end(sgtimer) + " ms");
            return best_loss;
        }
        async pretrain(text_files, epochs, optimizer) {
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
            var max_tokens_per_file = 1e45; // Effectively no limit for now
            for (var epoch = 0; epoch < epochs; epoch++) {
                var steps_in_this_epoch = 0;
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
                    var microbatch_samples = [];

                    while (token_index + this.contextSize < tokens.length) {
                        var input_tokens = tokens.slice(token_index, token_index + this.contextSize);
                        var target_token = tokens[token_index + this.contextSize];

                        microbatch_samples.push([input_tokens, target_token]);

                        if (microbatch_samples.length >= config["microbatchSize"]) {
                            steps_in_this_epoch++;
                            var microbatch_total_loss = 0.0;

                            for (var i = 0; i < microbatch_samples.length; i++) {
                                var [input, target] = microbatch_samples[i];
                                var isLast = i === microbatch_samples.length - 1;

                                await wait(1)
                                microbatch_total_loss += this.train_step(input, target, optimizer, true, !isLast);
                                await wait(1)
                            }

                            this.apply_gradients(optimizer); // Apply gradients after the microbatch

                            microbatch_samples = []; // reset after flush

                            var avg_loss = microbatch_total_loss / config["microbatchSize"];
                            epoch_losses.push(avg_loss);
                            ndprint("Microbatch loss: " + avg_loss.toFixed(4));
                        }

                        token_index += 1; // Move token by token
                    }

                    // Process any remaining samples in microbatch at the end of a file
                    if (microbatch_samples.length > 0) {
                        steps_in_this_epoch++;
                        var microbatch_total_loss = 0.0;
                        for (var i = 0; i < microbatch_samples.length; i++) {
                            var [input, target] = microbatch_samples[i];
                            await wait(1)
                            microbatch_total_loss += this.train_step(input, target, optimizer, true, true); // Accumulate until the end of the file
                            await wait(1)
                        }

                        this.apply_gradients(optimizer); // Apply gradients for the final partial microbatch

                        var avg_loss = microbatch_total_loss / microbatch_samples.length;
                        epoch_losses.push(avg_loss);
                        ndprint("Final partial microbatch loss: " + avg_loss.toFixed(4));
                        microbatch_samples = [];
                    }

                    // <<< --- ADD THIS SECTION --- >>>
                    // Unload the file we just finished processing
                    ndprint("[Info] Finished processing " + state["path"] + ". Unloading from memory.");
                    state["tokens"] = []; // Clear the token array
                    state["loaded"] = false; // Reset the loaded flag
                    // <<< --- END ADDED SECTION --- >>>

                    file_index += 1;
                    token_index = 0; // Reset token index for the next file

                    // Simple unload logic (can be optimized)
                    // For simplicity here, let's just keep all files loaded if less than a certain number.
                    // A more robust system would unload based on memory usage or a sliding window.
                    /*
                    for (var i = 0; i < file_states.length; i++) {
                        if (file_states[i]["loaded"]) {
                            // Compute the global position up to the current token
                            var current_position = 0;
                            for (var j = 0; j < file_index; j++) {
                                current_position += file_states[j]["tokens"].length;
                            }
                            current_position += token_index;

                            // Compute the end position of file i
                            var file_end_position = 0;
                            for (var j = 0; j <= i; j++) {
                                file_end_position += file_states[j]["tokens"].length;
                            }

                            // Unload if window is past this file
                            if (file_end_position < current_position - this.contextSize) {
                                console.log("[Info] Unloading " + file_states[i]['path'] + " from memory");
                                file_states[i]["loaded"] = false;
                                file_states[i]["tokens"] = [];
                            }
                        }
                    }
                    */
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
                        var save_path = "pretrained_" + (epoch + 1) + "_" + loss_str + "_" + optimizer + "_sweetspot.zip";
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
                            await this.save(save_path);
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

                ndprint("-".repeat(60)); // Optional separator
                if (steps_in_this_epoch > 0) {
                        var nan_step_percentage = (this.steps_with_nan_epoch / steps_in_this_epoch) * 100;
                        ndprint(`Epoch ${epoch + 1} NaN Summary:`);
                        ndprint(`  - Steps with any NaN/Inf: ${this.steps_with_nan_epoch} / ${steps_in_this_epoch} (${nan_step_percentage.toFixed(2)}%)`);
                        // You can uncomment these for more detail if needed:
                        ndprint(`    - Forward Checks Triggered: ${this.nan_forward_pass_count_epoch}`);
                        ndprint(`    - Backprop Checks Triggered: ${this.nan_backprop_calc_count_epoch}`);
                        ndprint(`    - Final Grad Checks Triggered: ${this.nan_final_gradient_count_epoch}`);
                } else {
                        ndprint(`Epoch ${epoch + 1}: No training steps counted.`);
                }
                ndprint("-".repeat(60)); // Optional separator
                var result = await this.interactive_test_loop(epoch, epoch_losses.length ? avg_loss : 0.0, optimizer, loss_history, best_loss);
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
            // scale_activation definition remains unchanged from original
            function scale_activation(vector, base_gamma) {
                if (base_gamma === undefined) { base_gamma = 5.0; }
                var norm = 0;
                var input_nan_found = false;
                for(var i = 0; i < vector.length; i++) {
                    if (isNaN(vector[i])) {
                        if (this.nan_checks_enabled) { console.warn(`--- WARNING: Input vector contained NaN at index ${i} for scale_activation ---`);}
                        vector[i] = 0; // Replace NaN
                        input_nan_found = true;
                    }
                    norm += vector[i] * vector[i];
                }
                // Check if *this* function call added a NaN count
                var nan_count_before_scale = this.nan_count_this_step;
                if (input_nan_found) { this.nan_count_this_step++; this.nan_forward_pass_count_epoch++; }

                norm = Math.sqrt(norm);

                if (isNaN(norm)) {
                    if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED IN NORM CALCULATION (scale_activation) !!!"); }
                    // Increment counters only if NaN wasn't already detected in input
                    if (this.nan_count_this_step === nan_count_before_scale) {
                        this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
                    }
                    return vector;
                }
                if (norm < 1e-10) { return vector; }

                var scaling_factor;
                var scaled_vector = new Float32Array(vector.length);
                var output_nan_found = false;

                if (norm > 1000) {
                    scaling_factor = 5.0 / norm;
                    for(var i = 0; i < vector.length; i++) scaled_vector[i] = vector[i] * scaling_factor;
                } else if (norm > 100) {
                    scaling_factor = Math.tanh(1.0) / norm * 100;
                    for(var i = 0; i < vector.length; i++) scaled_vector[i] = vector[i] * scaling_factor;
                } else {
                    var denominator = norm / base_gamma;
                    scaling_factor = (Math.abs(denominator) < 1e-9) ? 1.0 : (Math.tanh(denominator) / denominator);
                    for(var i = 0; i < vector.length; i++) scaled_vector[i] = vector[i] * scaling_factor;
                }

                // Final check on output
                var nan_count_before_output_check = this.nan_count_this_step;
                for(var i = 0; i < scaled_vector.length; i++) {
                    if(isNaN(scaled_vector[i])) {
                        if(this.nan_checks_enabled) { console.error(`!!! NaN DETECTED IN scale_activation OUTPUT at index ${i} (replaced with 0) !!! Norm: ${norm}, Factor: ${scaling_factor}`); }
                        scaled_vector[i] = 0;
                        output_nan_found = true;
                    }
                }
                // Increment counters only if NaN appeared here and wasn't already counted
                if(output_nan_found && this.nan_count_this_step === nan_count_before_output_check) {
                    this.nan_count_this_step++; this.nan_forward_pass_count_epoch++;
                }

                return scaled_vector;
            } // End of scale_activation definition

            ndprint("Doing inference...");
            var sgtimer = timer_();
            var tokenized_input = this.tokenize(context);
            var input_length = tokenized_input.length;
            if (input_length > this.contextSize) {
                // Maintain original error handling
                throw new Error("Input too long");
            }
            var cache = null;
            if (return_cache) {
                // Initialize cache structure
                cache = {
                    "tokenized": tokenized_input,
                    "initial_embeddings": [],
                    "positional_encodings": this.calculate_positional_encoding(input_length),
                    "layers": [] // Initialize layers array
                };
            } else {
                // Positional encodings calculated but not cached if return_cache is false
                var positional_encodings = this.calculate_positional_encoding(input_length);
            }
            var timer_inf = timer_();
            console.log("Computing embeddings...");
            var final_embeddings = []; // Array of Float32Arrays
            // Embedding calculation loop remains unchanged
            for (var pos = 0; pos < tokenized_input.length; pos++) {
                var token = tokenized_input[pos][0];
                var token_id = tokenized_input[pos][1];
                var embedding = new Float32Array(this.embeddingSize);
                var stored_embedding = this.get_embedding(token_id);
                for(var i = 0; i < this.embeddingSize; i++) {
                    embedding[i] = stored_embedding[i * 3];
                }

                if (return_cache) { cache["initial_embeddings"].push(new Float32Array(embedding)); }
                var pos_enc = (return_cache ? cache["positional_encodings"] : positional_encodings)[pos];
                for (var i = 0; i < this.embeddingSize; i++) {
                    embedding[i] += pos_enc[i];
                }
                final_embeddings.push(embedding);
            }
            console.log("Computed embeddings in " + timer_end(timer_inf) + " ms");
            var gtimer = timer_();
            console.log("Computing layers...");
            // Layer computation loop
            for (var layer = 0; layer < this.layersAmount; layer++) {
                timer_inf = timer_();
                console.log("Computing layer " + layer);
                if (return_cache) {
                    // Initialize cache for this specific layer, including new x_hat entries
                    cache["layers"].push({
                        "norm1_x_hat": [], // ADDED cache entry
                        "heads": [],
                        "combined": null,
                        "norm2_x_hat": [], // ADDED cache entry
                        "normalized": null, // This will store output of norm1
                        "feed_forward": {
                            "bigger": null,
                            "after_relu": null,
                            "final": null
                        }
                    });
                }

                // --- Normalize 1 START ---
                var normalized_embeddings = []; // Stores final 'y' output of norm1
                var norm1_weights = this.transformer["layers"][layer]["weights"]["normalize_1"]; // GAMMA
                var norm1_biases = this.transformer["layers"][layer]["biases"]["normalize_1"];   // BETA

                for (var i = 0; i < final_embeddings.length; i++) {
                    // --- Calculate x_hat for caching --- (NEW)
                    var x_hat_for_cache_1 = this._calculate_x_hat_only(final_embeddings[i]);
                    if (return_cache) {
                        cache["layers"][layer]["norm1_x_hat"].push(new Float32Array(x_hat_for_cache_1));
                    }
                    // --- End Calculate x_hat ---

                    // --- Call modified normalize_vector --- (NEW)
                    var final_norm1_output = this.normalize_vector(final_embeddings[i], norm1_weights, norm1_biases);
                    normalized_embeddings.push(final_norm1_output);
                    // --- End Call ---
                }
                // Cache the final output 'y' of Norm1
                if (return_cache) {
                    // This replaces the old caching logic for 'normalized'
                    cache["layers"][layer]["normalized"] = normalized_embeddings.map(arr => new Float32Array(arr));
                }
                // --- Normalize 1 END ---


                // --- Attention Calculation START --- (Unchanged Logic)
                var head_outputs = [];
                for (var head = 0; head < this.heads; head++) {
                    // Head internal calculations remain the same, taking normalized_embeddings (now 'y') as input
                    var head_weights = this.transformer["layers"][layer]["weights"]["attention"]["heads"][head];
                    var head_biases = this.transformer["layers"][layer]["biases"]["attention"]["heads"][head];
                    var q_vectors = []; var k_vectors = []; var v_vectors = [];
                    var head_query_weights = head_weights["query"]; var head_key_weights = head_weights["key"]; var head_value_weights = head_weights["value"];
                    var head_query_biases = head_biases["query"]; var head_key_biases = head_biases["key"]; var head_value_biases = head_biases["value"];

                    // Calculate Q, K, V vectors from normalized_embeddings ('y' from norm1)
                    for (var i = 0; i < normalized_embeddings.length; i++) {
                        var token_embedding = normalized_embeddings[i]; // Using the 'y' output of norm1
                        var q_vector = new Float32Array(this.embeddingSize);
                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                            var q_sum = 0;
                            for (var j = 0; j < this.embeddingSize; j++) { q_sum += token_embedding[j] * head_query_weights[pos * this.embeddingSize * 3 + j * 3]; }
                            q_vector[pos] = q_sum + head_query_biases[pos * 3];
                        }
                        q_vectors.push(q_vector);
                        var k_vector = new Float32Array(this.embeddingSize);
                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                            var k_sum = 0;
                            for (var j = 0; j < this.embeddingSize; j++) { k_sum += token_embedding[j] * head_key_weights[pos * this.embeddingSize * 3 + j * 3]; }
                            k_vector[pos] = k_sum + head_key_biases[pos * 3];
                        }
                        k_vectors.push(k_vector);
                        var v_vector = new Float32Array(this.embeddingSize);
                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                            var v_sum = 0;
                            for (var j = 0; j < this.embeddingSize; j++) { v_sum += token_embedding[j] * head_value_weights[pos * this.embeddingSize * 3 + j * 3]; }
                            v_vector[pos] = v_sum + head_value_biases[pos * 3];
                        }
                        v_vectors.push(v_vector);
                    }
                    // Attention scores, scaling, softmax, applying probs to V remain unchanged
                    var attention_scores = [];
                    for (var i = 0; i < q_vectors.length; i++) {
                        var token_scores = new Float32Array(k_vectors.length);
                        for (var j = 0; j < k_vectors.length; j++) {
                            var score = this.dot_product(q_vectors[i], k_vectors[j]);
                            if (j > i) { score = -Infinity; }
                            token_scores[j] = score;
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
                        var final_vector = new Float32Array(this.embeddingSize).fill(0);
                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                            for (var other_token_idx = 0; other_token_idx < attention_probs[token_idx].length; other_token_idx++) {
                                final_vector[pos] += v_vectors[other_token_idx][pos] * attention_probs[token_idx][other_token_idx];
                            }
                        }
                        post_attention_vectors.push(final_vector);
                    }
                    // Head Caching remains unchanged
                    if (return_cache) {
                        var head_cache = {
                            "q_vectors": q_vectors.map(arr => new Float32Array(arr)),
                            "k_vectors": k_vectors.map(arr => new Float32Array(arr)),
                            "v_vectors": v_vectors.map(arr => new Float32Array(arr)),
                            "attention_scores": attention_scores.map(arr => new Float32Array(arr)),
                            "attention_probs": attention_probs.map(arr => new Float32Array(arr)),
                            "output": post_attention_vectors.map(arr => new Float32Array(arr))
                        };
                        // Ensure cache structure exists before pushing
                        if (!cache["layers"][layer]["heads"]) cache["layers"][layer]["heads"] = [];
                        cache["layers"][layer]["heads"].push(head_cache);
                    }
                    head_outputs.push(post_attention_vectors);
                } // End head loop
                // --- Attention Calculation END ---


                // --- Combine Heads START --- (Unchanged Logic)
                var combined_vectors = []; // Stores result of Attention Output projection
                var output_weights = this.transformer["layers"][layer]["weights"]["attention"]["output"];
                var output_biases = this.transformer["layers"][layer]["biases"]["attention"]["output"];

                for (var token_idx = 0; token_idx < final_embeddings.length; token_idx++) { // Length matches input seq length
                    var concatenated = new Float32Array(this.embeddingSize * this.heads);
                    var current_offset = 0;
                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                        concatenated.set(head_outputs[head_idx][token_idx], current_offset);
                        current_offset += this.embeddingSize;
                    }
                    var output_vector = new Float32Array(this.embeddingSize);
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var pos_sum = 0;
                        for (var j = 0; j < this.embeddingSize * this.heads; j++) {
                            pos_sum += concatenated[j] * output_weights[pos * (this.embeddingSize * this.heads) * 3 + j * 3];
                        }
                        output_vector[pos] = pos_sum + output_biases[pos * 3];
                    }
                    combined_vectors.push(output_vector);
                }
                // Dropout (Unchanged Logic)
                if (training_mode) {
                    var dropout_rate = 0;
                    if (config["antiOverfittingOptimisations"]) { dropout_rate = 0.1; }
                    if (dropout_rate > 0) {
                        for (var i = 0; i < combined_vectors.length; i++) {
                            for (var j = 0; j < combined_vectors[i].length; j++) {
                                if (Math.random() < dropout_rate) { combined_vectors[i][j] = 0; }
                                else { combined_vectors[i][j] /= (1 - dropout_rate); }
                            }
                        }
                    }
                }
                // --- Combine Heads END ---

                // --- Add Residual Connection (Before Norm2) START --- (Unchanged Logic)
                for (var i = 0; i < combined_vectors.length; i++) {
                    for (var j = 0; j < this.embeddingSize; j++) {
                        combined_vectors[i][j] += final_embeddings[i][j]; // Add input to the layer
                    }
                }
                // Cache the combined output + residual (input to Norm2 and source for FFN residual)
                if (return_cache) {
                    cache["layers"][layer]["combined"] = combined_vectors.map(arr => new Float32Array(arr));
                }
                // --- Add Residual Connection END ---


                // --- Scale Activation after Residual START --- (Unchanged Logic)
                for (var i = 0; i < combined_vectors.length; i++) {
                    // Pass 'this' context correctly using .call
                    combined_vectors[i] = scale_activation.call(this, combined_vectors[i], 5.0);
                }
                // --- Scale Activation END ---


                // --- Normalize 2 START ---
                var normalized_vectors = []; // Stores final 'y' output of norm2
                var norm2_weights = this.transformer["layers"][layer]["weights"]["normalize_2"]; // GAMMA
                var norm2_biases = this.transformer["layers"][layer]["biases"]["normalize_2"];   // BETA

                for (var i = 0; i < combined_vectors.length; i++) { // Input is the scaled attn_out + residual
                    // --- Calculate x_hat for caching --- (NEW)
                    var x_hat_for_cache_2 = this._calculate_x_hat_only(combined_vectors[i]);
                    if (return_cache) {
                        cache["layers"][layer]["norm2_x_hat"].push(new Float32Array(x_hat_for_cache_2));
                    }
                    // --- End Calculate x_hat ---

                    // --- Call modified normalize_vector --- (NEW)
                    var final_norm2_output = this.normalize_vector(combined_vectors[i], norm2_weights, norm2_biases);
                    normalized_vectors.push(final_norm2_output);
                    // --- End Call ---
                }
                // --- Normalize 2 END ---
                // Note: `normalized_vectors` now holds the output 'y' of Norm2


                // --- Feed Forward Network START --- (Unchanged Logic, input is 'normalized_vectors')
                var bigger_vectors = []; // Stores output of FFN Grow
                var grow_weights = this.transformer["layers"][layer]["weights"]["feed_forward"]["grow"];
                var grow_biases = this.transformer["layers"][layer]["biases"]["feed_forward"]["grow"];

                // FFN Grow (Input is normalized_vectors, which is 'y' from Norm2)
                for (var i = 0; i < normalized_vectors.length; i++) {
                    var bigger_vector = new Float32Array(this.embeddingSize * 4);
                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                        var sum_val = 0;
                        for (var k = 0; k < this.embeddingSize; k++) {
                            sum_val += normalized_vectors[i][k] * grow_weights[k * (this.embeddingSize * 4) * 3 + j * 3];
                        }
                        bigger_vector[j] = sum_val + grow_biases[j * 3];
                    }
                    bigger_vectors.push(bigger_vector);
                }
                if (return_cache) { cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.map(arr => new Float32Array(arr)); }

                // Apply ReLU (Unchanged)
                for (var i = 0; i < bigger_vectors.length; i++) {
                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                        if (bigger_vectors[i][j] < 0) { bigger_vectors[i][j] = 0; }
                    }
                }
                if (return_cache) { cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.map(arr => new Float32Array(arr)); }

                // Dropout (Unchanged)
                if (training_mode) {
                    var dropout_rate = 0;
                    if (config["antiOverfittingOptimisations"]) { dropout_rate = 0.1; }
                    if (dropout_rate > 0) {
                        for (var i = 0; i < bigger_vectors.length; i++) {
                            for (var j = 0; j < bigger_vectors[i].length; j++) {
                                if (Math.random() < dropout_rate) { bigger_vectors[i][j] = 0; }
                                else { bigger_vectors[i][j] /= (1 - dropout_rate); }
                            }
                        }
                    }
                }

                // FFN Shrink (Unchanged)
                var final_vectors = []; // Stores output of FFN Shrink (before residual)
                var shrink_weights = this.transformer["layers"][layer]["weights"]["feed_forward"]["shrink"];
                var shrink_biases = this.transformer["layers"][layer]["biases"]["feed_forward"]["shrink"];
                for (var i = 0; i < bigger_vectors.length; i++) {
                    var final_vector = new Float32Array(this.embeddingSize);
                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                        var accum = 0;
                        for (var j = 0; j < this.embeddingSize * 4; j++) {
                            accum += bigger_vectors[i][j] * shrink_weights[pos * (this.embeddingSize * 4) * 3 + j * 3];
                        }
                        final_vector[pos] = accum + shrink_biases[pos * 3];
                    }
                    final_vectors.push(final_vector);
                }
                // --- Feed Forward Network END ---


                // --- Add Residual Connection (After FFN) START --- (Unchanged Logic)
                // Residual source is the output of (Attention + Residual) stored in 'combined' cache or var
                for (var i = 0; i < final_vectors.length; i++) {
                    // Retrieve the vector *before* Norm2 for the residual
                    var residual_source = (return_cache && cache["layers"][layer]["combined"])
                                        ? cache["layers"][layer]["combined"][i]
                                        : combined_vectors[i]; // Fallback if not caching
                    for (var j = 0; j < this.embeddingSize; j++) {
                        // Check if residual_source exists and has the element
                        if (residual_source && residual_source[j] !== undefined) {
                            final_vectors[i][j] += residual_source[j];
                        } else {
                            // Log error or handle missing residual source if necessary
                            if (this.nan_checks_enabled) console.error(`Missing residual source at layer ${layer}, token ${i}, dim ${j}`);
                        }
                    }
                }
                // --- Add Residual Connection END ---


                // --- Scale Activation after Residual START --- (Unchanged Logic)
                for (var i = 0; i < final_vectors.length; i++) {
                    final_vectors[i] = scale_activation.call(this, final_vectors[i], 5.0); // Use .call(this)
                }
                // --- Scale Activation END ---


                // Cache final layer output ('y') and update embeddings for next layer
                if (return_cache) {
                    cache["layers"][layer]["feed_forward"]["final"] = final_vectors.map(arr => new Float32Array(arr));
                }
                final_embeddings = final_vectors; // Output of this layer becomes input for the next
                console.log("Computed layer " + layer + " in " + timer_end(timer_inf) + " ms");
            } // --- End layer loop ---

            console.log("Computed layers in " + timer_end(gtimer) + " ms");

            // --- Vocab Projection START --- (Unchanged Logic)
            timer_inf = timer_();
            console.log("Computing next token...");
            var last_token_embedding = final_embeddings[final_embeddings.length - 1];
            var scores = new Float32Array(this.vocab.length);
            var vocab_weights = this.transformer["vocab_projection"]["weights"];
            var vocab_biases = this.transformer["vocab_projection"]["biases"];

            for (var token_idx = 0; token_idx < this.vocab.length; token_idx++) {
                var score = 0;
                for (var pos = 0; pos < this.embeddingSize; pos++) {
                    score += last_token_embedding[pos] * vocab_weights[token_idx * this.embeddingSize * 3 + pos * 3];
                }
                score += vocab_biases[token_idx * 3];
                scores[token_idx] = score;
            }
            if (return_cache) {
                cache["vocab_scores"] = new Float32Array(scores);
            }
            // Find highest score index (Unchanged)
            var highest_score = -Infinity;
            var next_token_idx = 0;
            for (var i = 0; i < scores.length; i++) {
                var score = scores[i];
                if (score > highest_score) {
                    highest_score = score;
                    next_token_idx = i;
                }
            }
            console.log("Computed next token in " + timer_end(timer_inf) + " ms");
            // --- Vocab Projection END ---

            ndprint("Did inference in", timer_end(sgtimer), "ms");
            if (return_cache) {
                return [[this.vocab[next_token_idx][0], this.vocab[next_token_idx][1]], cache];
            }
            return [this.vocab[next_token_idx][0], this.vocab[next_token_idx][1]];
        }
        generate(context, temperature) {
            if (temperature === undefined || temperature === false) { temperature = this.temperature; }
            var current_context = context;
            var output = "";
            for (var step = 0; step < this.maxOutputSize; step++) {
                var inference_res = this.inference(current_context, true);
                var next_token = inference_res[0];
                var cache = inference_res[1];
                var scores = cache["vocab_scores"]; // This is a Float32Array
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
                    var scaled_scores = new Float32Array(scores.length);
                    for (var i = 0; i < scores.length; i++) { scaled_scores[i] = scores[i] / temperature; }
                    var probs = this.softmax(scaled_scores); // This is a Float32Array
                    var random_value = Math.random(); // Use Math.random for float between 0 and 1
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
        async interactive_test_loop(epoch_num, avg_loss, optimizer, loss_history, best_loss) {
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

            ndprint("Available commands:");
            ndprint("  /continue        Continue training");
            ndprint("  /stop            Stop training");
            ndprint("  /save [path]     Save model (optional path, default is model_optimizer.zip)");
            ndprint("  /switch_to_*     Switch optimizer (sgd, adam, sgd_momentum)");
            ndprint("  /temperature X   Set or view temperature");
            ndprint("  /info            Show current training info");
            ndprint("  /help            Show this help message");
            ndprint("")

            // If the user responded before the 30s timeout, we enter the loop:
            while (true) {
                var user_input;
                try {
                    // Prompt again for the actual commands, also with a 30s limit
                    user_input = readlineSync.question("› ").trim();
                } catch (e) {
                    ndprint("\n[Info] Skipping interactive testing...");
                    break;
                }

                if (user_input === "") {
                    continue
                } else if (user_input === "/continue") {
                    ndprint("[Info] Continuing to next epoch...");
                    break;
                } else if (user_input === "/stop") {
                    ndprint("[Info] Stopping training.");
                    return "STOP_TRAINING";
                } else if (user_input.indexOf("/save") === 0) {
                    var parts = user_input.split(" ", 2);
                    var save_path = parts.length > 1 ? parts[1] : ("model_" + optimizer + ".zip");
                    try {
                        await this.save(save_path);
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
                    ndprint("--- Training Info ---");
                    ndprint(`  Epoch: ${epoch_num + 1}`);
                    ndprint(`  Optimizer: ${optimizer}`);
                    ndprint(`  Current Epoch Loss: ${!isNaN(avg_loss) ? avg_loss.toFixed(6) : 'N/A'}`);
                    ndprint(`  Best Loss So Far: ${isFinite(best_loss) ? best_loss.toFixed(6) : 'Infinity'}`);
                    ndprint(`  Previous epoch loss: ${(loss_history.length > 1) ? loss_history[loss_history.length - 2].toFixed(6) : 'N/A'}`);

                    // Calculate average of last 10 (or fewer if history is short)
                    var history_len = loss_history.length;
                    var window_size = Math.min(history_len, 10);
                    if (window_size > 0) {
                        var recent_losses = loss_history.slice(-window_size);
                        var avg_recent = recent_losses.reduce((a, b) => a + b, 0) / window_size;
                        ndprint(`  Avg Loss (Last ${window_size} epochs): ${avg_recent.toFixed(6)}`);
                    } else {
                        ndprint(`  Avg Loss (Last 10 epochs): N/A (history too short)`);
                    }
                    ndprint(`  Current Temperature: ${this.temperature}`);
                    ndprint("---------------------");
                } else if (user_input === "/help") {
                    ndprint("Available commands:");
                    ndprint("  /continue        Continue training");
                    ndprint("  /stop            Stop training");
                    ndprint("  /save [path]     Save model (optional path, default is model_optimizer.zip)");
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
    }; // <-- End of Transformer class definition

    (async function(){
        // Main execution logic starts here
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
                await transformer.pretrain(config["pre-training-paths"], config["pre-train-epochs"], config["pre-train-optimizer"]);
            }
            if (training__) {
                await transformer.train(config["training-dataset-path"], config["train-epochs"], config["train-optimizer"]);
            }
        } else {
            var transformer = await new Transformer(false, null, model_location);
        };
        // Final interactive generation loop
        try {
            ndprint("\nEntering interactive mode. Type a message or command:");
            ndprint("Commands: /save [path], /temperature <value>, /help, /exit");
            function generate_response(text) {
                var formatted_input = "user:\n" + text + "\nyou:\n";
                // No need to tokenize here, generate handles it
                return transformer.generate(formatted_input, transformer.temperature);
            }
            while (true) {
                var text = require("readline-sync").question("› ").trim();
                if (text.indexOf("/save ") === 0) {
                    var path_out = text.substring(6);
                    await transformer.save(path_out);
                    ndprint("Model saved to " + path_out);
                    continue;
                } else if (text === "/save") {
                    await transformer.save();
                    ndprint("Model saved to model.zip");
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
                    // Interactive mode help
                    ndprint("Available commands:");
                    ndprint("  /save [path]     Save model to file");
                    ndprint("  /temperature X   Set or view temperature");
                    ndprint("  /exit            Exit interactive mode");
                    ndprint("  /help            Show this help message");
                    continue;
                } else if (text === "/exit") {
                    console.log("Exiting interactive mode.");
                    break;
                }
                // If it's not a command, generate a response
                var output = generate_response(text);
                ndprint(output);
            } // End of while loop
        } // Close the try block
        catch (e) {
            ndprint("\nExiting interactive mode due to error: " + e); // Add error message
            process.exit(1); // Exit with an error code
        }
    })();
})();