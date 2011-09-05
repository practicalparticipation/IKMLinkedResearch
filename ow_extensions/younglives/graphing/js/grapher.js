/**
 * Grapher
 * Graphing UI for YoungLives
 *
 */
(function($, google){
        var Grapher = {
            data:null, //store for processed observations
            dimensionValues:{ //Unique values for each standard dimension
                'cohort':["http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/YC", 
                              "http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/OC"],
                'round':["http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/roundTwo",
                             "http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/roundThree"],
                'country':["http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/India",
                                "http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Peru"]
            },
            includeDimensionFilters: {} // Filter settings for included dimensions
        };


	//setup some namespaces
	Grapher.yld =  'http://data.younglives.org.uk/data/';
	Grapher.ylcs =  'http://data.younglives.org.uk/data/summary/';
	Grapher.yls = 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/';
	Grapher.ylcomp =  'http://data.younglives.org.uk/component#';
	Grapher.qb = 'http://purl.org/linked-data/cube#';
	Grapher.rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
	Grapher.rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
	Grapher.sdmx_measure = 'http://purl.org/linked-data/sdmx/2009/measures#';
	Grapher.sdmx_dimension = 'http://purl.org/linked-data/sdmx/2009/dimension#'; 
	Grapher.sdmx_code = 'http://purl.org/linked-data/sdmx/2009/code#';
	Grapher.xsd = 'http://www.w3.org/2001/XMLSchema#';
	
	



        /**
         * Extracts and sluggifies the last uri component
         */
        Grapher.tokenizeURI = function(uri){
            var token = uri.slice(uri.lastIndexOf('/')+1).toLowerCase();
	    if (token.lastIndexOf('#')) {
		token = token.slice(token.lastIndexOf('#')+1);
	    }
            token = token.replace(/[^a-zA-Z 0-9]+/g, '');
            return token;
        };
        
        /**
         * Helper to work around cross browser issues with multiselect,
         * which some times returns an array of one value and sometimes
         * just the value
         * Extract the first item from a list or return a string
         * @param val - the return from .val(0 on the element
         * @param first - boolean - just return the first item in the list?
         */
        Grapher.sanitiseMultiSelect = function(val, first){
            if ($.isArray(val)) {
                if (first) {
                    return (val.length > 0)?val[0]:'';
                }
            }
            return val;
        };
    
        /**
         * Observation Class
         */
        Grapher.Observation = Class.$extend({ __init__ : function() { console.log('called'); }});
        
        /**
          * Fetch a DataStructureDefinition
          *      
PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?dsdlabel ?dimension ?dimlabel
WHERE {
         <http://data.younglives.org.uk/data/summary/SumaryStatistics-204dbdc0-c90b-4bd9-9632-0dfdf0c3b51f> rdfs:label ?dsdlabel.
  <http://data.younglives.org.uk/data/summary/SumaryStatistics-204dbdc0-c90b-4bd9-9632-0dfdf0c3b51f> qb:ComponentProperty ?dimension.
  ?dimension rdf:type qb:DimensionProperty.
  ?dimension rdfs:label ?dimlabel.
  }


LIMIT 20
          * Gets the dsd from the endpoint
          */
         Grapher.getDSD = function(uri, callback) {
             // Stubbed for now pending having a dsd in the store
		//ok make a spqarql request here to collect from the dsd with a value of uri
		//the dsd label , the dimensions and their labels.
		var sparql_q = $.sparql(Grapher.sparql_endpoint)
			.prefix('qb', Grapher.qb)
			.prefix('rdfs', Grapher.rdfs)
			.prefix('rdf', Grapher.rdf)
			.select(['?dsdlabel', '?dimlabel', '?dimension', '?measure', '?mealabel'])
				.where('<' + uri + '>', 'rdfs:label' , '?dsdlabel')
				.where('<' + uri + '>', 'qb:ComponentProperty', '?dimension')
				.where('?dimension', 'rdf:type', 'qb:DimensionProperty')
				.where('?dimension', 'rdfs:label', '?dimlabel')
				.where('<' + uri + '>', 'qb:ComponentProperty', '?measure')
				.where('?measure', 'rdf:type', 'qb:MeasureProperty')
				.where('?measure', 'rdfs:label', '?mealabel')
;
		sparql_q.execute(get_dsd);
		function get_dsd (dsd_data)  {
			if (dsd_data) {
				callback(dsd_data);
			}
		} 

             
         };
        
        /**
         * Process and store a dsd
         */
        Grapher.updateDSD = function(data){
            
            var dsd = {
                label : data[0]['dsdlabel']['value'], 
		        dimensions: [], //populate these later when we can loop
		        measures: [],
		        get_dimension: function(uri) {
                    var dimension =  _.detect(this.dimensions, function(dim){ 
                        return dim.uri === uri; 
                    });
                    return dimension;
                },
		        get_measure: function(uri) {
                    return _.detect(this.measures, function(mea){ return mea.uri === uri; });
                }
		        
		        /*
		        label: 'A Structure for Summary Statistics from Young Lives',
                        dimensions: [
                            {uri:'http://data.younglives.org.uk/component#localityType',
                             label:'Urban or Rural living location'},
                            {uri:'http://data.younglives.org.uk/component#mothersEducation',
                             label:"Mother's level of education"},
                            {uri:'http://data.younglives.org.uk/component#region',
                             label:"Region in Country"},
                            {uri:'http://data.younglives.org.uk/component#gender',
                             label:"Gender of respondant"},
                            {uri:'http://data.younglives.org.uk/component#cohort',
                             label:'The Young Lives study Cohort'},
                            {uri:'http://data.younglives.org.uk/component#country',
                             label:'The Country'},
                            {uri:'http://data.younglives.org.uk/component#round',
                             label:'The Young Lives study round'}   
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
		        */
            };
            
            var _meas = {}; // temp store for measure deduplication
            // Extract the Dimension and measure from each result group
            $.each(data, function(k, res) {
                var dim = {uri: res['dimension']['value'],
                                   label: res['dimlabel']['value']};
                dsd.dimensions.push(dim);
                
                var mea = {uri: res['measure']['value'],
                                    label: res['mealabel']['value']};
                _meas[mea.uri] = mea;
            });
	        // Deduplicate the measures
	        dsd.measures = _.values(_meas);
	    
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
         * Request graphable data and process the results
         */
        Grapher.getData = function(measure, dimension, callback){
            var measure_token = Grapher.tokenizeURI(measure);
            var dimension_token = Grapher.tokenizeURI(dimension);
            var url = null;
            
            // Construct our request url
            if (Grapher.useFixtures) { 
                url = './fixtures/obs_data.json';
            } else {
                var squery = $.sparql(Grapher.sparql_endpoint)
                    .prefix('ylss', 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/')
		    .prefix('ylcomp', 'http://data.younglives.org.uk/component#')
                    .prefix('qb', 'http://purl.org/linked-data/cube#')
                    .select(['?cohort', '?country', '?round', '?' + measure_token, '?' + dimension_token])
                        .where('?obs', '<'+measure+'>', '?' + measure_token)
                            .where('<'+dimension+'>', '?' + dimension_token)
                            .where('ylcomp:cohort', '?cohort')
                            .where('ylcomp:round', '?round')
                            .where('ylcomp:country', '?country');
                url = squery.config.endpoint + '?query=' + $.URLEncode(squery.serialiseQuery());
                        
            }
            
            // Make our ajax object
            var request = $.ajax({
                    type: "get",
                    url: url,
                    dataType: 'json'
            });
            
            // Execute the request, passing in success and error callbacks
            request.then(function(results){ callback(results); },
                                 function(){ $.error('Failed to get data'); });
            
        };
   
        /**
        * Process the sparql json and store in Grapher.data
        * Emit an updated event
        */
        Grapher.updateData = function(data){
            // Extract the results from the data
            data = data.results.bindings;
            
            var items = [];
            var dimValMap = {};
            $.each(data, function(i,v){
                // Data conversion
                $.each(v, function(key, val){
                    // Sort type and find labels
                    if ( val.type === 'typed-literal' && !isNaN(parseFloat(val.value)) ) {
                        val.value = parseFloat(val.value);
                        val.label = val.value.toString();
                        val.coltype = 'number';
                    }  
                    if ( val.type === 'uri' ) {
                        val.coltype = 'string';
                        // Try to extract a label from the result set, if none transform the uri
                        val.label = this.hasOwnProperty(key + '_label')
                            ?this[key + '_label']:val.value.slice(val.value.lastIndexOf('/')+1).replace(/_/g, ' ');
                    }                
                });
                items.push(Grapher.Observation.$withData(v));
            
            });
            
            Grapher.data = items;
            Grapher.target.trigger('grapherDataUpdated');
        };
        
        /**
         * Filter the observation data according to the settings for 
         * includeDimensionsFilters
         */
        Grapher.filterData = function(){
            var fd = _.select(Grapher.data.slice(0), function(obs){
                var filter = true;
                _.each(Grapher.includeDimensionFilters, function(values, dim){
                    // Only filter if filters are selected
                    if (values.length > 0) {
                        var token = Grapher.tokenizeURI(dim);
                        if (obs.hasOwnProperty(token)) {
                            if (!_.include(values, obs[token].value)) {
                                filter = false;
                            }
                        }
                    }
                });
                return filter;
            });   
            return fd;
        };
        
        /**
        * Draw the selected visualisation
        */
        Grapher.drawVis = function(){
            // Set up chart options defaults
            var options = {'height': 400,
                                     'width': 600};
            
            // Prepare using the selected plugin
            if (Grapher.availablePlugins[Grapher.visType] !== undefined) {
                var prepped_vis = Grapher.availablePlugins[Grapher.visType].prepare(Grapher);
                // Draw the chart
                prepped_vis.chart.draw(prepped_vis.table, $.extend(options, prepped_vis.options));
                Grapher.tabs.tabs('enable', 0);
                Grapher.tabs.tabs('select',0);
            } else {
                $.error('No Grapher plugin has been registered with an id of ' + Grapher.visType);
            }
        };
   
        /**
        * Draw the Configuration screen
        */
        Grapher.drawConfig = function(){
	    var ui = $($.View('templates/configui.ejs', Grapher));
            
            // Prettify our options checkboxes
            $('.options :checkbox', ui).iphoneStyle();
            // Find our multiple selects
            $('.filter .selector', ui).multiselect({selectedList:2});
            
            // Connect the filter selectors to their option checkboxes
            $('.options :checkbox', ui).change(function(){
                var filter = $('.filter', $(this).parents('.includechoice'));
                if ($(this).is(':checked')) {
                    filter.show('blind',{},500);
                } else {
                    filter.hide('blind',{},500);
                }
            });
            
            // Find all our single selects
            $('.dimensionchooser, .measurechooser, .groupbychooser', ui).multiselect(
                        {header: "Select an option",
                          noneSelectedText: "Select an Option",
                          selectedList: 1,
                          multiple:false});
                          
            // Connect the rechart button
            $('.rechart', ui).button()
                .bind('click', function(evt){
                var sms = Grapher.sanitiseMultiSelect; //shortcut
                    // Oddly we're getting arrays out of .val() for inputs which have been 'enhanced' by multiselect

                    Grapher.selectedDimension = sms($('.dimensionchooser', Grapher.configui).val(), true);
                    Grapher.selectedMeasure = sms($('.measurechooser', Grapher.configui).val(), true);
                    Grapher.groupbyDimension = sms($('.groupbychooser', Grapher.configui).val(), true);

                    Grapher.includeDimensions = _.map($('input[name=include]:checked'), function(el){ return $(el).attr('value');});
                    
                    // Extract the filter settings for the selected includeDimensions
                    var filters = {};
                    $.each(Grapher.includeDimensions, function(i, dim){
                        filters[dim] = sms(
                            $('.'+Grapher.tokenizeURI(dim)+'filter', Grapher.configui).val(),
                            false
                        );
                    });
                    Grapher.includeDimensionFilters = filters;
                    
                    Grapher.getData(Grapher.selectedMeasure, Grapher.selectedDimension, Grapher.updateData);
                    
                    // A choice as been made - enable the sharing tab
                    Grapher.tabs.tabs('enable', 1);
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
                Grapher.changeVisType($(this).val());
            });
            
            // Bindings for sharing dialog
            this.target.find('button.share-link').bind('click', function(evt, el){
                var opts = {
                    title: 'Sharable Graph Link',
                    code: Grapher.sharingURL()
                };
                Grapher.displayCode(opts);
            });
            this.target.find('button.embed-code').bind('click', function(evt, el){
                var opts = {
                    title: 'Embeddabe Graph Code',
                    code: Grapher.embedCode()
                };
                Grapher.displayCode(opts);
            });
        };
        
        /**
         * Set a different vis type and notify listeners
         */
        Grapher.changeVisType = function(visType) {
            Grapher.visType = visType;
            Grapher.target.trigger('grapherVisTypeChanged');
        };
        
        /**
         * Create a shareable url for the current graph config
         */
        Grapher.sharingURL = function(){
            var settings = $.deparam.querystring();
            var base = 'http://' + settings.http_host + settings.host_path;
            
            var params = {r: Grapher.activeDSD, //Set the ontowiki resource
                                     selectedMeasure:Grapher.selectedMeasure,
                                     selectedDimension:Grapher.selectedDimension};
            var share_url = $.param.querystring(base, params);
            return share_url;
        };
        
        /**
         *  Generate an embed code using either javascript or iframe
         *
         * @param embed_type {String} iframe, js
         */
        Grapher.embedCode = function(embed_type){
            // Build a sharing url and pass it to our iframe template
            var iframe = $.View('templates/iframe_embed.ejs', {url:Grapher.sharingURL()});
            return iframe;
        };
        
        /**
         * Display a sharing string in a popup
         */
        Grapher.displayCode = function(opts){
            var settings = {
                resizeable: true,
                minWidth: 400,
                autoOpen: true,
                show: 'fade',
                hide:'fade',
                dialogClass: 'sharing',
                buttons: {
                    'Close': function() {
                        $(this).dialog('close');
                    }
                },
                open: function () {
                    $('button.ui-button').blur();
                }
            };
            
            this.sharing_popup = $($.View('templates/sharing_popup.ejs', opts)).dialog($.extend(settings, opts));
   
        };
         
   
        /**
        * Initialise
        * 
        * Build html in target element
        */
        Grapher.init = function( options ){  
            window.Grapher = Grapher;
            if (options) {
                $.extend(Grapher, $.fn.yl_grapher.defaults, options);
            }
            
            Grapher.target = this;
            
            // Have we enough configuration data to draw an initial graph?
            var graphable = Boolean((Grapher.selectedMeasure  && Grapher.selectedDimension ));
            
            // Build our main layout

	        var markup = $($.View('templates/init.ejs', Grapher));
            // Fancify the vis selector
            $('#grapher-vis-type-switch', markup).multiselect(
                        {header: "Select a visualisation",
                          noneSelectedText: "Select a visualisation",
                          selectedList: 1,
                          multiple:false,
                          click: function(event, ui){ Grapher.changeVisType(ui.value); }
                         });
            //tabify the interface 
            // Disable the sharing and graph tabs if we're not yet graphable
            var tabopts = {};
            if (!graphable) { 
                $.extend(tabopts, {selected:2, disabled:[0,1]});
            }       
            Grapher.tabs = markup.tabs(tabopts);
            
            Grapher.vis = markup.find('#grapher-vis');
            Grapher.configui = markup.find('#grapher-configui');
            
            Grapher.target.append(markup);

            /** Volatile config actions:
             * Fetch the DSD and the data
             * Once we've got the data we can draw the inital graph
             * Once we've got both data and dsd we can draw the config
             * Once the graph and config have been drawn the first time we can 
             * set up bindings to refresh the graph and config at appropriate points
             */
             var fetches = $.when(
                 // Make sure the google libraries are in and then fetch 
                 $.Deferred(
                    function(deferred){
                        google.load('visualization', '1', {'packages':['corechart', 'table']});
                        google.setOnLoadCallback(function(){ deferred.resolve(); });
                    }
                 ),
              
                //Get the graphable data
                $.Deferred(
                    function(deferred){
                        if (graphable) {
                            Grapher.getData(
                                Grapher.selectedMeasure,
                                Grapher.selectedDimension,
                                function(data){
                                    Grapher.updateData(data);
                                    deferred.resolve();
                                }
                            );
                        } else {
                            deferred.resolve();
                        }
                }),
                
                // Get the configuration data
                $.Deferred(
                    function(deferred){
                        Grapher.getDSD(
                            Grapher.activeDSD,
                            function(data){
                                Grapher.updateDSD(data);
                                deferred.resolve();
                            }
                        );
                    }
                 )
             );
             
             // Once contingent events have all finished we can do the last bits and bobs
             fetches.done(
                function(){
                    if (graphable) {
                        Grapher.drawVis();
                    }
                    Grapher.drawConfig(); // Draw the config screen
                    Grapher.initBindings(); // Set up the bindings
                    if (!graphable) {
                        Grapher.tabs.tabs('select', 2);// switch to the config screen
                    }
                }
             );
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
            //'activeDSD': 'http://data.younglives.org.uk/data/summary/SummaryStatistics', //URI of the DSD to graph
            //'selectedMeasure':'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample',
            //'selectedDimension':'http://data.younglives.org.uk/component#localityType',
            'selectedDimension': false,
            'selectedMeasure': false,
            'groupbyDimension':'http://data.younglives.org.uk/component#country', // Dimension to group along the x axis
            'includeDimensions':['http://data.younglives.org.uk/component#cohort'],
            'visType': 'columnchart', // Set default visualization

            'availablePlugins': $.fn.yl_grapher.plugins,
            'dimensions': { 'ignore':[ // Dimensions to omit from the UI
                                        //'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Round'
                                    ],
                                    'standard':[ // Dimensions to render as standard options
                                        'http://data.younglives.org.uk/component#cohort',
                                        'http://data.younglives.org.uk/component#country',
                                        'http://data.younglives.org.uk/component#round',
                                    ] 
                                  },
             'measures': { 'ignore':[] // Measures to ignore from the ui
                                }
        };
        
        $.fn.yl_grapher.registerPlugin = function(plugin){
            $.fn.yl_grapher.plugins[plugin.id] = plugin;
        };
        
           
 })(jQuery, google);


