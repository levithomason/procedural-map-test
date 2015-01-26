var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var map;
var layer;
var cursors;

var entryPosition;
var exitPosition;
var entryTile;
var exitTile;

var edges = ['N', 'S', 'E', 'W'];

var tileIndex = {
    dirt: {
        full: 1,
        mud: 11,
        hole: 2,

        top: 18,
        bottom: 4,
        right: 10,
        left: 12,

        topLeft: 3,
        topRight: 5,
        bottomLeft: 17,
        bottomRight: 19,
    },
    grass: {
        full: 9,
        leaves: 8,
    }
};

/**
 * Generates random map data for a map of 'width' and 'height' in tiles.
 * @param {Number} mapWidth - Width of the map in tiles.
 * @param {Number} mapHeight - Height of the map in tiles.
 * @param {Number} [density=2] - How densely populated the random tile should be, 1-10.
 * @param {Number} [baseTile=1] - Id of the which will fill the map.
 * @param {Number} [randomTile=2] - Id of the tile to be randomly placed at the 'density' value.
 * @returns {Array} - Single dimension array of tile ids which can be used as map layer data.
 */
function randomMapData(mapWidth, mapHeight, density, baseTile, randomTile) {
    if (!mapWidth || !mapHeight) {
        throw 'randomMapData() requires mapWidth and mapHeight';
    }

    density = (typeof density === 'undefined') ? 2 : 10 - density;
    baseTile = (typeof baseTile === 'undefined') ? 1 : baseTile;
    randomTile = (typeof randomTile === 'undefined') ? 2 : randomTile;

    // Create two dimensional grid array:
    // var grid = [
    //    [1, 2, 3],
    //    [4, 5, 6]
    // ];

    var grid = [];

    // mapHeight == rows
    for (var i = 0; i < mapHeight; i++) {
        var row = [];

        // mapWidth == cols
        for (var j = 0; j < mapWidth; j++) {
            var probability = Math.round(Math.random() * density) === density;
            var col = probability ? randomTile : baseTile;
            row.push(col);
        }

        grid.push(row);
    }

    // Concat into single dimension grid data array:
    // var data = [1, 2, 3, 4, 5, 6];

    var data = [];

    grid.forEach(function(row) {
        data = data.concat(row);
    });

    return data;
}

function randomTiledJSON(width, height) {
    var data = randomMapData(width, height, 9, tileIndex.grass.full, tileIndex.grass.leaves);
    return {
        version: 1,
        width: width,
        height: height,
        layers: [
            {
                data: data,
                height: height,
                name: "Ground",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                width: width,
                x: 0,
                y: 0
            }
        ],
        tilewidth: 64,
        tileheight: 64,
        tilesets: [
            {
                firstgid: 1,
                image: "green.png",
                imageheight: 320,
                imagewidth: 448,
                margin: 0,
                name: "Green Map",
                properties: {},
                spacing: 0,
                tileheight: 64,
                tilewidth: 64
            }],
        nextobjectid: 1,
        orientation: "orthogonal",
        properties: {},
        renderorder: "right-down",
    };
}


var pathfinder;
var walkables = [tileIndex.dirt.mud, tileIndex.dirt.full];

function preload() {
    // don't pause on loosing focus
    game.stage.disableVisibilityChange = true;

    //game.load.tilemap('Green Map', 'assets/tilemaps/green.json', null, Phaser.Tilemap.TILED_JSON);
    //game.load.tilemap('Tilemap', null, randomTiledJSON(16, 12), Phaser.Tilemap.TILED_JSON);
    game.cache.removeTilemap('Tilemap');
    game.load.tilemap('Tilemap', null, randomTiledJSON(16, 12), Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/green.png');
    pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
}

function create() {
    // MAP

    // load TILED_JSON map
    map = game.add.tilemap('Tilemap');
    map.addTilesetImage('Green Map', 'tiles');

    layer = map.createLayer('Ground');
    layer.resizeWorld();

    cursors = game.input.keyboard.createCursorKeys();

    game.input.onDown.add(GenerateMap, this);
    
    GenerateMap();
    
    var generateInterval = setInterval(function() {
        //GenerateMap();
    }, 200);

    setTimeout(function() {
        window.clearInterval(generateInterval);
    }, 5000);
}

function update() {
}

function render() {
}


///////////////////////////// Helper /////////////////////////////

function mapPath() {
    pathfinder.setGrid(map.layers[0].data, walkables);
    findPath(0, 0, 15, 11, tileIndex.grass.full, tileIndex.dirt.hole);
}

function GenerateMap() {
    // Clear map
    map.fill(tileIndex.grass.full);

    // obstacle tiles
    map.fill(tileIndex.grass.leaves, 4, 4, 1, 4);
    map.fill(tileIndex.grass.leaves, 6, 3, 8, 1);

    var from = randomEdgePosition(map, randomEdge());
    var to = randomEdgePosition(map, oppositeEdge(from.edge)); 

    findPath(map, from, to, tileIndex.grass.full, tileIndex.dirt.full);

    entryTile = map.putTile(tileIndex.dirt.mud, from.x, from.y);
    exitTile = map.putTile(tileIndex.dirt.hole, to.x, to.y);
}

function findPath(map, from, to, walkables, pathTile) {
    console.debug('Finding path:');
    console.log(from.x, from.y, to.x, to.y);

    // Setup path finder
    pathfinder.setGrid(map.layers[0].data, walkables, 50000);
    pathfinder.setCallbackFunction(function(path) {
        console.log(pathfinder._grid[0]);
        path = path || [];
        for (var i = 0, ilen = path.length; i < ilen; i++) {
            map.putTile(pathTile, path[i].x, path[i].y);
        }
    });

    pathfinder.preparePathCalculation([from.x, from.y], [to.x, to.y]);
    pathfinder.calculatePath();
}

/**
 * Gets a random position on the 'map' within 'margin' tiles from the edge
 * @param {Phaser.Tilemap} map
 * @param {number} [margin] - distance in tiles from the edge.  Defaults to 1/3 the smallest map dimesion.
 * @returns {{x: <number>, y: <number>}}
 */
function randomPosition(map, margin) {
    if (!map) throw 'map is required';

    // default margin 1/4 the smallest map dimension
    margin = margin || Math.round(Math.min(map.width, map.height) / 3);

    return {
        x: randomBetween(margin, map.width - margin),
        y: randomBetween(margin, map.height - margin)
    }
}

/**
 * Generates a random edge string
 * @returns {string} - ['N', 'S', 'E', 'W']
 */
function randomEdge() {
    return edges[randomBetween(0, edges.length - 1)];
}

/**
 * Finds the edge opposite the 'edge'
 * @param {string} edge - ['N', 'S', 'E', 'W']
 * @returns {string} - ['N', 'S', 'E', 'W']
 */
function oppositeEdge(edge) {
    if (edges.indexOf(edge) < 0) {
        throw 'edge is required (top, bottom, left, right)'
    }

    var opposites = {
        N: 'S',
        S: 'N',
        E: 'W',
        W: 'E',
    };

    return opposites[edge];
}

/**
 * Generates a random x, y position (in tiles) along an 'edge' of the 'map'
 * @param {Phaser.Tilemap} map
 * @param {string} [edge] - top, bottom, left, right. Default random.
 * @param {boolean} [allowCorners] - do not return corner positions. Default true.
 * @returns {object} - {edge: <String>, x: <number>, y: <number>}
 */
function randomEdgePosition(map, edge, allowCorners) {
    edge = edge || randomEdge();
    allowCorners = allowCorners || false;

    if (!map) throw 'map is required';
    if (edges.indexOf(edge) < 0) throw 'edge must be "N", "S", "E", "W". Received ' + edge;

    var result = {};

    var minWidth = allowCorners ? 0 : 1;
    var minHeight = allowCorners ? 0 : 1;

    var maxWidth = allowCorners ? map.width - 1 : map.height - 2;
    var maxHeight = allowCorners ? map.height - 1 : map.height - 2;

    result.edge = edge;

    switch (edge) {
        case 'N':
            result.x = randomBetween(minHeight, maxHeight);
            result.y = 0;
            break;

        case 'S':
            result.x = randomBetween(minHeight, maxHeight);
            result.y = map.height - 1;
            break;

        case 'W':
            result.x = 0;
            result.y = randomBetween(minWidth, maxWidth);
            break;

        case 'E':
            result.x = map.width - 1;
            result.y = randomBetween(minWidth, maxWidth);
            break;
    }

    return result;
}

function testForCorners(loops) {
    loops = loops || 100;
    for (var i = 0; i < loops; i++) {
        var coord = randomEdgePosition(map);

        if (
            coord.x === 0 && coord.y === 0 ||
            coord.x === 0 && coord.y === map.height - 1 ||
            coord.x === map.width - 1 && coord.y === 0 ||
            coord.x === map.width - 1 && coord.y === map.height - 1
        ) {
            console.error('CORNER!', coord);
        }
        else {
            console.debug('Pass :)');
        }
    }
}

/**
 * Returns a random number between 'num1' and 'num2'.
 * @param {Number} num1
 * @param {Number} num2
 * @returns {Number}
 */
function randomBetween(num1, num2) {
    if (typeof num1 === 'undefined' || typeof num2 === 'undefined') {
        throw 'randomBetween() requires num1 and num2';
    }

    var min = Math.min(num1, num2);
    var max = Math.max(num1, num2);
    var range = max - min;

    return Math.floor(Math.random() * (range + 1) + min);
}
