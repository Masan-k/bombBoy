﻿/*globals window, document, XMLHttpRequest, console, setInterval, event, Array, localStorage */
var canvas,
    ctx,
    player = null,
    skill = null,
    BLOCK_SIZE = 70,
    MAP_BLOCK,
    FIRE_UP = '0',
    FIRE_DOWN = '1',
    FIRE_RIGHT = '2',
    FIRE_LEFT = '3',
    FIRE_NONE = '9',
    
    bomsStopFireR,
    bomsStopFireL,
    bomsStopFireU,
    bomsStopFireD,
    bombsTimeCount,
    bombsFirePow,
    bombsPosX,
    bombsPosY,
    
    fireStockExpTime,
    fireStockPosX,
    fireStockPosY,
    fireStockFirePow,
    fireStockDirection,
    
    baseCount,
    isMoveUp = false,
    isMoveDown = false,
    isMoveLeft = false,
    isMoveRight = false,
    isBombPut = false,
    KEY_CODE_LEFT = 37,
    KEY_CODE_UP = 38,
    KEY_CODE_RIGHT = 39,
    KEY_CODE_DOWN = 40,
    
    
    TIME_BOM_ERACE = 177,
    TIME_BOM_EXP = 145,
    TIME_PL_STOP = 79,
    
    cmbMap,
    jsonObjStage = null,
    jsonObjSkill,
    isStart = false,
    startDate,
    btnStart,
    btnReset,
    gameStatus,
    lblGameStatus, // init,selectStage,run,end
    lblYourBestTime,
    lblYourTime,
    lblStageStatus,
    lblStageBestTime,
    lblStageNormalTime,
    lblHint,
    lblSkillName,
    lblPlayerName,
    prgSkill,
    
    LOCAL_ST_KEY = 'BOMBOY';

var Skill = function (skillName, recastTime, invicibleTime) {
    "use strict";
    //this.player = "urushi";
    this.skillName = skillName;
    this.recastTime = recastTime;
    this.invicibleTime = invicibleTime;
    
    this.recastCount = -1;
    this.invicibleCount = -1;
    this.isValid = null;
    this.isRecasting = null;
};

Skill.prototype.init = function () {
    "use strict";
    
    this.recastCount = this.recastTime;
    this.invicibleCount = 0;
            
    this.isValid = true;
    this.isRecasting = false;
};

var Player = function (x, y, bombs, firePower, speed, name) {
    "use strict";
    
    var PLAYER_WIDTH = 30,
        PLAYER_HEIGHT = 30;
    
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.bombs = bombs;
    this.firePower = firePower;
    this.speed = speed;
    this.name = name;
    
    this.x = x;
    this.y = y;
    
    this.status = '0';
    this.stopCount = '0';
};


Player.prototype.getMapX = function () {
    "use strict";
    return parseInt(player.x / BLOCK_SIZE, 10);
};

Player.prototype.getMapY = function () {
    "use strict";
    return parseInt(player.y / BLOCK_SIZE, 10);
};

Player.prototype.draw = function () {
    "use strict";
    
    switch (player.status) {
    case 'ss':
        ctx.fillStyle = 'rgb(255,0,0)';
        player.stopCount += 1;
        break;
        
    case 'ws':
        ctx.fillStyle = 'rgb(255,0,255)';
        player.stopCount += 1;
        break;
            
    case '0':
        ctx.fillStyle = 'rgb(234, 182, 156)';
        break;
            
    case 'tu1':
        ctx.fillStyle = 'rgb(0, 0, 0)';
        break;
            
    case 'g':
        ctx.fillStyle = 'rgb(255, 255, 0)';
        break;
                
    }
    
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
};

Player.prototype.set = function () {
    "use strict";
    
    var fs,
        status = [],
        firePow = [],
        r,
        minFirePow = 99,
        minStatus;

    if (player.status === 'ss') {
        if (player.stopCount === TIME_PL_STOP * 2) {
            player.status = '0';
            player.stopCount = 0;
        }
    } else if (player.status === 'ws') {
        if (player.stopCount === TIME_PL_STOP) {
            player.status = '0';
            player.stopCount = 0;
        }
    }
    
    if (MAP_BLOCK[player.getMapY()][player.getMapX()] === 'f' && player.status === '0') {
        player.stopCount = 0;

        for (fs = 0; fs < fireStockExpTime.length; fs += 1) {
            
            if (player.getMapX() === fireStockPosX[fs] && player.getMapY() === fireStockPosY[fs]) {
                
                if (player.status !== 'tu1') {
                    if (fireStockFirePow[fs] === 0 || fireStockFirePow[fs] === 1) {
                        status.push('ss');
                    } else {
                        status.push('ws');
                    }
                    firePow.push(fireStockFirePow[fs]);
                }
            }
        }
        for (r = 0; r < firePow.length; r += 1) {
            
            if (firePow[r] < minFirePow) {
                minFirePow = firePow[r];
                minStatus = status[r];
            }
        }
        player.status = minStatus;
    }
    
    if (skill === null) { return false; }
    if (player.status === 'tu1') {
        if (skill.invicibleCount > skill.invicibleTime) {
            player.status = '0';
            skill.isRecasting = true;
            skill.recastCount = 0;
        } else {
            skill.invicibleCount += 1;
        }
    }
    
    if (skill.isRecasting === true && skill.recastCount > skill.recastTime) {
        skill.isRecasting = false;
        skill.isValid = true;
    } else {
        skill.recastCount += 1;
    }
    
    prgSkill.value = skill.recastCount;
    
};
Player.prototype.getMoveWidth = function () {
    "use strict";
    
    var speedUpBase = 0.28,
        speedBase = 2.75;
    
    return speedBase + player.speed * speedUpBase;
    
};

function setStage() {
    "use strict";
    var i, option_add;
    
    option_add = document.createElement("option");
    option_add.value = '-';
    option_add.text = '-';
    cmbMap.appendChild(option_add);
    
    for (i = 0; i < jsonObjStage.stage.length; i += 1) {
        option_add = document.createElement("option");
        option_add.value = jsonObjStage.stage[i].code;
        option_add.text = jsonObjStage.stage[i].code;
        cmbMap.appendChild(option_add);
    }
    
}

function clearCanvas() {
    "use strict";
    var CANVAS_MAX_WIDTH = 1000,
        CANVAS_MAX_HEIGHT = 1000;

    ctx.clearRect(0, 0, CANVAS_MAX_WIDTH, CANVAS_MAX_HEIGHT);
}

function initStageVariable() {
    "use strict";
    isStart = false;
    
    lblYourBestTime.innerText = 'none';
    lblYourTime.innerText = '00:00:00.00';

    lblStageStatus.innerText = 'none';
    lblStageBestTime.innerText = 'none';
    lblStageNormalTime.innerText = 'none';
    lblHint.innerText = 'none';
        
    lblStageStatus.innerText = 'none';
    lblStageBestTime.innerText = 'none';
    lblStageNormalTime.innerText = 'none';
    lblHint.innerText = 'none';
    
    lblSkillName.innerText = 'none';
    lblPlayerName.innerText = 'none';
    prgSkill.value = "0";
    prgSkill.max = "0";
    
    isMoveUp = false;
    isMoveDown = false;
    isMoveLeft = false;
    isMoveRight = false;
    isBombPut = false;
    
    bomsStopFireR = [];
    bomsStopFireL = [];
    bomsStopFireU = [];
    bomsStopFireD = [];
    bombsTimeCount = [];
    bombsFirePow = [];
    bombsPosX = [];
    bombsPosY = [];
    
    fireStockExpTime = [];
    fireStockPosX = [];
    fireStockPosY = [];
    fireStockFirePow = [];
    fireStockDirection = [];
    
}
function init() {
    "use strict";
    clearCanvas();
    
    lblGameStatus.innerText = 'Waiting for stage selection';
    cmbMap.options[0].selected = true;
    btnStart.disabled = true;
    
    MAP_BLOCK = null;
    player = null;
    skill = null;
    
    initStageVariable();
}

function loadFileSkill() {
    "use strict";

    var requestURL = 'https://masan-k.github.io/bombBoy/skill.json',
        request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    
    request.onload = function () {
        jsonObjSkill = request.response;
        
        var key;

        for (key in jsonObjSkill) {
            if (jsonObjSkill.hasOwnProperty(key)) {
                if (player.name === key) {
                    skill = new Skill(jsonObjSkill[key][0].skillName, jsonObjSkill[key][0].recastTime, jsonObjSkill[key][0].invicibleTime);
                }
            }
        }
        
        if (skill !== null) {
            skill.init();

            lblSkillName.innerText = skill.skillName + " : ";
            prgSkill.max = skill.recastTime;
            prgSkill.value = skill.recastTime;

        } else {
            lblSkillName.innerText = 'none';
            prgSkill.max = "0";
            prgSkill.value = "0";
            
        }
    };
}

function loadFileStage() {
    "use strict";

    var requestURL = 'https://masan-k.github.io/bombBoy/stage.json',
        request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    
    request.onload = function () {
        jsonObjStage = request.response;
        setStage();
        init();
    };
}

function getMapCode(x, y) {
    'use strict';
    var mapX, mapY;
    mapX = parseInt(x / BLOCK_SIZE, 10);
    mapY = parseInt(y / BLOCK_SIZE, 10);
    return MAP_BLOCK[mapY][mapX];
}

function isMoveStop(mapCode) {
    'use strict';
    if (mapCode === '0' || mapCode === '1' || mapCode === 'f' || mapCode === 'g') {
        return false;
    } else {
        return true;
    }
}


function inputKeyUp() {
    "use strict";

    if (gameStatus !== 'run') { return false; }

    if (event.keyCode === KEY_CODE_LEFT) {isMoveLeft = false; }
    if (event.keyCode === KEY_CODE_UP) {isMoveUp = false; }
    if (event.keyCode === KEY_CODE_RIGHT) {isMoveRight = false; }
    if (event.keyCode === KEY_CODE_DOWN) {isMoveDown = false; }
}

function inputKey() {
    "use strict";
    
    var newMapX,
        newMapY,
        newX,
        newY,
        mapCodeX,
        mapCodeY;
    
    if (player.status === 'ss' || player.status === 'ws') { return false; }
    if (getMapCode(player.x, player.y) === 'g') { return false; }
        
    newX = player.x;
    newY = player.y;

    if (isMoveLeft) {newX -= player.getMoveWidth(); }
    if (isMoveUp) {newY -= player.getMoveWidth(); }
    if (isMoveRight) {newX += player.getMoveWidth(); }
    if (isMoveDown) {newY += player.getMoveWidth(); }
        
    if (isBombPut) {
        
        isBombPut = false;

        if (MAP_BLOCK[player.getMapY()][player.getMapX()] !== 'b' && player.bombs > bombsTimeCount.length) {
            
            if (MAP_BLOCK[player.getMapY()][player.getMapX()] === 'f') {
                MAP_BLOCK[player.getMapY()][player.getMapX()] = 'bf';
            } else {
                MAP_BLOCK[player.getMapY()][player.getMapX()] = 'b';
            }
        
            bombsTimeCount.push(0);
            bombsFirePow.push(player.firePower);
            bombsPosX.push(player.getMapX());
            bombsPosY.push(player.getMapY());
                
            bomsStopFireR.push(false);
            bomsStopFireL.push(false);
            bomsStopFireU.push(false);
            bomsStopFireD.push(false);
        }
    }
    
    newMapX = parseInt(newX / BLOCK_SIZE, 10);
    newMapY = parseInt(newY / BLOCK_SIZE, 10);
    
    if (player.getMapX() === newMapX && player.getMapY() === newMapY) {
        player.x = newX;
        player.y = newY;
    
    } else {
        mapCodeX = getMapCode(newX, player.y);
        if (isMoveStop(mapCodeX) === false) { player.x = newX; }
        mapCodeY = getMapCode(player.x, newY);
        if (isMoveStop(mapCodeY) === false) { player.y = newY; }
    }
}
function drawLine() {
    "use strict";
    
    var y, x;
    
    ctx.lineWidth = '0.1';
    for (y = 0; y <= MAP_BLOCK.length; y += 1) {
        
        ctx.beginPath();
        ctx.lineTo(0, y * BLOCK_SIZE);
        ctx.lineTo(MAP_BLOCK[0].length * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.closePath();
        
        ctx.stroke();
    }
    
    for (x = 0; x <= MAP_BLOCK[0].length; x += 1) {
    
        ctx.beginPath();
        ctx.lineTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, MAP_BLOCK.length * BLOCK_SIZE);
        ctx.closePath();
    
        ctx.stroke();

    }

}

function clearBombs(bomNum) {
    'use strict';
    
    bombsTimeCount.splice(bomNum, 1);
    bombsFirePow.splice(bomNum, 1);
    bombsPosX.splice(bomNum, 1);
    bombsPosY.splice(bomNum, 1);
    
    bomsStopFireR.splice(bomNum, 1);
    bomsStopFireL.splice(bomNum, 1);
    bomsStopFireU.splice(bomNum, 1);
    bomsStopFireD.splice(bomNum, 1);
    
}

function drawBom(y, x) {
    "use strict";
    
    var bombMinSize = 50,
        bombMinTime = TIME_BOM_EXP / 5, //29
        b,
        division,
        surplus,
        bombSize,
        bomTime,
        bomSizeFrame;
    
    for (b = 0; b < bombsTimeCount.length; b += 1) {
        if (bombsPosX[b] === x && bombsPosY[b] === y) {
            bomTime = bombsTimeCount[b];
        }
    }
    
    bomSizeFrame = (BLOCK_SIZE - bombMinSize) / 62.5;

    division = parseInt(bomTime / bombMinTime, 10);
    surplus = bomTime % bombMinTime;
    
    if (division === 0) {
        bombSize = BLOCK_SIZE - (surplus * bomSizeFrame);

    } else if (division % 2 === 0) {
        bombSize = BLOCK_SIZE - (surplus * bomSizeFrame);

    } else {
        bombSize = BLOCK_SIZE - (bomSizeFrame * bombMinTime)  + (surplus * bomSizeFrame);
    }
    
    ctx.beginPath();
    ctx.arc(x * BLOCK_SIZE + BLOCK_SIZE / 2,
            y * BLOCK_SIZE + BLOCK_SIZE / 2,
            bombSize / 2, 0, 360 * Math.PI / 180, false);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgb(0, 0, 255)";
    ctx.fill();
}

function setFireStock(y, x, fireMode, bomNum, isStopFire, fireNum) {
    "use strict";
    
    if (x < 0 || x >= MAP_BLOCK[0].length  || y < 0 || y >= MAP_BLOCK.length) { return false; }
    
    if (MAP_BLOCK[y][x] === 'h' || MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'g' || MAP_BLOCK[y][x] === 'sfd' || MAP_BLOCK[y][x] === 'sfu' || MAP_BLOCK[y][x] === 'sfl' || MAP_BLOCK[y][x] === 'sfr') {

        if ((MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'sfd' || MAP_BLOCK[y][x] === 'sfu' || MAP_BLOCK[y][x] === 'sfl' || MAP_BLOCK[y][x] === 'sfr') && isStopFire === false) {
            fireStockExpTime.push(baseCount + fireNum);
            fireStockPosX.push(x);
            fireStockPosY.push(y);
            fireStockFirePow.push(fireNum);
            fireStockDirection.push(fireMode);
        }
        
        switch (fireMode) {
        case FIRE_DOWN:
            if (MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'sfd' || MAP_BLOCK[y][x] === 'h') { bomsStopFireD[bomNum] = true; }
            break;
        
        case FIRE_UP:
            if (MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'sfu' || MAP_BLOCK[y][x] === 'h') { bomsStopFireU[bomNum] = true; }
            break;
                
        case FIRE_LEFT:
            if (MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'sfl' || MAP_BLOCK[y][x] === 'h') { bomsStopFireL[bomNum] = true; }
            break;
            
        case FIRE_RIGHT:
            if (MAP_BLOCK[y][x] === 's' || MAP_BLOCK[y][x] === 'sfr' || MAP_BLOCK[y][x] === 'h') { bomsStopFireR[bomNum] = true; }
            break;
                
        default:
            gameStatus = 'end';
            lblGameStatus.innerText = 'FIRE MODE ERROR';
            throw 'FIRE MODE LOAD ERROR!';
        }
        
    } else if (isStopFire === false) {
        fireStockExpTime.push(baseCount + fireNum);
        fireStockPosX.push(x);
        fireStockPosY.push(y);
        fireStockFirePow.push(fireNum);
        fireStockDirection.push(fireMode);
    }
    
}

function setFire(bomNum) {
    "use strict";
    var f;
    for (f = 1; f <= bombsFirePow[bomNum]; f += 1) {
        
        fireStockExpTime.push(baseCount);
        fireStockPosX.push(bombsPosX[bomNum]);
        fireStockPosY.push(bombsPosY[bomNum]);
        fireStockFirePow.push(0);
        fireStockDirection.push(FIRE_NONE);
        
        setFireStock(bombsPosY[bomNum], bombsPosX[bomNum] + f, FIRE_RIGHT, bomNum, bomsStopFireR[bomNum], f);
        setFireStock(bombsPosY[bomNum], bombsPosX[bomNum] - f, FIRE_LEFT, bomNum, bomsStopFireL[bomNum], f);
        setFireStock(bombsPosY[bomNum] + f, bombsPosX[bomNum], FIRE_DOWN, bomNum, bomsStopFireD[bomNum], f);
        setFireStock(bombsPosY[bomNum] - f, bombsPosX[bomNum], FIRE_UP, bomNum, bomsStopFireU[bomNum], f);
    }

    clearBombs(bomNum);
}
function setBestTime() {
    'use strict';
    lblGameStatus.innerText = 'Clear !!!BEST TIME!!!';
    lblYourBestTime.innerText = lblYourTime.innerText;
    localStorage.setItem(LOCAL_ST_KEY + cmbMap.value, lblYourTime.innerText);
}
function main() {
    'use strict';
    
    var x, y, fs, b, c,
        fireClearTime = [],
        fireClearPosX = [],
        fireClearPosY = [],
        bestTimeString,
        bestTimeDate,
        timeDate;
    
    if (jsonObjStage === null) { return false; }
    if (MAP_BLOCK === null) { return false; }
    if (gameStatus === 'end') { return false; }
   
    if (canvas.getContext) {
        
        inputKey();
        
        clearCanvas();
        
        baseCount += 1;
        for (y = 0; y < MAP_BLOCK.length; y += 1) {
            for (x = 0; x < MAP_BLOCK[y].length; x += 1) {
                switch (MAP_BLOCK[y][x]) {
                case '1':
                    ctx.fillStyle = 'rgb(230, 230, 230)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    break;
                        
                case 'g':
                    ctx.fillStyle = 'rgb(0, 255, 0)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    break;
                    
                case 'h':
                    ctx.fillStyle = 'rgb(0, 0, 0)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    break;
                        
                case 's':
                    ctx.fillStyle = 'rgb(255, 0, 0)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    break;

                case '0':
                    ctx.fillStyle = 'rgb(255, 255, 255)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    break;

                case 'sfu':
                case 'sfd':
                case 'sfr':
                case 'sfl':
                case 'b':
                case 'f':
                    break;
                        
                default:
                    gameStatus = 'end';
                    lblGameStatus.innerText = 'MAP LOAD ERROR';
                    throw 'MAP_BLOCK LOAD ERROR!';
                }
            }
        }
        
        for (b = 0; b < bombsTimeCount.length; b += 1) {
            bombsTimeCount[b] += 1;
            if (bombsTimeCount[b] === TIME_BOM_EXP || MAP_BLOCK[bombsPosY[b]][bombsPosX[b]] === 'bf') {
                setFire(b);
            }
        }
        
        for (fs = 0; fs < fireStockExpTime.length; fs += 1) {
            if (baseCount === fireStockExpTime[fs]) {
                if (MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] === 's') {
                    switch (fireStockDirection[fs]) {
                    case FIRE_DOWN:
                        MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = 'sfd';
                        break;
                            
                    case FIRE_UP:
                        MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = 'sfu';
                        break;
                            
                    case FIRE_LEFT:
                        MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = 'sfl';
                        break;

                    case FIRE_RIGHT:
                        MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = 'sfr';
                        break;
                    }
                    
                } else {
                    MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = 'f';
                }

            }
            
            if (baseCount === fireStockExpTime[fs] + (TIME_BOM_ERACE - TIME_BOM_EXP) - 1) {
                
                MAP_BLOCK[fireStockPosY[fs]][fireStockPosX[fs]] = '0';
                
                fireClearTime.push(fireStockExpTime[fs]);
                fireClearPosX.push(fireStockPosX[fs]);
                fireClearPosY.push(fireStockPosY[fs]);
            }
        }

        player.set();
        
        for (b = 0; b < bombsTimeCount.length; b += 1) {
            if (MAP_BLOCK[bombsPosY[b]][bombsPosX[b]] === 'f') {
                setFire(b);
            }
        }
        
        for (fs = fireStockExpTime.length - 1; fs >= 0; fs -= 1) {
            for (c = fireClearTime.length - 1; c >= 0; c -= 1) {
                
                if (fireStockExpTime[fs] === fireClearTime[c] &&
                        fireStockPosX[fs] === fireClearPosX[c] &&
                        fireStockPosY[fs] === fireClearPosY[c]) {
                    
                    fireStockExpTime.splice(fs, 1);
                    fireStockPosX.splice(fs, 1);
                    fireStockPosY.splice(fs, 1);
                    fireStockFirePow.splice(fs, 1);
                    fireStockDirection.splice(fs, 1);
                    
                    fireClearTime.splice(c, 1);
                    fireClearPosX.splice(c, 1);
                    fireClearPosY.splice(c, 1);
                }
            }
        }
        
        for (y = 0; y < MAP_BLOCK.length; y += 1) {
            for (x = 0; x < MAP_BLOCK[y].length; x += 1) {
                if (MAP_BLOCK[y][x] === 'b') {
                    drawBom(y, x);
                }
                
                if (MAP_BLOCK[y][x] === 'f' || MAP_BLOCK[y][x] === 'sfd' || MAP_BLOCK[y][x] === 'sfu' || MAP_BLOCK[y][x] === 'sfl' || MAP_BLOCK[y][x] === 'sfr') {
                    ctx.fillStyle = 'rgb(0, 255, 255)';
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    
        if (MAP_BLOCK[player.getMapY()][player.getMapX()] === 'g') {
            
            player.status = 'g';
            gameStatus = 'end';
            isStart = false;
            
            if (localStorage.getItem(LOCAL_ST_KEY + cmbMap.value)) {
                
                bestTimeString = localStorage.getItem(LOCAL_ST_KEY + cmbMap.value);
                // hh:mm:ss.sm
                // 01234567890
                bestTimeDate = new Date(2000, 1, 1,
                                        parseInt(bestTimeString.substr(0, 2), 10),
                                        parseInt(bestTimeString.substr(3, 2), 10),
                                        parseInt(bestTimeString.substr(6, 5), 10));
                
                timeDate = new Date(2000, 1, 1,
                                   parseInt(lblYourTime.innerText.substr(0, 2), 10),
                                   parseInt(lblYourTime.innerText.substr(3, 2), 10),
                                   parseInt(lblYourTime.innerText.substr(6, 5), 10));
                
                if (bestTimeDate.getTime() > timeDate.getTime()) {
                    setBestTime();
                    
                } else {
                    lblGameStatus.innerText = 'Clear!!!';
                }
                
            } else {
                setBestTime();
            }
        }
        
        player.draw();
        drawLine();
    }
}

function setStageData() {
    'use strict';
    var y, x, playerX, playerY, i, bomb, speed, firePower, playerName;
        
    for (y = 0; y < MAP_BLOCK.length; y += 1) {
        for (x = 0; x < MAP_BLOCK[y].length; x += 1) {
            if (MAP_BLOCK[y][x] === '1') {
                playerX = x * BLOCK_SIZE + BLOCK_SIZE / 2;
                playerY = y * BLOCK_SIZE + BLOCK_SIZE / 2;
            }
        }
    }
    
    for (i = 0; i < jsonObjStage.stage.length; i += 1) {
        if (jsonObjStage.stage[i].code === cmbMap.value) {
            
            bomb = jsonObjStage.stage[i].bomb;
            firePower = jsonObjStage.stage[i].firePower;
            speed = jsonObjStage.stage[i].speed;
            playerName = jsonObjStage.stage[i].playerName;

            player = new Player(playerX, playerY, bomb, firePower, speed, playerName);
                        
            lblStageStatus.innerText = bomb + ',' + firePower + ',' + speed;
            lblStageBestTime.innerText = jsonObjStage.stage[i].bestTime;
            lblStageNormalTime.innerText = jsonObjStage.stage[i].normalTime;
            lblHint.innerText = jsonObjStage.stage[i].hint;
            lblPlayerName.innerText = playerName;
        }
    }
}

function setMapBlock() {
    "use strict";
    var map = null, i, j, k;
           
    for (i = 0; i < jsonObjStage.stage.length; i += 1) {
        if (jsonObjStage.stage[i].code === cmbMap.value) {
            map = jsonObjStage.stage[i].map;
        }
    }

    if (map === null) { return false; }
    
    MAP_BLOCK = [map.length];
    
    for (i = 0; i < map.length; i += 1) {
        MAP_BLOCK[i] = [map[i].length];
    }
    
    for (j = 0; j < map.length; j += 1) {
        for (k = 0; k < map[j].length; k += 1) {
            MAP_BLOCK[j][k] = map[j].charAt(k);
        }
    }
}
function setUserTime() {
    'use strict';
    var stageTime;
        
    if (localStorage.getItem(LOCAL_ST_KEY + cmbMap.value)) {
        stageTime = localStorage.getItem(LOCAL_ST_KEY + cmbMap.value);
    } else {
        stageTime = 'none';
    }
    lblYourBestTime.innerText = stageTime;
}
function changeStage() {
    'use strict';
    if (setMapBlock() === false) { init(); }
    
    if (cmbMap.value === '-') {
        gameStatus = 'init';
        init();
        
    } else {
        gameStatus = 'selectStage';
        initStageVariable();
        
        setStageData();
        loadFileSkill();
        setUserTime();
                        
        btnStart.disabled = false;
        btnStart.focus();
        lblGameStatus.innerText = 'Waiting for start';
        
    }
}

function showTime() {
    'use strict';
    var miliSecond,
        second,
        minute,
        nowDate,
        hour,
        stopWatchTime;

    if (isStart === true) {
        
        nowDate = new Date();
        stopWatchTime = nowDate.getTime() - startDate.getTime();
        
        miliSecond = Math.floor(stopWatchTime / 10) % 60;
        miliSecond = ('0' + miliSecond).slice(-2);
        
        second = Math.floor(stopWatchTime / 1000) % 60;
        second = ('0' + second).slice(-2);
        
        minute = Math.floor(stopWatchTime / 1000 / 60) % 60;
        minute = ('0' + minute).slice(-2);
        
        hour = Math.floor(stopWatchTime / 1000 / 60 / 60) % 60;
        hour = ('0' + hour).slice(-2);
        
        lblYourTime = document.getElementById("lblYourTime");
        lblYourTime.innerText = hour + ":" + minute + ":" + second + "." + miliSecond;
    }
}

function setStart() {
    'use strict';
    isStart = true;
    baseCount = 0;

    lblGameStatus.innerText = 'Running..';
    btnStart.disabled = true;

    gameStatus = 'run';
    startDate = new Date();
    setInterval(showTime, 10);

}
function clickStart() {
    'use strict';
    if (isStart === false) {
        setStart();
    }
}

function reset() {
    'use strict';
    changeStage();
}

function inputKeyDown() {
    'use strict';
    

    var KEY_CODE_SPACE = 32,
        KEY_CODE_F5 = 116,
        KEY_CODE_S = 83,
        KEY_CODE_R = 82,
        KEY_CODE_F = 70;
    
    if (event.keyCode === KEY_CODE_S && btnStart.disabled === false) { clickStart(); }
    if (event.keyCode === KEY_CODE_R && btnReset.disabled === false) { reset(); }
    
    if (gameStatus !== 'run') { return false; }
    
    if (player.status === 'tu1') {
        event.preventDefault();
        return false;
    }
        
    if (event.keyCode === KEY_CODE_LEFT) {
        isMoveLeft = true;
        event.preventDefault();
    }
    if (event.keyCode === KEY_CODE_UP) {
        isMoveUp = true;
        event.preventDefault();
    }
    if (event.keyCode === KEY_CODE_RIGHT) {
        isMoveRight = true;
        event.preventDefault();
    }
    if (event.keyCode === KEY_CODE_DOWN) {
        isMoveDown = true;
        event.preventDefault();
    }
    if (event.keyCode === KEY_CODE_SPACE && player.status === '0') {
        isBombPut = true;
        event.preventDefault();
    }
    if (event.keyCode !== KEY_CODE_F5) {event.preventDefault(); } // scroll off
    
    if (event.keyCode === KEY_CODE_F && player.status === '0' && skill.isValid === true) {
        player.status = 'tu1';
        skill.isValid = false;
        skill.invicibleCount = 0;
    }
}


window.onload = function () {
    'use strict';
    
    canvas = document.getElementById('field');
    ctx = canvas.getContext('2d');
    document.addEventListener("keydown", inputKeyDown);
    document.addEventListener("keyup", inputKeyUp);
    
    cmbMap = document.getElementById("cmbMap");
    cmbMap.addEventListener('change', changeStage, false);
    
    lblStageStatus = document.getElementById("lblStageStatus");
    lblStageBestTime = document.getElementById("lblStageBestTime");
    lblStageNormalTime = document.getElementById("lblStageNormalTime");
    lblHint = document.getElementById("lblHint");
    lblGameStatus = document.getElementById("lblGameStatus");
    lblYourBestTime = document.getElementById("lblYourBestTime");
    lblYourTime = document.getElementById("lblYourTime");
    lblSkillName = document.getElementById("lblSkillName");
    lblPlayerName = document.getElementById("lblPlayerName");
    prgSkill = document.getElementById("prgSkill");
        
    btnStart = document.getElementById("btnStart");
    btnStart.addEventListener("click", clickStart, false);
    
    btnReset = document.getElementById("btnReset");
    btnReset.addEventListener("click", reset, false);
    
    loadFileStage();

    gameStatus = 'init';
    setInterval(main, 16);
    
};
