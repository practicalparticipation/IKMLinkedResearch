steal(
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquerytools/src/tabs/tabs.js', //jquery.tools Tabs
    'resources/jquery.sparql.js'
)
.css(
    'styles/grapher',   // Use our own CSS
    'styles/tabs'   // Tab styling
)
.then( function(){
    (function($){

        var settings = {
            dsd: 'http://data.younglives.org.uk/data/statistics/SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e/',
            sparql_endpoint: 'http://ocalhost/IKMLinkedResearch/build/service/sparql',
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
                        steal.dev.log('Building UI Layout');
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
                                steal.dev.log('In GO Callback');
                                steal.dev.log(data[0].id);
                            }
                        );
                    }
                });
            }, // END INIT

            /**
             * Fetch a full table of observations for our configured DSD
             */
            getObservations:function(callback) {
                steal.dev.log('Fetching Observations');
                steal.dev.log(settings.dsd);
                // Fetch observations for DSD
                var obs = [{'id':'test'}]; //making it up for now
                // Store observations
                steal.dev.log('Storing Observations');
                $(this).data('grapher').observations = obs;

                // Call supplied callback with obs data
                callback($(this).data('grapher').observations);
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
