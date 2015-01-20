var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var map;
var layer;
var cursors;

function preload() {

    // don't pause on loosing focus
    game.stage.disableVisibilityChange = true;
    game.load.image('tiles', 'assets/tilemaps/green.png');

}

function create() {
    //  Creates a blank tilemap
    map = game.add.tilemap();

    //  Add a Tileset image to the map
    map.addTilesetImage('tiles', 'tiles', 64, 64, 0, 0, 1);

    //  Creates a new blank layer and sets the map dimensions.
    //  In this case the map is 16x12 tiles in size and the tiles are 64x64 pixels in size.
    layer = map.create('level1', 16, 12, 64, 64);

    //  Resize the world
    layer.resizeWorld();

    cursors = game.input.keyboard.createCursorKeys();
    game.input.onDown.add(GenerateMap, this);

    GenerateMap();

    // Constantly generate new maps
    //setInterval(function() {
    //    GenerateMap();
    //}, 5000);
}

function update() {


}

function render() {


}


///////////////////////////// Helper /////////////////////////////

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

function GenerateMap() {
    // Entry / Exit
    var entry = {};
    entry.edge = randomEdge();
    entry.pos = randomEdgePosition(map, entry.edge);

    var exit = {};
    exit.edge = oppositeEdge(entry.edge);
    exit.pos = randomEdgePosition(map, exit.edge);

    // Clear map
    map.fill(tileIndex.grass.full);

    // Place entry/exit
    var entryTile = map.putTile(tileIndex.dirt.full, entry.pos.x, entry.pos.y);
    var exitTile = map.putTile(tileIndex.grass.leaves, exit.pos.x, exit.pos.y);

    // Entry/exit protrusions
    //var entryProtrusion = randomEdgeProtrusion(map, entry.edge, {x: entry.pos.x, y: entry.pos.y});
    //var exitProtrusion = randomEdgeProtrusion(map, exit.edge, {x: exit.pos.x, y: exit.pos.y});
    //map.fill(tileIndex.dirt.mud, entryProtrusion.x, entryProtrusion.y, entryProtrusion.width, entryProtrusion.height);
    //map.fill(tileIndex.dirt.mud, exitProtrusion.x, exitProtrusion.y, exitProtrusion.width, exitProtrusion.height);

    // Corner markers
    var corner1 = randomCentralPosition(map);
    var corner2 = randomCentralPosition(map);
    var corner1Tile = map.putTile(tileIndex.dirt.hole, corner1.x, corner1.y);
    var corner2Tile = map.putTile(tileIndex.dirt.hole, corner2.x, corner2.y);

    // Connect corner markers
    var leastXCorner;
    var greatestXCorner;

    if (corner1Tile.x < corner2Tile.x) {
        leastXCorner = corner1Tile;
        greatestXCorner = corner2Tile;
    } else {
        leastXCorner = corner2Tile;
        greatestXCorner = corner1Tile;
    }

    // horizontal
    map.fill(tileIndex.dirt.mud, leastXCorner.x, leastXCorner.y, greatestXCorner.x - leastXCorner.x + 1, 1);

    // vertical
    if (leastXCorner.y < greatestXCorner.y) {
        map.fill(tileIndex.dirt.mud, greatestXCorner.x, leastXCorner.y, 1, greatestXCorner.y - leastXCorner.y + 1);
    } else {
        map.fill(tileIndex.dirt.mud, greatestXCorner.x, greatestXCorner.y, 1, leastXCorner.y - greatestXCorner.y + 1);
    }
}

/**
 * Gets a random position on the 'map' at 'margin' tiles away from the edge
 * @param {Phaser.Tilemap} map
 * @param {number} [margin] - distance in tiles from the edge.  Defaults to 1/3 the smallest map dimesion.
 * @returns {{x: <number>, y: <number>}}
 */
function randomCentralPosition(map, margin) {
    if (!map) throw 'map is required';

    // default margin 1/4 the smallest map dimension
    margin = margin || Math.ceil(Math.min(map.width, map.height) / 3);

    return {
        x: game.rnd.integerInRange(margin, map.width - margin),
        y: game.rnd.integerInRange(margin, map.height - margin)
    }
}

/**
 * Gets protrusion rectangle, 1 tile wide, of random length from an 'edge' of a 'map'
 * @param {Phaser.Tilemap} map
 * @param {string} edge - 'N', 'S', 'E', 'W'
 * @param {object} start - {x: <number>, y: <number>} representing the starting point in tiles
 * @returns {object} - {x: <number>, y: <number>}
 */
function randomEdgeProtrusion(map, edge, start) {
    console.log(map, edge, start);
    if (!map || !edge || !start) throw 'map, edge, and start are required';

    // axis of protrusion
    var axis = (edge === 'N' || edge === 'S') ? 'y' : 'x';

    // max distance to protrude
    var maxLength = axis === 'x' ? map.width / 3 : map.height / 3;

    // invert the length if protruding form S or E edge
    var invert = (edge === 'S' || edge === 'E');
    var length = game.rnd.integerInRange(1, maxLength);

    var protrusion = {};

    protrusion.x = axis === 'y' ? start.x : invert ? start.x - length : start.x + 1;
    protrusion.y = axis === 'x' ? start.y : invert ? start.y - length : start.y + 1;

    protrusion.edge = edge;
    protrusion.axis = axis;
    protrusion.length = length;
    protrusion.invert = invert;
    protrusion.width = (axis === 'x') ? length : 1;
    protrusion.height = (axis === 'y') ? length : 1;

    console.log(protrusion);

    return protrusion;
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
