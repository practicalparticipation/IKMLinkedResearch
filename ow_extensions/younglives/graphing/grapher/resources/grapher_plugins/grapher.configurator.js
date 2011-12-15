steal()
.then(function($){
    (function($){
        var cf = {done: true};


        cf.render = function (grapher) {
           var conf,
                data,
                dsd_comps,
                markup;
            data = grapher.data('grapher');
            conf =  data.settings.config;
            comps = data.dsd_components;

            markup = $.View('//grapher/views/init-configurator.ejs', {conf:conf, comps:comps});

            return $(markup);

        };

        // Set up bindings on the config ui
        cf.setup = function(ui$, grapher) {

            // on click of update
            ui$.delegate('.update', 'click', function(){
                var data = grapher.data('grapher');
                console.log(ui$);
                console.log(grapher);
                // convert the config form into an object
                var conf = $.deparam($('#configure', ui$).serialize());
                // merge it over the top of the existing config
                var newconf = $.extend({}, data.settings.config, conf);
                // Set it in
                data.settings.config = newconf;
                grapher.trigger('grapherConfigChanged');
                return false;
            });
        };



        $.fn.yl_grapher.registerConfigurator(cf);
    })(jQuery);
});
