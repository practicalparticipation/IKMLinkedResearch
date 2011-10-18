/**
 * Column Chart display plugin for
 * Graphing UI for YoungLives
 *
 */
 (function($, google){
        var vis = {};
        vis.id = 'columnchart';
        vis.title = "Column Chart";
        vis.google_components = ['corechart'];
        vis.options = {};
        vis.prepare = function(data) {
                    var chart = new google.visualization.ColumnChart(data.graph_target);
                    var table = new google.visualization.DataTable();
                    var options = {};
                    var dsd = data.dsd_components;

                    //Chosen Measure for the Y axis
                    var yMeasure = dsd.getComponent("http://data.younglives.org.uk/data/statistics/structure/components/measure-EthiopiaAccessToImprovedWaterAsPercentage");
                    var xDimension = dsd.getComponent("http://data.younglives.org.uk/data/statistics/structure/components/mothersEducationLevel");

                    var xGroup = dsd.getComponent("http://data.younglives.org.uk/data/statistics/structure/components/year");
                    //var xGroup = null;

                    // Fixed Values or other core Dimensions
                    var fixed = {"http://data.younglives.org.uk/data/statistics/structure/components/country":
                        "http://data.younglives.org.uk/data/statistics/Ethiopia",
                      //"http://data.younglives.org.uk/data/statistics/structure/components/year":
                      // 2002,
                      "http://data.younglives.org.uk/data/statistics/structure/components/cohort":
                        "http://data.younglives.org.uk/data/statistics/AllCohorts"
                        };
                    function getXLabelFromFixed(){

                        var label = xDimension.label;
                        if (xGroup) {
                            label += ' grouped by ' + xGroup.label;
                        }
                        label += ' for ';
                        label += _.map(fixed, function(v,i){
                            return dsd.getValueLabel(v, i);
                        }).join(', ');
                        return label;
                    };

                    // Group Column is first
                    // Force this to a string type to support grouping
                    if (xGroup) {
                        table.addColumn('string', xGroup.label);
                    }

                    // Now a column for each unique value of the selected xDimension
                    $.each(dsd.uniqueValuesFor(xDimension.uri), function(i, spec){
                        table.addColumn(yMeasure.type, spec.label);
                    });

                    // Sort out our data
                    // Get an array of observation objects which have values for all of our requested
                    // components
                    // Do this by getting lists of observation uris out of the components'
                    // observation stores then intersecting them.
                    var filtered_observation_uris =  _.map(
                        _.select(data.observations, function(ob){
                            var select = true;
                            $.each(fixed, function(comp,val){
                                if (ob[comp].value != val) {
                                    select = false;
                                }
                            });
                            return select;
                        }),
                        function(selected_obs){
                            return selected_obs.uri;
                        }
                    );

                    var obs_uris = _.intersect(
                        _.map(yMeasure.observations, function(v){return v.obs.value;}),
                        _.map(xDimension.observations, function(v){return v.obs.value;}),
                        //_.map(xGroup.observations, function(v){return v.obs.value;}),
                        filtered_observation_uris
                    );
                    // Transform the list of ids into a list of objects
                    var obs = _.map(obs_uris, function(v){ return data.observations[v]; });


                    if (xGroup){
                        // Sort the observation list into a tree based on the value of the xGroup component
                        var grouped_obs = _.groupBy(obs, function(item){
                            return item[xGroup.uri].label?item[xGroup.uri].label:item[xGroup.uri].value;
                        });
                        // Iterate through the grouped observations writing rows into the table
                        // Be sure to apply yhr same sort to the list as we did to get the column titles
                        _.each(_.keys(grouped_obs).sort(), function(v,i){
                            // Start the row with the grouping value we'll need to
                            // cast this to match the column type
                            var row = [v];
                            var entries = _.map(
                                                    _.sortBy(grouped_obs[v], function(ob){ return ob[xDimension.uri].value; }),
                                                    function(ob) { return ob[yMeasure.uri].value }
                                               );
                            table.addRow(row.concat(entries));
                        });
                    } else {


                            var entries = _.map(
                                                    _.sortBy(obs, function(ob){ return ob[xDimension.uri].value; }),
                                                    function(ob) { return ob[yMeasure.uri].value }
                                               );
                            table.addRow(entries);

                    }



                    // Create Options for display
                    var options = {};
                    options.title = '';
                    //options.legend = 'none';
                    options.hAxis = {title: getXLabelFromFixed()};
                    options.vAxis = {title: yMeasure.label};

                    return {'chart':chart, 'table':table, 'options':$.extend(vis.options, options, true)};
        };

        $.fn.yl_grapher.registerPlugin(vis);

 })(jQuery, google);
