// I don't like beginning code from the first line


var canvas, ctx, W, H;
var underground, camera, mouse, player, keys;
var lastTime;


function Tile(x, y, size, type) {

	this.x = x;
	this.y = y;

	this.size = size;
	this.type = type;

} 

Tile.prototype.draw = function() {

	var xDrawPos = this.x - camera.x;
	var yDrawPos = this.y - camera.y;

	if(xDrawPos < -this.size || xDrawPos > W || yDrawPos < -this.size || yDrawPos > H) return;

	ctx.lineWidth = 1;

	if(this.type == 0) {

		ctx.fillStyle = '#4c2e10';

	}
	else if(this.type == 1) {

		ctx.fillStyle = '#824f1c';

	}
	else if(this.type == 2) {

		ctx.fillStyle = '#a59f9a';

	}
	else if(this.type == 3) {

		ctx.fillStyle = '#262524';

	}	

	ctx.strokeRect(xDrawPos, yDrawPos, this.size, this.size);
	ctx.fillRect(xDrawPos, yDrawPos, this.size, this.size);	

}

/*	Types of tiles (underground):
		0 - empty 
		1 - ground
		2 - rock
		3 - coal
*/

function Grid() {

	this.w = 0;
	this.h = 0;

	this.rows = 10;
	this.collumns = 5;

	this.tileSize = 50;

	this.content = [];

	this.tiles = [];

}

Grid.prototype.update = function() {

	this.w = this.rows * this.tileSize;
	this.h = this.collumns * this.tileSize;

}

Grid.prototype.setRows = function(number) {

	//	sets number of rows

		//	argument must be an integer	

	this.rows = number;

	return this.rows;

}

Grid.prototype.setCollumns = function(number) {

	//	sets number of collumns

		//	argument must be an integer

	this.collumns = number;

	return this.collumns;

}

Grid.prototype.setTileSize = function(size) {

	//	sets size of the tiles in the grid

		//	argument must be an integer

	this.tileSize = size;

	return this.tileSize;

}

Grid.prototype.setContentPercentage = function(content) {

	//	sets content probability in the grid

		//	argument must be an array of objects that look like this:
		//	{type: x, weight: y}

	this.content = content;

	return this.content;

}

Grid.prototype.setTileContent = function(index, content) {

	this.tiles[index].type = content;

}

Grid.prototype.setTileContentTwoAxis = function(xIndex, yIndex, content) {

	this.tiles[xIndex + (yIndex * this.rows)].type = content;

}

Grid.prototype.setTileRowContent = function(row, content) {

	for (var i = row * this.rows; i < (row * this.rows) + this.rows; i++) {

		this.tiles[i].type = content;

	}

}

Grid.prototype.setTileCollumnContent = function(collumn, content) {

	for (var i = collumn; i < collumn + (this.rows * this.collumns); i += this.rows) {

		this.tiles[i].type = content;

	}

}

Grid.prototype.generateTiles = function() {

	//	generates the tiles

		//	no arguments

	// empty the tiles array
	this.tiles = [];

	for (var i = 0; i < this.collumns; i++) {

		for (var j = 0; j < this.rows; j++) {

			var tileType = 0;

			//	creating the weighted array

			var contentArray = this.content;
			var weightedArray = [];

			for(var k = 0; k < contentArray.length; k++) {

				for (var l = 0; l < contentArray[k].weight; l++) {

					weightedArray.push(contentArray[k].type);
					
				}

			}

			//	randomly choosing an element from weighted array and assigning it to the tile type

			var tileType = weightedArray[Math.floor(Math.random() * weightedArray.length)];

			var tile = new Tile(j * this.tileSize, i * this.tileSize, this.tileSize, tileType);

			this.tiles.push(tile);

		}

	}

	return this.tiles;

}

Grid.prototype.draw = function(tile, sight, playerW, playerH, playerX, playerY) {

	var toBeRendered = getRadiusTiles(tile, this.rows, sight);

	try {

		this.tiles[tile].draw();

	}
	catch(e) {}

	for (var i = 0; i < toBeRendered.length; i++) {

		try {

			this.tiles[toBeRendered[i]].draw();
			
		}
		catch(e) {}
		
	}

}


function Camera(w, h) {

	this.x = 0;
	this.y = 0;

	this.w = w;
	this.h = h;

	this.zoomLevel = 1;

	this.zoomMin = 0.1;
	this.zoomMax = 10;

	this.draggable = false;

}

Camera.prototype.setPos = function(x, y) {

	this.x = x;
	this.y = y;

}

Camera.prototype.zoom = function(deltaY, tSize) {

	this.zoomLevel += deltaY * 0.1;

	if(this.zoomLevel < this.zoomMin) this.zoomLevel = this.zoomMin;
	if(this.zoomLevel > this.zoomMax) this.zoomLevel = this.zoomMax;

	/*this.x += deltaY * tSize;
	this.y += deltaY * tSize;*/

}

Camera.prototype.drag = function(deltaX, deltaY) {

	this.x += deltaX;
	this.y += deltaY;

}

Camera.prototype.reset = function() {

	this.x = 0;
	this.y = 0;

	this.zoomLevel = 1;

}

Camera.prototype.follow = function(obj) {

	this.x = obj.x + obj.w / 2 - W / 2;
	this.y = obj.y - obj.h / 2 - H / 2;

}


function Miner(x, y) {

	this.x = x;
	this.y = y;

	this.w = 30;
	this.h = 30;

	this.maxHP = 40;
	this.HP = this.maxHP;

	this.maxStamina = 20;
	this.stamina = this.maxStamina;

	this.velX = 0;
	this.velY = 0;

	this.speed = 500;

	this.sight = 6;

	this.currentTileXIndex = 0;
	this.currentTileYIndex = 0;

	this.currentTile = 0;
	this.radiusTiles = [];

}

Miner.prototype.setSpeed = function(spd) {

	this.speed = spd;

	return this.speed;

}

Miner.prototype.setSight = function(value) {

	this.sight = value;

	return this.sight;

}

Miner.prototype.setPos = function(xpos, ypos) {

	this.x = xpos;
	this.y = ypos;

	return {x: xpos, y: ypos};

}

Miner.prototype.getTile = function(gridTileSize, gridRows) {

	var roundedX = Math.round(this.x / gridTileSize) * gridTileSize;
	var roundedY = Math.round(this.y / gridTileSize) * gridTileSize;

	var xIndex = roundedX / gridTileSize;
	var yIndex = roundedY / gridTileSize;

	this.currentTileXIndex = xIndex;
	this.currentTileYIndex = yIndex;

	this.currentTile = xIndex + yIndex * gridRows;

	return this.currentTile;

}

Miner.prototype.update = function(dt, worldBoundW, worldBoundH, grid) {

	// Movement
	if(keys[87] || keys[38]) {
		//	W or Up Arrow
		this.velY = -this.speed * dt;

	}
	if(keys[83] || keys[40]) {
		//	S or Down Arrow
		this.velY = this.speed * dt;

	}
	if(keys[65] || keys[37]) {
		//	A or Left Arrow
		this.velX = -this.speed * dt;

	}
	if(keys[68] || keys[39]) {
		//	D or Right Arrow
		this.velX = this.speed * dt;

	}

	// If none of the movement keys are pressed, set the velocity to 0
	if(!keys[87] && !keys[38] && !keys[83] && !keys[40]) {

		this.velY = 0;

	}
	if(!keys[65] && !keys[37] && !keys[68] && !keys[39]) {

		this.velX = 0;

	}	

	// collision stuff
	var tilesToCheckCollisionsFor = getRadiusTiles(this.currentTile, grid.rows);

	this.x += this.velX;

	for (var i = 0; i < tilesToCheckCollisionsFor.length; i++) {

		var collision = checkCollision(this, grid.tiles[tilesToCheckCollisionsFor[i]], null, 'size');

		if(collision.happened && collision.collided.type != 0) {

			if(this.velX < 0) {

				this.x = collision.collided.x + collision.collided.size;

			}
			else if(this.velX > 0) {

				this.x = collision.collided.x - this.w;

			}

		}

	}

	this.y += this.velY;	

	for (var i = 0; i < tilesToCheckCollisionsFor.length; i++) {

		var collision = checkCollision(this, grid.tiles[tilesToCheckCollisionsFor[i]], null, 'size');

		if(collision.happened && collision.collided.type != 0) {

			if(this.velY < 0) {

				this.y = collision.collided.y + collision.collided.size;

			}
			else if(this.velY > 0) {

				this.y = collision.collided.y - this.h;

			}

		}

	}	


	// prevent player from going outside world boundaries
	if(this.x < 0) this.x = 0;
	else if(this.x + this.w > worldBoundW) this.x = worldBoundW - this.w;

	if(this.y < 0) this.y = 0;
	else if(this.y + this.h > worldBoundH) this.y = worldBoundH - this.h;

}

Miner.prototype.draw = function(tileSize) {

	ctx.fillStyle = '#3781cc';
	ctx.fillRect(this.x - camera.x, this.y - camera.y, this.w, this.h);	
	ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.w, this.h);

	try {

		var dx = this.x + (this.w / 2) - camera.x;
		var dy = this.y + (this.h / 2) - camera.y;
		var dradius = this.sight * tileSize * 1.9;

		var darknessGradient = ctx.createRadialGradient(dx, dy, dradius / 2, dx, dy, dradius);
		darknessGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
		darknessGradient.addColorStop(0.05, 'rgba(0, 0, 0, 1.0)');
		darknessGradient.addColorStop(0.5, 'rgba(0, 0, 0, 1.0)');

		ctx.fillStyle = darknessGradient;
		ctx.beginPath();
		ctx.arc(dx, dy, dradius, 0, 2 * Math.PI);
		ctx.fill();

	}
	catch(e) {}

}


function getRadiusTiles(tile, rows, range = 1) {

	var radiusSideLength = (range * 2) + 1;

	var totalTilesNumber = (radiusSideLength * radiusSideLength) - 1;

	var radiusTiles = [];

	for (var y = -range; y < range + 1; y++) {

		for (var x = -range; x < range + 1; x++) {

			var index = tile + x + (y * rows);

			if(index == tile) continue;

			radiusTiles.push(index);

		}
		
	}

	return radiusTiles;

}

function getAdjacentTiles(tile, rows) {

	var adjacentTiles = [];

	// upper tile
	adjacentTiles.push(tile - rows);

	// bottom tile
	adjacentTiles.push(tile + rows);

	// left tile
	adjacentTiles.push(tile - 1);

	//right tile
	adjacentTiles.push(tile + 1);

	return adjacentTiles;

}

function generateNewGrid() {

	underground.setCollumns(parseInt($("#grid-collumns").val()));
	underground.setRows(parseInt($("#grid-rows").val()));
	underground.setTileSize(parseInt($("#tile-size").val()));

	underground.generateTiles();

}

function checkCollision(a, b, aSizePropName = null, bSizePropName = null) {

	if(a == undefined || b == undefined) return false;

	var aw, ah, bw, bh;

	if(aSizePropName != null) {

		aw = a[aSizePropName];
		ah = a[aSizePropName];

	}
	else {

		aw = a.w;
		ah = a.h;

	}

	if(bSizePropName != null) {

		bw = b[bSizePropName];
		bh = b[bSizePropName];

	}	
	else {

		bw = b.w;
		bh = b.h;

	}	

	if(a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y) {

		return {happened: true, collided: b};

	}
	else {

		return {happened: false};

	}

}


$(window).ready(() => {

	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth - 250;
	canvas.height = window.innerHeight;

	W = canvas.width;
	H = canvas.height;

	keys = [];

	underground = new Grid();

	underground.setCollumns(120);
	underground.setRows(200);
	underground.setTileSize(50);

	var contentTypesArray = [{type: 1, weight: 60}, {type: 2, weight: 1}, {type: 3, weight: 2}];

	underground.setContentPercentage(contentTypesArray);
	underground.generateTiles();

	underground.setTileCollumnContent(7, 0);
	underground.setTileRowContent(7, 0);

	camera = new Camera(W, H);
	camera.setPos(underground.w / 2, underground.h / 2);

	player = new Miner(500, 500);

	mouse = {
		x: 0,
		y: 0
	}

	console.log(underground);

	lastTime = Date.now();

	mainLoop();

	player.setPos(350, 350);

});


$(window).keydown(event => {

	keys[event.which] = true;

});

$(window).keyup(event => {

	keys[event.which] = false;

});

$(window).resize(event => {

	canvas.width = window.innerWidth - 250;
	canvas.height = window.innerHeight;

	W = canvas.width;
	H = canvas.height;	

});

$(window).contextmenu(event => {

	//return false;

});


// -------------UI thingys----------------------

// inputs
$("#player-x").change(event => {

	player.x = parseInt($("#player-x").val());

});

$("#player-y").change(event => {

	player.y = parseInt($("#player-y").val());

});

$("#player-speed").change(event => {

	player.speed = parseInt($("#player-speed").val());

});

$("#player-sight").change(event => {

	player.sight = parseInt($("#player-sight").val());

});

$("#player-hp").change(event => {

	player.HP = parseInt($("#player-hp").val());

});

$("#player-max-hp").change(event => {

	player.maxHP = parseInt($("#player-max-hp").val());

});

$("#player-stamina").change(event => {

	player.stamina = parseInt($("#player-stamina").val());

});

$("#player-max-stamina").change(event => {

	player.maxStamina = parseInt($("#player-max-stamina").val());

});

// buttons
$("#edit-tile-button").click(event => {

	var index = parseInt($("#tile-index").val());
	var content = parseInt($("#tile-content").val());

	if(index == null || content == null) return;

	underground.setTileContent(index, content);

});

$("#edit-tile-two-axis-button").click(event => {

	var xIndex = parseInt($("#tile-x-index").val());
	var yIndex = parseInt($("#tile-y-index").val());
	var content = parseInt($("#tile-content-two").val());

	if(xIndex == null || yIndex == null || content == null) return;

	underground.setTileContentTwoAxis(xIndex, yIndex, content);

});

$("#edit-collumn-button").click(event => {

	var index = parseInt($("#collumn-index").val());
	var content = parseInt($("#collumn-content").val());

	if(index == null || content == null) return;

	underground.setTileCollumnContent(index, content);

});

$("#edit-row-button").click(event => {

	var index = parseInt($("#row-index").val());
	var content = parseInt($("#row-content").val());

	if(index == null || content == null) return;

	underground.setTileRowContent(index, content);

});

function mainLoop() {

	var currentTime = Date.now();
	var dt = currentTime - lastTime;
	dt /= 1000;

	update(dt);
	render();

	lastTime = currentTime;

	requestAnimationFrame(mainLoop);

}

function update(dt) {
	player.update(dt, underground.w, underground.h, underground);
	camera.follow(player);
	underground.update();
	player.getTile(underground.tileSize, underground.rows);

	// UI stuff
	$("#player-x-show").text(Math.round(player.x));
	$("#player-y-show").text(Math.round(player.y));
	$("#player-speed-show").text(player.speed);	
	$("#player-sight-show").text(player.sight);	
	$("#player-hp-show").text(player.HP);	
	$("#player-max-hp-show").text(player.maxHP);	
	$("#player-stamina-show").text(player.stamina);	
	$("#player-max-stamina-show").text(player.maxStamina);	
	$("#player-tile-index-show").text(player.currentTile);
	$("#player-tile-x-index-show").text(player.currentTileXIndex);
	$("#player-tile-y-index-show").text(player.currentTileYIndex);	

	$("#grid-collumns-show").text(underground.collumns);
	$("#grid-rows-show").text(underground.rows);
	$("#tile-size-show").text(underground.tileSize);

}

function render() {

	ctx.clearRect(0, 0, W, H);

	underground.draw(player.currentTile, player.sight, player.w, player.h, player.x, player.y);

	player.draw(underground.tileSize);

}
