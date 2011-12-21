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

            markup = $.View('//grapher/views/init-configurator.ejs', {conf:conf, comps:comps, plugins:$.fn.yl_grapher.plugins()});

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
                // Set it in
                data.settings.config = newconf;
                grapher.trigger('grapherConfigChanged');
                return false;
            });
            
            // Handle changes to selects in the fixed section
            ui$.delegate('.fixes select', 'change', function(){
                var sibs;
                // Get our sibling selects
                sibs = $(this).siblings('select');

                if ($(this).val() === 'xGroup') {
                    //Disable our siblings' xGroup option
                    sibs.find('option[value="xGroup"]').attr('disabled', true);
                } else {
                    //otherwise enable all xGroup options if none are selected
                    sibs
                        .add(this)
                        .find('option[value="xGroup"]')
                        .removeAttr('disabled');
                }
            });
            // Trigger a change on any xGroup selected select in order to initialize this
            ui$.find('.fixes select option:selected[value="xGroup"]').eq(0).parent().trigger('change');
        };



        $.fn.yl_grapher.registerConfigurator(cf);
    })(jQuery);
});
