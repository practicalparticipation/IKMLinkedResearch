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
                // convert the config form into an object
                var conf = $.deparam($('#configure', ui$).serialize());
                // merge it over the top of the existing config
                var newconf = conf;//$.extend({}, data.settings.config, conf);

                // Because we've passed through a form we need to check any fixed
                // values - might they be numbers?
                // Also - find out of one fixed value has been selected as the
                // grouping dimension
                $.each(newconf.fixed, function(i,v){
                    // Cast number types
                    if (data.dsd_components.getDimensions()[i].type === 'number') {
                        newconf.fixed[i] = parseFloat(v);
                    }
                    // Check for xGroup
                    if (v === 'xGroup') {
                        newconf.xGroup = i;
                        delete newconf.fixed[i];
                    }
                });

                // Fix the measure
                //newconf.yMeasure = data.dsd_components.getMeasures()[0];


                // Set it in
                data.settings.config = newconf;
                grapher.trigger('grapherConfigChanged');
                return false;
            });
        };



        $.fn.yl_grapher.registerConfigurator(cf);
    })(jQuery);
});
