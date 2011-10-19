steal(
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquery.sparql.js'
)
.css(
     'styles/topicmap'
)
.then(function(){
    (function($){

        var settings = {

        };

        var methods = {
            init: function(options) {
                return this.each(function(){
                    var $this = $(this)
                          data = $(this).data('topicmap')
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
                        $this.html(ui);
                        // Store our state
                        $this.data('topicmap', data);
                    }
                });
            } // END INIT



        };

        /**
         * Standard method calling logic
         */
        $.fn.yl_topicmap = function(method){
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                return $.error( 'Method ' +  method + ' does not exist on jQuery.yl_topicmap' );
            }
        }; // END YL_TOPICMAP

    })(jQuery);
});
