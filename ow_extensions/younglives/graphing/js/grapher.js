/**
 * Grapher
 * Graphing UI for YoungLives
 *
 */

var Grapher = {  // Config object and api
                            'target': $('#grapher'), // Target dom element
                            'useFixtures':false, //Use static data from the fixtures folder
                            'sparql_endpoint': 'http://localhost/IKMLinkedResearch/build/service/sparql', // Sparql Endpoint
                            'selectedMeasure':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample',
                            'selectedDimension':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/UrbanOrRural',
                            'groupbyDimension':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Country', // Dimension to group along the x axis
                            'includeDimensions':['http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Cohort'],
                            'visType': 'columnchart', // Set default visualization
                            'availableVisTypes': [ // Available Visualization types
                                    {id:'columnchart',
                                      title:'Column Chart'},
                                    {id:'table',
                                      title:'Data Table'}
                            ],
                            'dimensions': { 'ignore':[ // Dimensions to omit from the UI
                                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Round'
                                                    ],
                                                    'standard':[ // Dimensions to render as standard options
                                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Cohort',
                                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Country'
                                                    ] 
                                                  },
                             'measures': { 'ignore':[] // Measures to ignore from the ui
                                                }
                           }; 
(function(){ // Self-executing closure
    // Hook up to the dom
    Grapher.target.data('Grapher', Grapher);
    
    /**
     * Fetch a DataStructureDefinition
     *      
     * Gets the dsd from the endpoint
     */
    Grapher.getDSD = function(uri) {
        // Stubbed for now pending having a dsd in the store
        var data = {};
        Grapher.updateDSD(data);
    };
    
    /**
     * Extracts and sluggifies the last uri component
     */
    Grapher.tokenizeURI = function(uri){
        var token = uri.slice(uri.lastIndexOf('/')+1).toLowerCase();
        token = token.replace(/[^a-zA-Z 0-9]+/g, '');
        return token;
    };
    
    /**
     * Process and store a dsd
     */
    Grapher.updateDSD = function(data){
        //Building a structure by hand for now
        var dsd = {
            label: 'A Structure for Summary Statistics from Young Lives',
            dimensions: [
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/UrbanOrRural',
                 label:'Urban or Rural living location'},
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/MothersEducation',
                 label:"Mother's level of education"},
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Cohort',
                 label:'The Young Lives study Cohort'},
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Country',
                 label:'The Country'},
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Round',
                 label:'The Young Lives study round'},     
            ],
            get_dimension: function(uri) {
                var dimension =  _.detect(this.dimensions, function(dim){ 
                    return dim.uri === uri; 
                });
                return dimension;
            },
            measures: [
                {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample',
                label: 'The proportion of the sample in the categories noted'
                 }
            ],
            get_measure: function(uri) {
                return _.detect(this.measures, function(mea){ return mea.uri === uri; });
            }
        };
        
        dsd.chooseable_dimensions = _.select(dsd.dimensions, function(v){
                var ignore =  _.include(Grapher.dimensions.ignore, v.uri);
                var standard = _.include(Grapher.dimensions.standard, v.uri);
                return (!ignore && !standard);
        });
        
        dsd.standard_dimensions = _.select(dsd.dimensions, function(v){
                var ignore =  _.include(Grapher.dimensions.ignore, v.uri);
                var standard = _.include(Grapher.dimensions.standard, v.uri);
                return (!ignore && standard);
        });
        
        dsd.chooseable_measures = _.select(dsd.measures, function(v){
                var ignore =  _.include(Grapher.measures.ignore, v.uri);
                return !ignore;
        });
        
        Grapher.dsd = dsd;
        Grapher.target.trigger('grapherDSDUpdated');
    };
    
    /**
     * Request graphable data
     */
   Grapher.getData = function(measure, dimension){
        var measure_token = Grapher.tokenizeURI(measure);
        var dimension_token = Grapher.tokenizeURI(dimension);

        if (Grapher.useFixtures) { 
            $.ajax({url:'./fixtures/obs_data.json', 
                        dataType:'json',
                        success:function(data){Grapher.updateData(data.results.bindings);}
                      });
        } else {
            $.sparql(Grapher.sparql_endpoint)
                .prefix('ylss', 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/')
                .prefix('qb', 'http://purl.org/linked-data/cube#')
                .select(['?cohort', '?country', '?round', '?' + measure_token, '?' + dimension_token])
                    .where('?obs', '<'+measure+'>', '?' + measure_token)
                        .where('<'+dimension+'>', '?' + dimension_token)
                        .where('ylss:Cohort', '?cohort')
                        .where('ylss:Round', '?round')
                        .where('ylss:Country', '?country')
                .execute(Grapher.updateData);
        }
   };
   
   /**
    * Process the sparql json and store in Grapher.data
    * Emit an updated event
    */
   Grapher.updateData = function(data){
        var items = [];
        $.each(data, function(i,v){
            // Data conversion
            $.each(v, function(key, val){
                if ( val.type == 'typed-literal' && parseFloat(val.value) ) {
                    val.value = parseFloat(val.value);
                    val.label = val.value.toString();
                    val.coltype = 'number';
                }  
                if ( val.type == 'uri' ) {
                    val.coltype = 'string';
                    val.label = this.hasOwnProperty(key + '_label')
                        ?this[key + '_label']:val.value.slice(val.value.lastIndexOf('/')+1);
                }
            });
            items.push(v);
        
        });
        
        Grapher.data = items;
        Grapher.target.trigger('grapherDataUpdated');
   };
   
   Grapher.drawVis = function(){
        var vis_el = Grapher.vis[0]
        var options = {'title': 'The Title',
                                'height': 400,
                                'width': 400};
        var chart = null;
        var table = null;
        
        switch (Grapher.visType) {
            case 'table':
                chart = new google.visualization.Table(vis_el);
                table = new google.visualization.DataTable();
                
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
                
                $.each(Grapher.data, function(i,obs) { 
                    var observation = obs;
                    var row = [];
                    $.each(rowspec, function(i,spec){
                        var data = observation[Grapher.tokenizeURI(spec[1])];
                        row.push(data[(data.type === 'uri')?'label':'value']);
                    });
                    table.addRow(row);
                });
                break;
            case 'columnchart':
                chart = new google.visualization.ColumnChart(vis_el);
                table = new google.visualization.DataTable();
                
                // We need unique values for our selectedDimension groupbyDimension and the includeDimensions
                var selectedDimensionValues = _.uniq(_.map(Grapher.data, function(obs){ 
                    return obs[Grapher.tokenizeURI(Grapher.selectedDimension)].label;
                }));
                var groupbyDimensionValues = _.uniq(_.map(Grapher.data, function(obs){ 
                    return obs[Grapher.tokenizeURI(Grapher.groupbyDimension)].label;
                }));
                var includeDimensionsValues = [];
                $.each(Grapher.includeDimensions, function(i, dimuri){
                   includeDimensionsValues.push([dimuri, _.uniq(_.map(Grapher.data, function(obs){
                        return obs[Grapher.tokenizeURI(dimuri)].label;
                    }))]);
                });
                
                // Draw a column for the grouping dimension
                table.addColumn('string', Grapher.dsd.get_dimension(Grapher.groupbyDimension));
                
               
                
                // Prepare a data structure by agressive use of _.groupBy
                var bucket_stack = [Grapher.tokenizeURI(Grapher.groupbyDimension)].label,
                                                Grapher.tokenizeURI(Grapher.selectedDimension)].label];
                $.each(Grapher.includeDimensions, function(i, dim){
                    bucket_stack.push(Grapher.tokenizeURI(dim));
                });
                
                // We'd like a tree which has as many levels as there are items in bucket_stack
                
                $.each(bucket_stack, function(dim_token){
                    var token = dim_token;
                    if (!tree_data) {
                        tree_data = _.groupBy(Grapher.data, function(obs){ return obs[token].label });
                    } else {
                        $.each(tree_data,
                    }
                });                 
                
                
                
             
                
                table.addColumn('string', 'Country');
                table.addColumn('number', 'YC / Urban');
                table.addColumn('number', 'OC / Urban');
                table.addColumn('number', 'YC / Rural');
                table.addColumn('number', 'OC / Rural');
                
                var getVal = function(filters){
                    var item = _.detect(Grapher.data, function(item){
                        var pass = true;
                        _.each(filters, function(val, key){
                            if(item[key].label != val) { pass = false };
                        });
                        return pass;
                    });
                    return item ? item.value.value : 0;
                };
                
                table.addRow(['India', 
                                        getVal({cohort:'YC', dimension:'Urban'}),
                                        getVal({cohort:'OC',dimension:'Urban'}),
                                        getVal({cohort:'OC',dimension:'Rural'}),
                                        getVal({cohort:'YC',dimension:'Rural'})
                                       ]);
                break;
        }  
        // Draw the chart
        chart.draw(table, options);  
   };
   
   /**
    * Draw the Configuration screen
    */
   Grapher.drawConfig = function(){
        var ui = $($.View('templates/configui.ejs', Grapher.dsd));
        
        $('.options', ui).buttonset();
        
        // Connect the rechart button
        $('.rechart', ui).button()
            .bind('click', function(evt){
                Grapher.selectedDimension = $('.dimensionchooser', Grapher.configui).val();
                Grapher.groupbyDimension = $('input[name=groupby]:checked', Grapher.configui).attr('value');
                Grapher.getData(Grapher.selectedMeasure, Grapher.selectedDimension);
            });
        
        Grapher.configui.append(ui);
   };
   
   /**
    * Initialise Event Bindings
    */
   Grapher.initBindings = function(){
        this.target.bind('grapherDataUpdated', this.drawVis);
        this.target.bind('grapherVisTypeChanged', this.drawVis);
        
        this.target.bind('grapherDSDUpdated', this.drawConfig);
        
        this.target.find('#grapher-vis-type-switch').bind('change', function(evt, el){
            Grapher.visType = $(this).val();
            Grapher.target.trigger('grapherVisTypeChanged');
        });
   };
   
   /**
    * Initialise
    * 
    * Build html in target element
    */
   Grapher.init = function(){  
        // Build our main layout
        var markup = $($.View('templates/init.ejs', Grapher));
        
        markup.tabs();
        
        Grapher.vis = markup.find('#grapher-vis');
        Grapher.configui = markup.find('#grapher-configui');
        
        Grapher.target.append(markup);
        
        Grapher.initBindings();
        
        // Load the Visualization API and the piechart package.
       google.load('visualization', '1', {'packages':['corechart', 'table']});
       google.setOnLoadCallback(function(){
            Grapher.getDSD('http://data.younglives.org.uk/data/summary/SummaryStatistics');
            Grapher.getData(Grapher.selectedMeasure, Grapher.selectedDimension);
       });

   };

   // Kick Off
   Grapher.init();
   
}()); // End self-executing closure
