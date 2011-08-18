/**
 * Tabular display plugin for
 * Graphing UI for YoungLives
 *
 */
 (function($, google){
        var vis = {};
        
        vis.id = 'table';
        vis.title = "Data Table";
        vis.google_packages = ['table'];
        vis.prepare = function(Grapher) {
                    var observations = Grapher.filterData();
                    var vis_el = Grapher.vis[0]
                    var chart = new google.visualization.Table(vis_el);
                    var table = new google.visualization.DataTable();
                    
                    var rowspec = [];
                    rowspec.push(['dimension', Grapher.groupbyDimension, 'string']);
                    $.each(Grapher.includeDimensions, function(i,v){
                         rowspec.push(['dimension', v, 'string']);
                    });
                    rowspec.push(['dimension', Grapher.selectedDimension, 'string']);
                    rowspec.push(['measure', Grapher.selectedMeasure, 'number']);
                    
                    // Add a columns as per rowspec
                    $.each(rowspec, function(i,v){
                        // use the first item in the rowspec tuple to arbitrate between get+_dimension and get_measure
                        table.addColumn(v[2], Grapher.dsd['get_'+v[0]](v[1]).label);
                    });
                    
                    $.each(observations, function(i,obs) { 
                        var observation = obs;
                        var row = [];
                        $.each(rowspec, function(i,spec){
                            var data = observation[Grapher.tokenizeURI(spec[1])];
                            row.push(data[(data.type === 'uri')?'label':'value']);
                        });
                        table.addRow(row);
                    });
                    
                    return {'chart':chart, 'table':table};
        };
        
        $.fn.yl_grapher.registerPlugin(vis);
           
 })(jQuery, google);
