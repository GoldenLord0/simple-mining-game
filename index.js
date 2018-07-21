// I don't like beginning code from the first line


var canvas, ctx, W, H;
var underground, camera, mouse, player, keys;
var lastTime;


function Tile(x, y, size, type, hp) {

	this.x = x;
	this.y = y;

	this.size = size;
	this.type = type;

	this.hp = hp;

	this.red = 0;
	this.green = 0;
	this.blue = 0;

	if(this.type == 0) {

		this.red = 61;
		this.green = 37;
		this.blue = 13;

	}
	else if(this.type == 1) {

		this.red = 122;
		this.green = 79;
		this.blue = 36;

	}	
	else if(this.type == 2) {

		this.red = 40;
		this.green = 40;
		this.blue = 40;

	}	
	else if(this.type == 3) {

		this.red = 135;
		this.green = 135;
		this.blue = 135;

	}	

} 

Tile.prototype.setContent = function(content) {

	this.type = content;

	if(this.type == 0) {

		this.red = 61;
		this.green = 37;
		this.blue = 13;

	}
	else if(this.type == 1) {

		this.red = 122;
		this.green = 79;
		this.blue = 36;

	}	
	else if(this.type == 2) {

		this.red = 40;
		this.green = 40;
		this.blue = 40;

	}	
	else if(this.type == 3) {

		this.red = 135;
		this.green = 135;
		this.blue = 135;

	}		

}

Tile.prototype.flash = function() {

	var flashValue = 20;

	this.red -= flashValue;
	this.green -= flashValue;
	this.blue -= flashValue;

	setTimeout(() => {

		if(this.type == 0) return;

		this.red += flashValue;
		this.green += flashValue;
		this.blue += flashValue;

	}, 100);

}

Tile.prototype.draw = function() {

	var xDrawPos = this.x - camera.x;
	var yDrawPos = this.y - camera.y;

	if(xDrawPos < -this.size || xDrawPos > W || yDrawPos < -this.size || yDrawPos > H) return;

	ctx.lineWidth = 1;
	ctx.strokeStyle = '#000000';

	ctx.fillStyle = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';

	ctx.strokeRect(xDrawPos, yDrawPos, this.size, this.size);
	ctx.fillRect(xDrawPos, yDrawPos, this.size, this.size);	

}

/*	Types of tiles (underground):
		0 - empty 
		1 - ground
		2 - coal
		3 - stone
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

	this.tiles[index].setContent(content);

}

Grid.prototype.setTileContentTwoAxis = function(xIndex, yIndex, content) {

	this.tiles[xIndex + (yIndex * this.rows)].setContent(content);

}

Grid.prototype.setTileRowContent = function(row, content) {

	for (var i = row * this.rows; i < (row * this.rows) + this.rows; i++) {

		this.tiles[i].setContent(content);

	}

}

Grid.prototype.setTileCollumnContent = function(collumn, content) {

	for (var i = collumn; i < collumn + (this.rows * this.collumns); i += this.rows) {

		this.tiles[i].setContent(content);

	}

}

Grid.prototype.damageTile = function(index, damage) {

	var thisTile = this.tiles[index];

	thisTile.hp -= damage;

	thisTile.flash();

	var returnValue = {type: 0, isDead: false};

	if(thisTile.hp <= 0) {

		returnValue.type = thisTile.type;
		returnValue.isDead = true;

		thisTile.setContent(0);

	}

	return returnValue;

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

			var tile = new Tile(j * this.tileSize, i * this.tileSize, this.tileSize, tileType, tileType * 2);

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

	this.speed = 200;

	this.sight = 6;

	this.currentTileXIndex = 0;
	this.currentTileYIndex = 0;

	this.currentTile = 0;
	this.radiusTiles = [];

	this.isMining = false;
	this.canMine = true;
	this.mineSpeed = 250;

	this.inventory = new Inventory();

}

Miner.prototype.collect = function(item) {

	this.inventory.addItem(item);

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

Miner.prototype.setMineDelay = function() {

	this.canMine = false;

	setTimeout(() => {

		this.canMine = true;

	}, this.mineSpeed);

}

Miner.prototype.collisionAndMine = function(grid, tilesAroundPlayer, tilesAdjacentOnAxis, vel, pos, asize) {

	for (var i = 0; i < tilesAroundPlayer.length; i++) {

		var tileIndex = tilesAroundPlayer[i];
		var tileObject = grid.tiles[tilesAroundPlayer[i]];

		var collision = checkCollision(this, tileObject, null, 'size');

		if(collision.happened) {

			if(this.isMining) {

				if(tilesAdjacentOnAxis.indexOf(tileIndex) != -1 && tileObject.type != 0) {

					var damagedTile = grid.damageTile(tileIndex, 1);

					// collecting stuff
					if(damagedTile.isDead) {

						if(damagedTile.type == 2) {

							this.collect(new Items.Coal());

						}
						else if(damagedTile.type == 3) {

							this.collect(new Items.Stone());

						}

					}

					this.setMineDelay();

				}

			}
			else {

				if(tileObject.type != 0) {

					if(this[vel] < 0) {

						this[pos] = tileObject[pos] + tileObject.size;

					}
					else if(this[vel] > 0) {

						this[pos] = tileObject[pos] - this[asize];

					}				

				}

			}

		}

	}

}

Miner.prototype.update = function(dt, worldBoundW, worldBoundH, grid) {

	// Movement
	if(keys[87] || keys[38]) {
		// W or Up Arrow
		this.velY = -this.speed * dt;

	}
	else if(keys[83] || keys[40]) {
		// S or Down Arrow
		this.velY = this.speed * dt;

	}
	else {

		this.velY = 0;

	}

	if(keys[65] || keys[37]) {
		// A or Left Arrow
		this.velX = -this.speed * dt;

	}
	else if(keys[68] || keys[39]) {
		// D or Right Arrow
		this.velX = this.speed * dt;

	}
	else {

		this.velX = 0;

	}

	// Mining
	if(keys[32]) {
		// Space
		this.isMining = true;

	}
	else {

		this.isMining = false;

	}

	// Prevent player from digging in diagonal direction
	if(this.isMining && (keys[87] || keys[38] || keys[83] || keys[40]) && (keys[65] || keys[37] || keys[68] || keys[39])) {

		this.isMining = false;

	}	

	// disable mining
	if(!this.canMine) {

		this.isMining = false;

	}


	var tilesAroundPlayer = getRadiusTiles(this.currentTile, grid.rows);	
	var tilesAdjacentToPlayer = getAdjacentTiles(this.currentTile, grid.rows);

	var tilesInCorners = tilesAroundPlayer.filter(element => {

		return !(tilesAdjacentToPlayer.includes(element));

	});

	var tilesAdjacentOnX = tilesAdjacentToPlayer.slice(2, 4);
	var tilesAdjacentOnY = tilesAdjacentToPlayer.slice(0, 2);

	this.x += this.velX;

	this.collisionAndMine(grid, tilesAroundPlayer, tilesAdjacentOnX, "velX", "x", "w");	

	this.y += this.velY;

	this.collisionAndMine(grid, tilesAroundPlayer, tilesAdjacentOnY, "velY", "y", "h");


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


function Items() {

	this.name = '';
	this.value = 0;
	this.weight = 0;
	this.displayColor = '#ffffff';

}

Items.Coal = function() {

	this.name = 'Coal';
	this.value = 10;
	this.weight = 5;
	this.displayColor = '#202020';

}

Items.Stone = function() {

	this.name = 'Stone';
	this.value = 1;
	this.weight = 5;
	this.displayColor = '#6C6C6C';

}

function Inventory() {

	this.content = [];

	this.visible = false;

	this.grid = [];
	this.slotSize = 100;

	var rows = 6;
	var collumns = 8;	
	var slotSize = this.slotSize;

	for (var i = 0; i < rows; i++) {

		for (var j = 0; j < collumns; j++) {

			this.grid.push({x: j * slotSize + slotSize * j + slotSize, y: i * slotSize + slotSize * i + slotSize});

		}

	}

	console.log(this.grid)

}

Inventory.prototype.addItem = function(adding) {

	if(!(this.content.some(item => item.name == adding.name))) {

		this.content.push({name: adding.name, amount: 1, displayColor: adding.displayColor});

	}
	else {

		var index = this.content.findIndex(item => item.name == adding.name);

		this.content[index].amount += 1;

	}

	console.log(this.content);

} 

Inventory.prototype.show = function() {

	console.log('show');

	this.visible = true;

}

Inventory.prototype.hide = function() {

	console.log('hide');

	this.visible = false;

}

Inventory.prototype.update = function() {



}

Inventory.prototype.draw = function() {

	if(!this.visible) return;

	var xoffset = 100;
	var yoffset = 100;
	var alpha = 0.7;
	var radius = 20;

	ctx.fillStyle = 'rgba(129, 136, 145, ' + alpha + ')';
	ctx.strokeStyle = 'rgba(64, 67, 71, ' + alpha + ')';
	ctx.lineWidth = 24;	
	roundRect(ctx, xoffset, yoffset, W - xoffset * 2, H - yoffset * 2, radius, true, true);

	ctx.strokeStyle = '#353b42';
	ctx.lineWidth = 10;

	for (var i = 0; i < this.content.length; i++) {

		ctx.fillStyle = this.content[i].displayColor;

		roundRect(ctx, xoffset + this.grid[i].x, yoffset + this.grid[i].y, this.slotSize, this.slotSize, 5, true, true);

		ctx.font = '25px Arial';
		ctx.fillStyle = '#000000';

		ctx.fillText(this.content[i].amount + 'x', xoffset + this.grid[i].x + this.slotSize * 1.2, yoffset + this.grid[i].y + this.slotSize);

	}

}

// logic functions --------------------------------------------------------------------

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

// rendering functions --------------------------------------------------------------------

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
// got this code from StackOverflow, it was written by Juan Mendes (https://stackoverflow.com/users/227299/juan-mendes)
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {

	if(typeof stroke == 'undefined') {

		stroke = true;

	}

	if(typeof radius === 'undefined') {

		radius = 5;

	}

	if(typeof radius === 'number') {

		radius = {tl: radius, tr: radius, br: radius, bl: radius};

	} 
	else {

		var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};

		for (var side in defaultRadius) {

			radius[side] = radius[side] || defaultRadius[side];

		}

	}

	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();

	if(fill) {

		ctx.fill();

	}

	if(stroke) {

		ctx.stroke();

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

	var contentTypesArray = [{type: 1, weight: 60}, {type: 2, weight: 2}, {type: 3, weight: 1}];

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

var inventoryFired = false;

$(window).keydown(event => {

	keys[event.which] = true;

	// inventory stuff
	if(keys[73] && !inventoryFired) {

		inventoryFired = true;

		if(!player.inventory.visible) {

			player.inventory.show();

		}
		else {

			player.inventory.hide();

		}

	}	

});

$(window).keyup(event => {

	keys[event.which] = false;

	// inventory stuff
	inventoryFired = false;

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

$("#player-mine-speed").change(event => {

	player.mineSpeed = parseInt($("#player-mine-speed").val());

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
	$("#player-mine-speed-show").text(player.mineSpeed);	
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

	player.inventory.draw();

}
