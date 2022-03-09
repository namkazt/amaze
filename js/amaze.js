//a few globals

var dimensionX = 8;
var dimensionY = 16;
var pixelX;
var pixelY;
var cells;
var start;
var end;
var path;
var winning = false;

function round(value) {
  return (value + 0.5) | 0;
}

//initialize a new maze
var reset = function () {
  winning = false;
  winPopup.visible = false;
  //clear the maze
  cells = [];
  for (var x = 0; x < dimensionX; x++) {
    cells.push([]);
    for (var y = 0; y < dimensionY; y++) cells[x].push(0);
  }

  //get the shared walls between a cell and its neighbors
  var getWalls = function (x, y) {
    var walls = [];
    [
      [x - 1, y, 1],
      [x + 1, y, 2],
      [x, y - 1, 4],
      [x, y + 1, 8],
    ].forEach(function (n) {
      if (
        n[0] > -1 &&
        n[0] < dimensionX &&
        n[1] > -1 &&
        n[1] < dimensionY &&
        cells[n[0]][n[1]] == 0
      )
        walls.push([[x, y], n]);
    });
    return walls;
  };

  //generate the maze starting at a random set of walls
  var walls = getWalls(
    round(Math.random() * (dimensionX - 1)),
    round(Math.random() * (dimensionY - 1))
  );
  while (walls.length) {
    //randomly pick a wall
    var index = (Math.random() * walls.length) | 0;
    var from = walls[index][0];
    var to = walls[index][1];
    walls.splice(index, 1);
    //connect it if its still needing connected
    if (cells[to[0]][to[1]] == 0) {
      cells[from[0]][from[1]] |= to[2];
      cells[to[0]][to[1]] |= (to[2] + 1) % 3 == 0 ? to[2] >> 1 : to[2] << 1;
      //add its relevant neighbors
      walls = walls.concat(getWalls(to[0], to[1]));
    }
  }

  //randomly start along the perimeter of the maze and end on the opposite side
  if (round(Math.random())) {
    start = [
      round(Math.random()) * (dimensionX - 1),
      round(Math.random() * (dimensionY - 1)),
    ];
    end = [
      start[0] ? 0 : dimensionX - 1,
      round(Math.random() * (dimensionY - 1)),
    ];
  } else {
    start = [
      round(Math.random() * (dimensionX - 1)),
      round(Math.random()) * (dimensionY - 1),
    ];
    end = [
      round(Math.random() * (dimensionX - 1)),
      start[1] ? 0 : dimensionY - 1,
    ];
  }
  path = [];

  //(function depth_first_backtrack(x, y){
  //})(0,0);

  // draw
  drawMaze();
  drawTarget();
};

//show the solution to the maze
var solve = function () {
  //TODO: A*
};

//movement in general
var keyToNeighbor = { "-1": { 0: 1 }, 1: { 0: 2 }, 0: { "-1": 4, 1: 8 } };
function move(x, y) {
  //figure out which neighbor
  var neighbor = 0;
  try {
    neighbor = keyToNeighbor[x - start[0]][y - start[1]];
  } catch (e) {}
  var mask = cells[start[0]][start[1]];
  //is it a valid move
  if (mask & neighbor) {
    if (
      path.length &&
      x == path[path.length - 1][0] &&
      y == path[path.length - 1][1]
    )
      path.pop();
    else path.push(start);
    start = [x, y];
  }
}

//move around the maze with arrow keys
var onKeyPress = function (evt) {
  const e = evt.data.originalEvent;
  if (e.keyCode > 36 && e.keyCode < 41)
    move(start[0] + ((e.keyCode - 38) % 2), start[1] + ((e.keyCode - 39) % 2));
};

//move around the maze with finger or mouse
var onHover = function (evt) {
  const e = evt.data.originalEvent;
  //touch
  if (e.changedTouches !== undefined) {
    for (var i = 0; i < e.changedTouches.length; i++)
      move(
        ((e.changedTouches[i].pageX / pixelX) * dimensionX) | 0,
        ((e.changedTouches[i].pageY / pixelY) * dimensionY) | 0
      );
  } //mouse
  else if (e.clientX !== undefined)
    move(
      ((e.clientX / pixelX) * dimensionX) | 0,
      ((e.clientY / pixelY) * dimensionY) | 0
    );
};

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0xffffff,
});
document.body.appendChild(app.view);

pixelX = app.renderer.width;
pixelY = app.renderer.height - 200;
var scaleX = pixelX / dimensionX;
var scaleY = pixelY / dimensionY;
const container = new PIXI.Container();
container.scale.set(scaleX, scaleY);
app.stage.addChild(container);

// load the texture we need
const texA = PIXI.Texture.from("res/a.png");
const texB = PIXI.Texture.from("res/b.png");
const texC = PIXI.Texture.from("res/c.png");

// init maze
//let mazeStartX = app.renderer.width / 2 - pixels / 2;
let maze = new PIXI.Graphics();
container.addChild(maze);

// init player path
let playerPath = new PIXI.Graphics();
container.addChild(playerPath);

// init player
let player = new PIXI.Graphics();
player.scale.set(1 / scaleX, 1 / scaleY);
container.addChild(player);

// init target
const target = new PIXI.Sprite(texA);
target.width = 1.2;
target.height = 1.2;
target.anchor.x = 0.5;
target.anchor.y = 0.5;
container.addChild(target);

var w = dimensionX - 2;
var h = 5;

const styleLogo = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 38,
  fontWeight: "bold",
  align: "left",
  fill: ["#000000"],
  wordWrap: true,
  wordWrapWidth: 600,
  lineJoin: "round",
});
const logoText = new PIXI.Text(
  "Vanilla flavored small tablet for patient compliance",
  styleLogo
);
logoText.x = dimensionX - 600 / scaleX;
logoText.y = dimensionY + 0.2;
logoText.scale.set(1 / scaleX, 1 / scaleY);
container.addChild(logoText);

const logoOut = new PIXI.Sprite(texB);
logoOut.scale.set(1 / scaleX, 1 / scaleY);
logoOut.width = 2265 / scaleX / 7;
logoOut.height = 945 / scaleY / 7;
logoOut.anchor.x = 0.5;
logoOut.anchor.y = 0.5;
logoOut.x = 1.4;
logoOut.y = dimensionY + 0.6;
container.addChild(logoOut);

// init player\

let winPopup = new PIXI.Graphics();
const style = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 36,
  fontWeight: "bold",
  align: "center",
  fill: ["#000000"],
  lineJoin: "round",
});
const richText = new PIXI.Text("Congratulation!!!", style);
richText.width = 250 / scaleX;
richText.x = dimensionX / 2 - richText.width / 2;
richText.y = dimensionY / 2 - h / 2 + 0.3;
richText.scale.set(1 / scaleX, 1 / scaleY);
winPopup.addChild(richText);

// init target
const logo = new PIXI.Sprite(texB);
logo.scale.set(1 / scaleX, 1 / scaleY);
logo.width = 2265 / scaleX / 6;
logo.height = 945 / scaleY / 6;
logo.anchor.x = 0.5;
logo.anchor.y = 0.5;
logo.x = dimensionX / 2 - w / 2 + w / 2;
logo.y = dimensionY / 2 - h / 2 + 2.3;
winPopup.addChild(logo);

// init target
const resetButton = new PIXI.Sprite(texC);
resetButton.scale.set(1 / scaleX, 1 / scaleY);
resetButton.width = 398 / scaleX / 2;
resetButton.height = 218 / scaleY / 2;
resetButton.anchor.x = 0.5;
resetButton.anchor.y = 0.5;
resetButton.x = dimensionX / 2 - w / 2 + w / 2;
resetButton.y = dimensionY / 2 - h / 2 + 4;
resetButton.interactive = true;
resetButton.on("pointerdown", reset);
winPopup.addChild(resetButton);
container.addChild(winPopup);
winPopup.visible = false;
// init maze
reset();

function drawTarget() {
  target.x = start[0] + 0.5;
  target.y = start[1] + 0.5;
}

function drawMaze() {
  maze.clear();
  maze.lineStyle({
    width: 0.75,
    color: 0x91bcff,
    cap: PIXI.LINE_CAP.SQUARE,
    join: PIXI.LINE_JOIN.MITER,
  });
  var line = function (x1, y1, x2, y2) {
    maze.moveTo(x1 + 0.5, y1 + 0.5).lineTo(x2 + 0.5, y2 + 0.5);
  };
  cells.forEach(function (column, x) {
    column.forEach(function (row, y) {
      if (row & 1) line(x, y, x - 1, y);
      if (row & 2) line(x, y, x + 1, y);
      if (row & 4) line(x, y, x, y - 1);
      if (row & 8) line(x, y, x, y + 1);
    });
  });
  maze.endFill();
}

function drawPlayer() {
  player.clear();
  player.lineStyle({
    width: 0.15 * scaleX,
    color: 0x003399,
    join: PIXI.LINE_JOIN.MITER,
  });
  player.beginFill(0x6699cc, 1);
  player.drawCircle(
    (end[0] + 0.5) * scaleX,
    (end[1] + 0.5) * scaleY,
    0.25 * scaleX
  );
  player.endFill();
}

function drawPlayerPath() {
  if (path.length) {
    playerPath.clear();
    playerPath.lineStyle({
      width: 0.5,
      color: 0xf0fc7c,
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND,
    });

    playerPath.moveTo(path[0][0] + 0.5, path[0][1] + 0.5);
    path.forEach(function (pt) {
      playerPath.lineTo(pt[0] + 0.5, pt[1] + 0.5);
    });
    playerPath.lineTo(start[0] + 0.5, start[1] + 0.5);
  } else {
    playerPath.clear();
  }
}

function drawWinPopup() {
  winPopup.clear();
  winPopup.lineStyle({
    width: 0.2,
    color: 0xe6e6e6,
    cap: PIXI.LINE_CAP.ROUND,
    join: PIXI.LINE_JOIN.ROUND,
  });
  winPopup.beginFill(0xffffff);
  winPopup.drawRect(dimensionX / 2 - w / 2, dimensionY / 2 - h / 2, w, h);
  winPopup.endFill();
}

// canvas.addEventListener("keypress", onKeyPress);
// canvas.addEventListener("touchstart", onHover, false);
// canvas.addEventListener("touchmove", onHover, false);
// canvas.addEventListener("mousemove", onHover, false);
container.interactive = true;
container.on("touchstart", onHover);
container.on("touchmove", onHover);
container.on("mousemove", onHover);

// Listen for frame updates
app.ticker.add(() => {
  drawPlayer();
  drawPlayerPath();
  drawTarget();

  // each frame we spin the bunny around a bit
  target.rotation += 0.01;
  if (winning) {
    drawWinPopup();
  }
  //did you win
  if (start[0] == end[0] && start[1] == end[1]) {
    winning = true;
    winPopup.visible = true;
  }
});
