/* Default Values */
var color = '#53121c'
var enableBuild = false;
var enableFaith = false;
var enableRes = false;
var autoBuild = [];
var autoRes = [
               { condition: { resource: "catnip", limit: 0.95 }, 	action: { craft: "wood", amount: 300 } },
               { condition: { resource: "wood", limit: 0.97 }, 		action: { craft: "beam", amount: 100 } },
               { condition: { resource: "beam", limit: 25000 },		action: { craft: "scaffold", amount: 3 } },
               { condition: { resource: "minerals", limit: 0.97 }, 	action: { craft: "slab", amount: 100 } },
               { condition: { resource: "slab", limit: 50000},		action: [ { craft: "concrate", amount: 1 },
										  { craft: "megalith", amount: 3 } ] },
               { condition: { resource: "coal", limit: 0.95 }, 		action: { craft: "steel", amount: 5 } },
               { condition: { resource: "iron", limit: 0.95 }, 		action: { craft: "plate", amount: 10 } },
               { condition: { resource: "steel", limit: 5000 }, 	action: [ { craft: "gear", amount: 3 }, 
                                                                	          { craft: "alloy", amount: 1 } ] },
               { condition: [ { resource: "ivory", limit: 1000000}, 
                              { resource: "gold", limit: 0.5 } ], 	action: { trade: 3, amount: 3 } },
               { condition: [ { resource: "titanium", limit: 0.97},
                              { resource: "gold", limit: 0.5 } ], 	action: { trade: 6, amount: 1 } },
               { condition: { resource: "furs", limit: 2500 }, 		action: { craft: "parchment", amount: 3 } },
               { condition: { resource: "parchment", limit: 2550 }, 	action: { craft: "manuscript", amount: 3 } },
               { condition: { resource: "manuscript", limit: 1500 }, 	action: { craft: "compedium", amount: 1 } },
               { condition: { resource: "compedium", limit: 500 }, 	action: { craft: "blueprint", amount: 1 } },
          ];

//Reset interval before creating new
if (typeof autoRun != "undefined") clearInterval(autoRun);
autoRun = setInterval(function() {
    var origTab = gamePage.activeTabId;

    //Star Events
    $("#gameLog").find("input").click();

    //Hunting
    var catpower = gamePage.resPool.get('manpower');
    if (catpower.value / catpower.maxValue > 0.95) {
        $("a:contains('Send hunters')").click();
    }

    //Building
    if (enableBuild && gamePage.activeTabId == 'Bonfire') {
        $('#gameContainerId .tabInner .btn span').each(function() {
            var ma = $(this).text().match(/[\w .]+\w|\d+/g);
            if (ma && ma.length >= 2 &&
                autoBuild.indexOf(ma[0]) != -1 &&
                !$(this).parent().parent().hasClass('disabled')) {
                this.click();
                gamePage.msg("Upgraded Building: " + ma[0] + " to " + (parseInt(ma[1]) + 1), "notice");
				return false;
            }
        });
    }

    //Resources
    if (enableRes) {
        for (var i = 0; i < autoRes.length; i++) {
            if (autoRes[i].enabled && checkConditions(autoRes[i].condition))
                doActions(autoRes[i].action);
        }
    }

    //Faith
    if (enableFaith) {
        var faith = gamePage.resPool.get('faith');
        if (faith.value / faith.maxValue > 0.95) {
            gamePage.activeTabId = 'Religion';
            gamePage.render();
            $(".btnContent:contains('Praise the sun')").click();
        }
    }

    if (gamePage.activeTabId != origTab) {
        gamePage.activeTabId = origTab;
        gamePage.render();
    }
}, 1000);
console.log("Kitten Bot Started");
//Some styling upgrades
$("#leftColumn")[0].style.width = "25%";
$("#rightColumn")[0].style.width = "25%";

var canCraft = function(res) {
    var p = gamePage.workshop.getCraft(res.craft).prices;
    for (var i = 0; i < p.length; i++) {
        if (gamePage.resPool.get(p[i].name).value < p[i].val * res.amount)
            return false;
    }
    return true;
};

function checkConditions(cond) {
    var check = function(con) {
        if (typeof con == "function")
            return con();
        var curRes = gamePage.resPool.get(con.resource);
        return !((con.limit <= 1 && curRes.value / curRes.maxValue <= con.limit) ||
            (con.limit > 1 && curRes.value < con.limit));
    };

    if (Array.isArray(cond)) {
        for (var i in cond)
            if (!check(cond[i]))
                return false;
        return true;
    } else
        return check(cond);
}

function doActions(acts) {
	var run = function(act) {
		if (act.craft != undefined && canCraft(act)) {
			if (act.amount == -1)
				gamePage.craftAll(act.craft);
			else
				gamePage.craft(act.craft, act.amount);
			//gamePage.msg("Crafted "+act.amount+" "+act.craft);
		} else if (act.trade != undefined) {
			var catpower = gamePage.resPool.get('manpower');
			if (catpower.value >= 50 * act.amount) {
				gamePage.activeTabId = 'Trade';
				gamePage.render();
				for (var j = 0; j < act.amount; j++)
					$("span:contains('Send caravan')")[act.trade].click();
				//gamePage.msg("Traded "+act.amount+"x with "+act.trade);
			}
		}
	};
	if (Array.isArray(acts)) {
		for (var i in acts)
			run(acts[i]);
	} else
		run(acts);
}

//Store Settings
function saveBot() {
    localStorage.setItem('enableBuild', enableBuild);
    localStorage.setItem('enableFaith', enableFaith);
    localStorage.setItem('enableRes', enableRes);
    localStorage.setItem('autoBuild', JSON.stringify(autoBuild));
    localStorage.setItem('autoRes', JSON.stringify(autoRes));
}

function loadBot() {
    enableBuild = localStorage.getItem('enableBuild') || enableBuild;
    enableFaith = localStorage.getItem('enableFaith', enableFaith) || enableFaith;
    enableRes = localStorage.getItem('enableRes', enableRes) || enableRes;
    var tmp = localStorage.getItem('autoBuild');
    if (tmp)
        autoBuild = JSON.parse(tmp);
    tmp = localStorage.getItem('autoRes');
    if (tmp)
        autoRes = JSON.parse(tmp);
}
loadBot();

//UI
$('#infoCol').remove();
$('#game').append('\
<div id="infoCol" class="column" style="margin-left: 5px; width: 300px;">\
	<div style="float: right">\
		FPS: <span id="fps">5</span>\
	</div>\
	<a href="#" onclick="updateBot()">Update</a> \
	<a id="botFF" href="#" onclick="toggleFF()">FastForward</a> \
	<br>\
	<b>AutoRes:</b> \
	<a id="toggleRes" href="#" onclick="toggleRes()">Enable</a><br>\
	<table id="autoRes"></table>\
	<hr />\
	<b>AutoBuild:</b> \
	<a id="toggleBuild" href="#" onclick="toggleBuild()">Enable</a><br>\
	<table id="autoBuild"></table>\
	<hr /> \
	<b>AutoFaith:</b> \
	<a id="toggleFaith" href="#" onclick="toggleFaith()">Enable</a><br>\
</div>');

function updateAutoRes() {
	//Some helper functions to extract the right text
    function getCon(con, val) {
        var res = '';
        if (Array.isArray(con)) {
            for (j in con) res += con[j][val] + '<br>';
            res.substr(0, res.length - 4);
        } else res = con[val];
        return res;
    }

    function getAct(act) {
        var res = '';
        if (Array.isArray(act)) {
            for (j in act) res += (act[j].craft ? act[j].craft : 'Trade: ' + act[j].trade) + '<br>';
            res.substr(0, res.length - 4);
        } else res = (act.craft ? act.craft : 'Trade: ' + act.trade);
        return res;
    }

    function canCalc(res) {
        return Array.isArray(res.action) || res.action.trade || res.condition.limit > 1;
    }
	
    var table = $("#autoRes");
    table.empty();
    table.append('<tr><th>Resource</th><th>Limit</th><th>Action</th><th>Amount</th></tr>');
    for (i in autoRes)
        table.append('<tr style="background-color: ' + (i % 2 == 0 ? '#FFF' : '#CCC') + '"><td>' +
            '<a id="resource' + i + '" href="#" onclick="enableResource(' + i + ')" style="font-weight: ' + (autoRes[i].enabled ? "bold" : "normal") + '">' +
            getCon(autoRes[i].condition, "resource") + '</a></td><td>' +
            getCon(autoRes[i].condition, "limit") + '</td><td>' +
            getAct(autoRes[i].action) + '</td><td>' +
            getCon(autoRes[i].action, "amount") + '</td>' +
            (canCalc(autoRes[i]) ? '' : '<td><a href="#" onclick="calcResource(' + i + ')" tooltip="Calculate Limit and Amount">Calc</a></td>') + '</tr>');
}

var buildings = [];
function updateAutoBuild() {
    buildings = [];
    $('#gameContainerId .tabInner .btn span').each(function() {
        var ma = $(this).text().match(/[\w .]+\w|\d+/g);
        if (!ma || ma.length < 2) return;
        buildings.push({
            name: ma[0],
            level: ma[1],
            enabled: autoBuild.indexOf(ma[0]) != -1
        });
    });

    buildings.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    var table = $("#autoBuild");
    table.empty();
    var i = 0;
    var str = '';
    for (j in buildings) {
        i++;
        if (i == 1)
            str += '<tr>';
        str += '<td><a id="building' + j + '" href="#" onclick="enableBuilding(' + j + ')" style="font-weight: ' + (buildings[j].enabled ? "bold" : "normal") + '">' + buildings[j].name + '</a></td>';
        if (i == 3) {
            str += '</tr>';
            i = 0;
        }
    }
    if (i != 0)
        str += '</tr>';
    table.append(str);
}

function updateBot() {
    updateAutoRes();
    updateAutoBuild();
    saveBot();
}
updateAutoRes();
updateAutoBuild();

// This is still experimental
function calcResource(j) {
    if (autoRes[j].condition.limit <= 1) {
        var curRes = gamePage.resPool.get(autoRes[j].condition.resource);
        var craftPrices = gamePage.workshop.getCraft(autoRes[j].action.craft).prices;
        var min = 0;
        for (i in craftPrices) {
            craftPrices[i].res = gamePage.resPool.get(craftPrices[i].name);
            am = Math.ceil((craftPrices[i].res.perTickUI * TicksPerSecond) / craftPrices[i].val);
            if (am < min || min == 0)
                min = am;
        }
        //console.log(curRes, craftPrices, min);

        autoRes[j].action.amount = min;
    }
	//TODO: Implement more scenarios

    updateAutoRes();
    saveBot();
}

// Toggle Functions
function enableResource(j) {
    autoRes[j].enabled = !autoRes[j].enabled;
    if (autoRes[j].enabled) {
        $("#resource" + j).css("font-weight", "bold");
    } else {
        $("#resource" + j).css("font-weight", "normal");
	}
    saveBot();
}

function enableBuilding(j) {
    buildings[j].enabled = !buildings[j].enabled;
    if (buildings[j].enabled) {
        $("#building" + j).css("font-weight", "bold");
        autoBuild.push(buildings[j].name);
    } else {
        $("#building" + j).css("font-weight", "normal");
        autoBuild.splice(autoBuild.indexOf(buildings[j].name), 1);
    }
    saveBot();
}

function toggleBuild() {
    enableBuild = !enableBuild;
    if (enableBuild)
        $("#toggleBuild").css("font-weight", "bold");
    else
        $("#toggleBuild").css("font-weight", "normal");
    saveBot();
}
if (enableBuild)
    $("#toggleBuild").css("font-weight", "bold");

function toggleRes() {
    enableRes = !enableRes;
    if (enableRes)
        $("#toggleRes").css("font-weight", "bold");
    else
        $("#toggleRes").css("font-weight", "normal");
    saveBot();
}
if (enableRes)
    $("#toggleRes").css("font-weight", "bold");

function toggleFaith() {
    enableFaith = !enableFaith;
    if (enableFaith)
        $("#toggleFaith").css("font-weight", "bold");
    else
        $("#toggleFaith").css("font-weight", "normal");
    saveBot();
}
if (enableFaith)
    $("#toggleFaith").css("font-weight", "bold");

//Fast Forward
var TicksPerSecond = 5;
var fps = {
    current: 0,
    counter: 0,
    last: []
};
var enableFF = false;

function _updFunc() {
    gamePage.tick();
    fps.counter++;
    if (enableFF)
        setTimeout(_updFunc, 1);
    else {
        TicksPerSecond = 5;
        fps = {
            current: 0,
            counter: 0,
            last: []
        };
        $('#fps').text(TicksPerSecond);
    }
}
//Clear timer before restarting
if (typeof fpstimer != "undefined") clearInterval(fpstimer);
var fpstimer = 0;

function toggleFF() {
    if (enableFF) {
        enableFF = false;
        clearInterval(fpstimer);
        $("#botFF").css("font-weight", "normal");
    } else {
        enableFF = true;
        fpstimer = setInterval(function() {
            if (!enableFF)
                return;
            fps.current = fps.counter;
            fps.counter = 0;
            fps.last.unshift(fps.current);
            if (fps.last.length > 30)
                fps.last.pop();
            TicksPerSecond = 0;
            for (i in fps.last)
                TicksPerSecond += fps.last[i];
            TicksPerSecond /= fps.last.length;
            $('#fps').text(Math.ceil(TicksPerSecond));
        }, 1000);
        $("#botFF").css("font-weight", "bold");
        _updFunc();
    }
}