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
function createTilemap(width, height) {
    var data = [];
    var grid = [];

    // Produces a grid like so:
    // var grid = [
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    //    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
    // ];
    
    // for every tile high, create a row
    for (var i = 0; i < height; i++) {
        var row = [];

        // for every tile wide, make a column in the row
        for (var j = 0; j < width; j++) {
            var probability = Math.round(Math.random() * 2) === 2;
            var col = probability ? tileIndex.grass.leaves : tileIndex.grass.full;
            row.push(col);
        }

        grid.push(row);
    }

    // concat the grid into a single array for use as map data
    grid.forEach(function(row) {
        data = data.concat(row);
    });

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
    //game.load.tilemap('Tilemap', 'Layer1', generateLevel(), Phaser.Tilemap.CSV);
    game.load.tilemap('Tilemap', null, createTilemap(16, 12), Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/green.png');
    pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
}

function create() {
    //  Creates a blank tilemap
    //map = game.add.tilemap();
    //map = game.add.tilemap('Green Map');
    map = game.add.tilemap('Tilemap');

    //  Add a Tileset image to the map
    //map.addTilesetImage('tiles', 'tiles', 64, 64, 0, 0, 1);
    map.addTilesetImage('Green Map', 'tiles');

    console.log(map);

    //  Creates a new blank layer and sets the map dimensions.
    //  In this case the map is 16x12 tiles in size and the tiles are 64x64 pixels in size.
    //layer = map.create('level1', 16, 12, 64, 64);
    layer = map.createLayer('Ground');

    //  Resize the world
    layer.resizeWorld();

    cursors = game.input.keyboard.createCursorKeys();
    //game.input.onDown.add(GenerateMap, this);

    // Generate a map
    //GenerateMap();

    var grid = map.layers[0].data;
    pathfinder.setGrid(grid, walkables);

    findPath(0, 0, 15, 11, tileIndex.grass.full, tileIndex.dirt.hole);
}

function update() {
}

function render() {
}


///////////////////////////// Helper /////////////////////////////

function GenerateMap() {
    // Clear map
    map.fill(tileIndex.grass.full);

    // Entry / Exit
    entryPosition = randomEdgePosition(map, randomEdge());
    exitPosition = randomEdgePosition(map, oppositeEdge(entryPosition.edge));

    entryTile = map.putTile(tileIndex.dirt.full, entryPosition.x, entryPosition.y);
    exitTile = map.putTile(tileIndex.grass.leaves, exitPosition.x, exitPosition.y);

    // obstacle tiles
    map.fill(tileIndex.grass.leaves, 4, 4, 1, 4);
    map.fill(tileIndex.grass.leaves, 6, 3, 8, 1);

    findPath(entryTile.x, entryTile.y, exitTile.x, exitTile.y, tileIndex.dirt.hole);
}

function findPath(x1, y1, x2, y2, walkables, pathTile) {
    // Setup path finder
    var grid = map.layers[0].data;
    pathfinder.setGrid(grid, walkables);

    pathfinder.setCallbackFunction(function(path) {
        path = path || [];
        for (var i = 0, ilen = path.length; i < ilen; i++) {
            map.putTile(pathTile, path[i].x, path[i].y);
        }
    });

    pathfinder.preparePathCalculation([x1, y1], [x2, y2]);
    pathfinder.calculatePath();
}

/**
 * Gets a random position on the 'map' within 'margin' from the edge
 * @param {Phaser.Tilemap} map
 * @param {number} [margin] - distance in tiles from the edge.  Defaults to 1/3 the smallest map dimesion.
 * @returns {{x: <number>, y: <number>}}
 */
function randomPosition(map, margin) {
    if (!map) throw 'map is required';

    // default margin 1/4 the smallest map dimension
    margin = margin || Math.ceil(Math.min(map.width, map.height) / 3);

    return {
        x: game.rnd.integerInRange(margin, map.width - margin),
        y: game.rnd.integerInRange(margin, map.height - margin)
    }
}

/**
 * Generates a random edge string
 * @returns {string} - ['N', 'S', 'E', 'W']
 */
function randomEdge() {
    return game.rnd.pick(edges)
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
    if (edges.indexOf(edge) < 0) throw 'edge must be "top", "bottom", "left", "right"';

    var result = {};

    var minWidth = allowCorners ? 0 : 1;
    var minHeight = allowCorners ? 0 : 1;

    var maxWidth = allowCorners ? map.width - 1 : map.height - 2;
    var maxHeight = allowCorners ? map.height - 1 : map.height - 2;

    function randomX() {
        return game.rnd.integerInRange(minHeight, maxHeight);
    }

    function randomY() {
        return game.rnd.integerInRange(minWidth, maxWidth);
    }

    result.edge = edge;

    switch (edge) {
        case 'N':
            result.x = randomX();
            result.y = 0;
            break;

        case 'S':
            result.x = randomX();
            result.y = map.height - 1;
            break;

        case 'W':
            result.x = 0;
            result.y = randomY();
            break;

        case 'E':
            result.x = map.width - 1;
            result.y = randomY();
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
