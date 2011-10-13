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
                    
                    /**
                    // We need unique values for our selectedDimension groupbyDimension and the includeDimensions
                    var groupbyDimensionValues = _.uniq(_.map(observations, function(obs){ 
                        return obs[Grapher.tokenizeURI(Grapher.groupbyDimension)].label;
                    }));
                    var selectedDimensionValues = _.uniq(_.map(observations, function(obs){ 
                        return obs[Grapher.tokenizeURI(Grapher.selectedDimension)].label;
                    }));
                    var includeDimensionsValues = [];
                    $.each(Grapher.includeDimensions, function(i, dimuri){
                       includeDimensionsValues.push([dimuri, _.uniq(_.map(observations, function(obs){
                            return obs[Grapher.tokenizeURI(dimuri)].label;
                        }))]);
                    });
                    
                    // Draw a column for the grouping dimension
                    table.addColumn('string', Grapher.dsd.get_dimension(Grapher.groupbyDimension).label);
                    
                    // Now add a column for each combination of each unique value from
                    // the selectedDimension and each includedDimensions
                    var colspec = [];
                    var dimension_loop = function(dimensions,dimdex, valstack, specs) {
                        if (dimdex === (dimensions.length -1)) {
                            // We're at the end of the stack run over the last set of values making specs
                            $.each(dimensions[dimdex][1], function(i, value) {
                                var spec = {};
                                spec.type = 'number';
                                spec.path = valstack.slice(0);// put a full copy of valstack into path
                                spec.path.push(value)
                                spec.label = spec.path.join(' / ');
                                specs.push(spec);
                            });
                        } else {
                            $.each(dimensions[dimdex][1], function(i, value) {
                                var newstack = valstack.slice(0);
                                newstack.push(value);
                                dimension_loop(dimensions, dimdex +1, newstack, specs);
                            });
                            
                        }
                    }
                    
                    $.each(selectedDimensionValues, function(i, sdv){
                        if (includeDimensionsValues.length > 0) {
                            dimension_loop(includeDimensionsValues, 0, [sdv], colspec);
                        } else {
                            var spec = {};
                             spec.type = 'number';
                             spec.label = sdv;
                             spec.path = [sdv];
                             colspec.push(spec);
                        }
                    });
                    $.each(colspec, function(i,v){
                        table.addColumn(v.type, v.label);
                    });

                    // Prepare a data structure by agressive use of _.groupBy
                    var bucket_stack = [Grapher.tokenizeURI(Grapher.groupbyDimension),
                                                    Grapher.tokenizeURI(Grapher.selectedDimension)];
                    $.each(Grapher.includeDimensions, function(i, dim){
                        bucket_stack.push(Grapher.tokenizeURI(dim));
                    });
                    
                    // We'd like a tree which has as many levels as there are items in bucket_stack
                    // 1. a recusive function which takes a list of observations, a list of dimension
                    // tokens, and the current position in that list.
                    //  It'll convert the supplied list into a bucketed object, then recurse into each bucket
                    
                    var paths = [];
                    var bucketeer = function(observations, keys, key_index) {
                        if (key_index < (keys.length)) {
                                observations = _.groupBy(observations, function(obs)  { return obs[keys[key_index]].label; });
                                $.each(observations, function(i, v) {
                                    observations[i] = bucketeer(v, keys, key_index +1);
                                });
                        } 
                        return observations;
                    };
                    var tree_data = bucketeer(observations, bucket_stack, 0);          

                    $.each(tree_data, function(i,v){
                        // For this data table each top level key in tree_data will build a row
                        // According to the column spec
                        var row = [i];
                        $.each(colspec, function(coldex, spec){
                            var val = 0;
                            var cur = v;
                            try {
                                $.each(spec.path, function(i, key) { //slice the rowspec to omit the first key which
                                                                                       // is handled by our outer iterator
                                    cur = cur[key];
                                });
                                row.push(cur[0][Grapher.tokenizeURI(Grapher.selectedMeasure)].value);
                            } catch (e) {
                                // If there's no data along this path put in a blank column
                                row.push(0);
                            }
                        });
                        table.addRow(row);
                    });
                    
                    // Create Options for display
                    var options = {};
                    options.title = Grapher.dsd.get_dimension(Grapher.selectedDimension).label;
                    options.legend = 'none';
                    options.hAxis = {title: Grapher.dsd.get_dimension(Grapher.groupbyDimension).label};
                    options.vAxis = {title: Grapher.dsd.get_measure(Grapher.selectedMeasure).label};
                    **/
                    return {'chart':chart, 'table':table, 'options':$.extend(vis.options, options, true)};
        };
        
        $.fn.yl_grapher.registerPlugin(vis);
           
 })(jQuery, google);
