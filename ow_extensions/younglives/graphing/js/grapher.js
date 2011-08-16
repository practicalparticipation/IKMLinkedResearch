/**
 * Grapher
 * Graphing UI for YoungLives
 *
 */
 (function($, google){
        var Grapher = {};
        
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
         * Observation Class
         */
        Grapher.Observation = Class.$extend({ __init__ : function() { console.log('called'); }});
        
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
                    {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Region',
                     label:"Region in Country"},
                    {uri:'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Gender',
                     label:"Gender of respondant"},
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
                items.push(Grapher.Observation.$withData(v));
            
            });
            
            Grapher.data = items;
            Grapher.target.trigger('grapherDataUpdated');
        };
        
        
        /**
        * Draw the selected visualisation
        */
        Grapher.drawVis = function(){
            // Set up chart options
            var options = {'title': 'The Title',
                                    'height': 400,
                                    'width': 600};
            
            // Prepare using the selected plugin
            if (Grapher.availablePlugins[Grapher.visType] != undefined) {
                var prepped_vis = Grapher.availablePlugins[Grapher.visType].prepare(Grapher);
                // Draw the chart
                prepped_vis.chart.draw(prepped_vis.table, options);
            } else {
                $.error('No Grapher plugin has been registered with an id of ' + Grapher.visType);
            }
        };
   
        /**
        * Draw the Configuration screen
        */
        Grapher.drawConfig = function(){
            var ui = $($.View('templates/configui.ejs', Grapher));
            
            $('.options', ui).buttonset();
            $('select', ui).multiselect({
                                                       header: "Select an option",
                                                       noneSelectedText: "Select an Option",
                                                       selectedList: 1,
                                                    multiple:false});
            
            // Connect the rechart button
            $('.rechart', ui).button()
                .bind('click', function(evt){
                    Grapher.selectedDimension = $('.dimensionchooser', Grapher.configui).val();
                    Grapher.groupbyDimension = $('input[name=groupby]:checked', Grapher.configui).attr('value');
                    Grapher.includeDimensions = _.map($('input[name=include]:checked'), function(el){ return $(el).attr('value');});
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
        Grapher.init = function( options ){  
        
            if (options) {
                $.extend(Grapher, $.fn.yl_grapher.defaults, options);
            };
            
            Grapher.target = this;
            
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
 
        $.fn.yl_grapher = function(method) {
            // Method calling logic
            if ( Grapher[method] ) {
              return Grapher[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
              return Grapher.init.apply( this, arguments );
            } else {
              $.error( 'Method ' +  method + ' does not exist on jQuery.yl_grapher' );
            }
        };
        
         $.fn.yl_grapher.plugins = {}; // Available Visualization types
        
        $.fn.yl_grapher.defaults = {  // Config object and api
            'useFixtures':false, //Use static data from the fixtures folder
            'sparql_endpoint': 'http://localhost/IKMLinkedResearch/build/service/sparql', // Sparql Endpoint
            'selectedMeasure':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample',
            'selectedDimension':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/UrbanOrRural',
            'groupbyDimension':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Country', // Dimension to group along the x axis
            'includeDimensions':['http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Cohort'],
            'visType': 'table', // Set default visualization
            'availablePlugins': $.fn.yl_grapher.plugins,
            'dimensions': { 'ignore':[ // Dimensions to omit from the UI
                                        //'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Round'
                                    ],
                                    'standard':[ // Dimensions to render as standard options
                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Cohort',
                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Country',
                                        'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Round'
                                    ] 
                                  },
             'measures': { 'ignore':[] // Measures to ignore from the ui
                                }
        };
        
        $.fn.yl_grapher.registerPlugin = function(plugin){
            $.fn.yl_grapher.plugins[plugin.id] = plugin;
        };
        
           
 })(jQuery, google);


