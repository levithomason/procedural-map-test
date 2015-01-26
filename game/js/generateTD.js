/**
 * GenerateTD - Tower Defense map generator for Phaser.io.
 * This file contains higher level random data generator abstractions.
 * Lower level generators can be found in the randomTD object.
 */

var GenerateTD = (function(window) {
    var randomTD = randomTD || window.randomTD;
    var hasSetMap = false;
    var pathfinder;


    /**
     * Lightweight logger
     */
    window.GENERATE_TD_DEBUG = true;
    function log() {
        if (window.GENERATE_TD_DEBUG) {
            console.debug(arguments.callee.caller.name + '() ', Array.prototype.slice.apply(arguments));
        }
    }

    /**
     * Allows generating maps with high level abstractions.
     * @param {Phaser.Tilemap} game
     * @constructor
     */
    function GenerateTD(game) {
        if (!(game instanceof Phaser.Game)) {
            throw 'GenerateTD() "game" parameter must be an instance of Phaser.Game.';
        }

        this._map = null;
        pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    }


    /**
     * Sets the Phaser.Tilemap to be used for generating maps.
     * @param {Phaser.Tilemap} map
     */
    GenerateTD.prototype.setMap = function(map) {
        if (!(map instanceof Phaser.Tilemap)) {
            throw 'GenerateTD() "map" parameter must be an instance of Phaser.Tilemap.';
        }
        this._map = map;
        hasSetMap = true;
    };


    /**
     * Generates a base map with an entry point, exit point, and path.
     * @param {Number} baseTile
     * @param {Number} pathTile
     * @param {Number} entryTile
     * @param {Number} exitTile
     * @param {Boolean} [allowAdjacent=false] - whether or not to allow adjacent entry/exit points.
     */
    GenerateTD.prototype.randomMap = function(baseTile, pathTile, entryTile, exitTile, allowAdjacent) {
        if (!hasSetMap) {
            throw 'Cannot call GenerateTD.newMap() before setting a map with GenerateTD.setMap().';
        }

        if (!baseTile || !pathTile || !entryTile || !exitTile) {
            throw 'GenerateTD.newMap() requires baseTile, pathTile, entryTile, and exitTile. Received: ' + baseTile + pathTile + entryTile + exitTile;
        }

        allowAdjacent = allowAdjacent || false;

        // Clear map
        this._map.fill(baseTile);

        // Obstacles
        // noise
        var noiseDensity = Math.round(this._map.width * this._map.height * 0.2);
        for (var i = 0; i < noiseDensity; i++) {
            var pos = randomTD.position(this._map);

            this._map.fill(undefined, pos.x, pos.y, 1, 1);
        }

        // center
        var center = {};
        center.size = Math.round(Math.min(this._map.width, this._map.height) * (Math.random() * 0.3 + 0.2));
        center.x = Math.round(this._map.width / 2 - center.size / 2);
        center.y = Math.round(this._map.height / 2 - center.size / 2);
        this._map.fill(undefined, center.x, center.y, center.size, center.size);

        var edges = randomTD.edgePair(allowAdjacent);
        var from = randomTD.edgePosition(this._map, edges.start);
        var to = randomTD.edgePosition(this._map, edges.end);


        log('from, to', from, to);

        findPath(this._map, from, to, baseTile, pathTile);

        this._map.putTile(entryTile, from.x, from.y);
        this._map.putTile(exitTile, to.x, to.y);

        // clean up obstacles
        this._map.replace(undefined, baseTile);
    };


    /**
     * Creates an object analogous to a Tiled tilemap JSON file. Use with Phaser.Tilemap.TILED_JSON.
     * @param map
     * @param map.width
     * @param map.height
     * @param map.tileWidth
     * @param map.tileHeight
     *
     * @param layer
     * @param layer.data
     * @param [layer.width=map.width]
     * @param [layer.height=map.height]
     * @param [layer.name="GTD Layer"]
     *
     * @param tileset
     * @param [tileset.name="GTD Tileset"]
     * @param tileset.imageName
     * @param tileset.imageWidth
     * @param tileset.imageHeight
     * @param [tileset.margin=0]
     * @param [tileset.spacing=0]
     * @param [tileset.tileWidth=map.tileWidth]
     * @param [tileset.tileHeight=map.tileHeight
     *
     * @param {Number} [baseTile=1] - Id of the which will fill the map.
     * @param {Number} [randomTile=2] - Id of the tile to be randomly placed at the 'density' value.
     * @param {Number} [density=2] - How densely populated the random tile should be, 1-10.
     * @returns {Object} - Tiled JSON object.
     */
    GenerateTD.prototype.tiledJSON = function(map, layer, tileset, baseTile, randomTile, density) {
        if (!map || !map.width || !map.height || !map.tileWidth || !map.tileHeight) {
            throw 'GenerateTD.tiledJSON() "map" argument object is missing required properties.';
        }

        if (!layer || !layer.data) {
            throw 'GenerateTD.tiledJSON() "layer" argument object is missing required properties.';
        }

        if (!tileset || !tileset.imageName || !tileset.imageWidth || !tileset.imageHeight) {
            throw 'GenerateTD.tiledJSON() "tileset" argument object is missing required properties.';
        }

        layer.data = layer.data || randomTD.mapData(map.width, map.height, baseTile, randomTile, density);
        layer.width = layer.width || map.width;
        layer.height = layer.height || map.height;
        layer.name = layer.name || 'GTD Layer';

        tileset.name = tileset.name || 'GTD Tileset';
        tileset.margin = tileset.margin || 0;
        tileset.spacing = tileset.spacing || 0;
        tileset.tileWidth = tileset.tileWidth || map.tileWidth;
        tileset.tileHeight = tileset.tileHeight || map.tileHeight;

        return {
            version: 1,
            width: map.width,
            height: map.height,
            tilewidth: map.tileWidth,
            tileheight: map.tileHeight,
            nextobjectid: 1,
            orientation: 'orthogonal',
            properties: {},
            renderorder: 'right-down',
            layers: [
                {
                    data: layer.data,
                    width: layer.width,
                    height: layer.height,
                    name: layer.name,
                    opacity: 1,
                    type: 'tilelayer',
                    visible: true,
                    x: 0,
                    y: 0
                }
            ],
            tilesets: [
                {
                    firstgid: 1,
                    image: tileset.imageName,
                    imageheight: tileset.imageHeight,
                    imagewidth: tileset.imageWidth,
                    margin: tileset.margin,
                    name: tileset.name,
                    properties: {},
                    spacing: tileset.spacing,
                    tilewidth: tileset.tileWidth,
                    tileheight: tileset.tileHeight,
                }],
        };
    };

    // 
    // PRIVATE 
    // 

    function findPath(map, from, to, walkables, pathTile) {
        log(map, from, to, walkables, pathTile);

        // Setup path finder
        pathfinder.setGrid(map.layers[0].data, walkables);
        pathfinder.setCallbackFunction(function(path) {
            log(pathfinder._grid[0]);
            path = path || [];
            for (var i = 0, ilen = path.length; i < ilen; i++) {
                map.putTile(pathTile, path[i].x, path[i].y);
            }
        });

        pathfinder.preparePathCalculation([from.x, from.y], [to.x, to.y]);
        pathfinder.calculatePath();
    }

    return GenerateTD;
}(window));
