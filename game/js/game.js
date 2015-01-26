'use strict';
var tiles = {
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

var _map = {
    width: 24,
    height: 16,
    tileWidth: 64,
    tileHeight: 64,
};

var _tileset = {
    name: 'Tileset',
    imageName: 'green.png',
    imageWidth: 320,
    imageHeight: 448,
};

var _layer = {
    name: 'Layer',
    data: randomTD.mapData(_map.width, _map.height, tiles.grass.full, tiles.dirt.full, 9)
};

var game = new Phaser.Game(_map.width * _map.tileWidth, _map.height * _map.tileHeight, Phaser.AUTO, 'game', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var generateTD;
var map;
var layer;


function preload() {
    // don't pause on loosing focus
    game.stage.disableVisibilityChange = true;

    game.load.image('Tiles', 'assets/tilemaps/green.png');

    generateTD = new GenerateTD(game);

    var g = game.load.tilemap('Tilemap', null, generateTD.tiledJSON(_map, _layer, _tileset), Phaser.Tilemap.TILED_JSON);
    console.log(g);

}

function create() {
    // load TILED_JSON map
    map = game.add.tilemap('Tilemap');
    map.addTilesetImage('Tileset', 'Tiles');

    generateTD.setMap(map);

    layer = map.createLayer('Layer');
    layer.resizeWorld();

    game.input.onDown.add(generateMap, this);

    generateMap();

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

function generateMap() {
    generateTD.randomMap(tiles.grass.full, tiles.dirt.full, tiles.dirt.mud, tiles.dirt.hole);
}

