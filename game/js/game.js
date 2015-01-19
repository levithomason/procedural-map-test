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

    // Uncomment for to use Tiled map
    //game.load.tilemap('green', 'assets/tilemaps/green.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/green.png');

}

function create() {
    // Uncomment for use with the Tiled map
    // map = game.add.tilemap('green');
    // map.addTilesetImage('Green Map', 'tiles');
    // layer = map.createLayer('Tile Layer 1');
    // layer.resizeWorld();

    //  Creates a blank tilemap
    map = game.add.tilemap();

    //  Add a Tileset image to the map
    
    map.addTilesetImage('tiles', 'tiles', 64, 64, 0, 0, 1);

    //  Creates a new blank layer and sets the map dimensions.
    //  In this case the map is 16x12 tiles in size and the tiles are 64x64 pixels in size.
    layer = map.create('level1', 16, 12, 64, 64);
    layer.scrollFactorX = 0.5;
    layer.scrollFactorY = 0.5;

    //  Resize the world
    layer.resizeWorld();

    cursors = game.input.keyboard.createCursorKeys();
    game.input.onDown.add(GenerateMap, this);

    GenerateMap();
}

function update() {


}

function render() {


}


/////////////////

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
    map.putTile(tileIndex.dirt.full, entry.pos.x, entry.pos.y);
    map.putTile(tileIndex.grass.leaves, exit.pos.x, exit.pos.y);
}

///////////////////////////// Helper /////////////////////////////

/**
 * Generates a random edge string
 * @returns {String} - ['top', 'bottom', 'left', 'right']
 */
function randomEdge() {
    return game.rnd.pick(['top', 'bottom', 'left', 'right'])
}

/**
 * Finds the edge opposite the 'edge'
 * @param {String} edge - ['top', 'bottom', 'left', 'right']
 * @returns {String} - ['top', 'bottom', 'left', 'right']
 */
function oppositeEdge(edge) {
    if (['top', 'bottom', 'left', 'right'].indexOf(edge) < 0) {
        throw 'edge is required (top, bottom, left, right)'
    }

    var opposites = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left'
    };
   
    return opposites[edge];
}

/**
 * Generates a random x, y position (in tiles) along an 'edge' of the 'map'
 * @param map {Phaser.Tilemap}
 * @param [edge] {String} - top, bottom, left, right. Default random.
 * @param [allowCorners] {Boolean} - do not return corner positions. Default true.  
 * @returns {Object} - {edge: <String>, x: <Integer>, y: <Integer>}
 */
function randomEdgePosition(map, edge, allowCorners) {
    var edges = ['top', 'bottom', 'left', 'right'];
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
        case 'top':
            result.x = randomX();
            result.y = 0;
            break;

        case 'bottom':
            result.x = randomX();
            result.y = map.height - 1;
            break;

        case 'left':
            result.x = 0;
            result.y = randomY();
            break;

        case 'right':
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
