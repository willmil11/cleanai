(async function(){
    var mode;
    var workerData;

    var submode;

    try{
        workerData = require("worker_threads").workerData;
        mode = "SharedMemory"
        submode = workerData.submode;
    }
    catch (error){
        mode = "Remote"
    }

    var timers = [];

    var wait = async function(ms){
        return new Promise(function(resolve){
            setTimeout(function(){
                resolve();
            }, ms);
        })
    }

    var randomRangeInclusive = function(range) {
        return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    };

    var toSharedFloat32 = function(arr) {
        var shared = new SharedArrayBuffer(arr.byteLength);
        var sharedView = new Float32Array(shared);
        sharedView.set(arr);
        return sharedView;
    };
    
    var sharedFloat32Array = function(input) {
        if (input instanceof Float32Array) return toSharedFloat32(input);
        if (Array.isArray(input)) return toSharedFloat32(new Float32Array(input));
        if (ArrayBuffer.isView(input)) return toSharedFloat32(new Float32Array(input));
        if (typeof input === 'number') return new Float32Array(new SharedArrayBuffer(input * 4));
        throw new Error("sharedFloat32Array: invalid input");
    };    

    if (mode === "Remote"){
        console.log("Remote mode selected.")
        try{
            var randomUuid = function(){
                var uuid = "";
                for (var i = 0; i < 32; i++){
                    uuid += String.fromCharCode(Math.floor(Math.random() * (126 - 32 + 1)) + 32);
                }
                return uuid;
            }

            var ndprint = function(text){
                console.log(text);
            };

            (async function(){
                var process = require("process");
                try{
                    var websocket = require("ws");
                }
                catch (error){
                    process.exit(1);
                }

                try{
                    var Tiktoken = require("tiktoken/lite").Tiktoken;
                }
                catch (error){
                    process.exit(1);
                }

                try{
                    var uuid = require("uuid");
                }
                catch (error){
                    process.exit(1);
                }

                var fs = require('fs');
                var cl100k_base = require('tiktoken/encoders/cl100k_base.json')
                
                var args = process.argv.slice(2);
                if (args.length != 4){
                    console.error("Correct usage: node worker.js --port <port> --modeldata <json model data>")
                    process.exit(1);
                }
                var port = null;
                var modelData = null;

                // Parse arguments for --port and --modeldata
                for (var i = 0; i < args.length; i++) {
                    if (args[i] === "--port") {
                        if (i + 1 < args.length) {
                            try {
                                port = parseInt(args[i + 1]);
                            } catch (error) {
                                console.error("Port must be an integer");
                                process.exit(1);
                            }
                            if (isNaN(port) || port < 0 || port > 65535) {
                                console.error("Port must be between 0 and 65535");
                                process.exit(1);
                            }
                        } else {
                            console.error("Missing value for --port");
                            process.exit(1);
                        }
                    }
                    if (args[i] === "--modeldata") {
                        if (i + 1 < args.length) {
                            try {
                                modelData = JSON.parse(args[i + 1]);
                            } catch (error) {
                                console.error("Model data must be valid JSON");
                                process.exit(1);
                            }
                        } else {
                            console.error("Missing value for --modeldata");
                            process.exit(1);
                        }
                    }
                }

                if (port === null) {
                    console.error("Correct usage: node worker.js --port <port> --modeldata <json model data>");
                    process.exit(1);
                }
                if (modelData === null) {
                    console.error("Correct usage: node worker.js --port <port> --modeldata <json model data>");
                    process.exit(1);
                }

                //? Can add more checks here.
                var requiredInModelData = [
                    "embeddingSize",
                    "nan_checks_enabled",
                    "heads",
                    "layersAmount",
                    "contextSize",
                    "antiOverfittingOptimisations",
                    "batchSize",
                    "script_loc"
                ]

                // Check that all required fields are present in modelData
                for (var i = 0; i < requiredInModelData.length; i++) {
                    var key = requiredInModelData[i];
                    if (!(key in modelData)) {
                        console.error("Model data is missing required field: " + key);
                        process.exit(1);
                    }
                }

                var config = {
                    "antiOverfittingOptimisations": modelData.antiOverfittingOptimisations,
                    "batchSize": modelData.batchSize
                }

                var ws = new websocket("ws://localhost:" + port, {"maxPayload": 9999999999999999999999999999999999999999999999999999999999999999999999999999999999 * 1024 * 1024});

                console.log("Knitting bridge to main process...");

                ws.on("open", async function() {
                    console.log("Knit bridge to main process.");
                    var requests = [];

                    console.log("Setting up worker...")

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

                    var convertArraysToFloat32 = function(obj) {
                        // Add this check at the beginning of the function
                        if (obj instanceof Float32Array) {
                            return obj;
                        }

                        function isAllNumbers(arr) {
                            for (var i = 0; i < arr.length; i++) {
                                if (typeof arr[i] !== "number") {
                                    return false;
                                }
                            }
                            return true;
                        }
                    
                        if (Array.isArray(obj)) {
                            if (isAllNumbers(obj)) {
                                return sharedFloat32Array(obj);
                            } else {
                                var converted = [];
                                for (var i = 0; i < obj.length; i++) {
                                    if (typeof obj[i] === "object" && obj[i] !== null) {
                                        converted.push(convertArraysToFloat32(obj[i]));
                                    } else {
                                        converted.push(obj[i]);
                                    }
                                }
                                return converted;
                            }
                        } else {
                            if (obj && typeof obj === "object") {
                                for (var key in obj) {
                                    if (obj.hasOwnProperty(key)) {
                                        obj[key] = convertArraysToFloat32(obj[key]);
                                    }
                                }
                            }
                        }
                    
                        return obj;
                    };

                    var requestData = async function(pathto, slice){
                        try{
                            var requestId = randomUuid();
                            while (true){
                                var found = false; //cool linear search
                                for (var i = 0; i < requests.length; i++){
                                    if (requests[i].requestId == requestId){
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found){
                                    break;
                                }
                                requestId = randomUuid();
                            }
                            requests.push({
                                "type": "requestData",
                                "requestId": requestId,
                                "response": undefined
                            })
                            ws.send(JSON.stringify({
                                "type": "requestData",
                                "requestId": requestId,
                                "pathto": pathto,
                                "slice": slice
                            }));
                            while (true){
                                var reqIndex = undefined;
                                var found = false; //another dope linear search
                                for (var i = 0; i < requests.length; i++){
                                    if (requests[i].requestId == requestId){
                                        found = true;
                                        reqIndex = i;
                                        break;
                                    }
                                }
                                if (!found){
                                    await wait(1);
                                    continue
                                }
                                else{
                                    if (requests[reqIndex].response != undefined){
                                        //Remove the request from the list
                                        var rep = requests[reqIndex].response;
                                        requests.splice(reqIndex, 1);

                                        rep = convertArraysToFloat32(rep);
                                        
                                        return rep;                        
                                    }
                                }
                                await wait(1);
                            }
                        }
                        catch (error){
                            throw error;
                        }
                    }

                    var dataIds = [];
                    var generateDataId = function() {
                        var dataId = "";
                        while (true) {
                            dataId = "";
                            for (var index = 0; index < 5; index++) { dataId += randomRangeInclusive([0, 9]); }
                            var found = false;
                            for (var i = 0; i < dataIds.length; i++) { if (dataIds[i] === dataId) { found = true; break; } }
                            if (!found) { dataIds.push(dataId); break; }
                        }
                        return dataId;
                    };

                    var makeStruct = function(dataRequested) {
                        var binaries = [];
                        var walk = function(val) {
                            if (val instanceof Float32Array) {
                                var binidstr = generateDataId();
                                var header = Buffer.alloc(5);
                                for (var i = 0; i < 5; i++) { header[i] = binidstr.charCodeAt(i); }
                                var payload = Buffer.from(val.buffer);
                                var full = Buffer.concat([header, payload]);
                                binaries.push(full);
                                return ["binary", binidstr];
                            }
                            if (val === null || val === undefined) { return ["data", null]; }
                            var type = typeof val;
                            if (type === "string" || type === "number" || type === "boolean") { return ["data", val]; }
                            if (Array.isArray(val)) {
                                var arr = [];
                                for (var i = 0; i < val.length; i++) { arr.push(walk(val[i])); }
                                return ["data", arr];
                            }
                            if (type === "object") {
                                var obj = {};
                                var keys = Object.keys(val);
                                for (var i = 0; i < keys.length; i++) { obj[keys[i]] = walk(val[keys[i]]); }
                                return ["data", obj];
                            }
                            throw new Error("Unsupported type in struct: " + type);
                        };
                        var struct = walk(dataRequested);
                        return [struct].concat(binaries);
                    };

                    var gradientsFeedback = async function(gradients) {
                        var requestId = randomUuid();
                        while (true) {
                            var dupe = false;
                            for (var i = 0; i < requests.length; i++) { 
                                if (requests[i].requestId === requestId) { 
                                    dupe = true; 
                                    break; 
                                } 
                            }
                            if (!dupe) break;
                            requestId = randomUuid();
                        }
                        requests.push({ 
                            "type": "gradientsFeedback",
                            "requestId": requestId, 
                            "response": undefined 
                        });
                    
                        var structRes = makeStruct(gradients);
                        var struct = structRes[0];
                        var binaries = structRes.slice(1);
                    
                        ws.send(JSON.stringify({ 
                            "type": "gradientsFeedback", 
                            "requestId": requestId, 
                            "struct": struct 
                        }));
                        
                        for (var i = 0; i < binaries.length; i++) { 
                            ws.send(binaries[i]); 
                        }
                    
                        while (true) {
                            var idx = -1;
                            for (var i = 0; i < requests.length; i++) { 
                                if (requests[i].requestId === requestId) { 
                                    idx = i; 
                                    break; 
                                } 
                            }
                            if (idx !== -1 && requests[idx].response !== undefined) {
                                var ok = requests[idx].response;
                                requests.splice(idx, 1);
                                return ok;
                            }
                            await wait(1);
                        }
                    }

                    var pushData = async function(pathto, data) {
                        // Generate a unique requestId
                        var requestId = randomUuid();
                        // Ensure uniqueness in requests array
                        while (true) {
                            var found = false;
                            for (var i = 0; i < requests.length; i++) {
                                if (requests[i].requestId == requestId) {
                                    found = true;
                                    break;
                                }   
                            }
                            if (!found) break;
                            requestId = randomUuid();
                        }
                        // Push the request object to requests array
                        requests.push({
                            "type": "pushData",
                            "requestId": requestId,
                            "response": undefined
                        });
                        // Send the pushData message
                        ws.send(JSON.stringify({
                            "type": "pushData",
                            "requestId": requestId,
                            "pathto": pathto,
                            "data": data
                        }));
                        // Wait for confirmation (response will be filled in by message handler)
                        while (true) {
                            var reqIndex = undefined;
                            var found = false;
                            for (var i = 0; i < requests.length; i++) {
                                if (requests[i].requestId == requestId) {
                                    found = true;
                                    reqIndex = i;
                                    break;
                                }
                            }
                            if (!found) {
                                await wait(1);
                                continue;
                            } else {
                                if (requests[reqIndex].response !== undefined) {
                                    // Remove the request from the list
                                    var rep = requests[reqIndex].response;
                                    requests.splice(reqIndex, 1);
                                    return rep;
                                }
                            }
                            await wait(1);
                        }
                    }

                    var decodeStruct = function(structReply) {
                        var binaryIds = [];
                    
                        var walk = function(entry) {
                            if (!Array.isArray(entry) || entry.length !== 2) return;
                            var tag = entry[0];
                            var val = entry[1];
                    
                            if (tag === "binary") {
                                binaryIds.push(val);
                            } else if (tag === "data") {
                                if (Array.isArray(val)) {
                                    for (var i = 0; i < val.length; i++) {
                                        walk(val[i]);
                                    }
                                } else if (typeof val === "object" && val !== null) {
                                    var keys = Object.keys(val);
                                    for (var i = 0; i < keys.length; i++) {
                                        walk(val[keys[i]]);
                                    }
                                }
                            }
                        };
                    
                        walk(structReply);
                        return binaryIds;
                    };

                    var recomposeStruct = function(structReply, binaries) {
                        var binmap = {};
                        for (var i = 0; i < binaries.length; i++) {
                            var buf = binaries[i]; // This is a Buffer received over WebSocket, includes header
                            var idstr = "";
                            for (var j = 0; j < 5; j++) { idstr += String.fromCharCode(buf[j]); }
                            var payloadSlice = buf.slice(5); // payloadSlice is a Buffer containing only the float data

                            // Create a new ArrayBuffer that is a copy of payloadSlice's content.
                            // This new ArrayBuffer will have its data starting at offset 0, ensuring alignment.
                            // payloadSlice.buffer refers to the ArrayBuffer backing payloadSlice.
                            // payloadSlice.byteOffset is its offset within that ArrayBuffer.
                            // payloadSlice.length is its length in bytes.
                            var alignedArrayBuffer = payloadSlice.buffer.slice(
                                payloadSlice.byteOffset,
                                payloadSlice.byteOffset + payloadSlice.length
                            );

                            // Defensive check: Ensure the length of the data is a multiple of 4 (size of a float).
                            // This should be true if the data was serialized correctly.
                            if (alignedArrayBuffer.byteLength % 4 !== 0) {
                                console.error(`[Worker] recomposeStruct: Data length for binary ID ${idstr} is ${alignedArrayBuffer.byteLength}, which is not a multiple of 4. Cannot create Float32Array.`);
                                binmap[idstr] = null; // Mark as problematic
                                continue; // Skip this binary
                            }
                            
                            // Now create the Float32Array from this new, aligned ArrayBuffer.
                            // The byteOffset for this constructor call implicitly defaults to 0.
                            // The length (number of elements) is implicitly alignedArrayBuffer.byteLength / 4.
                            // worker.js - inside recomposeStruct, after creating f32
                            var f32 = sharedFloat32Array(alignedArrayBuffer);
                            // *** ADD CHECKS ***
                            if (!f32 || !(f32 instanceof Float32Array)) {
                                console.error(`[Worker] recomposeStruct: Failed to create Float32Array for ID ${idstr}`);
                                binmap[idstr] = null; // Mark as problematic
                                continue;
                            }
                            if (f32.byteLength !== alignedArrayBuffer.byteLength) {
                                console.error(`[Worker] recomposeStruct: Mismatch byteLength for ID ${idstr}. Expected ${alignedArrayBuffer.byteLength}, Got ${f32.byteLength}`);
                                binmap[idstr] = null;
                                continue;
                            }
                            // Optionally check a few values if sizes are reasonable
                            // if(f32.length > 0 && !Number.isFinite(f32[0])) {
                            //      console.warn(`[Worker] recomposeStruct: First element of F32 for ID ${idstr} is not finite.`);
                            // }
                            // *** END CHECKS ***
                            binmap[idstr] = f32;
                        }

                        // The walk function needs to handle the case where binmap[idstr] might be null
                        // if the length check above failed.
                        var walk = function(entry) {
                            if (!Array.isArray(entry) || entry.length !== 2) return null; // Or handle as error
                            var tag = entry[0], val = entry[1];

                            if (tag === "binary") {
                                if (val in binmap) {
                                    if (binmap[val] === null) {
                                        console.warn(`[Worker] walk: Binary data for ID ${val} was invalid and set to null. Returning null for this part of the structure.`);
                                        return null; // Or throw new Error(`Invalid/missing binary data for ID ${val}`);
                                    }
                                    return binmap[val];
                                } else {
                                    // This indicates an ID was in structReply (from decodeStruct) but not found in the processed binaries map.
                                    // This should ideally not happen if the binary was received and processed.
                                    console.error(`[Worker] walk: Binary ID ${val} expected by struct but not found in processed binaries map.`);
                                    throw new Error(`Missing binary ID in map: ${val}`);
                                }
                            } else if (tag === "data") {
                                if (Array.isArray(val)) {
                                    var out = [];
                                    for (var i = 0; i < val.length; i++) {
                                        out.push(walk(val[i]));
                                    }
                                    return out;
                                } else if (typeof val === "object" && val !== null) {
                                    var obj = {}, ks = Object.keys(val);
                                    for (var k = 0; k < ks.length; k++) {
                                        obj[ks[k]] = walk(val[ks[k]]);
                                    }
                                    return obj;
                                } else {
                                    return val;
                                }
                            }
                            throw new Error("Invalid struct tag in walk: " + tag);
                        };

                        return walk(structReply);
                    };

                    var transformer_dynamicworker;

                    transformer_dynamicworker = {
                        "tokenize": function(text) {
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
                        },
                        "id_to_token": {},
                        "encoder": new Tiktoken(
                            cl100k_base.bpe_ranks,
                            { "<|endoftext|>": 100257 }, // example special token
                            cl100k_base.pat_str
                        ),
                        "calculate_positional_encoding": function(sequence_length) {
                            var positional_encodings = [];
                            for (var pos = 0; pos < sequence_length; pos++) {
                                var embedding = sharedFloat32Array(this.embeddingSize);
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
                        },
                        "embeddingSize": modelData.embeddingSize,
                        "heads": modelData.heads,
                        "layersAmount": modelData.layersAmount,
                        "contextSize": modelData.contextSize,
                        "get_embedding": async function(token_id) {
                            var vocab_idx = null;
                            for (var i = 0; i < this.vocab.length; i++) {
                                if (this.vocab[i][1] === token_id) {
                                    vocab_idx = i;
                                    break;
                                }
                            }
                            if (vocab_idx !== null) {
                                return await requestData("[\"transformer\"][\"embeddings\"][" + vocab_idx + "]")
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
                                    return await requestData("[\"transformer\"][\"embeddings\"][" + unknown_idx + "]");
                                } else {
                                    console.log("Warning: Token ID " + token_id + " not found in vocabulary, using first token as fallback");
                                    return await requestData("[\"transformer\"][\"embeddings\"][0]");
                                }
                            }
                        },
                        "nan_checks_enabled": modelData.nan_checks_enabled,
                        "dot_product": function(vec1, vec2) {
                            var sum = 0;
                            for (var i = 0; i < vec1.length; i++) {
                                sum += vec1[i] * vec2[i];
                            }
                            return sum;
                        },
                        "softmax": function(scores) {
                            var float_scores = sharedFloat32Array(scores.length);
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
                
                            var exp_scores = sharedFloat32Array(float_scores.length);
                            for (var i = 0; i < float_scores.length; i++) {
                                exp_scores[i] = Math.exp(float_scores[i] - max_score);
                            }
                            var sum_exp = exp_scores.reduce(function(a, b) { return a + b; }, 0);
                            if (sum_exp === 0) {
                                var equal = sharedFloat32Array(float_scores.length);
                                equal.fill(1.0 / float_scores.length);
                                return equal;
                            }
                            var probs = sharedFloat32Array(exp_scores.length);
                            for (var i = 0; i < exp_scores.length; i++) {
                                probs[i] = exp_scores[i] / sum_exp;
                            }
                            return probs;
                        },
                        "_calculate_x_hat_only": function(vector) {
                            function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }
                
                            // Replicates steps 1-6 of normalize_vector WITHOUT gamma/beta/clamping
                            // NOTE: Uses original NaN checks but doesn't increment class counters from here
                            var vector_list = sharedFloat32Array(vector.length);
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
                                return sharedFloat32Array(vector_list.length).fill(0.0);
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
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            var epsilon = 1e-8;
                            var std = Math.sqrt(variance + epsilon);
                            if (isNaN(std)) {
                                if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED in _calculate_x_hat_only: Std !!!"); }
                                // Don't increment class counters from helper
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            // Use original threshold for consistency, return 0 for x_hat if std is near zero
                            if (std < 1e-6) {
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            var x_hat = sharedFloat32Array(vector_list.length);
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
                        },
                        "nan_count_this_step": 0,
                        "nan_forward_pass_count_epoch": 0,
                        "normalize_vector": async function(vector, gamma, beta) { // Added gamma, beta params
                            // 1. Convert to Float32Array and handle NaNs in input (Keep this part)
                            function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }
                            var vector_list = sharedFloat32Array(vector.length);
                            var nan_count_before = this.nan_count_this_step; // Track NaNs before this specific call
                            for (var i = 0; i < vector.length; i++) {
                                vector_list[i] = finiteOrZero(vector[i]); // Simplified conversion
                                if (vector_list[i] === 0 && !Number.isFinite(vector[i])) { 
                                    if(this.nan_checks_enabled) {
                                        console.warn(`--- WARNING: Input vector contained NaN at index ${i} for normalize_vector ---`);
                                    }
                                    this.nan_count_this_step += 1;
                                    this.nan_forward_pass_count_epoch += 1;
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
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
                                return sharedFloat32Array(vector_list.length).fill(0.0);
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
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            // 4. Calculate Standard Deviation (with epsilon) (Keep this part)
                            var epsilon = 1e-8;
                            var std = Math.sqrt(variance + epsilon);
                            if (isNaN(std)) {
                                if(this.nan_checks_enabled) {
                                    console.error("!!! NaN DETECTED in normalize_vector: Std calculation !!!");
                                }
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            // 5. Handle near-zero std dev (Keep original return zero for simplicity)
                            if (std < 1e-6) { // Kept original threshold
                                // Returning zeros is the simplest behavior matching the original near-zero handling
                                return sharedFloat32Array(vector_list.length).fill(0.0);
                            }
                
                            // 6. Normalize: (x - mean) / std (Keep this part, result is x_hat)
                            var x_hat = sharedFloat32Array(vector_list.length);
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
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
                            }
                
                            // 7. --- NEW: Apply Gamma (Scale) and Beta (Shift) ---
                            var final_output = sharedFloat32Array(x_hat.length);
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
                                    this.nan_count_this_step += 1;
                                    this.nan_forward_pass_count_epoch += 1;
                                }
                            }
                            // --- END NEW ---
                
                            // Return the final scaled and shifted result ('y')
                            return final_output;
                        },
                        "inference": async function(context, return_cache, training_mode) {
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
                                var scaled_vector = sharedFloat32Array(vector.length);
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
                            var tokenized_input = await this.tokenize(context);
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
                                    "positional_encodings": await this.calculate_positional_encoding(input_length),
                                    "layers": [] // Initialize layers array
                                };
                            } else {
                                // Positional encodings calculated but not cached if return_cache is false
                                var positional_encodings = await this.calculate_positional_encoding(input_length);
                            }
                            var timer_inf = timer_();
                            console.log("Computing embeddings...");
                            var final_embeddings = []; // Array of Float32Arrays
                            // Embedding calculation loop remains unchanged
                            for (var pos = 0; pos < tokenized_input.length; pos++) {
                                var token = tokenized_input[pos][0];
                                var token_id = tokenized_input[pos][1];
                                var embedding = sharedFloat32Array(this.embeddingSize);
                                var stored_embedding = await this.get_embedding(token_id);
                                for(var i = 0; i < this.embeddingSize; i++) {
                                    embedding[i] = stored_embedding[i * 3];
                                }
                
                                if (return_cache) { cache["initial_embeddings"].push(sharedFloat32Array(embedding)); }
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
                                var norm1_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"normalize_1\"]"); // GAMMA
                                var norm1_biases = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"normalize_1\"]");   // BETA
                
                                for (var i = 0; i < final_embeddings.length; i++) {
                                    // --- Calculate x_hat for caching --- (NEW)
                                    var x_hat_for_cache_1 = this._calculate_x_hat_only(final_embeddings[i]);
                                    if (return_cache) {
                                        cache["layers"][layer]["norm1_x_hat"].push(sharedFloat32Array(x_hat_for_cache_1));
                                    }
                                    // --- End Calculate x_hat ---
                
                                    // --- Call modified normalize_vector --- (NEW)
                                    var final_norm1_output = await this.normalize_vector(final_embeddings[i], norm1_weights, norm1_biases);
                                    normalized_embeddings.push(final_norm1_output);
                                    // --- End Call ---
                                }
                
                                norm1_weights = null;
                                norm1_biases = null;
                                if (global.gc) global.gc();
                                // Cache the final output 'y' of Norm1
                                if (return_cache) {
                                    // This replaces the old caching logic for 'normalized'
                                    cache["layers"][layer]["normalized"] = normalized_embeddings.map(arr => sharedFloat32Array(arr));
                                }
                                // --- Normalize 1 END ---
                
                
                                // --- Attention Calculation START --- (Unchanged Logic)
                                var head_outputs = [];
                                for (var head = 0; head < this.heads; head++) {
                                    // Head internal calculations remain the same, taking normalized_embeddings (now 'y') as input
                                    var head_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "]");
                                    var head_biases = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "]");
                                    var q_vectors = []; var k_vectors = []; var v_vectors = [];
                                    var head_query_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"query\"]");
                                    var head_key_weights   = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"key\"]");
                                    var head_value_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"value\"]");
                
                                    var head_query_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"query\"]");
                                    var head_key_biases    = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"key\"]");
                                    var head_value_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"value\"]");
                
                                    // Calculate Q, K, V vectors from normalized_embeddings ('y' from norm1)
                                    for (var i = 0; i < normalized_embeddings.length; i++) {
                                        var token_embedding = normalized_embeddings[i]; // Using the 'y' output of norm1
                                        var q_vector = sharedFloat32Array(this.embeddingSize);
                                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                                            var q_sum = 0;
                                            for (var j = 0; j < this.embeddingSize; j++) { q_sum += token_embedding[j] * head_query_weights[pos * this.embeddingSize * 3 + j * 3]; }
                                            q_vector[pos] = q_sum + head_query_biases[pos * 3];
                                        }
                                        q_vectors.push(q_vector);
                                        var k_vector = sharedFloat32Array(this.embeddingSize);
                                        for (var pos = 0; pos < this.embeddingSize; pos++) {
                                            var k_sum = 0;
                                            for (var j = 0; j < this.embeddingSize; j++) { k_sum += token_embedding[j] * head_key_weights[pos * this.embeddingSize * 3 + j * 3]; }
                                            k_vector[pos] = k_sum + head_key_biases[pos * 3];
                                        }
                                        k_vectors.push(k_vector);
                                        var v_vector = sharedFloat32Array(this.embeddingSize);
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
                                        var token_scores = sharedFloat32Array(k_vectors.length);
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
                                        var final_vector = sharedFloat32Array(this.embeddingSize).fill(0);
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
                                            "q_vectors": q_vectors.map(arr => sharedFloat32Array(arr)),
                                            "k_vectors": k_vectors.map(arr => sharedFloat32Array(arr)),
                                            "v_vectors": v_vectors.map(arr => sharedFloat32Array(arr)),
                                            "attention_scores": attention_scores.map(arr => sharedFloat32Array(arr)),
                                            "attention_probs": attention_probs.map(arr => sharedFloat32Array(arr)),
                                            "output": post_attention_vectors.map(arr => sharedFloat32Array(arr))
                                        };
                                        // Ensure cache structure exists before pushing
                                        if (!cache["layers"][layer]["heads"]) cache["layers"][layer]["heads"] = [];
                                        cache["layers"][layer]["heads"].push(head_cache);
                                    }
                                    head_outputs.push(post_attention_vectors);
                
                                    head_query_weights = null;
                                    head_key_weights = null;
                                    head_value_weights = null;
                                    head_query_biases = null;
                                    head_key_biases = null;
                                    head_value_biases = null;
                                    if (global.gc) global.gc();
                                } // End head loop
                                // --- Attention Calculation END ---
                
                
                                // --- Combine Heads START --- (Unchanged Logic)
                                var combined_vectors = []; // Stores result of Attention Output projection
                                var output_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"output\"]");
                                var output_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"output\"]");
                
                                for (var token_idx = 0; token_idx < final_embeddings.length; token_idx++) { // Length matches input seq length
                                    var concatenated = sharedFloat32Array(this.embeddingSize * this.heads);
                                    var current_offset = 0;
                                    for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                                        concatenated.set(head_outputs[head_idx][token_idx], current_offset);
                                        current_offset += this.embeddingSize;
                                    }
                                    var output_vector = sharedFloat32Array(this.embeddingSize);
                                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                                        var pos_sum = 0;
                                        for (var j = 0; j < this.embeddingSize * this.heads; j++) {
                                            pos_sum += concatenated[j] * output_weights[pos * (this.embeddingSize * this.heads) * 3 + j * 3];
                                        }
                                        output_vector[pos] = pos_sum + output_biases[pos * 3];
                                    }
                                    combined_vectors.push(output_vector);
                                }
                                output_weights = null;
                                output_biases = null;
                                if (global.gc) global.gc();
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
                                    cache["layers"][layer]["combined"] = combined_vectors.map(arr => sharedFloat32Array(arr));
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
                                var norm2_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"normalize_2\"]"); // GAMMA
                                var norm2_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"normalize_2\"]");   // BETA
                
                                for (var i = 0; i < combined_vectors.length; i++) { // Input is the scaled attn_out + residual
                                    // --- Calculate x_hat for caching --- (NEW)
                                    var x_hat_for_cache_2 = this._calculate_x_hat_only(combined_vectors[i]);
                                    if (return_cache) {
                                        cache["layers"][layer]["norm2_x_hat"].push(sharedFloat32Array(x_hat_for_cache_2));
                                    }
                                    // --- End Calculate x_hat ---
                
                                    // --- Call modified normalize_vector --- (NEW)
                                    var final_norm2_output = await this.normalize_vector(combined_vectors[i], norm2_weights, norm2_biases);
                                    normalized_vectors.push(final_norm2_output);
                                    // --- End Call ---
                                }
                
                                norm2_weights = null;
                                norm2_biases = null;
                                if (global.gc) global.gc();
                                // --- Normalize 2 END ---
                                // Note: `normalized_vectors` now holds the output 'y' of Norm2
                
                
                                // --- Feed Forward Network START --- (Unchanged Logic, input is 'normalized_vectors')
                                var bigger_vectors = []; // Stores output of FFN Grow
                                var grow_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"feed_forward\"][\"grow\"]");
                                var grow_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"feed_forward\"][\"grow\"]");
                
                                // FFN Grow (Input is normalized_vectors, which is 'y' from Norm2)
                                for (var i = 0; i < normalized_vectors.length; i++) {
                                    var bigger_vector = sharedFloat32Array(this.embeddingSize * 4);
                                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                                        var sum_val = 0;
                                        for (var k = 0; k < this.embeddingSize; k++) {
                                            sum_val += normalized_vectors[i][k] * grow_weights[k * (this.embeddingSize * 4) * 3 + j * 3];
                                        }
                                        bigger_vector[j] = sum_val + grow_biases[j * 3];
                                    }
                                    bigger_vectors.push(bigger_vector);
                                }
                                if (return_cache) { cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.map(arr => sharedFloat32Array(arr)); }
                
                                // Apply ReLU (Unchanged)
                                for (var i = 0; i < bigger_vectors.length; i++) {
                                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                                        if (bigger_vectors[i][j] < 0) { bigger_vectors[i][j] = 0; }
                                    }
                                }
                                if (return_cache) { cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.map(arr => sharedFloat32Array(arr)); }
                
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
                                var shrink_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"feed_forward\"][\"shrink\"]");
                                var shrink_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"feed_forward\"][\"shrink\"]");
                                for (var i = 0; i < bigger_vectors.length; i++) {
                                    var final_vector = sharedFloat32Array(this.embeddingSize);
                                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                                        var accum = 0;
                                        for (var j = 0; j < this.embeddingSize * 4; j++) {
                                            accum += bigger_vectors[i][j] * shrink_weights[pos * (this.embeddingSize * 4) * 3 + j * 3];
                                        }
                                        final_vector[pos] = accum + shrink_biases[pos * 3];
                                    }
                                    final_vectors.push(final_vector);
                                }
                
                                grow_weights = null;
                                grow_biases = null;
                                shrink_weights = null;
                                shrink_biases = null;
                                if (global.gc) global.gc();
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
                                    cache["layers"][layer]["feed_forward"]["final"] = final_vectors.map(arr => sharedFloat32Array(arr));
                                }
                                final_embeddings = final_vectors; // Output of this layer becomes input for the next
                                console.log("Computed layer " + layer + " in " + timer_end(timer_inf) + " ms");
                            } // --- End layer loop ---
                
                            console.log("Computed layers in " + timer_end(gtimer) + " ms");
                
                            // --- Vocab Projection START --- (Unchanged Logic)
                            timer_inf = timer_();
                            console.log("Computing next token...");
                            var last_token_embedding = final_embeddings[final_embeddings.length - 1];
                            var scores = sharedFloat32Array(this.vocab.length);
                            var vocab_weights = await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]");
                            var vocab_biases  = await requestData("[\"transformer\"][\"vocab_projection\"][\"biases\"]");
                            for (var token_idx = 0; token_idx < this.vocab.length; token_idx++) {
                                var score = 0;
                                for (var pos = 0; pos < this.embeddingSize; pos++) {
                                    score += last_token_embedding[pos] * vocab_weights[token_idx * this.embeddingSize * 3 + pos * 3];
                                }
                                score += vocab_biases[token_idx * 3];
                                scores[token_idx] = score;
                            }

                            vocab_weights = null;
                            vocab_biases = null;
                            if (global.gc) global.gc();
                
                            if (return_cache && cache) {
                                cache["vocab_scores"] = sharedFloat32Array(scores);
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
                        },
                        "calculate_loss": function(predicted_scores, target_token_id) {
                            var predicted_probs = this.softmax(predicted_scores);
                            var epsilon = 0;
                            if (config["antiOverfittingOptimisations"]) {
                                epsilon = 0.1;
                            }
                            var vocab_size = this.vocab.length;
                            var target_distribution = sharedFloat32Array(vocab_size);
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
                        },
                        "initialize_zero_gradients": function(structure) {
                            if (structure instanceof Float32Array) {
                                // Return a sharedFloat32Array of the same length, filled with zeros
                                return sharedFloat32Array(structure.length).fill(0);
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
                        },
                        "add_in_place": function(target, source) {
                            if (target instanceof Float32Array && source instanceof Float32Array && target.length === source.length) {
                                // This is a leaf node containing gradient and optimizer state (m, v)
                                // We only add the gradient (index 0)
                                target[0] += source[0]; // Accumulate gradient
                                // Do NOT accumulate Adam moments (m, v) across batches
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
                        },
                        "learningRate": undefined,
                        "train_step": async function(input_tokens, target_token) {
                            while (this.learningRate === undefined){
                                await wait(1);
                            }

                            var training_mode=true;
                
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
                            var inference_result = await this.inference(input_text, true, training_mode);
                            var cache = inference_result[1]; // Cache now includes 'normX_x_hat'
                            console.log("Got inference cache in " + timer_end(timer_inf) + " ms");
                            
                            // --- Forward pass to get cache END ---
                
                            // --- Initial Loss Calculation START --- (Unchanged Logic)
                            console.log("Calculating initial loss...");
                            timer_inf = timer_();
                            var initial_loss = await this.calculate_loss(cache["vocab_scores"], target_token[1]);
                            console.log("Initial loss: " + initial_loss + " calculated in " + timer_end(timer_inf) + " ms");
                            // --- Initial Loss Calculation END ---
                
                
                            console.log("Computing gradients...");
                            var gtimer2 = timer_();
                
                            // --- Initial Error Calculation START --- (Unchanged Logic)
                            var predicted_probs = await this.softmax(cache["vocab_scores"]);
                            var epsilon_grad = 0; // Keep original epsilon setting for gradients
                            var vocab_size = this.vocab.length;
                            var target_distribution = sharedFloat32Array(vocab_size);
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
                            var initial_error = sharedFloat32Array(predicted_probs.length);
                            for (var i = 0; i < predicted_probs.length; i++) {
                                initial_error[i] = predicted_probs[i] - target_distribution[i];
                            }
                            // --- Initial Error Calculation END ---
                
                
                            // --- Vocab Projection Gradients START --- (Unchanged Logic)
                            console.log("Computing gradients for vocabulary projection parameters...");
                            var vocab_proj_weight_gradients = sharedFloat32Array((await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]")).length).fill(0);
                            var vocab_proj_bias_gradients = sharedFloat32Array((await requestData("[\"transformer\"][\"vocab_projection\"][\"biases\"]")).length).fill(0);
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
                                var arr = sharedFloat32Array(this.embeddingSize).fill(0.0);
                                error_gradients.push(arr);
                            }
                            // Calculate gradient flowing into the last layer's final output ('y')
                            var last_layer_final_output_grad = sharedFloat32Array(this.embeddingSize).fill(0.0);
                            var vocab_projection_weights = await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]");
                            for (var j = 0; j < this.embeddingSize; j++) { // Dimension index
                                for (var k = 0; k < this.vocab.length; k++) { // Vocab index
                                    // Use the weight value (index * 3)
                                    last_layer_final_output_grad[j] += initial_error[k] * vocab_projection_weights[k * this.embeddingSize * 3 + j * 3];
                                }
                            }
                            // Assign this gradient only to the last token position in the sequence
                            if (error_gradients.length > 0) {
                                error_gradients[error_gradients.length - 1] = last_layer_final_output_grad;
                            }
                            // --- Error Backpropagation from Vocab END ---
                
                
                            // --- Gradient Initializations START --- (Unchanged Logic)
                            var embedding_gradients = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0));
                            var layer_gradients = [];
                            for (var i = 0; i < this.layersAmount; i++) {
                                var layer = await requestData("[\"transformer\"][\"layers\"]" + "[" + i + "]");
                                var layer_grad = {
                                    "weights": this.initialize_zero_gradients(layer["weights"]),
                                    "biases": this.initialize_zero_gradients(layer["biases"])
                                };
                                layer_gradients.push(layer_grad);
                            }
                            // --- Gradient Initializations END ---
                
                            // --- Backpropagation Loop START ---
                            var next_grad = error_gradients; // Starts as gradient w.r.t final layer output 'y'
                
                            for (var layer_idx = this.layersAmount - 1; layer_idx >= 0; layer_idx--) {
                                var package_ = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"feed_forward\"][\"shrink\"]")
                                var layer_cache = cache["layers"][layer_idx];
                                // --- Backprop through FFN Residual START --- (Unchanged Logic)
                                // next_grad is dLoss/dFinalOutputY
                                var grad_into_ffn_shrink = next_grad; // Path back through FFN
                                var grad_into_ffn_residual = next_grad; // Path back through residual skip connection
                                // --- Backprop through FFN Residual END ---
                
                
                                // --- FFN Shrink Backprop START --- (Unchanged Logic)
                                // Input: grad_into_ffn_shrink (dLoss/dOutputY)
                                // Output: shrink_grad (dLoss/dReluOutput), calculates shrink layer param grads
                                var shrink_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize * 4).fill(0.0));
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
                                                shrink_grad[i][k] += grad_into_ffn_shrink[i][j] * package_[j * (this.embeddingSize * 4) * 3 + k * 3];
                                                layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) * 3 + k * 3] += grad_into_ffn_shrink[i][j] * after_relu_cache[k];
                                            }
                                        }
                                        // Bias gradient calculation needs correction - should sum over tokens, not reduce inside loop
                                        // Corrected bias grad calculation (example - needs verification based on original intent)
                                        // layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j * 3] += grad_into_ffn_shrink[i][j]; // Accumulate per token
                                    }
                                }
                
                                package_ = null;
                                if (global.gc) global.gc();
                
                                // Correct summation for bias gradients (after token loop)
                                for(var j = 0; j < this.embeddingSize; j++) {
                                    var bias_grad_sum = 0;
                                    for(var i = 0; i < input_tokens.length; i++) {
                                        bias_grad_sum += grad_into_ffn_shrink[i][j];
                                    }
                                    layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j*3] += bias_grad_sum;
                                }
                                // --- FFN Shrink Backprop END ---
                
                                var package_2 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"feed_forward\"][\"grow\"]")
                
                                // --- FFN Grow / ReLU Backprop START --- (Unchanged Logic)
                                // Input: shrink_grad (dLoss/dReluOutput)
                                // Output: grow_grad (dLoss/dNorm2OutputY), calculates grow layer param grads
                                var relu_grad = shrink_grad;
                                var grow_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                                            grow_grad[i][k] += relu_grad[i][j] * package_2[k * (this.embeddingSize * 4) * 3 + j * 3];
                                            // Gradient for Grow weights
                                            layer_gradients[layer_idx]["weights"]["feed_forward"]["grow"][k * (this.embeddingSize * 4) * 3 + j * 3] += relu_grad[i][j] * norm2_output_cache[k];
                                        }
                                        // Correct bias grad calculation
                                        // layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j * 3] += relu_grad[i][j]; // Accumulate per token
                                    }
                                }
                
                                package_2 = null;
                                if (global.gc) global.gc();
                
                                // Correct summation for bias gradients (after token loop)
                                for(var j = 0; j < this.embeddingSize * 4; j++) {
                                    var bias_grad_sum = 0;
                                    for(var i = 0; i < input_tokens.length; i++) {
                                        bias_grad_sum += relu_grad[i][j];
                                    }
                                    layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j*3] += bias_grad_sum;
                                }
                                // --- FFN Grow / ReLU Backprop END ---
                                var package_3 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"normalize_2\"]")
                                // --- Normalize_2 Backprop START --- (MODIFIED)
                                // Input: grow_grad (dLoss/dNorm2OutputY)
                                // Output: grad_into_norm2_input (dLoss/dNorm2Input), calculates norm2 param grads
                                var norm2_output_grad = grow_grad;
                                var grad_into_norm2_input = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm2Input
                
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
                                        var gamma2_val = package_3[j * 3];
                                        grad_into_norm2_input[i][j] = norm2_output_grad[i][j] * gamma2_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                                    }
                                }
                                // --- Normalize_2 Backprop END ---
                
                                package_3 = null;
                                if (global.gc) global.gc();
                
                                // --- Combine gradients before Norm2 START --- (MODIFIED)
                                var combined_grad_before_norm2 = []; // Gradient for the output of (Attention + Residual)
                                for(var i = 0; i < input_tokens.length; i++) {
                                    var row_grad = sharedFloat32Array(this.embeddingSize);
                                    for(var j = 0; j < this.embeddingSize; j++) {
                                        // Sum gradient from Norm2 input path and gradient from the FFN residual path
                                        row_grad[j] = grad_into_norm2_input[i][j] + grad_into_ffn_residual[i][j]; // grad w.r.t attn_out+res
                                    }
                                    combined_grad_before_norm2.push(row_grad);
                                }
                                // --- Combine gradients before Norm2 END ---
                                var package_4 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"output\"]")
                                // --- Attention Output Backprop START --- (Unchanged Logic)
                                // Input: combined_grad_before_norm2 (dLoss/dAttnOut+Res) -> only dLoss/dAttnOut matters here
                                // Output: attention_output_input_grad (dLoss/dConcatHeads), calculates attn output layer param grads
                                var attention_output_grad = combined_grad_before_norm2; // Use the combined gradient flowing into this point
                                var attention_output_input_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize * this.heads).fill(0.0));
                                // ... (Existing Attention Output backprop logic using attention_output_grad) ...
                                // ... (Calculates attention_output_input_grad and gradients for Attn Output layer params) ...
                                // Note: The `concatenated_input` used here for weight gradients should correctly come from the head outputs in the forward pass cache.
                                // Ensure layer_cache.heads[head_idx].output[i] is used correctly inside the loop.
                                for (var i = 0; i < input_tokens.length; i++) {
                                    var concatenated_input = sharedFloat32Array(this.embeddingSize * this.heads);
                                    var current_offset = 0;
                                    for(var head_idx = 0; head_idx < this.heads; head_idx++) {
                                        if (layer_cache && layer_cache.heads && layer_cache.heads[head_idx] && layer_cache.heads[head_idx].output && layer_cache.heads[head_idx].output[i]) {
                                            concatenated_input.set(layer_cache.heads[head_idx].output[i], current_offset);
                                        } else if (this.nan_checks_enabled) { console.error(`Attn Output Backprop: Missing head output cache layer ${layer_idx} head ${head_idx} token ${i}`); }
                                        current_offset += this.embeddingSize;
                                    }
                                    for (var j = 0; j < this.embeddingSize; j++) { // Output dim
                                        for (var k = 0; k < this.embeddingSize * this.heads; k++) { // Input dim
                                            attention_output_input_grad[i][k] += attention_output_grad[i][j] * package_4[(j * (this.embeddingSize * this.heads) + k) * 3];
                                            var weight_grad_delta = attention_output_grad[i][j] * concatenated_input[k];
                                            if (isNaN(weight_grad_delta) || !isFinite(weight_grad_delta)) {
                                                if(this.nan_chercks_enabled) console.error(`NaN/Inf in Attn Output Weight Grad Calc: L${layer_idx} T${i} O${j} I${k}`);
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
                
                                package_4 = null;
                                if (global.gc) global.gc();
                
                                // --- Attention Heads Backprop START --- (Unchanged Logic)
                                // Input: attention_output_input_grad (dLoss/dConcatHeads)
                                // Output: head_input_grads (dLoss/dHeadInput = dLoss/dNorm1OutputY), calculates Q/K/V layer param grads
                                var head_input_grads = Array.from({ length: this.heads }, () => Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)));
                                for (var head = 0; head < this.heads; head++) {
                                    var head_cache = (layer_cache && layer_cache.heads && layer_cache.heads[head]) ? layer_cache.heads[head] : null;
                                    if (!head_cache) {
                                        if(this.nan_checks_enabled) console.error(`Attn Head Backprop: Missing head cache layer ${layer_idx} head ${head}`);
                                        continue;
                                    }
                                    var head_grad_from_output = [];
                                    for(var i = 0; i < input_tokens.length; i++) { head_grad_from_output.push(attention_output_input_grad[i].slice(head * this.embeddingSize, (head + 1) * this.embeddingSize)); }
                
                                    // Backprop through V and attention probs
                                    var v_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
                                    var attention_prob_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(input_tokens.length).fill(0.0));
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
                                    var attention_score_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(input_tokens.length).fill(0.0));
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
                                    var q_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
                                    var k_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                                    var package_5 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"query\"]")
                                    var package_6 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"key\"]")
                                    var package_7 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"value\"]")
                
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
                                        for (var k = 0; k < this.embeddingSize; k++) { // Input dimension (output of Norm1)
                                            var grad_sum_k = 0;
                                            for (var j = 0; j < this.embeddingSize; j++) { // Output dimension
                                                grad_sum_k += q_grad[i][j] * package_5[j * this.embeddingSize * 3 + k * 3];
                                                grad_sum_k += k_grad[i][j] * package_6[j * this.embeddingSize * 3 + k * 3];
                                                grad_sum_k += v_grad[i][j] * package_7[j * this.embeddingSize * 3 + k * 3];
                                            }
                                            head_input_grads[head][i][k] = grad_sum_k; // Store dLoss/dNorm1OutputY for this head
                                        }
                                    }
                                    package_5 = null;
                                    package_6 = null;
                                    package_7 = null;
                                    if (global.gc) global.gc();
                                } // End head backprop loop
                                // --- Attention Heads Backprop END ---
                
                
                                // --- Sum head gradients START --- (Unchanged Logic)
                                var total_attention_input_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                                var grad_into_norm1_input = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm1Input
                                var package_8 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"normalize_1\"]")
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
                                        var gamma1_val = package_8[j * 3];
                                        grad_into_norm1_input[i][j] = norm1_output_grad[i][j] * gamma1_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                                    }
                                }
                                // --- Normalize_1 Backprop END ---
                
                                package_8 = null;
                                if (global.gc) global.gc();
                
                                // --- Combine gradients before Norm1 START --- (MODIFIED)
                                // Gradient flowing back to the output of the previous layer OR the initial embedding
                                var grad_into_previous_layer_output = [];
                                for(var i = 0; i < input_tokens.length; i++) {
                                    var row_grad = sharedFloat32Array(this.embeddingSize);
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
                
                            //? Changed logic to just send back gradients so its cool.
                            await gradientsFeedback({
                                embedding_grads: embedding_gradients,
                                layer_grads: layer_gradients,
                                vocab_proj: {
                                    weights: vocab_proj_weight_gradients,
                                    biases: vocab_proj_bias_gradients
                                }
                            });
                
                            return initial_loss;
                            
                            /*
                            // --- Gradient Accumulation / Application START --- (Unchanged Logic)
                            if (accumulate) {
                                // Initialize accumulators if first batch
                                if (!this.accumulated_embedding_grads) {
                                    // Initialize using original logic
                                    this.accumulated_embedding_grads = Array.from({ length: config.batchSize }, () => Array.from({ length: this.contextSize }, () => sharedFloat32Array(this.embeddingSize).fill(0)));
                                    this.accumulated_layer_grads = [];
                                    for (var i = 0; i < this.layersAmount; i++) {
                                        this.accumulated_layer_grads.push({
                                            "weights": await this.requestData("transformer[\"layers\"]" + "[" + i + "]" + "[\"weights\"]"),
                                            "biases": await this.requestData("transformer[\"layers\"]" + "[" + i + "]" + "[\"biases\"]")
                                        });
                                    }
                                    this.accumulated_vocab_grads = {
                                        "weights": new Float32Array(this.vocab.length * this.embeddingSize * 3).fill(0),
                                        "biases": new Float32Array(this.vocab.length * 3).fill(0)
                                    };
                                    this.accumulated_token_inputs = [];
                                }
                
                                // Accumulate embedding gradients
                                if (this.accumulated_token_inputs.length < config.batchSize) {
                                    // Ensure embedding_gradients structure matches expected
                                    if (embedding_gradients && embedding_gradients.length === input_tokens.length) { // Use actual input length for check
                                        // Store the calculated embedding gradients for this step/token sequence
                                        // The accumulator structure seems designed per batch item, then per token position
                                        this.accumulated_embedding_grads[this.accumulated_token_inputs.length] = embedding_gradients;
                                    } else {
                                        console.error("CRITICAL Accumulation Error: Embedding gradient structure mismatch or missing.");
                                    }
                                } else {
                                    console.error("CRITICAL Accumulation Error: Exceeded allocated batch size for embedding gradients.");
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
                                if (this.accumulated_token_inputs.length >= config.batchSize) {
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
                            */
                        }
                    }

                    ws.on("message", async function(message) {
                        var reply;
                        var binaryReplyFlag = false;
                        try {
                            reply = JSON.parse(message);
                        } catch (error) {
                            // Then its binary so we wanna skip the json stuff
                            binaryReplyFlag = true;
                        }

                        if (!binaryReplyFlag){
                            if (reply.type == "responseData") {
                                var found = false;
                                for (var i = 0; i < requests.length; i++) {
                                    if (requests[i].requestId == reply.requestId) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    console.error("Invalid response from main process: " + message);
                                    process.exit(1);
                                }
                                else{
                                    requests[i].__waitingStruct = reply.struct;
                                    requests[i].__waitingBinaryIds = decodeStruct(reply.struct);
                                    requests[i].__receivedBinaries = [];

                                    if (requests[i].__waitingBinaryIds.length === 0) {
                                        requests[i].response = recomposeStruct(reply.struct, []);
                                    }
                                }
                            } 
                            else {
                                if (reply.type == "pushDataConfirmation") {
                                    // Handle pushDataConfirmation from main process
                                    var found = false;
                                    for (var i = 0; i < requests.length; i++) {
                                        if (requests[i].requestId == reply.requestId) {
                                            found = true;
                                            requests[i].response = reply.data;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        console.error("Invalid pushDataConfirmation from main process: " + message);
                                        process.exit(1);
                                    }
                                }
                                else{
                                    if (reply.type == "gradientsFeedbackConfirmation") {
                                        // Handle gradientsFeedbackConfirmation from main process
                                        var found = false;
                                        for (var i = 0; i < requests.length; i++) {
                                            if (requests[i].requestId == reply.requestId) {
                                                found = true;
                                                requests[i].response = reply.data;
                                                break;
                                            }
                                        }
                                        if (!found) {
                                            console.error("Invalid gradientsFeedbackConfirmation from main process: " + message);
                                            process.exit(1);
                                        }
                                    }
                                    else{
                                        if (reply.type == "train_step"){
                                            try{
                                                var returns = await transformer_dynamicworker.train_step(reply.context, reply.targetOutToken);
                                                ws.send(JSON.stringify({
                                                    "type": "train_step_confirmation",
                                                    "requestId": reply.requestId,
                                                    "data": returns
                                                }));
                                            }
                                            catch(error){
                                                console.error("Error occured in train_step: " + error)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else{
                            var idstr = "";
                            for (var i = 0; i < 5; i++) {
                                idstr += String.fromCharCode(message[i]);
                            }

                            var payload = message.slice(5);

                            for (var i = 0; i < requests.length; i++) {
                                var req = requests[i];
                                if (!req.__waitingBinaryIds) continue;

                                if (req.__waitingBinaryIds.indexOf(idstr) !== -1) {
                                    req.__receivedBinaries.push(message);

                                    if (req.__receivedBinaries.length === req.__waitingBinaryIds.length) {
                                        req.response = recomposeStruct(req.__waitingStruct, req.__receivedBinaries);

                                        // Cleanup
                                        delete req.__waitingStruct;
                                        delete req.__waitingBinaryIds;
                                        delete req.__receivedBinaries;
                                    }

                                    break;
                                }
                            }
                        }
                    });

                    transformer_dynamicworker.learningRate = await requestData("[\"learningRate\"]")

                    ndprint("Trying to read vocabulary file...");
                    try {
                        transformer_dynamicworker.vocab = JSON.parse(fs.readFileSync(modelData.script_loc + "/vocabulary.json", "utf-8"));
                    } catch (e) {
                        console.log("Failed to read vocabulary file, creating error...");
                        throw new Error("Failed to read vocabulary file");
                    }
                    ndprint("Successfully read vocabulary file");
                    ndprint("Computing lookup table...");
                    transformer_dynamicworker.id_to_token = {};
                    for (var i = 0; i < transformer_dynamicworker.vocab.length; i++) {
                        var tok = transformer_dynamicworker.vocab[i];
                        transformer_dynamicworker.id_to_token[tok[1]] = tok[0];
                    }
                    ndprint("Computed lookup table");
                });

                ws.on("close", async function() {
                    console.log("Unknit bridge to main process, cause must be that main process exited.");
                    process.exit(0);
                });

                ws.on("error", async function() {
                    console.error("Unknit bridge to main process, cause must be that main process crashed.");
                    process.exit(1);
                });
            })();
        }
        catch (error){
            console.error("Uncaught error: " + error);
        }
    }
    else{
        if (mode === "SharedMemory"){
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
            console.log("SharedMemory mode selected.")
            var process = require("process")

            try{
                try{
                    var Tiktoken = require("tiktoken/lite").Tiktoken;
                }
                catch (error){
                    process.exit(1);
                }

                try{
                    var uuid = require("uuid");
                }
                catch (error){
                    process.exit(1);
                }

                var fs = require('fs');
                var cl100k_base = require('tiktoken/encoders/cl100k_base.json')
                var main = require("worker_threads").parentPort;

                var workerId = workerData.id;

                var original_console_log = function(...args){
                    main.postMessage({
                        "type": "console_log",
                        "text": args.join(" ")
                    })
                }

                console.log = function(...args) {
                    original_console_log("[" + workerId + "] ", ...args)
                }

                var original_console_error = function(...args){
                    main.postMessage({
                        "type": "console_error",
                        "text": args.join(" ")
                    })
                }

                console.error = function(...args) {
                    original_console_error("[" + workerId + "] ", ...args)
                }

                var original_console_warn = function(...args){
                    main.postMessage({
                        "type": "console_warn",
                        "text": args.join(" ")
                    })
                }

                console.warn = function(...args) {
                    original_console_warn("[" + workerId + "] ", ...args)
                }

                var original_console_debug = function(...args){
                    main.postMessage({
                        "type": "console_debug",
                        "text": args.join(" ")
                    })
                }

                console.debug = function(...args) {
                    original_console_debug("[" + workerId + "] ", ...args)
                }

                var original_console_info = function(...args){
                    main.postMessage({
                        "type": "console_info",
                        "text": args.join(" ")
                    })
                }

                console.info = function(...args) {
                    original_console_info("[" + workerId + "] ", ...args)
                }

                var ndprint = console.log

                var responses = []

                var genReqId = function(){
                    while (true){
                        var id = "";
                        for (var index = 0; index < 5; index++){
                            id += randomRangeInclusive([0, 9]);
                        }
                
                        var found_in_active_worker_responses = false;
                        // 'responses' here refers to the worker's `responses` array at line 918.
                        for (var i = 0; i < responses.length; i++){ 
                            if (responses[i].reqId == id){
                                found_in_active_worker_responses = true;
                                break;
                            }
                        }
                
                        if (!found_in_active_worker_responses){
                            return id;
                        }
                    }
                };

                var requestData;
                if (submode === "Rabbit"){
                    var requestData = async function(pathto){
                        var requestId = genReqId();
                        main.postMessage({
                            "type": "req_data",
                            "requestId": requestId,
                            "pathto": pathto
                        })
                        responses.push({
                            "reqId": requestId,
                            "response": null
                        })
                        while (true){
                            for (var index = 0; index < responses.length; index++){
                                if (responses[index].reqId === requestId){
                                    if (responses[index].response !== null){
                                        return responses[index].response;
                                    }
                                }
                            }
                            await wait(1);
                        }
                    }
                }
                else{
                    if (submode === "Turtle"){
                        var requestData = async function(pathto){
                            var walk = function(root, path) { // Define walk locally or ensure it's accessible
                                // Handle edge cases
                                if (typeof path !== "string" || path.trim() === "") {
                                return root;
                                }
                            
                                // Match parts like ["key"] or [0]
                                var matcher = /\[(?:'([^']+)'|"([^"]+)"|([0-9]+))\]/g;
                                var match;
                                var current = root;
                            
                                while ((match = matcher.exec(path)) !== null) {
                                // Get whichever capture group matched
                                var key = match[1] !== undefined
                                    ? match[1]
                                    : match[2] !== undefined
                                    ? match[2]
                                    : match[3] !== undefined
                                    ? parseInt(match[3], 10)
                                    : undefined;
                            
                                // Early-out if the key is missing
                                if (current == null || !(key in current)) {
                                    return undefined;
                                }
                            
                                current = current[key];
                                }
                            
                                return current;
                            };
        
                            return walk(workerData.data.transformer_data, pathto)
                        }
                    }
                    else{
                        console.error("Invalid submode, should be either Rabbit or Turtle.")
                        console.error("Current mode is \"" + submode + "\"")
                        process.exit(1)
                    }
                }

                var gradientsFeedback = async function(gradients, loss){
                    var requestId = genReqId();
                    main.postMessage({
                        "type": "train_step_feedback",
                        "gradients": gradients,
                        "loss": loss,
                        "requestId": requestId
                    })
                    responses.push({
                        "reqId": requestId,
                        "response": null
                    })

                    while (true){
                        for (var index = 0; index < responses.length; index++){
                            if (responses[index].reqId === requestId){
                                if (responses[index].response !== null){
                                    return responses[index].response;
                                }
                            }
                        }
                        await wait(1);
                    }
                }

                main.on("message", async function(message){
                    if (message.type === "train_step_feedback_res"){
                        for (var index_loop = 0; index_loop < responses.length; index_loop++){ // Ensure 'responses' here is the worker's local array
                            if (responses[index_loop].reqId === message.requestId){
                                responses[index_loop].response = message.response; // <<< USE message.response from main
                                break;
                            }
                        }                    
                    }
                    else{
                        if (message.type === "req_data_res"){
                            for (var index = 0; index < responses.length; index++){
                                if (responses[index].reqId === message.requestId){
                                    responses[index].response = message.response;
                                    break;
                                }
                            }
                        }
                        else{
                            if (message.type === "train_step"){
                                var returns = await transformer_dynamicworker.train_step(message.data.input, message.data.target);
                                main.postMessage({
                                    "type": "train_step_feedback_res",
                                    "requestId": message.requestId,
                                    "returns": returns
                                })
                            }
                        }
                    }
                })

                var modelData = workerData.data.modelData
                var config = {
                    "antiOverfittingOptimisations": modelData.antiOverfittingOptimisations,
                    "batchSize": modelData.batchSize
                }

                transformer_dynamicworker = {
                    "vocab": modelData.vocab,
                    "tokenize": function(text) {
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
                    },
                    "id_to_token": workerData.data.modelData.lookupTable,
                    "encoder": new Tiktoken(
                        cl100k_base.bpe_ranks,
                        { "<|endoftext|>": 100257 }, // example special token
                        cl100k_base.pat_str
                    ),
                    "calculate_positional_encoding": function(sequence_length) {
                        var positional_encodings = [];
                        for (var pos = 0; pos < sequence_length; pos++) {
                            var embedding = sharedFloat32Array(this.embeddingSize);
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
                    },
                    "embeddingSize": modelData.embeddingSize,
                    "heads": modelData.heads,
                    "layersAmount": modelData.layersAmount,
                    "contextSize": modelData.contextSize,
                    "get_embedding": async function(token_id) {
                        var vocab_idx = null;
                        for (var i = 0; i < this.vocab.length; i++) {
                            if (this.vocab[i][1] === token_id) {
                                vocab_idx = i;
                                break;
                            }
                        }
                        if (vocab_idx !== null) {
                            return await requestData("[\"transformer\"][\"embeddings\"][" + vocab_idx + "]")
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
                                return await requestData("[\"transformer\"][\"embeddings\"][" + unknown_idx + "]");
                            } else {
                                console.log("Warning: Token ID " + token_id + " not found in vocabulary, using first token as fallback");
                                return await requestData("[\"transformer\"][\"embeddings\"][0]");
                            }
                        }
                    },
                    "nan_checks_enabled": modelData.nan_checks_enabled,
                    "dot_product": function(vec1, vec2) {
                        var sum = 0;
                        for (var i = 0; i < vec1.length; i++) {
                            sum += vec1[i] * vec2[i];
                        }
                        return sum;
                    },
                    "softmax": function(scores) {
                        var float_scores = sharedFloat32Array(scores.length);
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
            
                        var exp_scores = sharedFloat32Array(float_scores.length);
                        for (var i = 0; i < float_scores.length; i++) {
                            exp_scores[i] = Math.exp(float_scores[i] - max_score);
                        }
                        var sum_exp = exp_scores.reduce(function(a, b) { return a + b; }, 0);
                        if (sum_exp === 0) {
                            var equal = sharedFloat32Array(float_scores.length);
                            equal.fill(1.0 / float_scores.length);
                            return equal;
                        }
                        var probs = sharedFloat32Array(exp_scores.length);
                        for (var i = 0; i < exp_scores.length; i++) {
                            probs[i] = exp_scores[i] / sum_exp;
                        }
                        return probs;
                    },
                    "_calculate_x_hat_only": function(vector) {
                        function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }
            
                        // Replicates steps 1-6 of normalize_vector WITHOUT gamma/beta/clamping
                        // NOTE: Uses original NaN checks but doesn't increment class counters from here
                        var vector_list = sharedFloat32Array(vector.length);
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
                            return sharedFloat32Array(vector_list.length).fill(0.0);
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
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        var epsilon = 1e-8;
                        var std = Math.sqrt(variance + epsilon);
                        if (isNaN(std)) {
                            if(this.nan_checks_enabled) { console.error("!!! NaN DETECTED in _calculate_x_hat_only: Std !!!"); }
                            // Don't increment class counters from helper
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        // Use original threshold for consistency, return 0 for x_hat if std is near zero
                        if (std < 1e-6) {
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        var x_hat = sharedFloat32Array(vector_list.length);
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
                    },
                    "nan_count_this_step": 0,
                    "nan_forward_pass_count_epoch": 0,
                    "normalize_vector": async function(vector, gamma, beta) { // Added gamma, beta params
                        // 1. Convert to Float32Array and handle NaNs in input (Keep this part)
                        function finiteOrZero(x) { return Number.isFinite(x) ? x : 0; }
                        var vector_list = sharedFloat32Array(vector.length);
                        var nan_count_before = this.nan_count_this_step; // Track NaNs before this specific call
                        for (var i = 0; i < vector.length; i++) {
                            vector_list[i] = finiteOrZero(vector[i]); // Simplified conversion
                            if (vector_list[i] === 0 && !Number.isFinite(vector[i])) { 
                                if(this.nan_checks_enabled) {
                                    console.warn(`--- WARNING: Input vector contained NaN at index ${i} for normalize_vector ---`);
                                }
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
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
                            this.nan_count_this_step += 1;
                            this.nan_forward_pass_count_epoch += 1;
                            return sharedFloat32Array(vector_list.length).fill(0.0);
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
                            this.nan_count_this_step += 1;
                            this.nan_forward_pass_count_epoch += 1;
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        // 4. Calculate Standard Deviation (with epsilon) (Keep this part)
                        var epsilon = 1e-8;
                        var std = Math.sqrt(variance + epsilon);
                        if (isNaN(std)) {
                            if(this.nan_checks_enabled) {
                                console.error("!!! NaN DETECTED in normalize_vector: Std calculation !!!");
                            }
                            this.nan_count_this_step += 1;
                            this.nan_forward_pass_count_epoch += 1;
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        // 5. Handle near-zero std dev (Keep original return zero for simplicity)
                        if (std < 1e-6) { // Kept original threshold
                            // Returning zeros is the simplest behavior matching the original near-zero handling
                            return sharedFloat32Array(vector_list.length).fill(0.0);
                        }
            
                        // 6. Normalize: (x - mean) / std (Keep this part, result is x_hat)
                        var x_hat = sharedFloat32Array(vector_list.length);
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
                            this.nan_count_this_step += 1;
                            this.nan_forward_pass_count_epoch += 1;
                        }
            
                        // 7. --- NEW: Apply Gamma (Scale) and Beta (Shift) ---
                        var final_output = sharedFloat32Array(x_hat.length);
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
                                this.nan_count_this_step += 1;
                                this.nan_forward_pass_count_epoch += 1;
                            }
                        }
                        // --- END NEW ---
            
                        // Return the final scaled and shifted result ('y')
                        return final_output;
                    },
                    "inference": async function(context, return_cache, training_mode) {
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
                            var scaled_vector = sharedFloat32Array(vector.length);
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
                        var tokenized_input = await this.tokenize(context);
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
                                "positional_encodings": await this.calculate_positional_encoding(input_length),
                                "layers": [] // Initialize layers array
                            };
                        } else {
                            // Positional encodings calculated but not cached if return_cache is false
                            var positional_encodings = await this.calculate_positional_encoding(input_length);
                        }
                        var timer_inf = timer_();
                        console.log("Computing embeddings...");
                        var final_embeddings = []; // Array of Float32Arrays
                        // Embedding calculation loop remains unchanged
                        for (var pos = 0; pos < tokenized_input.length; pos++) {
                            var token = tokenized_input[pos][0];
                            var token_id = tokenized_input[pos][1];
                            var embedding = sharedFloat32Array(this.embeddingSize);
                            var stored_embedding = await this.get_embedding(token_id);
                            for(var i = 0; i < this.embeddingSize; i++) {
                                embedding[i] = stored_embedding[i * 3];
                            }
            
                            if (return_cache) { cache["initial_embeddings"].push(sharedFloat32Array(embedding)); }
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
                            var norm1_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"normalize_1\"]"); // GAMMA
                            var norm1_biases = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"normalize_1\"]");   // BETA
            
                            for (var i = 0; i < final_embeddings.length; i++) {
                                // --- Calculate x_hat for caching --- (NEW)
                                var x_hat_for_cache_1 = this._calculate_x_hat_only(final_embeddings[i]);
                                if (return_cache) {
                                    cache["layers"][layer]["norm1_x_hat"].push(sharedFloat32Array(x_hat_for_cache_1));
                                }
                                // --- End Calculate x_hat ---
            
                                // --- Call modified normalize_vector --- (NEW)
                                var final_norm1_output = await this.normalize_vector(final_embeddings[i], norm1_weights, norm1_biases);
                                normalized_embeddings.push(final_norm1_output);
                                // --- End Call ---
                            }
            
                            norm1_weights = null;
                            norm1_biases = null;
                            if (global.gc) global.gc();
                            // Cache the final output 'y' of Norm1
                            if (return_cache) {
                                // This replaces the old caching logic for 'normalized'
                                cache["layers"][layer]["normalized"] = normalized_embeddings.map(arr => sharedFloat32Array(arr));
                            }
                            // --- Normalize 1 END ---
            
            
                            // --- Attention Calculation START --- (Unchanged Logic)
                            var head_outputs = [];
                            for (var head = 0; head < this.heads; head++) {
                                // Head internal calculations remain the same, taking normalized_embeddings (now 'y') as input
                                var head_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "]");
                                var head_biases = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "]");
                                var q_vectors = []; var k_vectors = []; var v_vectors = [];
                                var head_query_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"query\"]");
                                var head_key_weights   = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"key\"]");
                                var head_value_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"value\"]");
            
                                var head_query_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"query\"]");
                                var head_key_biases    = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"key\"]");
                                var head_value_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"heads\"][" + head + "][\"value\"]");
            
                                // Calculate Q, K, V vectors from normalized_embeddings ('y' from norm1)
                                for (var i = 0; i < normalized_embeddings.length; i++) {
                                    var token_embedding = normalized_embeddings[i]; // Using the 'y' output of norm1
                                    var q_vector = sharedFloat32Array(this.embeddingSize);
                                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                                        var q_sum = 0;
                                        for (var j = 0; j < this.embeddingSize; j++) { q_sum += token_embedding[j] * head_query_weights[pos * this.embeddingSize * 3 + j * 3]; }
                                        q_vector[pos] = q_sum + head_query_biases[pos * 3];
                                    }
                                    q_vectors.push(q_vector);
                                    var k_vector = sharedFloat32Array(this.embeddingSize);
                                    for (var pos = 0; pos < this.embeddingSize; pos++) {
                                        var k_sum = 0;
                                        for (var j = 0; j < this.embeddingSize; j++) { k_sum += token_embedding[j] * head_key_weights[pos * this.embeddingSize * 3 + j * 3]; }
                                        k_vector[pos] = k_sum + head_key_biases[pos * 3];
                                    }
                                    k_vectors.push(k_vector);
                                    var v_vector = sharedFloat32Array(this.embeddingSize);
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
                                    var token_scores = sharedFloat32Array(k_vectors.length);
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
                                    var final_vector = sharedFloat32Array(this.embeddingSize).fill(0);
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
                                        "q_vectors": q_vectors.map(arr => sharedFloat32Array(arr)),
                                        "k_vectors": k_vectors.map(arr => sharedFloat32Array(arr)),
                                        "v_vectors": v_vectors.map(arr => sharedFloat32Array(arr)),
                                        "attention_scores": attention_scores.map(arr => sharedFloat32Array(arr)),
                                        "attention_probs": attention_probs.map(arr => sharedFloat32Array(arr)),
                                        "output": post_attention_vectors.map(arr => sharedFloat32Array(arr))
                                    };
                                    // Ensure cache structure exists before pushing
                                    if (!cache["layers"][layer]["heads"]) cache["layers"][layer]["heads"] = [];
                                    cache["layers"][layer]["heads"].push(head_cache);
                                }
                                head_outputs.push(post_attention_vectors);
            
                                head_query_weights = null;
                                head_key_weights = null;
                                head_value_weights = null;
                                head_query_biases = null;
                                head_key_biases = null;
                                head_value_biases = null;
                                if (global.gc) global.gc();
                            } // End head loop
                            // --- Attention Calculation END ---
            
            
                            // --- Combine Heads START --- (Unchanged Logic)
                            var combined_vectors = []; // Stores result of Attention Output projection
                            var output_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"attention\"][\"output\"]");
                            var output_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"attention\"][\"output\"]");
            
                            for (var token_idx = 0; token_idx < final_embeddings.length; token_idx++) { // Length matches input seq length
                                var concatenated = sharedFloat32Array(this.embeddingSize * this.heads);
                                var current_offset = 0;
                                for (var head_idx = 0; head_idx < this.heads; head_idx++) {
                                    concatenated.set(head_outputs[head_idx][token_idx], current_offset);
                                    current_offset += this.embeddingSize;
                                }
                                var output_vector = sharedFloat32Array(this.embeddingSize);
                                for (var pos = 0; pos < this.embeddingSize; pos++) {
                                    var pos_sum = 0;
                                    for (var j = 0; j < this.embeddingSize * this.heads; j++) {
                                        pos_sum += concatenated[j] * output_weights[pos * (this.embeddingSize * this.heads) * 3 + j * 3];
                                    }
                                    output_vector[pos] = pos_sum + output_biases[pos * 3];
                                }
                                combined_vectors.push(output_vector);
                            }
                            output_weights = null;
                            output_biases = null;
                            if (global.gc) global.gc();
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
                                cache["layers"][layer]["combined"] = combined_vectors.map(arr => sharedFloat32Array(arr));
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
                            var norm2_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"normalize_2\"]"); // GAMMA
                            var norm2_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"normalize_2\"]");   // BETA
            
                            for (var i = 0; i < combined_vectors.length; i++) { // Input is the scaled attn_out + residual
                                // --- Calculate x_hat for caching --- (NEW)
                                var x_hat_for_cache_2 = this._calculate_x_hat_only(combined_vectors[i]);
                                if (return_cache) {
                                    cache["layers"][layer]["norm2_x_hat"].push(sharedFloat32Array(x_hat_for_cache_2));
                                }
                                // --- End Calculate x_hat ---
            
                                // --- Call modified normalize_vector --- (NEW)
                                var final_norm2_output = await this.normalize_vector(combined_vectors[i], norm2_weights, norm2_biases);
                                normalized_vectors.push(final_norm2_output);
                                // --- End Call ---
                            }
            
                            norm2_weights = null;
                            norm2_biases = null;
                            if (global.gc) global.gc();
                            // --- Normalize 2 END ---
                            // Note: `normalized_vectors` now holds the output 'y' of Norm2
            
            
                            // --- Feed Forward Network START --- (Unchanged Logic, input is 'normalized_vectors')
                            var bigger_vectors = []; // Stores output of FFN Grow
                            var grow_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"feed_forward\"][\"grow\"]");
                            var grow_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"feed_forward\"][\"grow\"]");
            
                            // FFN Grow (Input is normalized_vectors, which is 'y' from Norm2)
                            for (var i = 0; i < normalized_vectors.length; i++) {
                                var bigger_vector = sharedFloat32Array(this.embeddingSize * 4);
                                for (var j = 0; j < this.embeddingSize * 4; j++) {
                                    var sum_val = 0;
                                    for (var k = 0; k < this.embeddingSize; k++) {
                                        sum_val += normalized_vectors[i][k] * grow_weights[k * (this.embeddingSize * 4) * 3 + j * 3];
                                    }
                                    bigger_vector[j] = sum_val + grow_biases[j * 3];
                                }
                                bigger_vectors.push(bigger_vector);
                            }
                            if (return_cache) { cache["layers"][layer]["feed_forward"]["bigger"] = bigger_vectors.map(arr => sharedFloat32Array(arr)); }
            
                            // Apply ReLU (Unchanged)
                            for (var i = 0; i < bigger_vectors.length; i++) {
                                for (var j = 0; j < this.embeddingSize * 4; j++) {
                                    if (bigger_vectors[i][j] < 0) { bigger_vectors[i][j] = 0; }
                                }
                            }
                            if (return_cache) { cache["layers"][layer]["feed_forward"]["after_relu"] = bigger_vectors.map(arr => sharedFloat32Array(arr)); }
            
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
                            var shrink_weights = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"weights\"][\"feed_forward\"][\"shrink\"]");
                            var shrink_biases  = await requestData("[\"transformer\"][\"layers\"][" + layer + "][\"biases\"][\"feed_forward\"][\"shrink\"]");
                            for (var i = 0; i < bigger_vectors.length; i++) {
                                var final_vector = sharedFloat32Array(this.embeddingSize);
                                for (var pos = 0; pos < this.embeddingSize; pos++) {
                                    var accum = 0;
                                    for (var j = 0; j < this.embeddingSize * 4; j++) {
                                        accum += bigger_vectors[i][j] * shrink_weights[pos * (this.embeddingSize * 4) * 3 + j * 3];
                                    }
                                    final_vector[pos] = accum + shrink_biases[pos * 3];
                                }
                                final_vectors.push(final_vector);
                            }
            
                            grow_weights = null;
                            grow_biases = null;
                            shrink_weights = null;
                            shrink_biases = null;
                            if (global.gc) global.gc();
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
                                cache["layers"][layer]["feed_forward"]["final"] = final_vectors.map(arr => sharedFloat32Array(arr));
                            }
                            final_embeddings = final_vectors; // Output of this layer becomes input for the next
                            console.log("Computed layer " + layer + " in " + timer_end(timer_inf) + " ms");
                        } // --- End layer loop ---
            
                        console.log("Computed layers in " + timer_end(gtimer) + " ms");
            
                        // --- Vocab Projection START --- (Unchanged Logic)
                        timer_inf = timer_();
                        console.log("Computing next token...");
                        var last_token_embedding = final_embeddings[final_embeddings.length - 1];
                        var scores = sharedFloat32Array(this.vocab.length);
                        var vocab_weights = await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]");
                        var vocab_biases  = await requestData("[\"transformer\"][\"vocab_projection\"][\"biases\"]");
                        for (var token_idx = 0; token_idx < this.vocab.length; token_idx++) {
                            var score = 0;
                            for (var pos = 0; pos < this.embeddingSize; pos++) {
                                score += last_token_embedding[pos] * vocab_weights[token_idx * this.embeddingSize * 3 + pos * 3];
                            }
                            score += vocab_biases[token_idx * 3];
                            scores[token_idx] = score;
                        }
            
                        vocab_weights = null;
                        vocab_biases = null;
                        if (global.gc) global.gc();
            
                        if (return_cache && cache) {
                            cache["vocab_scores"] = sharedFloat32Array(scores);
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
                    },
                    "calculate_loss": function(predicted_scores, target_token_id) {
                        var predicted_probs = this.softmax(predicted_scores);
                        var epsilon = 0;
                        if (config["antiOverfittingOptimisations"]) {
                            epsilon = 0.1;
                        }
                        var vocab_size = this.vocab.length;
                        var target_distribution = sharedFloat32Array(vocab_size);
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
                    },
                    "initialize_zero_gradients": function(structure) {
                        if (structure instanceof Float32Array) {
                            // Return a sharedFloat32Array of the same length, filled with zeros
                            return sharedFloat32Array(structure.length).fill(0);
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
                    },
                    "add_in_place": function(target, source) {
                        if (target instanceof Float32Array && source instanceof Float32Array && target.length === source.length) {
                            // This is a leaf node containing gradient and optimizer state (m, v)
                            // We only add the gradient (index 0)
                            target[0] += source[0]; // Accumulate gradient
                            // Do NOT accumulate Adam moments (m, v) across batches
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
                    },
                    "learningRate": undefined,
                    "train_step": async function(input_tokens, target_token) {
                        // while (this.learningRate === undefined){
                        //     await wait(1);
                        // }

                        var training_mode=true;
            
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
                        var inference_result = await this.inference(input_text, true, training_mode);
                        var cache = inference_result[1]; // Cache now includes 'normX_x_hat'
                        console.log("Got inference cache in " + timer_end(timer_inf) + " ms");
                        
                        // --- Forward pass to get cache END ---
            
                        // --- Initial Loss Calculation START --- (Unchanged Logic)
                        console.log("Calculating initial loss...");
                        timer_inf = timer_();
                        var initial_loss = await this.calculate_loss(cache["vocab_scores"], target_token[1]);
                        console.log("Initial loss: " + initial_loss + " calculated in " + timer_end(timer_inf) + " ms");
                        // --- Initial Loss Calculation END ---
            
            
                        console.log("Computing gradients...");
                        var gtimer2 = timer_();
            
                        // --- Initial Error Calculation START --- (Unchanged Logic)
                        var predicted_probs = await this.softmax(cache["vocab_scores"]);
                        var epsilon_grad = 0; // Keep original epsilon setting for gradients
                        var vocab_size = this.vocab.length;
                        var target_distribution = sharedFloat32Array(vocab_size);
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
                        var initial_error = sharedFloat32Array(predicted_probs.length);
                        for (var i = 0; i < predicted_probs.length; i++) {
                            initial_error[i] = predicted_probs[i] - target_distribution[i];
                        }
                        // --- Initial Error Calculation END ---
            
            
                        // --- Vocab Projection Gradients START --- (Unchanged Logic)
                        console.log("Computing gradients for vocabulary projection parameters...");
                        var vocab_proj_weight_gradients = sharedFloat32Array((await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]")).length).fill(0);
                        var vocab_proj_bias_gradients = sharedFloat32Array((await requestData("[\"transformer\"][\"vocab_projection\"][\"biases\"]")).length).fill(0);
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
                            var arr = sharedFloat32Array(this.embeddingSize).fill(0.0);
                            error_gradients.push(arr);
                        }
                        // Calculate gradient flowing into the last layer's final output ('y')
                        var last_layer_final_output_grad = sharedFloat32Array(this.embeddingSize).fill(0.0);
                        var vocab_projection_weights = await requestData("[\"transformer\"][\"vocab_projection\"][\"weights\"]");
                        for (var j = 0; j < this.embeddingSize; j++) { // Dimension index
                            for (var k = 0; k < this.vocab.length; k++) { // Vocab index
                                // Use the weight value (index * 3)
                                last_layer_final_output_grad[j] += initial_error[k] * vocab_projection_weights[k * this.embeddingSize * 3 + j * 3];
                            }
                        }
                        // Assign this gradient only to the last token position in the sequence
                        if (error_gradients.length > 0) {
                            error_gradients[error_gradients.length - 1] = last_layer_final_output_grad;
                        }
                        // --- Error Backpropagation from Vocab END ---
            
            
                        // --- Gradient Initializations START --- (Unchanged Logic)
                        var embedding_gradients = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0));
                        var layer_gradients = [];
                        for (var i = 0; i < this.layersAmount; i++) {
                            var layer = await requestData("[\"transformer\"][\"layers\"]" + "[" + i + "]");
                            var layer_grad = {
                                "weights": this.initialize_zero_gradients(layer["weights"]),
                                "biases": this.initialize_zero_gradients(layer["biases"])
                            };
                            layer_gradients.push(layer_grad);
                        }
                        // --- Gradient Initializations END ---
            
                        // --- Backpropagation Loop START ---
                        var next_grad = error_gradients; // Starts as gradient w.r.t final layer output 'y'
            
                        for (var layer_idx = this.layersAmount - 1; layer_idx >= 0; layer_idx--) {
                            var package_ = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"feed_forward\"][\"shrink\"]")
                            var layer_cache = cache["layers"][layer_idx];
                            // --- Backprop through FFN Residual START --- (Unchanged Logic)
                            // next_grad is dLoss/dFinalOutputY
                            var grad_into_ffn_shrink = next_grad; // Path back through FFN
                            var grad_into_ffn_residual = next_grad; // Path back through residual skip connection
                            // --- Backprop through FFN Residual END ---
            
            
                            // --- FFN Shrink Backprop START --- (Unchanged Logic)
                            // Input: grad_into_ffn_shrink (dLoss/dOutputY)
                            // Output: shrink_grad (dLoss/dReluOutput), calculates shrink layer param grads
                            var shrink_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize * 4).fill(0.0));
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
                                            shrink_grad[i][k] += grad_into_ffn_shrink[i][j] * package_[j * (this.embeddingSize * 4) * 3 + k * 3];
                                            layer_gradients[layer_idx]["weights"]["feed_forward"]["shrink"][j * (this.embeddingSize * 4) * 3 + k * 3] += grad_into_ffn_shrink[i][j] * after_relu_cache[k];
                                        }
                                    }
                                    // Bias gradient calculation needs correction - should sum over tokens, not reduce inside loop
                                    // Corrected bias grad calculation (example - needs verification based on original intent)
                                    // layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j * 3] += grad_into_ffn_shrink[i][j]; // Accumulate per token
                                }
                            }
            
                            package_ = null;
                            if (global.gc) global.gc();
            
                            // Correct summation for bias gradients (after token loop)
                            for(var j = 0; j < this.embeddingSize; j++) {
                                var bias_grad_sum = 0;
                                for(var i = 0; i < input_tokens.length; i++) {
                                    bias_grad_sum += grad_into_ffn_shrink[i][j];
                                }
                                layer_gradients[layer_idx]["biases"]["feed_forward"]["shrink"][j*3] += bias_grad_sum;
                            }
                            // --- FFN Shrink Backprop END ---
            
                            var package_2 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"feed_forward\"][\"grow\"]")
            
                            // --- FFN Grow / ReLU Backprop START --- (Unchanged Logic)
                            // Input: shrink_grad (dLoss/dReluOutput)
                            // Output: grow_grad (dLoss/dNorm2OutputY), calculates grow layer param grads
                            var relu_grad = shrink_grad;
                            var grow_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                                        grow_grad[i][k] += relu_grad[i][j] * package_2[k * (this.embeddingSize * 4) * 3 + j * 3];
                                        // Gradient for Grow weights
                                        layer_gradients[layer_idx]["weights"]["feed_forward"]["grow"][k * (this.embeddingSize * 4) * 3 + j * 3] += relu_grad[i][j] * norm2_output_cache[k];
                                    }
                                    // Correct bias grad calculation
                                    // layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j * 3] += relu_grad[i][j]; // Accumulate per token
                                }
                            }
            
                            package_2 = null;
                            if (global.gc) global.gc();
            
                            // Correct summation for bias gradients (after token loop)
                            for(var j = 0; j < this.embeddingSize * 4; j++) {
                                var bias_grad_sum = 0;
                                for(var i = 0; i < input_tokens.length; i++) {
                                    bias_grad_sum += relu_grad[i][j];
                                }
                                layer_gradients[layer_idx]["biases"]["feed_forward"]["grow"][j*3] += bias_grad_sum;
                            }
                            // --- FFN Grow / ReLU Backprop END ---
                            var package_3 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"normalize_2\"]")
                            // --- Normalize_2 Backprop START --- (MODIFIED)
                            // Input: grow_grad (dLoss/dNorm2OutputY)
                            // Output: grad_into_norm2_input (dLoss/dNorm2Input), calculates norm2 param grads
                            var norm2_output_grad = grow_grad;
                            var grad_into_norm2_input = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm2Input
            
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
                                    var gamma2_val = package_3[j * 3];
                                    grad_into_norm2_input[i][j] = norm2_output_grad[i][j] * gamma2_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                                }
                            }
                            // --- Normalize_2 Backprop END ---
            
                            package_3 = null;
                            if (global.gc) global.gc();
            
                            // --- Combine gradients before Norm2 START --- (MODIFIED)
                            var combined_grad_before_norm2 = []; // Gradient for the output of (Attention + Residual)
                            for(var i = 0; i < input_tokens.length; i++) {
                                var row_grad = sharedFloat32Array(this.embeddingSize);
                                for(var j = 0; j < this.embeddingSize; j++) {
                                    // Sum gradient from Norm2 input path and gradient from the FFN residual path
                                    row_grad[j] = grad_into_norm2_input[i][j] + grad_into_ffn_residual[i][j]; // grad w.r.t attn_out+res
                                }
                                combined_grad_before_norm2.push(row_grad);
                            }
                            // --- Combine gradients before Norm2 END ---
                            var package_4 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"output\"]")
                            // --- Attention Output Backprop START --- (Unchanged Logic)
                            // Input: combined_grad_before_norm2 (dLoss/dAttnOut+Res) -> only dLoss/dAttnOut matters here
                            // Output: attention_output_input_grad (dLoss/dConcatHeads), calculates attn output layer param grads
                            var attention_output_grad = combined_grad_before_norm2; // Use the combined gradient flowing into this point
                            var attention_output_input_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize * this.heads).fill(0.0));
                            // ... (Existing Attention Output backprop logic using attention_output_grad) ...
                            // ... (Calculates attention_output_input_grad and gradients for Attn Output layer params) ...
                            // Note: The `concatenated_input` used here for weight gradients should correctly come from the head outputs in the forward pass cache.
                            // Ensure layer_cache.heads[head_idx].output[i] is used correctly inside the loop.
                            for (var i = 0; i < input_tokens.length; i++) {
                                var concatenated_input = sharedFloat32Array(this.embeddingSize * this.heads);
                                var current_offset = 0;
                                for(var head_idx = 0; head_idx < this.heads; head_idx++) {
                                    if (layer_cache && layer_cache.heads && layer_cache.heads[head_idx] && layer_cache.heads[head_idx].output && layer_cache.heads[head_idx].output[i]) {
                                        concatenated_input.set(layer_cache.heads[head_idx].output[i], current_offset);
                                    } else if (this.nan_checks_enabled) { console.error(`Attn Output Backprop: Missing head output cache layer ${layer_idx} head ${head_idx} token ${i}`); }
                                    current_offset += this.embeddingSize;
                                }
                                for (var j = 0; j < this.embeddingSize; j++) { // Output dim
                                    for (var k = 0; k < this.embeddingSize * this.heads; k++) { // Input dim
                                        attention_output_input_grad[i][k] += attention_output_grad[i][j] * package_4[(j * (this.embeddingSize * this.heads) + k) * 3];
                                        var weight_grad_delta = attention_output_grad[i][j] * concatenated_input[k];
                                        if (isNaN(weight_grad_delta) || !isFinite(weight_grad_delta)) {
                                            if(this.nan_chercks_enabled) console.error(`NaN/Inf in Attn Output Weight Grad Calc: L${layer_idx} T${i} O${j} I${k}`);
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
            
                            package_4 = null;
                            if (global.gc) global.gc();
            
                            // --- Attention Heads Backprop START --- (Unchanged Logic)
                            // Input: attention_output_input_grad (dLoss/dConcatHeads)
                            // Output: head_input_grads (dLoss/dHeadInput = dLoss/dNorm1OutputY), calculates Q/K/V layer param grads
                            var head_input_grads = Array.from({ length: this.heads }, () => Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)));
                            for (var head = 0; head < this.heads; head++) {
                                var head_cache = (layer_cache && layer_cache.heads && layer_cache.heads[head]) ? layer_cache.heads[head] : null;
                                if (!head_cache) {
                                    if(this.nan_checks_enabled) console.error(`Attn Head Backprop: Missing head cache layer ${layer_idx} head ${head}`);
                                    continue;
                                }
                                var head_grad_from_output = [];
                                for(var i = 0; i < input_tokens.length; i++) { head_grad_from_output.push(attention_output_input_grad[i].slice(head * this.embeddingSize, (head + 1) * this.embeddingSize)); }
            
                                // Backprop through V and attention probs
                                var v_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
                                var attention_prob_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(input_tokens.length).fill(0.0));
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
                                var attention_score_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(input_tokens.length).fill(0.0));
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
                                var q_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
                                var k_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                                var package_5 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"query\"]")
                                var package_6 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"key\"]")
                                var package_7 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"attention\"][\"heads\"][" + head + "][\"value\"]")
            
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
                                    for (var k = 0; k < this.embeddingSize; k++) { // Input dimension (output of Norm1)
                                        var grad_sum_k = 0;
                                        for (var j = 0; j < this.embeddingSize; j++) { // Output dimension
                                            grad_sum_k += q_grad[i][j] * package_5[j * this.embeddingSize * 3 + k * 3];
                                            grad_sum_k += k_grad[i][j] * package_6[j * this.embeddingSize * 3 + k * 3];
                                            grad_sum_k += v_grad[i][j] * package_7[j * this.embeddingSize * 3 + k * 3];
                                        }
                                        head_input_grads[head][i][k] = grad_sum_k; // Store dLoss/dNorm1OutputY for this head
                                    }
                                }
                                package_5 = null;
                                package_6 = null;
                                package_7 = null;
                                if (global.gc) global.gc();
                            } // End head backprop loop
                            // --- Attention Heads Backprop END ---
            
            
                            // --- Sum head gradients START --- (Unchanged Logic)
                            var total_attention_input_grad = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0));
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
                            var grad_into_norm1_input = Array.from({ length: input_tokens.length }, () => sharedFloat32Array(this.embeddingSize).fill(0.0)); // dLoss/dNorm1Input
                            var package_8 = await requestData("[\"transformer\"][\"layers\"][" + layer_idx + "][\"weights\"][\"normalize_1\"]")
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
                                    var gamma1_val = package_8[j * 3];
                                    grad_into_norm1_input[i][j] = norm1_output_grad[i][j] * gamma1_val; // dLoss/dInput approx = dLoss/dOutputY * gamma
                                }
                            }
                            // --- Normalize_1 Backprop END ---
            
                            package_8 = null;
                            if (global.gc) global.gc();
            
                            // --- Combine gradients before Norm1 START --- (MODIFIED)
                            // Gradient flowing back to the output of the previous layer OR the initial embedding
                            var grad_into_previous_layer_output = [];
                            for(var i = 0; i < input_tokens.length; i++) {
                                var row_grad = sharedFloat32Array(this.embeddingSize);
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
            
                        //? Changed logic to just send back gradients so its cool.
                        await gradientsFeedback({
                            embedding_grads: embedding_gradients,
                            layer_grads: layer_gradients,
                            vocab_proj: {
                                weights: vocab_proj_weight_gradients,
                                biases: vocab_proj_bias_gradients
                            }
                        }, initial_loss);
            
                        return initial_loss;
                        
                        /*
                        // --- Gradient Accumulation / Application START --- (Unchanged Logic)
                        if (accumulate) {
                            // Initialize accumulators if first batch
                            if (!this.accumulated_embedding_grads) {
                                // Initialize using original logic
                                this.accumulated_embedding_grads = Array.from({ length: config.batchSize }, () => Array.from({ length: this.contextSize }, () => new Float32Array(this.embeddingSize).fill(0)));
                                this.accumulated_layer_grads = [];
                                for (var i = 0; i < this.layersAmount; i++) {
                                    this.accumulated_layer_grads.push({
                                        "weights": await this.requestData("transformer[\"layers\"]" + "[" + i + "]" + "[\"weights\"]"),
                                        "biases": await this.requestData("transformer[\"layers\"]" + "[" + i + "]" + "[\"biases\"]")
                                    });
                                }
                                this.accumulated_vocab_grads = {
                                    "weights": new Float32Array(this.vocab.length * this.embeddingSize * 3).fill(0),
                                    "biases": new Float32Array(this.vocab.length * 3).fill(0)
                                };
                                this.accumulated_token_inputs = [];
                            }
            
                            // Accumulate embedding gradients
                            if (this.accumulated_token_inputs.length < config.batchSize) {
                                // Ensure embedding_gradients structure matches expected
                                if (embedding_gradients && embedding_gradients.length === input_tokens.length) { // Use actual input length for check
                                    // Store the calculated embedding gradients for this step/token sequence
                                    // The accumulator structure seems designed per batch item, then per token position
                                    this.accumulated_embedding_grads[this.accumulated_token_inputs.length] = embedding_gradients;
                                } else {
                                    console.error("CRITICAL Accumulation Error: Embedding gradient structure mismatch or missing.");
                                }
                            } else {
                                console.error("CRITICAL Accumulation Error: Exceeded allocated batch size for embedding gradients.");
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
                            if (this.accumulated_token_inputs.length >= config.batchSize) {
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
                        */
                    }
                }
                if (workerData.type === "train_step"){
                    await transformer_dynamicworker.train_step(workerData.data.input, workerData.data.target)
                }
            }   
            catch(error){
                console.error("Uncaught error: " + error);
                process.exit(1);
            }     
        }
        else{
            var process = require("process")
            console.error("Corrupted mode.")
            process.exit(1)
        }
    }
})()