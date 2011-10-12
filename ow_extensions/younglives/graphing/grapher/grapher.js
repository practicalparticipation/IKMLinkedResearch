steal(
    {path:'https://www.google.com/jsapi'}, //Google JS Api
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquerytools/src/tabs/tabs.js', //jquery.tools Tabs
    'resources/jquery.sparql.js', // SPARQL Query Generation
    'resources/urlEncode.js' // URLEncoding Utility
)
.css(
    'styles/grapher',   // Use our own CSS
    'styles/tabs'   // Tab styling
)
.then( function(){
    (function($){

        var ns = {
            qb: 'http://purl.org/linked-data/cube#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs:'http://www.w3.org/2000/01/rdf-schema#'
        };

        // Store for grapher plugins
        var plugins = {};
        // Registered via $.fn.yl_grapher.registerPlugin


        var settings = {
            dsd: 'http://data.younglives.org.uk/data/statistics/SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e',
            sparql_endpoint: 'http://localhost/IKMLinkedResearch/build/service/sparql',
            http_host:'localhost',
            host_path: '/IKMLinkedResearch/build/younglives/display/r/ylstats?SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e',
            graph_type: 'table',
            chart_options: {'height': 400,
                                     'width': 600}
        };

        var methods = {
            /**
             * Perform Initial startup
             *
             * - parse options
             * - build initial UI
             * - set up bindings
             * - perform initial data load
             */
            init: function(options) {
                return this.each(function(){
                    var $this = $(this)
                          data = $(this).data('grapher');
                    if (!data) {
                        data = {};
                        // Merge options with defaults
                        if (options) {
                            $.extend(settings, options, true);
                        }
                        // Build UI
                        var ui = $($.View('views/init.ejs'));
                        $("ul.tabs", ui).tabs("div.panes > div");
                        $this.html(ui);
                        // Store a reference to the place we ant the chart drawn
                        // Mostly for Google's convenience
                        data.graph_target = $("#grapher-vis", ui)[0];

                        // Store our state
                        $this.data('grapher', data);

                        // Set up initial bindings
                        $this.bind('graphDataLoaded',
                            function(){
                                $this.yl_grapher('drawGraph');
                            }
                        );

                        /**
                         * Kick off by calling getObservations
                         */
                        $this.yl_grapher('loadGraphData');
                    }
                });
            }, // END INIT

            /**
             * Fetch a full table of observations for our configured DSD
             * Parse the result into observations and dsd_components objects
             * and store them in our data stash
             */
            loadGraphData:function(callback) {
                var $this = $(this)
                        data = $(this).data('grapher');

                // Fetch observations for DSD
                // Formulate a sparql request
                var squery = $.sparql(settings.sparql_endpoint)
                    .prefix('qb', ns.qb)
                    .prefix('rdfs', ns.rdfs)
                    .prefix('rdf', ns.rdf)
                    .select(['?dataset', '?obs', '?propertyLabel',
                                 '?valueLabel', '?value', '?property',
                                 '?propertyType', '?propertyOrder'])
                    .where('?dataset', 'qb:structure', '<' + settings.dsd + '>')
                    .where('?obs', 'qb:dataSet', '?dataset')
                    .where('?obs', '?property', '?value')
                    .where('?property', 'rdf:type', '?propertyType')
                    .where('?propertyType', 'rdfs:subClassOf', 'qb:ComponentProperty')
                    .where('?property', 'rdfs:label', '?propertyLabel')
                    .optional()
                        .where('?propertyClass', 'qb:dimension', '?property')
                        .where('?propertyClass', 'qb:order', '?propertyOrder')
                        .where('?value', 'rdfs:label', '?valueLabel')
                    .end();
                    //.orderby('?obs');

                var qurl = squery.config.endpoint
                    + '?query='
                    + $.URLEncode(squery.serialiseQuery());

                var fetch = $.when(
                    $.Deferred( // Get the google packages we need
                        function(deferred){
                            google.load('visualization', '1', {'packages':['corechart', 'table']});
                            google.setOnLoadCallback(function(){ deferred.resolve(); });
                        }
                    ),
                    $.Deferred(function(deferred){ // Fetch our observation data
                        $.ajax({
                            url: qurl,
                            dataType: 'json',
                            methos:'GET',
                            success: function(observations){
                                data.raw_observations = observations;
                                deferred.resolve();
                            }
                        });
                    })
                );

                // Wait for completion of the fetch before proceeding
                fetch.done(
                    function(){
                        // Build stores of Observations, Dimensions and Measures
                        var obs = {};
                        var dsd_comps = {};
                        $.each(data.raw_observations.bindings, function(i, ob) {
                            // Populate the Observation
                            if (!obs[ob.obs.value]) {
                                obs[ob.obs.value] = {};
                            }
                            obs[ob.obs.value].dataset = ob.dataset.value;
                            obs[ob.obs.value][ob.property.value] = {
                                value:ob.value.value,
                                label:ob.valueLabel?ob.valueLabel.value:null
                            };
                            // Ensure we've got the measure or dimension stores
                            var store = dsd_comps[ob.propertyType.value];
                            if(!store) {
                                store = dsd_comps[ob.propertyType.value] = {};
                            }
                            // Ensure we've got an entry in the appropriate store
                            var entry = store[ob.property.value];
                            if(!entry) {
                                entry = dsd_comps[ob.propertyType.value][ob.property.value] = {
                                   label:ob.propertyLabel.value,
                                   order:ob.propertyOrder.value,
                                   uri:ob.property.value,
                                   values:{}
                                };
                            }
                            // Now add to its known values
                            entry.values[ob.value.value] = ob.valueLabel?ob.valueLabel.value:null;
                        });
                        // Store parsed observations and dsd componetry
                        data.observations = obs;
                        data.dsd_components = dsd_comps;
                        // Call supplied callback & emit loaded event
                        $this.trigger('graphDataLoaded');
                        if (callback) {
                            callback(data);
                        }
                    }
                );
            }, // END loadGraphData

            /**
             * Check that we've got all the information we need
             * then hand off to a graph drawing routine
             */
            drawGraph: function(){
                if (plugins[settings.graph_type] !== undefined) {
                    var prepped_vis = plugins[settings.graph_type]
                                                    .prepare(data);
                    // Draw the chart
                    prepped_vis.chart.draw(
                        prepped_vis.table,
                        $.extend(settings.chart_options, prepped_vis.options, true)
                    );
                } else {
                    $.error('No Grapher plugin has been registered with an id of ' + settings.graph_type);
                }
            }
        }

        /**
         * Standard method calling logic
         */
        $.fn.yl_grapher = function(method){
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                return $.error( 'Method ' +  method + ' does not exist on jQuery.yl_grapher' );
            }
        }; // END YL_GRAPHER

        // Plugin registration
        $.fn.yl_grapher.registerPlugin = function(plugin){
            plugins[plugin.id] = plugin;
        };

    })(jQuery, google);
})
.then(
    // Load any Plugins we want included by default
    'resources/grapher_plugins/grapher.table.js' // Data Table Vis Plugin
);
