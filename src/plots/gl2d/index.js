/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var Scene2D = require('./scene2d');

var Plots = Plotly.Plots;


exports.type = 'gl2d';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot =  ['x', 'y'];

exports.attributes = require('../cartesian/attributes');

exports.plot = function plotGl2d(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotId = subplotIds[i],
            subplotObj = fullLayout._plots[subplotId],
            fullSubplotData = Plots.getSubplotData(fullData, 'gl2d', subplotId);

        // ref. to corresp. Scene instance
        var scene = subplotObj._scene2d;

        // If Scene is not instantiated, create one!
        if(scene === undefined) {
            scene = new Scene2D({
                    container: gd.querySelector('.gl-container'),
                    id: subplotId,
                    staticPlot: gd._context.staticPlot,
                    plotGlPixelRatio: gd._context.plotGlPixelRatio
                },
                fullLayout
            );

            // set ref to Scene instance
            subplotObj._scene2d = scene;
        }

        scene.plot(fullSubplotData, fullLayout, gd.layout);
    }
};
