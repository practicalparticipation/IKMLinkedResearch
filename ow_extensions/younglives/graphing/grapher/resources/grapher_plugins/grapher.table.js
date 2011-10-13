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
        vis.options = {};
        vis.prepare = function(data) {
                    var observations = [];
                    var chart = new google.visualization.Table(data.graph_target);
                    var table = new google.visualization.DataTable();
                    
                    var rowspec = [];
                    var components = data.dsd_components.getSortedComponents(data.settings.measureType);
                    components = components.concat(data.dsd_components.getSortedComponents(data.settings.dimensionType));
                    $.each(
                        components,
                        function(i, comp){
                            rowspec.push(comp);
                        }
                    );
                    
                    $.each(rowspec, function(i,v){
                        table.addColumn(v.type, v.label?v.label:v.uri);    
                    });
                   

                    $.each(data.observations, function(i,obs) {
                        var row = [];
                        $.each(rowspec, function(i,spec){
                            var cell = null;
                            if (obs[spec.uri]) {
                                cell = obs[spec.uri].label?obs[spec.uri].label:obs[spec.uri].value;
                            }
                            row.push(cell);
                        });
                        table.addRow(row);
                    });
                    
                    
                    //table.addRow(['VALUE']);
                    return {'chart':chart, 'table':table, 'options':vis.options};
        };

        $.fn.yl_grapher.registerPlugin(vis);

 })(jQuery, google);
