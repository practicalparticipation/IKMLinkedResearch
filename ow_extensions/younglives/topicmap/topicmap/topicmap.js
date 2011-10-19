steal(
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/underscore.js', // Underscore.js
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquery.sparql.js', // SPARQL Query Generation
    'resources/jit-custom.js', // Custom InfoVis Toolkit build from http://thejit.org/builder/
                                         // Contains spacetree and sunburst
    {path:'resources/jquery.fixture.js',
     ignore:true}, // Add fixtures in development mode
    'resources/urlEncode.js' // URLEncoding Utility
)
.css(
     'styles/topicmap'
)
.then(function(){
    (function($){

        var settings = {
            sparql_endpoint: null,
            vistype: 'Spacetree',
            spacetree: {
                selection_mode: 'normal' // or 'asroot'
            }
        };

        var methods = {
            init: function(options) {
                return this.each(function(){
                    var $this = $(this)
                          data = $(this).data('topicmap')
                    if (!data) {
                        data = {};
                        // Merge options with defaults
                        if (options) {
                            $.extend(settings, options);
                        }
                        /**
                         * Setup
                         */
                        var ui = $($.View('views/init.ejs'));
                        $this.html(ui);
                        
                        // Store our state
                        $this.data('topicmap', data);
                        
                        // Set up initial bindings
                        $this.bind('dataLoaded',
                            function(){
                                $this.yl_topicmap('draw' + settings.vistype);
                            }
                        );

                        /**
                         * Kick off by calling getData
                         */
                        $this.yl_topicmap('getData');
                    }
                });
            }, // END INIT

            /**
             * Fetch the topic map data from the server
             * Reformat it and store it as data.topicdata
             * Call any supplied callback and emit 'dataLoaded' when done
             */
            getData: function(callback){
                var $this = $(this)
                        data = $(this).data('topicmap');

                // Topic Map Data
                // Formulate a sparql request
                var squery = $.sparql(settings.sparql_endpoint);
                /**
                    EXAMPLE FROM GRAPHER
                    .prefix('qb', ns.qb)
                    .prefix('rdfs', ns.rdfs)
                    .prefix('rdf', ns.rdf)
                    .select(['?dataset', '?obs', '?propertyLabel',
                                 '?valueLabel', '?value', '?property',
                                 '?propertyType', '?propertyOrder'])
                    .where('?dataset', 'qb:structure', '<' + settings.dsd + '>')
                    .where('?obs', 'qb:dataSet', '?dataset')
                    .where('?obs', '?property', '?value')
                    .where('?property', 'rdf:type', '?propertyType')
                    .where('?propertyType', 'rdfs:subClassOf', 'qb:ComponentProperty')
                    .where('?property', 'rdfs:label', '?propertyLabel')
                    .optional()
                        .where('?propertyClass', 'qb:dimension', '?property')
                        .where('?propertyClass', 'qb:order', '?propertyOrder')
                        .where('?value', 'rdfs:label', '?valueLabel')
                    .end();
                    //.orderby('?obs');
                */
                var qurl = squery.config.endpoint
                    + '?query='
                    + $.URLEncode(squery.serialiseQuery());

                var fetch = $.when(
                    //$.Deferred( // Get the google packages we need
                    //    function(deferred){
                    //        google.load('visualization', '1', {'packages':['corechart', 'table']});
                    //        google.setOnLoadCallback(function(){ deferred.resolve(); });
                    //    }
                    //),
                    $.Deferred(function(deferred){ // Fetch our observation data
                        $.ajax({
                            url: qurl,
                            dataType: 'json',
                            method:'GET',
                            success: function(topicdata){
                                data.raw_topicdata = topicdata;
                                deferred.resolve();
                            },
                            fixture: 'fixtures/sparql_result.json'
                        });
                    })
                );

                // Wait for completion of the fetch before proceeding
                fetch.done(
                    function(){
                        // Manipulate data
                        // Actually Dummy data right now
                        // TODO: parse the json data into a tree
                        // structure
                        var manipulated = {  
                            id: "node02",  
                            name: "0.2",  
                            data: {},  
                            children: [{  
                                id: "node13",  
                                name: "1.3",  
                                data: {},  
                                children: []}]
                        };
                        
                        // Store parsed data
                        data.topicdata = manipulated;
                        
                        // Call supplied callback & emit loaded event
                        $this.trigger('dataLoaded');
                        if (callback) {
                            callback(data);
                        }
                        
                    }
                );
            },
            
            /**
             *Draw the visualisation using the data and settings provided
             */
            drawSpacetree: function(callback){
                var $this = $(this)
                        data = $(this).data('topicmap');
                $this.html('<h2>Topic Map</h2>');
                //Create a new ST instance  
                var st = new $jit.ST({  
                    //id of viz container element  in this case our own element
                    injectInto: $this.attr('id'),  
                    //set duration for the animation  
                    duration: 800,  
                    //set animation transition type  
                    transition: $jit.Trans.Quart.easeInOut,  
                    //set distance between node and its children  
                    levelDistance: 50,  
                    //enable panning  
                    Navigation: {  
                      enable:true,  
                      panning:true  
                    },  
                    //set node and edge styles  
                    //set overridable=true for styling individual  
                    //nodes or edges  
                    Node: {  
                        height: 20,  
                        width: 60,  
                        type: 'rectangle',  
                        color: '#aaa',  
                        overridable: true  
                    },  
                      
                    Edge: {  
                        type: 'bezier',  
                        overridable: true  
                    },  
                      
                    onBeforeCompute: function(node){  
                        console.log("loading " + node.name);  
                    },  
                      
                    onAfterCompute: function(){  
                        console.log("done");  
                    },  
                      
                    //This method is called on DOM label creation.  
                    //Use this method to add event handlers and styles to  
                    //your node.  
                    onCreateLabel: function(label, node){  
                        label.id = node.id;              
                        label.innerHTML = node.name;  
                        label.onclick = function(){  
                            if(settings.spacetree.selection_mode === 'normal') {  
                                st.onClick(node.id);  
                            } else {  
                                st.setRoot(node.id, 'animate');  
                            }  
                        };  
                        //set label styles  
                        var style = label.style;  
                        style.width = 60 + 'px';  
                        style.height = 17 + 'px';              
                        style.cursor = 'pointer';  
                        style.color = '#333';  
                        style.fontSize = '0.8em';  
                        style.textAlign= 'center';  
                        style.paddingTop = '3px';  
                    },  
                      
                    //This method is called right before plotting  
                    //a node. It's useful for changing an individual node  
                    //style properties before plotting it.  
                    //The data properties prefixed with a dollar  
                    //sign will override the global node style properties.  
                    onBeforePlotNode: function(node){  
                        //add some color to the nodes in the path between the  
                        //root node and the selected node.  
                        if (node.selected) {  
                            node.data.$color = "#ff7";  
                        }  
                        else {  
                            delete node.data.$color;  
                            //if the node belongs to the last plotted level  
                            if(!node.anySubnode("exist")) {  
                                //count children number  
                                var count = 0;  
                                node.eachSubnode(function(n) { count++; });  
                                //assign a node color based on  
                                //how many children it has  
                                node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];                      
                            }  
                        }  
                    },  
                      
                    //This method is called right before plotting  
                    //an edge. It's useful for changing an individual edge  
                    //style properties before plotting it.  
                    //Edge data proprties prefixed with a dollar sign will  
                    //override the Edge global style properties.  
                    onBeforePlotLine: function(adj){  
                        if (adj.nodeFrom.selected && adj.nodeTo.selected) {  
                            adj.data.$color = "#eed";  
                            adj.data.$lineWidth = 3;  
                        }  
                        else {  
                            delete adj.data.$color;  
                            delete adj.data.$lineWidth;  
                        }  
                    }  
                });
                //load json data  
                st.loadJSON(data.topicdata);  
                //compute node positions and layout  
                st.compute();  
                //optional: make a translation of the tree  
                //st.geom.translate(new $jit.Complex(-200, 0), "current");  
                //emulate a click on the root node.  
                st.onClick(st.root);
            }

        };

        /**
         * Standard method calling logic
         */
        $.fn.yl_topicmap = function(method){
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                return $.error( 'Method ' +  method + ' does not exist on jQuery.yl_topicmap' );
            }
        }; // END YL_TOPICMAP

    })(jQuery);
});
