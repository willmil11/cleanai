//Cleanai webui app.js
//

var scale = 1;
var special_scale = 1;

var container = document.getElementById("container");
var data = document.getElementById("data");
var logs = document.getElementById("logs");
var header = document.getElementsByTagName("h1")[0];
var texts = document.getElementsByTagName("p");
var subheaders = document.getElementsByTagName("h2");
var loss_evo_graph = document.getElementById("loss_evolution");
var run_info = document.getElementById("run_info")
var logs_header = document.getElementsByTagName("h2")[0]
var logs_div = document.getElementById("logs_div")
var run_info_overdiv = document.getElementById("run_info_overdiv")

var userScrolled = false;

// Detect if user scrolled away from bottom
logs.addEventListener("scroll", function () {
    var atBottom = logs.scrollTop + logs.clientHeight >= logs.scrollHeight - 10;
    userScrolled = !atBottom;
});

// Force scroll to bottom (only if user hasn't scrolled up)
function forceScroll() {
    if (!userScrolled) {
        logs.scrollTop = logs.scrollHeight;
    }
}

document.body.backgroundColor = "rgb(0, 0, 0)"
document.body.style.margin = "0px"
document.body.style.padding = "0px"
document.body.style.overflow = "hidden"
logs.style.overflow = "auto"
container.style.backgroundColor = "rgb(240, 238, 230)"
header.style.color = "rgb(20, 20, 19)"
header.style.fontFamily = "StyreneBlack"
header.style.width = "fit-content"
container.style.position = "absolute"
loss_evo_graph.style.backgroundColor = "rgb(255, 255, 255)"
logs_div.style.backgroundColor = "rgb(255, 255, 255)"
logs_div.style.width = "fit-content"
logs_div.style.height = "fit-content"
logs.style.backgroundColor = "rgb(0, 0, 0)"
logs_div.style.position = "absolute"
run_info_overdiv.style.backgroundColor = "rgb(255, 255, 255)"
run_info_overdiv.style.position = "absolute"
run_info_overdiv.style.width = "fit-content"
run_info_overdiv.style.height = "fit-content"
document.body.style.overflowX = "hidden"
logs.style.color = "white"

for (var index = 0; index < subheaders.length; index++){
    subheaders[index].style.fontFamily = "StyreneBlack"
}

for (var index = 0; index < texts.length; index++){
    texts[index].style.fontFamily = "TiemposText"
}

var loss_history = []


var lossChartInstance = null;

var updateGraph = function(loss_hist) {
    if (lossChartInstance !== null) {
        lossChartInstance.destroy();
    }

    var labels = [];
    var dataPoints = [];

    for (var i = 0; i < loss_hist.length; i++) {
        if (loss_hist[i] != null) {
            labels.push(i + 1);
            dataPoints.push(loss_hist[i]);
        }
    }

    lossChartInstance = new Chart(loss_evo_graph.getContext("2d"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Loss',
                data: dataPoints,
                borderColor: 'rgba(115, 87, 250, 1)',
                backgroundColor: 'rgba(115, 87, 250, 0.1)',
                pointBackgroundColor: 'black',
                pointRadius: 3,
                borderWidth: 2,
                tension: 0.2,
            }]
        },
        options: {
            animation: false,
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
};

var style = function(){
    container.style.width = window.innerWidth + "px";
    container.style.height = window.innerHeight + "px";

    header.style.fontSize = (window.innerWidth * window.innerHeight / 15000) * scale + "px";
    header.style.marginLeft = (window.innerWidth / 2 - header.offsetWidth / 2) + "px";

    for (var index = 0; index < subheaders.length; index++){
        subheaders[index].style.fontSize = (window.innerWidth * window.innerHeight / (15000 * 1.7)) * scale + "px";
    }

    for (var index = 0; index < texts.length; index++){
        texts[index].style.fontSize = (window.innerWidth * window.innerHeight / (15000 * 3)) * scale + "px";
    }

    loss_evo_graph.style.borderRadius = (window.innerWidth * window.innerHeight / (100000 * 0.5)) * scale + "px"
    loss_evo_graph.style.width = (2 * (window.innerHeight * window.innerWidth / (5000 * 0.6))) * scale + "px"
    loss_evo_graph.style.height = (1 * (window.innerHeight * window.innerWidth / (5000 * 0.6))) * scale + "px"
    loss_evo_graph.style.border = (window.innerHeight * window.innerWidth / (5000 * 50)) * scale + "px solid rgb(50, 50, 50)"

    loss_evo_graph.width = (2 * (window.innerHeight * window.innerWidth / (5000 * 0.6))) * scale
    loss_evo_graph.height = (1 * (window.innerHeight * window.innerWidth / (5000 * 0.6))) * scale

    run_info_overdiv.style.borderRadius = (window.innerWidth * window.innerHeight / (100000 * 0.5)) * scale + "px"
    logs_div.style.borderRadius = (window.innerWidth * window.innerHeight / (100000 * 0.5)) * scale + "px"
    logs_div.style.padding = (window.innerHeight * window.innerWidth / (100000 * 0.8)) * scale + "px"
    logs.style.borderRadius = (window.innerWidth * window.innerHeight / (100000 * 0.5)) * scale + "px"
    logs.style.height = (window.innerHeight / 1.3) * special_scale + "px"
    logs.style.width = (window.innerWidth / 2) * scale + "px"
    
    updateGraph(loss_history);

    run_info_overdiv.style.padding = (window.innerHeight * window.innerWidth / (100000 * 0.8)) * scale + "px"
    run_info_overdiv.style.marginLeft = (window.innerHeight * window.innerWidth / (100000 * 0.8)) * scale + "px"

    logs_div.style.marginLeft = (window.innerWidth - logs_div.offsetWidth - ((window.innerHeight * window.innerWidth / (100000 * 0.8)) * scale)) + "px"

    var causesOverflow = false;

    var checkOverflowRecursive = function(element) {
        // Skip checking the logs element
        if (element === logs) {
            return;
        }
        
        var originalOverflow = element.style.overflow;
        element.style.overflow = 'hidden';

        var scrollHeight = document.documentElement.scrollHeight;
        var scrollWidth = document.documentElement.scrollWidth;

        element.style.overflow = originalOverflow;

        // If scrollable after hiding overflow, it's likely due to this element
        if (scrollHeight > window.innerHeight || scrollWidth > window.innerWidth) {
            causesOverflow = true;
            return;
        }

        var children = element.children;
        for (var i = 0; i < children.length; i++) {
            checkOverflowRecursive(children[i]);
            if (causesOverflow) return;
        }
    }

    var elementCausesOverflow = function(el) {
        // Skip checking the logs element
        if (el === logs) {
            return false;
        }
        
        var clone = el.cloneNode(true);
        clone.style.position = "absolute";
        clone.style.visibility = "hidden";
        clone.style.height = "auto";
        clone.style.width = "auto";
        clone.style.maxHeight = "none";
        clone.style.maxWidth = "none";
        clone.style.overflow = "visible";

        document.body.appendChild(clone);

        var beforeH = document.documentElement.scrollHeight;
        var beforeW = document.documentElement.scrollWidth;

        el.style.display = "none";

        var afterH = document.documentElement.scrollHeight;
        var afterW = document.documentElement.scrollWidth;

        el.style.display = "";
        document.body.removeChild(clone);

        return afterH < beforeH || afterW < beforeW;
    }
    console.log("scale: " + scale + " | special_scale: " + special_scale);

    if (elementCausesOverflow(logs_div)){
        special_scale -= 0.001
        style()
        return
    }

    checkOverflowRecursive(document.body);

    if (causesOverflow){
        scale -= 0.001
        style()
    }
}

window.onresize = function() {
    scale = 1;
    special_scale = 1;
    style()
}

style()

setTimeout(function(){
    style()
    link();
}, 100)

var wait = async function(ms){
    return new Promise(function(resolve){
        setTimeout(function(){
            resolve();
        }, ms)
    })
}

var fullscreen_error = function(err){
    var error_div = document.createElement("div")
    error_div.innerHTML = `<div id="sub'">
        <h1 id="err_header">Fatal error</h1>
        <p id="err_message">${err}</p>
    </div>`
    document.body.appendChild(error_div)
    error_div.style.position = "absolute"
    error_div.style.zIndex = Infinity
    error_div.style.backgroundColor = "rgb(240, 238, 230)"
    var err_header = document.getElementById("err_header")
    var err_message = document.getElementById("err_message")
    var sub = document.getElementById("sub'")
    sub.style.backgroundColor = "rgb(255, 255, 255)"
    style = function(){
        error_div.style.width = window.innerWidth + "px"
        error_div.style.height = window.innerHeight + "px"
        
        sub.style.width = window.innerWidth / 1.7 * scale + "px"
        sub.style.height = window.innerHeight / 3.5 * scale + "px"

        sub.style.borderRadius = window.innerWidth * window.innerHeight / 10000 * 0.5 * scale + "px"

        err_header.style.fontSize = (window.innerWidth * window.innerHeight / 15000) * scale + "px";
        err_message.style.fontSize = (window.innerWidth * window.innerHeight / (15000 * 3)) * scale + "px";

        sub.style.marginLeft = window.innerWidth / 2 - sub.offsetWidth / 2 + "px"
        sub.style.marginTop = window.innerHeight / 2 - sub.offsetHeight / 2 + "px"

        var causesOverflow = false;

        var checkOverflowRecursive = function(element) {
            var originalOverflow = element.style.overflow;
            element.style.overflow = 'hidden';

            var scrollHeight = document.documentElement.scrollHeight;
            var scrollWidth = document.documentElement.scrollWidth;

            element.style.overflow = originalOverflow;

            // If scrollable after hiding overflow, it's likely due to this element
            if (scrollHeight > window.innerHeight || scrollWidth > window.innerWidth) {
                causesOverflow = true;
                return;
            }

            var children = element.children;
            for (var i = 0; i < children.length; i++) {
                checkOverflowRecursive(children[i]);
                if (causesOverflow) return;
            }
        }

        checkOverflowRecursive(document.body);

        if (causesOverflow){
            scale -= 0.001
            style()
        }
    }
    scale = 1;
    style();
    setTimeout(function(){
        style()
    }, 100)
}

var end = function(err){
    var error_div = document.createElement("div")
    error_div.innerHTML = `<div id="sub'">
        <h1 id="err_header">Terminated</h1>
        <p id="err_message">${err}</p>
    </div>`
    document.body.appendChild(error_div)
    error_div.style.position = "absolute"
    error_div.style.zIndex = Infinity
    error_div.style.backgroundColor = "rgb(240, 238, 230)"
    var err_header = document.getElementById("err_header")
    var err_message = document.getElementById("err_message")
    var sub = document.getElementById("sub'")
    sub.style.backgroundColor = "rgb(255, 255, 255)"
    style = function(){
        error_div.style.width = window.innerWidth + "px"
        error_div.style.height = window.innerHeight + "px"
        
        sub.style.width = window.innerWidth / 1.7 * scale + "px"
        sub.style.height = window.innerHeight / 3.5 * scale + "px"

        sub.style.borderRadius = window.innerWidth * window.innerHeight / 10000 * 0.5 * scale + "px"

        err_header.style.fontSize = (window.innerWidth * window.innerHeight / 15000) * scale + "px";
        err_message.style.fontSize = (window.innerWidth * window.innerHeight / (15000 * 3)) * scale + "px";

        sub.style.marginLeft = window.innerWidth / 2 - sub.offsetWidth / 2 + "px"
        sub.style.marginTop = window.innerHeight / 2 - sub.offsetHeight / 2 + "px"

        var causesOverflow = false;

        var checkOverflowRecursive = function(element) {
            var originalOverflow = element.style.overflow;
            element.style.overflow = 'hidden';

            var scrollHeight = document.documentElement.scrollHeight;
            var scrollWidth = document.documentElement.scrollWidth;

            element.style.overflow = originalOverflow;

            // If scrollable after hiding overflow, it's likely due to this element
            if (scrollHeight > window.innerHeight || scrollWidth > window.innerWidth) {
                causesOverflow = true;
                return;
            }

            var children = element.children;
            for (var i = 0; i < children.length; i++) {
                checkOverflowRecursive(children[i]);
                if (causesOverflow) return;
            }
        }

        checkOverflowRecursive(document.body);

        if (causesOverflow){
            scale -= 0.001
            style()
        }
    }
    scale = 1;
    style();
    setTimeout(function(){
        style()
    }, 100)
}

var link = async function(){
    console.log("[Linker] Ui is ready, linking to cli...") 
    var socket = new WebSocket("ws://" + window.location.href.split("://")[1].split(":")[0] + ":" + ws_port_);
    
    successful_link = false

    socket.onopen = function(){
        successful_link = true
    }

    socket.onerror = function(){
        fullscreen_error("A connection error to the cli has occured.")
    }

    socket.onclose = function(){
        end("The cli has exited.")
    }

    while (!(successful_link)){
        await wait(1)
    }

    console.log("[Linker] Link to cli was successful.")

    var n_epoch = document.getElementById("n_epoch")
    var n_batch_size = document.getElementById("n_batch_size")
    var n_lr = document.getElementById("n_lr")
    var n_loss = document.getElementById("n_loss")

    socket.onmessage = async function(event){
        var data_raw = event.data
        
        var data;
        try{
            data = JSON.parse(data_raw)
        }
        catch (error){
            console.warn("[Linker] Received corrupted data, discarding...")
            return
        }

        console.debug(JSON.stringify(data))

        if (data["type"] === "epoch_update"){
            if (!(isNaN(data["data"]["curr_epoch"]))){
                n_epoch.innerHTML = "Epoch: " + (data["data"]["curr_epoch"] + 1)
            }
            else{
                console.warn("[Linker] Corrupted data for current epoch, will not update current epoch.")
            }
            if (!(isNaN(data["data"]["curr_batch_size"]))){
                n_batch_size.innerHTML = "Batch size: " + data["data"]["curr_batch_size"]
            }
            else{
                console.warn("[Linker] Corrupted data for current batch size, will not update current batch size.")
            }
            if (!(isNaN(data["data"]["curr_lr"]))){
                n_lr.innerHTML = "Learning rate: " + data["data"]["curr_lr"]
            }
            else{
                console.warn("[Linker] Corrupted data for current learning rate, will not update current learning rate.")
            }
            if (!(isNaN(data["data"]["curr_loss"]))){
                n_loss.innerHTML = "Loss: " + data["data"]["curr_loss"]
            }
            else{
                console.warn("[Linker] Corrupted data for current loss, will not update current loss.")
            }

            loss_history = data["data"]["loss_history"]
        }
        else{
            if (data["type"] === "log"){
                logs.innerHTML = logs.innerHTML + data["data"]["log"] + "<br>"
                
                if (logs.innerHTML.split("<br>").length > 100) {
                    logs.innerHTML = logs.innerHTML
                        .split("<br>")
                        .slice(-100)
                        .join("<br>");
                }

                forceScroll()
            }
        }

        console.log("[Linker] Updating loss evo graph...")
        updateGraph(loss_history)
        console.log("[Linker] Updated loss evo graph.")
    }
}
