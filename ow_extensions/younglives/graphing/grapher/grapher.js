steal(
    {path:'https://www.google.com/jsapi'}, //Google JS Api
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/jquery.ba-bbq.js', // Ben Allmans back button and query parser
    'resources/underscore.js', // Underscore.js
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquerytools/src/tabs/tabs.js', //jquery.tools Tabs
    'resources/jquery.sparql.js', // SPARQL Query Generation
    //{path:'resources/jquery.fixture.js',
    // ignore:true}, // Add fixtures in development mode
    'resources/urlEncode.js' // URLEncoding Utility

)
.css(
    'styles/grapher',   // Use our own CSS
    'styles/tabs-accordion'   // Tab styling
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

        // Store for the configurator
        var configurator = null;

        // Registered via $.fn.yl_grapher.registerPlugin

        var settings = {
            default_graph_title: 'Chart',
            default_graph_type: 'linechart',
            dsd: null,
            sparql_endpoint: null,
            grapher_host:'localhost',
            ontowiki_path: null,
            grapher_path: '/IKMLinkedResearch/ow_extensions/younglives/graphing/grapher/grapher.html',
            shareable: true,
            configurable: true,
            chart_options: {'height': 400,
                                     'width': 630,
                                     'chartArea': {left:40,top:35,width:"440",height:"300"}
                                    },
            measureType: "MeasureProperty",
            dimensionType: "DimensionProperty"
        };

        // Settings items which are exportable via the sharing tab
        var exportables  = ['dsd', 'sparql_endpoint', 'http_host', 'host_path', 'config'];

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
                    var self = this,
                        $this = $(this),
                          data = $(this).data('grapher');
                    if (!data) {
                        data = {};
                        // Merge options with defaults
                        if (options) {
                            $.extend(settings, options, true);
                        }

                        // Build UI
                        var ui = $($.View('views/init-accordion.ejs', settings));

                        $this.html(ui);
                        $(".accordion", $this).tabs(".accordion div.pane",
                                                        {tabs:'h2',
                                                          effect:'slide',
                                                          initialIndex: null
                                                        });
                        // Store a reference to the place we ant the chart drawn
                        // Mostly for Google's convenience
                        data.graph_target = $("#grapher-vis", ui)[0];
                        // Store a reference to our settings
                        data.settings = settings;

                        // Store our state
                        $this.data('grapher', data);

                        // Set up sharing tab if available
                        if (settings.shareable) {
                            $this.yl_grapher('initSharing');
                        }



                        // Set up initial bindings
                        $this.bind('graphDataLoaded',
                            function(){
                                $this.yl_grapher('drawGraph');
                                // Set up the configurator if available
                                if (settings.configurable) {
                                    $this.yl_grapher('initConfigurator');
                                    // The configurator might generate config changes
                                    // so we'll listen for them
                                    $this.bind('grapherConfigChanged', function(){
                                        // redraw the graph
                                        $this.yl_grapher('drawGraph');
                                        // rewrite the title
                                        $('#chart_title', $this).html($.View('views/chart_pane_title.ejs', settings));
                                        // switch to the graph pane
                                        $('.accordion', $this).data('tabs').click(0);
                                    });
                                }
                            }
                        );
                        // DEBUG
                        window.grapherdata = data;
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
                    //.where('?propertyType', 'rdfs:subClassOf', 'qb:ComponentProperty')
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
                            method:'GET',
                            success: function(observations){
                                data.raw_observations = observations;
                                deferred.resolve();
                            },
                            fixture: 'fixtures/sparql_result.json'
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
                            var cast_val = $.fn.yl_grapher.sparqlCaster(ob.value);
                            obs[ob.obs.value].dataset = ob.dataset.value;
                            obs[ob.obs.value].uri = ob.obs.value;
                            obs[ob.obs.value][ob.property.value] = {
                                value:cast_val,
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
                                   order:ob.propertyOrder?ob.propertyOrder.value:null,
                                   uri:ob.property.value,
                                   type: typeof(cast_val),
                                   observations:[]
                                };
                            }
                            // Now add to its known values
                            entry.observations.push(ob);
                        });

                        // Enhance dsd_comps with utility functions
                        /**
                         * Return a sorted list of dsd components
                         * of the supplied type
                         * The sort order is Alpahbetical by component label
                         */
                        dsd_comps.sortType = function(type){
                            return _.sortBy(
                                            _.values(this[ns.qb + type]),
                                            function(comp){ return comp.label?comp.label:comp.uri; }
                                        );
                        };

                        /**
                         * Retrieve a component specification by URI
                         */
                        dsd_comps.getComponent = function(componentURI){
                            // Locate the component scan all our subobjects
                            var comps = Array.prototype.concat.apply([], _.map(this, function(v){
                                        return _.values(v);
                                })
                            );
                            // Find the coponent object we're looking for
                            var comp = _.detect(
                                    comps,
                                    function(val){
                                        return val.uri == componentURI;
                                    }
                            );
                            return comp;
                        }

                        /**
                         * Return an array of values for a dsd component
                         */

                        dsd_comps.valuesFor = _.memoize(function(componentURI) {
                            var comp = this.getComponent(componentURI);

                            return  _.map(comp.observations, function(ob){
                                return {label:ob.valueLabel?ob.valueLabel.value:null,
                                                value: $.fn.yl_grapher.sparqlCaster(ob.value)};
                            });
                        });

                        /**
                         * Return an array of unique values for a dsd component
                         */
                        dsd_comps.uniqueValuesFor = function(componentURI) {
                            return _.sortBy(
                                _.uniq(
                                    this.valuesFor(componentURI),
                                    false,
                                   function(val){return val.value; }
                                ),
                                function(val) {return val.label?val.label:val.value;}
                            );
                        }

                        /**
                         *Get the Label for a value for a component
                         *
                         *@param valuri {String} Value URI
                         *@param componentURI {String} Component URI
                         */
                        dsd_comps.getValueLabel = function(val, componentURI) {
                            var values = this.valuesFor(componentURI);
                            var obj =  _.detect(values, function(item){return item.value === val;});
                            if (obj.label) { return obj.label; }
                            else {
                                // Get the component label and append the val to it
                                return this.getComponent(componentURI).label + ':' + val.toString();
                            }
                        }

                        /**
                         * Returns true if all observations in the set have a value for the componets
                         */
                        dsd_comps.isCoreComponent = function(componentURI) {
                            return (this.valuesFor(componentURI).length === _.keys(obs).length);
                        }

                        dsd_comps.getMeasures = function () {
                            return _.sortBy(
                                    this["http://purl.org/linked-data/cube#MeasureProperty"],
                                    function(comp){ return comp.order; }
                                );
                        },

                        /**
                         * @function getDimensions
                         * @return {Object}
                         */
                        dsd_comps.getDimensions = function () {
                            return this["http://purl.org/linked-data/cube#DimensionProperty"];
                        },

                        /**
                         * @ function getGroupedDimensions
                         * Return all the dsd components which are dimensions
                         * @param {String} type 'core' or 'optional' get just an arry
                         * @return {Object}
                         */
                        dsd_comps.getGroupedDimensions = function(type) {
                            var grouped = _.groupBy(
                                dsd_comps.getDimensions(),
                                function(comp, uri){ return dsd_comps.isCoreComponent(uri)?'core':'optional'; }
                            );
                            if (type) {
                                return grouped[type]
                            } else {
                                return grouped
                            }

                        },

                        /**
                         * getDefaultConfig
                         *
                         * Analyses the dsd and attempts  a set of sensible grapher values
                         */
                        dsd_comps.getDefaultConfig = function(){
                            var config = {
                                graph_type: data.settings.default_graph_type,
                                yMeasure: null,
                                xDimension: null,
                                xGroup: null,
                                fixed: {//"http://data.younglives.org.uk/data/statistics/structure/components/country":
                                           //     "http://data.younglives.org.uk/data/statistics/Ethiopia",
                                        //"http://data.younglives.org.uk/data/statistics/structure/components/year":
                                        //         2009,
                                        //   "http://data.younglives.org.uk/data/statistics/structure/components/cohort":
                                        //        "http://data.younglives.org.uk/data/statistics/AllCohorts"
                                }
                            };

                            //Sort all the measures by order and grab the first
                             config.yMeasure =  dsd_comps.getMeasures()[0].uri;


                             // sort dimensions into core components and others
                            var dim_map = dsd_comps.getGroupedDimensions();

                            // sort the required components - group by the one with the largest range of values
                            // fix the rest to the first of their unique values
                            _.each(
                                _.sortBy(
                                    dim_map.core,
                                    function(item){
                                        return dsd_comps.uniqueValuesFor(item.uri).length;
                                    }
                                ).reverse(),
                                function(v,i){
                                    if (i === 0) {
                                        //group by the first item
                                        config.xGroup = v.uri;
                                    } else {
                                        // Fix the dimension to the first of its values
                                        config.fixed[v.uri] = dsd_comps.uniqueValuesFor(v.uri)[0].value;
                                    }
                                }
                            );

                            // Choose a dimension to graph! RANDOMLY
                            config.xDimension = dim_map.optional[Math.floor(Math.random()*dim_map.optional.length)].uri;
                            return config;

                        }

                        // Store parsed observations and dsd componetry
                        data.observations = obs;
                        data.dsd_components = dsd_comps;

                        // Check our config - calculating defaults if necessary
                        if (!data.settings.config) {
                            data.settings.config = data.dsd_components.getDefaultConfig();
                            $this.trigger('grapherConfigChanged');
                        }

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
                if (plugins[settings.config.graph_type] !== undefined) {
                    var prepped_vis = plugins[settings.config.graph_type]
                                                    .prepare(data);
                    // Draw the chart
                    prepped_vis.chart.draw(
                        prepped_vis.table,
                        $.extend(settings.chart_options, prepped_vis.options, true)
                    );
                } else {
                    $.error('No Grapher plugin has been registered with an id of ' + settings.config.graph_type);
                }
            }, //END drawGraph

            /**
             *Set up the sharing interface
             */
            initSharing: function(){
                var $this = $(this)
                        data = $(this).data('grapher');

                var shareui = $('#share', $this);

                // Call for an update of the sharing code whenever
                // an input element changes
                $('input', shareui).bind('change', function(evt){
                    $this.trigger('grapherUpdateSharing');
                });

                // Bind to changes to the configuration
                $this.bind('grapherConfigChanged grapherUpdateSharing', function(evt){
                    var req_params = {};
                    _.each(exportables, function(v,i){
                        req_params[v] = data.settings[v];
                    });

                    // Implement shareability
                    req_params.shareable = $('input[name="reshareable"]', shareui).is(':checked');
                    // Implement configurability
                    req_params.configurable = $('input[name="reconfigurable"]', shareui).is(':checked');

                    // Discover our share_type
                    var share_type = $('input[name="share_type"]:checked', shareui).val();

                    var base = 'http://' + data.settings.grapher_host;
                    /* data.settings.grapher_path is already a full url
                    var iframe_url = base + data.settings.grapher_path;
                    */
                    var link_url = base;
                    var iframe_url = data.settings.grapher_path;

                    if (data.settings.ontowiki_path) {
                        // inside an ontowiki deployment
                        link_url += data.settings.ontowiki_path;
                        // add the dsd as a resource param for ow
                        req_params['r'] = req_params.dsd;
                    } else {
                        // No Ontowiki detected
                        //link direct to grapher
                        link_url = iframe_url;
                    }

                    // calculate the url to the sabot script:
                    // take our grapher html pge and traverse to resources
                    var sabot_script_url = iframe_url.substr(0, iframe_url.lastIndexOf('/'));
                    sabot_script_url += '/resources/sabot-jqt.js';

                    var share_data = {link: $.param.querystring(link_url, req_params),
                                                 iframe_src: $.param.querystring(iframe_url, req_params),
                                                 sabot_script_url: sabot_script_url,
                                                 params: req_params};

                    $('.share_output', shareui).val($.View('views/sharing-' + share_type, share_data));

                });

                // Lastly - if we've just been called
                // check to see if we've something in our config
                // if so get on with it...
                if (data.settings.config) {
                    $this.trigger('grapherUpdateSharing');
                }
            }, //END initSharing

            initConfigurator: function () {
                var self = this,
                    $this = $(this);

                // Render the initial configurator
                var configui = $('#configui', $this);
                // empty configui to guard against memory leaks
                configui.empty();
                configui.html(configurator.render(self));

                // Set up configurator bindings
                configurator.setup(configui, self);

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

        /**
         * @function plugins
         * plugin retrieval
         * @param [{String}] id a plugin id to retrieve
         */
        $.fn.yl_grapher.plugins = function(id) {
            if (id) {
                return plugins[id];
            } else {
                return plugins;
            }
        }

        // Configurator registration
        $.fn.yl_grapher.registerConfigurator = function(conf){
            configurator = conf;
        }

        /**
         *Cast sparql result values to js types
         *
         *@param {Object} item A sparql result value
         *@returns {Object} the cast value
         */
        $.fn.yl_grapher.sparqlCaster = function(item){
            var datatypes = {
                "http://www.w3.org/2001/XMLSchema#integer": parseInt,
                "http://www.w3.org/2001/XMLSchema#double":parseFloat
            }
            if (item.type === "typed-literal") {
                return datatypes[item.datatype](item.value);
            } else {
                return item.value.toString();
            }
        };



    })(jQuery, google);
})
.then(
    // Load any Plugins we want included by default
    '//grapher/resources/grapher_plugins/grapher.table.js', // Data Table Plugin
    '//grapher/resources/grapher_plugins/grapher.columnchart.js', // Column Chart Plugin
    '//grapher/resources/grapher_plugins/grapher.linechart.js', // Line Chart Plugin
    '//grapher/resources/grapher_plugins/grapher.configurator.js'// Configurator plugin
);
