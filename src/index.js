import { moveBot, shoot } from "./emit";
import { registerListeners } from "./listen";
import socket from "./connect";
registerListeners({
  user: handleUser,
  new_enemy: handleNewEnemy,
  player_move: handlePlayerMove,
  new_bullet: handleNewBullet,
  user_die_update: handleUserDieUpdate,
  user_update: handleUserUpdate,
  user_disconnect: handleUserDisconnect,
  start: handleStart,
  new_life: handlerNewLife
});

socket.on("connect", () => {
  socket.emit("join");
  console.log("Join Game")
});
let bot = {};
let otherBots = []
let gridMap = {};
let pixelMap = []
let speed = 3
let targetBot = null;

function handleStart() {
  main();
}
function handleUser(data) {
  bot = data.tanks.find((tank) => tank.name === 'bumbum');
  otherBots = data.tanks.filter((tank) => tank.name !== 'bumbum');
  gridMap = buildGridMap(data.map);
  pixelMap = buildPixelMap(gridMap);
  if (process.env.BOT_ENV === 'DEV') {
    main();
  }
}
function buildGridMap(map) {
  const rows = 35;
  const cols = 45;
  const gridMap = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const value = map[i][j];
      gridMap[i][j] = value ? 1 : 0;
    }
  }

  return gridMap;
}
function buildPixelMap(gridMap) {
  const pixelWidth = 20;
  const pixelHeight = 20;
  const pixelMap = Array.from({ length: 700 }, () => Array(900).fill(0));

  for (let i = 0; i < gridMap.length; i++) {
    for (let j = 0; j < gridMap[i].length; j++) {
      const value = gridMap[i][j];

      for (let x = i * pixelHeight; x < (i + 1) * pixelHeight; x++) {
        for (let y = j * pixelWidth; y < (j + 1) * pixelWidth; y++) {
          pixelMap[x][y] = value === 1 ? 1 : 0;
        }
      }
    }
  }

  return pixelMap;
}
function handlePlayerMove(data) {
  if (data.uid !== bot.uid) {
    const opponentIndex = otherBots.findIndex((tank) => tank.uid === data.uid);
    if (opponentIndex !== -1) {
      otherBots[opponentIndex].x = data.x;
      otherBots[opponentIndex].y = data.y;
    } else {
      otherBots.push({
        data
      });
    }
  } else {
    bot.x = data.x
    bot.y = data.y
    bot.shootable = data.shootable
  }
}

function handleNewBullet(data) {
}

function handleNewEnemy(data) {
  if (data.tank) {
    let existingBot = otherBots.find(b => b.uid === data.tank.uid);
    if (!existingBot) {
      otherBots.push(data.tank);
    }
  }
}

function handleUserDieUpdate(data) {

}

function handleUserUpdate(data) {
  if (data.name === "bumbum") {
    bot.x = data.x
    bot.y = data.y
    bot.shootable = data.shootable
  } else {
    const botOther = otherBots.find((otherBot) => otherBot.name === data.name);
    if (botOther) {
      botOther.x = data.x;
      botOther.y = data.y;
    }
  }
}

function handleUserDisconnect(data) {
  if (data.uid && process.env.BOT_ENV === "DEV") {
    const botIndex = otherBots.findIndex(b => b.uid === data.uid);

    if (botIndex !== -1) {
      otherBots.splice(botIndex, 1);
      console.log(`Bot with uid ${data.uid} disconnect.`);
    }
  }
}

function handlerNewLife(data) {
  let botOther = otherBots.find(b => b.uid === data.killed.uid);

  if (botOther) {
    botOther = data.killed
  }
  targetBot = findNearestBot()
}


function canMove(newX, newY, direction) {
  const maxX = pixelMap[0].length;
  const maxY = pixelMap.length;
  if (direction === 'UP') {
    if (newX >= 0 && newX <= maxX && newY >= 0 && newY < 700) {
      if (pixelMap[newY][newX] === 1 || pixelMap[newY][newX + 33] === 1) {
        return false;
      }
    }
  }

  if (direction === 'DOWN') {
    if (newX >= 0 && newX <= maxX && newY >= 0 && newY <= maxY) {
      if (pixelMap[newY + 33][newX] === 1 || pixelMap[newY + 33][newX + 33] === 1) {
        return false;
      }
    }
  }

  if (direction === 'RIGHT') {
    if (newX >= 0 && newX <= maxX && newY >= 0 && newY <= maxY) {
      if (pixelMap[newY][newX + 33] === 1 || pixelMap[newY + 33][newX + 33] === 1) {
        return false;
      }
    }
  }

  if (direction === 'LEFT') {
    if (newX >= 0 && newX <= maxX && newY >= 0 && newY <= maxY) {
      if (pixelMap[newY][newX] === 1 || pixelMap[newY + 33][newX] === 1) {
        return false;
      }
    }
  }

  return true;
}
function shouldShoot() {
  if (!bot.shootable) return;
  for (const otherBot of otherBots) {
    const dx = otherBot.x - bot.x;
    const dy = otherBot.y - bot.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDy >= 15 && absDy < 250 && absDx <= 15) {
      if (dy > 0) {
        moveBot("DOWN");
      } else {
        moveBot("UP");
      }
      shoot()

    } else if (absDx >= 15 && absDx < 250 && absDy <= 15) {
      if (dx > 0) {
        moveBot("RIGHT");
      } else {
        moveBot("LEFT");
      }
      shoot()
    }
  }
}

function findNearestBot() {
  if (otherBots.length === 0) return null;

  let nearestBot = null;
  let minDistance = Infinity;

  for (const otherBot of otherBots) {
    const distance = Math.hypot(otherBot.x - bot.x, otherBot.y - bot.y);

    if (distance < minDistance) {
      nearestBot = otherBot;
      minDistance = distance;
    }
  }

  return nearestBot;
}
function getRandomBot(bots, currentTarget) {
  const availableBots = bots.filter(bot => bot !== currentTarget);

  if (availableBots.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableBots.length);
    return availableBots[randomIndex];
  }
  return null;
}
let previousMove = null;
let lastX = null
let lastY = null
function moveToTarget() {
  if (!targetBot) {
    targetBot = findNearestBot();
  }

  if (!targetBot) return;
  const dx = targetBot.x - bot.x;
  const dy = targetBot.y - bot.y;
 
  let moved = false;
  
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0 && canMove(bot.x + speed, bot.y, 'RIGHT')) {
      moveBot("RIGHT");
      previousMove = 'RIGHT';
      moved = true;
    } else if (dx < 0 && canMove(bot.x - speed, bot.y, 'LEFT') && previousMove !== 'RIGHT') {
      moveBot("LEFT");
      previousMove = 'LEFT';
      moved = true;
    }
  }
  if (!moved) {
    if (dy > 0 && canMove(bot.x, bot.y + speed, 'DOWN') && previousMove !== 'UP') {
      moveBot("DOWN");
      previousMove = 'DOWN';
      moved = true;
    } else if (dy < 0 && canMove(bot.x, bot.y - speed, 'UP') && previousMove !== 'DOWN') {
      moveBot("UP");
      previousMove = 'UP';
      moved = true;
    }
  }
  if (!moved) {
    if (previousMove !== 'RIGHT' && canMove(bot.x - speed, bot.y, 'LEFT')) {
      moveBot("LEFT");
      previousMove = 'LEFT';
    } else if (previousMove !== 'LEFT' && canMove(bot.x + speed, bot.y, 'RIGHT')) {
      moveBot("RIGHT");
      previousMove = 'RIGHT';
    } else if (previousMove !== 'DOWN' && canMove(bot.x, bot.y - speed, 'UP')) {
      moveBot("UP");
      previousMove = 'UP';
    } else if (previousMove !== 'UP' && canMove(bot.x, bot.y + speed, 'DOWN')) {
      moveBot("DOWN");
      previousMove = 'DOWN';
    }
  }
}
function getRandomBot(bots, currentTarget) {
  const availableBots = bots.filter(bot => bot !== currentTarget);

  if (availableBots.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableBots.length);
    return availableBots[randomIndex];
  }
  return null;
}

function main() {
  setInterval(() => {
    moveToTarget();
  }, 17);

  setInterval(() => {
    shouldShoot();
  }, 5);

  setInterval(() => {
    if (lastY === bot.y && lastX === bot.x) {
      targetBot = getRandomBot(otherBots, targetBot);
    }
    lastX = bot.x
    lastY = bot.y
  }, 500)

}
