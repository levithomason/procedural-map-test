/**
 * Lower level random data generator abstractions.
 */

var randomTD = (function(window, Phaser) {
    'use strict';

    var edges = ['N', 'S', 'E', 'W'];

    var edgeOpposites = {
        N: 'S',
        S: 'N',
        E: 'W',
        W: 'E',
    };


    var random = {};

    //
    // MAP DATA
    //

    /**
     * Generates random map layer data for a map of 'mapWidth' and 'mapHeight' in tiles.
     * @param {Number} mapWidth - Width of the map in tiles.
     * @param {Number} mapHeight - Height of the map in tiles.
     * @param {Number} [baseTile=1] - Id of the which will fill the map.
     * @param {Number} [randomTile=2] - Id of the tile to be randomly placed at the 'density' value.
     * @param {Number} [density=2] - How densely populated the random tile should be, 1-10.
     * @returns {Array} - Single dimension array of tile ids which can be used as map layer data.
     */
    random.mapData = function(mapWidth, mapHeight, baseTile, randomTile, density) {
        if (!mapWidth || !mapHeight) {
            throw 'randomTD.mapData() requires mapWidth and mapHeight';
        }

        density = (typeof density === 'undefined') ? 2 : 10 - density;
        baseTile = (typeof baseTile === 'undefined') ? 1 : baseTile;
        randomTile = (typeof randomTile === 'undefined') ? 2 : randomTile;

        var mapData = [];
        var grid = [];

        // Create two dimensional grid array:
        // [[1, 2, 3],
        //  [4, 5, 6]];

        // rows
        var row;
        for (var i = 0; i < mapHeight; i++) {
            row = [];

            // columns
            for (var j = 0; j < mapWidth; j++) {
                var probability = Math.round(Math.random() * density) === density;
                var col = probability ? randomTile : baseTile;
                row.push(col);
            }

            grid.push(row);
        }

        // Concat to single dimension
        grid.forEach(function(row) {
            mapData = mapData.concat(row);
        });

        return mapData;
    };


    //
    // MAP EDGES
    //

    /**
     * Generates a random edge string
     * @param {String|String[]} [exclude] - string, or array or strings of edges to exclude.
     * @returns {String} - ['N', 'S', 'E', 'W']
     */
    random.edge = function(exclude) {
        exclude = Array.isArray(exclude) ? exclude : [exclude];

        // remove excluded edges from edge options
        var edgeOptions = [];

        for (var i in edges) {
            if (exclude.indexOf(edges[i]) < 0) {
                edgeOptions.push(edges[i]);
            }
        }

        return random.arrayItem(edgeOptions);
    };

    
    /**
     * Gets a random pair of edges.
     * @param {Boolean} [allowAdjacent=false]
     * @returns {{start: String, end}}
     */
    random.edgePair = function(allowAdjacent) {
        allowAdjacent = allowAdjacent || false;

        var start = random.edge();
        var end = allowAdjacent ? random.edge(start) : edgeOpposites[start];

        return {
            start: start,
            end: end,
        }
    };


    //
    // MAP POSITIONS
    //

    /**
     * Generates a random x, y position (in tiles) along an 'edge' of the 'map'
     * @param {Phaser.Tilemap} map
     * @param {String} [edge] - N, S, E, W. Default random.
     * @param {Boolean} [allowCorners] - do not return corner positions. Default true.
     * @returns {Object} - {edge: <String>, x: <Number>, y: <Number>}
     */
    random.edgePosition = function(map, edge, allowCorners) {
        edge = edge || random.edge();
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
                result.x = random.numberBetween(minHeight, maxHeight);
                result.y = 0;
                break;

            case 'S':
                result.x = random.numberBetween(minHeight, maxHeight);
                result.y = map.height - 1;
                break;

            case 'W':
                result.x = 0;
                result.y = random.numberBetween(minWidth, maxWidth);
                break;

            case 'E':
                result.x = map.width - 1;
                result.y = random.numberBetween(minWidth, maxWidth);
                break;
        }

        return result;
    };

    
    /**
     * Gets a random position on the 'map' within 'margin' tiles from the edge
     * @param {Phaser.Tilemap} map
     * @param {Number} [margin] - distance in tiles from the edge.  Defaults to 1/3 the smallest map dimesion.
     * @returns {{x: <Number>, y: <Number>}}
     */
    random.position = function(map, margin) {
        if (!map instanceof Phaser.Tilemap) throw 'map is required';

        // default margin 1/4 the smallest map dimension
        margin = (typeof margin === 'undefined') ? Math.floor(Math.min(map.width, map.height) / 8) : margin;

        return {
            x: random.numberBetween(margin, map.width - 1 - margin),
            y: random.numberBetween(margin, map.height - 1 - margin)
        }
    };

    //
    // MATH
    //
    
    /**
     * Returns a random number between 'num1' and 'num2'.
     * @param {Number} num1
     * @param {Number} num2
     * @returns {Number}
     */
    random.numberBetween = function(num1, num2) {
        if (typeof num1 === 'undefined' || typeof num2 === 'undefined') {
            throw 'random.numberBetween() requires num1 and num2';
        }

        var min = Math.min(num1, num2);
        var max = Math.max(num1, num2);
        var range = max - min;

        return Math.floor(Math.random() * (range + 1) + min);
    };

    
    /**
     * Returns a single random item from an array.
     * @returns *
     */
    random.arrayItem = function(arr) {
        return arr[random.numberBetween(0, arr.length - 1)];
    };

    /**
     * Returns random true or falsel
     * @returns {Boolean}
     */
    random.boolean = function() {
        return Math.random() < 0.5;
    };


    return random;
}(window, window.Phaser));
