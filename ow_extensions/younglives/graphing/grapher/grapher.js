steal(
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquerytools/src/tabs/tabs.js', //jquery.tools Tabs
    'resources/jquery.sparql.js', // SPARQL Query Generation
    'resources/urlEncode.js'
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

        var settings = {
            dsd: 'http://data.younglives.org.uk/data/statistics/SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e',
            sparql_endpoint: 'http://localhost/IKMLinkedResearch/build/service/sparql',
            http_host:'localhost',
            host_path: '/IKMLinkedResearch/build/younglives/display/r/ylstats?SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e'
        };

        var methods = {
            init: function(options) {
                return this.each(function(){
                    var $this = $(this)
                          data = $(this).data('grapher')
                    if (!data) {
                        data = {};
                        // Merge options with defaults
                        if (options) {
                            $.extend(settings, options);
                        }
                        /**
                         * Setup
                         */
                        var ui = $($.View('views/init.ejs'));
                        $("ul.tabs", ui).tabs("div.panes > div");
                        $this.html(ui);
                        // Store our state
                        $this.data('grapher', data);
                        /**
                         * Kick off by calling getObservations
                         */
                        $this.yl_grapher(
                            'getObservations',
                            function(data){
                                console.log(data);
                            }
                        );
                    }
                });
            }, // END INIT

            /**
             * Fetch a full table of observations for our configured DSD
             */
            getObservations:function(callback) {
                var $this = $(this)
                        data = $(this).data('grapher');

                steal.dev.log('Fetching Observations');
                steal.dev.log(settings.dsd);
                // Fetch observations for DSD
                // Formulate a sparql request
                var squery = $.sparql(settings.sparql_endpoint)
                    .prefix('qb', ns.qb)
                    .prefix('rdfs', ns.rdfs)
                    .prefix('rdf', ns.rdf)
                    .select(['?dataset', '?obs', '?propertyLabel',
                                 '?valueLabel', '?value', '?property',
                                 '?propertyType'])
                    .where('?dataset', 'qb:structure', '<' + settings.dsd + '>')
                    .where('?obs', 'qb:dataSet', '?dataset')
                    .where('?obs', '?property', '?value')
                    .where('?property', 'rdf:type', '?propertyType')
                    .where('?propertyType', 'rdfs:subClassOf', 'qb:ComponentProperty')
                    .where('?property', 'rdfs:label', '?propertyLabel')
                    .optional()
                        .where('?value', 'rdfs:label', '?valueLabel')
                    .end()
                    .orderby('?obs');

                var qurl = squery.config.endpoint
                    + '?query='
                    + $.URLEncode(squery.serialiseQuery());

                var fetch = $.when(
                    $.Deferred(function(deferred){
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
                            if(!dsd_comps[ob.propertyType.value]) {
                                dsd_comps[ob.propertyType.value] = {};
                            }

                            // Ensure we've got an entry in the appropriate store
                            if(!dsd_comps[ob.propertyType.value][ob.property.value]) {
                                dsd_comps[ob.propertyType.value][ob.property.value] = {
                                   label:ob.propertyLabel.value,
                                   uri:ob.property.value,
                                   values:{}
                                };
                            }
                            // Now add to its known values
                            dsd_comps[ob.propertyType.value][ob.property.value].values[ob.value.value] = ob.valueLabel?ob.valueLabel.value:null;

                        });

                        // Store parsed observations and dsd componetry
                        data.observations = obs;
                        data.dsd_components = dsd_comps;

                        // Call supplied callback data
                        callback(data);
                    }
                );


            } // END GETOBSERVATIONS

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

    })(jQuery);
});
