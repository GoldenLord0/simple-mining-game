// I don't like beginning code from the first line


var underground, camera, canvas, ctx;


function Tile(x, y, size, type) {

	this.x = x;
	this.y = y;

	this.size = size;
	this.type = type;

} 

Tile.prototype.draw = function() {

	if(this.type == 0) {

		cta.fillStyle = '#4c2e10';

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

	ctx.strokeRect(this.x, this.y, this.size, this.size);
	ctx.fillRect(this.x, this.y, this.size, this.size);	

}

/*	Types of tiles (underground):
		0 - empty 
		1 - ground
		2 - rock
		3 - coal
*/

function Grid() {

	this.width = 500;
	this.height = 300;

	this.tileSize = 50;

	this.content = [];

	this.tiles = [];

}

Grid.prototype.setWidth = function(width) {

	//	sets width of the grid

		//	argument must be an integer	

	this.width = width;

	return this.width;

}

Grid.prototype.setHeight = function(height) {

	//	sets height of the grid

		//	argument must be an integer

	this.height = height;

	return this.height;

}

Grid.prototype.setTileSize = function(size) {

	//	sets size of the tiles in the grid

		//	argument must be an integer

	this.tileSize = size;

	return this.tileSize;

}

Grid.prototype.setContent = function(content) {

	//	sets content probability in the grid

		//	argument must be an array of objects that look like this:
		//	{type: x, weight: y}

	this.content = content;

	return this.content;

}

Grid.prototype.generateTiles = function() {

	//	generates the tiles

		//	no arguments

	// empty the tiles array
	this.tiles = [];

	var collumns = this.height / this.tileSize;
	var rows = this.width / this.tileSize;

	for (var i = 0; i < collumns; i++) {

		for (var j = 0; j < rows; j++) {

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

Grid.prototype.draw = function() {

	for (var i = 0; i < this.tiles.length; i++) {

		this.tiles[i].draw(ctx);

	}

}


function Camera(w, h) {

	this.x = 0;
	this.y = 0;

	this.w = w;
	this.h = h;

	this.zoom = 1;

}


$(window).ready(() => {

	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var W = canvas.width;
	var H = canvas.height;

	underground = new Grid();

	underground.setWidth(1000);
	underground.setHeight(600);
	underground.setTileSize(50);

	var contentTypesArray = [{type: 1, weight: 40}, {type: 2, weight: 1}, {type: 3, weight: 2}];

	underground.setContent(contentTypesArray);
	underground.generateTiles();

	camera = new Camera(W, H);

	console.log(underground);

	mainLoop();

});

function mainLoop() {

	update();
	render();

	requestAnimationFrame(mainLoop);

}

function update() {



}

function render() {

	underground.draw(ctx);

}

$('#canvas').click(() => {

	underground.generateTiles();

});
