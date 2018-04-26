require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/ScaleBar",
    "esri/widgets/Home",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery",
    "esri/geometry/support/webMercatorUtils",
    "dojo/domReady!"
], function (
    Map,
    MapView,
    FeatureLayer,
    ScaleBar,
    Home,
    Legend,
    Expand,
    BasemapGallery,
    webMercatorUtils
) {
    var map = new Map({
        basemap: "topo",
    });

    var view = new MapView({
        map: map,
        container: "viewDiv",
        constraints: {
            snapToZoom: false,
            minZoom: 8,
            maxZoom: 20
        },
        extent: {
            xmax: -11560772,
            xmin: -11974297,
            ymax: 5015101,
            ymin: 4814378,
            spatialReference: {
                wkid: 102100
            }
        }
    });

    //Remove default zoom buttons from upper left of map
    view.ui.remove("zoom");

    //Create scale bar in lower left showing both english and metric units
    var scaleBar = new ScaleBar({
        view: view,
        unit: "dual"
    });

    view.ui.add(scaleBar, {
        position: "bottom-left"
    });

    //Add home button to reset view to original extent after the map has been panned or zoomed
    var homeButton = new Home({
        view: view
    });

    view.ui.add(homeButton, "top-right");

    //Add a button to allow the user to change the default basemap
    var basemapGall = new BasemapGallery({
        view: view,
        container: document.createElement("div")
    });

    //Create a small button to hold the basemap options, instead of using the large default window
    var basemapExpand = new Expand({
        view: view,
        autoCollapse: true,
        title: "Basemap Options",
        content: basemapGall.domNode,
        expandIconClass: "esri-icon-basemap"
    });

    view.ui.add(basemapExpand, "top-right");

    //Popup box settings, moved to upper left by default
    view.popup.dockEnabled = true;
    view.popup.dockOptions = {
        buttonEnabled: false,
        breakpoint: false,
        position: "top-left",
        autoCloseEnabled: true
    };

    //Create symbols that are rendered based on PARK_NAME field from the database
    var bouldSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png",
        width: "30px",
        height: "30px",
        angle: 30
    };

    var sulphSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/OrangeStickpin.png",
        width: "30px",
        height: "30px",
        angle: 30
    };

    var canSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/YellowStickpin.png",
        width: "30px",
        height: "30px",
        angle: 30
    };

    var rmnpTrailsSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/PurpleStickpin.png",
        width: "30px",
        height: "30px"
    };

    var rmnpSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/GreenStickpin.png",
        width: "30px",
        height: "30px",
        angle: 30
    };

    var defaultSym = {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/BlackStickpin.png",
        width: "30px",
        height: "30px",
        angle: 30
    };

    var pointRenderer = {
        type: "unique-value",
        defaultSymbol: defaultSym,
        field: "PARK_NAME",
        uniqueValueInfos: [{
            value: "Boulder Ranger District",
            symbol: bouldSym
        }, {
            value: "Sulphur Ranger District",
            symbol: sulphSym
        }, {
            value: "Canyon Lakes Ranger District",
            symbol: canSym
        }, {
            value: "Rocky Mountain National Park Trails",
            symbol: rmnpTrailsSym
        }, {
            value: "Rocky Mountain National Park",
            symbol: rmnpSym
        }]
    };

    //Create border style for each park boundary
    var rmnpBorder = {
        type: "simple-fill",
        color: [77, 175, 74, 0],
        outline: {
            color: [77, 175, 74, 1],
            width: 2
        }
    };

    var bouldBorder = {
        type: "simple-fill",
        color: [228, 26, 28, 0],
        outline: {
            color: [228, 26, 28, 0.75],
            width: 2
        }
    };

    var sulphBorder = {
        type: "simple-fill",
        color: [255, 127, 0, 0],
        outline: {
            color: [255, 127, 0, 0.75],
            width: 2
        }
    };

    var canBorder = {
        type: "simple-fill",
        color: [255, 255, 51, 0],
        outline: {
            color: [255, 255, 51, 0.75],
            width: 2
        }
    };

    /*var defaultBorder = {
        type: "simple-fill",
        color: [0, 0, 255, 0],
        legendOptions: {
            showLegend: "false"
        },
       outline: {
            color: [0, 0, 255, 0.75],
            width: 2
        }
    };*/

    //Render borders based on DISTRICTNAME using border style
    //This is also where info for legend is taken
    var borderRenderer = {
        type: "unique-value",
        //defaultSymbol: defaultBorder,
        valueExpressionTitle: " ",
        field: "DISTRICTNAME",
        uniqueValueInfos: [{
            value: "Boulder Ranger District",
            symbol: bouldBorder
        }, {
            value: "Canyon Lakes Ranger District",
            symbol: canBorder
        }, {
            value: "Sulphur Ranger District",
            symbol: sulphBorder
        }, {
            value: "Rocky Mountain National Park",
            symbol: rmnpBorder
        }]
    };

    //RMNP needs a different renderer since the polygon is taken from a different location than the ranger districts
    var rmnpRenderer = {
        type: "simple",
        field: "NAME",
        symbol: rmnpBorder
    };

    //Create the layer showing the park boundaries, if the boundaries change a new service url may be needed to display the correct borders            
    var boundaryLayer = new FeatureLayer({
        url: "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer/1",
        definitionExpression: "DISTRICTNAME = 'Sulphur Ranger District' OR DISTRICTNAME = 'Canyon Lakes Ranger District' OR DISTRICTNAME = 'Boulder Ranger District'",
        renderer: borderRenderer
    });
    map.add(boundaryLayer);

    var rmnpLayer = new FeatureLayer({
        url: "https://services.nationalmap.gov/arcgis/rest/services/govunits/MapServer/23",
        legendEnabled: true,
        definitionExpression: "NAME = 'Rocky Mountain National Park'",
        renderer: rmnpRenderer
    });
    map.add(rmnpLayer);

    //Add database to the map, change this url if the location of the database service layer changes
    var trailPoints = new FeatureLayer({
        url: "https://services8.arcgis.com/FZdwhCiaGlH8eyZg/arcgis/rest/services/RMCCC_GIS_Project_2018/FeatureServer/0",
        renderer: pointRenderer,

        //Popup uses the NAME field for the title and DESCRIPTION field to display the work bring done at each site
        //Also displays an image based on the url provided in the IMG_URL field
        popupTemplate: {
            title: "{NAME}",
            content: [{
                type: "text",
                text: "{DESCRIPTION}"
            }, {
                type: "media",
                mediaInfos: [{
                    type: "image",
                    value: {
                        sourceURL: "{IMG_URL}"
                    }
                }]
            }]
        },
        outFields: ["*"]
    });
    map.add(trailPoints);
    view.whenLayerView(trailPoints).then(setupHoverTooltip);

    //Display a legend in the lower left showing the park boundary colors
    var legend = new Legend({
        view: view,
        layerInfos: [{
            //layer: rmnpLayer,
            layer: boundaryLayer,
            title: "District Boundaries"
        }]
    });
    
    view.ui.add(legend, "bottom-right");

    //Create a Tooltip that displays the name of the trail when the mouse hosvers over a point on the map
    function setupHoverTooltip(layerview) {
        var promise;
        var highlight;

        var tooltip = createTooltip();
        view.on("pointer-move", function (event) {
            if (promise) {
                promise.cancel();
            }
            promise = view.hitTest(event.x, event.y)
                .then(function (hit) {
                    promise = null;

                    if (highlight) {
                        highlight.remove();
                        highlight = null;
                    }

                    var results = hit.results.filter(function (result) {
                            return result.graphic.layer === trailPoints;
                        });
                    if (results.length) {
                        var graphic = results[0].graphic;
                        var screenPoint = hit.screenPoint;

                        highlight = layerview.highlight(graphic);
                        tooltip.show(screenPoint, graphic.getAttribute("NAME"));
                    } else {
                        tooltip.hide();
                    }
                });
        });
    }

    function createTooltip() {
        var tooltip = document.createElement("div");
        var style = tooltip.style;

        tooltip.setAttribute("role", "tooltip");
        tooltip.classList.add("tooltip");

        var textElement = document.createElement("div");
        textElement.classList.add("esri-widget");
        tooltip.appendChild(textElement);

        view.container.appendChild(tooltip);

        var x = 0;
        var y = 0;
        var targetX = 0;
        var targetY = 0;
        var visible = false;

        function move() {
            x += (targetX - x) * 0.1;
            y += (targetY - y) * 0.1;

            if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
                x = targetX;
                y = targetY;
            } else {
                requestAnimationFrame(move);
            }

            style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
        }

        return {
            show: function (point, text) {
                if (!visible) {
                    x = point.x;
                    y = point.y;
                }

                targetX = point.x;
                targetY = point.y;
                style.opacity = 1;
                visible = true;
                textElement.innerHTML = text;

                move();
            },

            hide: function () {
                style.opacity = 0;
                visible = false;
            }
        };
    }

    //Show lat lon of mouse cursor
    view.on("pointer-move", showLatLon);

    function showLatLon(evt) {

        var pt = view.toMap(evt);
        var ddpt = webMercatorUtils.webMercatorToGeographic(pt);
        
        document.getElementById("mouseLoc").innerText = (ddpt.y).toFixed(5) + " | " + (ddpt.x).toFixed(5);
    }
});