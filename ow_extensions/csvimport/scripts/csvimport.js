var dimensions = {};
var uribase = '';

// RDFa
var attributeModel = "http://localhost/ontowiki/sdmx-attribute";
var conceptModel   = "http://localhost/ontowiki/sdmx-concept";
var dimensionModel = "http://localhost/ontowiki/sdmx-dimension";

$(document).ready(function () {
    if(typeof isTabular !== "undefined" && isTabular === true ) {return;}
    
    // load RDFa
    var rdf_script = document.createElement( 'script' );
    rdf_script.type = 'text/javascript';
    rdf_script.src = RDFAUTHOR_BASE+"src/rdfauthor.js";
    $('body').append( rdf_script );
        
    // on ready
    RDFAUTHOR_READY_CALLBACK = function () {
        // default graph
        RDFauthor.setInfoForGraph(RDFAUTHOR_DEFAULT_GRAPH, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(RDFAUTHOR_DEFAULT_GRAPH, "updateEndpoint", urlBase+"update");
      
        // attribute endpoint
        RDFauthor.setInfoForGraph(attributeModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(attributeModel, "updateEndpoint", urlBase+"update");
        
        // concept endpoint
        RDFauthor.setInfoForGraph(conceptModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(conceptModel, "updateEndpoint", urlBase+"update");
        
        // dim endpoint
        RDFauthor.setInfoForGraph(dimensionModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(dimensionModel, "updateEndpoint", urlBase+"update");
    };
    
    // check for trailing slash
    var checkSlash = function(uri){        
        if( uri.charAt(uri.length - 1) !== "/" ){ 
            uri += '/';
        }
        return uri;
    };
        
    // set uribase value
    if( uribase.length < 1 && typeof salt !== 'undefined' ){
        uribase = RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/';    
    }
    $("#uribase").val(uribase);
    
    $("#uribase").keyup(function(){
        if( $(this).val().length < 3 ) {return;}
        var oldbase = uribase;
        uribase = $(this).val();
        
        // temp vars for new keys
        var newKey = '';
        var newEKey = '';
        var di, ele ;
        for (di in dimensions) {
	    if (dimensions.hasOwnProperty(di)) {
		newKey = checkSlash( di.replace(oldbase, uribase) );
		dimensions[newKey] = dimensions[di];
		
		for(ele in dimensions[di]["elements"]){
			if (dimensions[di]["elements"].hasOwnProperty(ele)) {
				newEKey = checkSlash( ele.replace(oldbase, uribase) );
				dimensions[newKey]["elements"][newEKey] = dimensions[di]["elements"][ele];
				
				// delete old elements
				delete dimensions[di]["elements"][ele];
			}
		}
            }
            // delete old stuff            
            delete dimensions[di];
        }
        
        dimensions.uribase = uribase;
    });
    
    /* functions */
    var _getColor = function () {
        var r = Math.round(Math.random() * (90 - 50) + 50);
        var g = Math.round(Math.random() * (90 - 50) + 50);
        var b = Math.round(Math.random() * (90 - 50) + 50);

        return 'rgb(' + r + '%,' + g + '%,' + b + '%)';
    };

    var _getURI = function (name) {
        var prefix = uribase;
        prefix = checkSlash(prefix);
        var URI = prefix + name.replace(/[^A-Za-z0-9_-]/, ''); //RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/' + name.replace(/[^A-Za-z0-9_-]/, '');
        return URI;
    };

    /* vars */
    var currentColor;
    var currentDimension;
    var selectionMode = 'dimension';
    var datarange = {};

    $('table.csvimport td').dblclick(function(){
        if (selectionMode !== 'dimension') {return;}

        var id = $(this).attr('id');
        var URI = _getURI(id);
        var ids = id.split('-');
        var row = ids[0].replace('r', '');
        var col = ids[1].replace('c', '');
        var selid = null;

        var select = prompt('(De)Select whole row (r) or column (c)?');
        if(select === "r" || select === "row"){
            selid = 'id*=r'+row+'-';
        }else if(select === "c" || select === "column"){
            selid = 'id$=c'+col;
        }

        $('table.csvimport td['+selid+']').each(function(){
            var id = $(this).attr('id');
            var URI = _getURI(id);
            var ids = id.split('-');
            var row = ids[0].replace('r', '');
            var col = ids[1].replace('c', '');

            if($.trim($(this).text()).length < 1) {return;}

            if (!$(this).hasClass('csv-highlighted')) {
                $(this).data('dimension', null);
                $(this).css('background-color', currentColor);
                $(this).addClass('csv-highlighted');

                dimensions[currentDimension]['elements'][URI] = {
                    'row': row,
                    'col': col,
                    'label': $.trim($(this).text())
                };
            } else {
                $(this).data('dimension', currentDimension);
                $(this).css('background-color', 'transparent');
                $(this).removeClass('csv-highlighted');

                // undefine
                delete dimensions[currentDimension]['elements'][URI];
            }
        });
    });

    $('table.csvimport td').click(function () {
        var id = $(this).attr('id');
        var URI = _getURI(id);
        var ids = id.split('-');
        var row = ids[0].replace('r', '');
        var col = ids[1].replace('c', '');

        if (selectionMode === 'dimension') {
            
            if ( dimensions[currentDimension].attribute ){
                // attributes stuff here
                if (!$(this).hasClass('csv-highlighted')) {
                    if(dimensions[currentDimension].selected){
                        // clear old stuff
                        $('td[about='+currentDimension+']').data('dimension', currentDimension);
                        $('td[about='+currentDimension+']').css('background-color', 'transparent');
                        $('td[about='+currentDimension+']').removeClass('csv-highlighted');
                        dimensions[currentDimension].value = '';
                        dimensions[currentDimension].selected = false;
                    }
                    
                    $(this).data('dimension', null);
                    $(this).css('background-color', currentColor);
                    $(this).addClass('csv-highlighted');
                    $(this).attr("about", currentDimension);

                    dimensions[currentDimension].row = row;
                    dimensions[currentDimension].col = col;
                    dimensions[currentDimension].value = $.trim($(this).text());
                    dimensions[currentDimension].selected = true;
                } else {
                    $(this).data('dimension', currentDimension);
                    $(this).css('background-color', 'transparent');
                    $(this).removeClass('csv-highlighted');

                    // undefine
                    dimensions[currentDimension].value = '';
                    dimensions[currentDimension].selected = false;
                }
            } else { 
                // dimensions stuff here
                if (!$(this).hasClass('csv-highlighted')) {
                    $(this).data('dimension', null);
                    $(this).css('background-color', currentColor);
                    $(this).addClass('csv-highlighted');

                    dimensions[currentDimension]['elements'][URI] = {
                        'row': row,
                        'col': col,
                        'label': $.trim($(this).text())
                    };
                } else {
                    $(this).data('dimension', currentDimension);
                    $(this).css('background-color', 'transparent');
                    $(this).removeClass('csv-highlighted');

                    // undefine
                    delete dimensions[currentDimension]['elements'][URI];
                }
            }
        } else {
            if (selectionMode === 'start') {
                datarange['start'] = {'row': row, 'col': col};
                selectionMode = 'end';
            } else if (selectionMode === 'end') {
                datarange['end'] = {'row': row, 'col': col};
                selectionMode = 'dimension';
                $('#csvimportDatarange').html(' (' +
                    datarange['start'].row + ',' +
                    datarange['start'].col + ') to (' +
                    datarange['end'].row + ',' +
                    datarange['end'].col + ')');
            }
        }
    });


    /*
     *  DIMENSIONS STUFF
     */
    $('#btn-add-dimension').click(function () {
        var name = prompt('Dimension name:');
        if ( typeof name === 'undefined' || name.length < 1) {return;}
        
        var eid = name.replace(" ","_");
        var dimensionInfo = {
            color: _getColor(),
            label: $.trim(name),
            elements: {}
        };
        var dimensionURI = _getURI(name);
        dimensions[dimensionURI] = dimensionInfo;
        currentDimension = dimensionURI;
        currentColor = dimensionInfo.color;
        var htmlText = '<tr style="background-color:' + currentColor + '"><td name="'+name+'">' + name; 
        htmlText += '<br/><sub>subPropertyOf:</sub><span id="dim_'+eid+'_0"></span>'+
                    '<sub>concept:</sub><span id="dim_'+eid+'_1"></span>';
        htmlText += '</td></tr>';
        var tr = $(htmlText).data('dimension', name);

        $('#csvimport-dimensions').append(tr);
        
        // property selector
        _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
        var input0 = $("#dim_"+eid+"_0");
        selectorOptions = {
            container: input0,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input0).val(uri);
                dimensions[dimensionURI].subproperty = uri;
            }
        };
        // FIXME: title hack        
        _propertySelector = new ObjectSelector(dimensionModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
        _propertySelector.presentInContainer();
        
        // property selector 2
        var input1 = $("#dim_"+eid+"_1");
        selectorOptions = {
            container: input1,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input1).val(uri);
                dimensions[dimensionURI].concept = uri;
            }
        };
        _propertySelector = new ObjectSelector(conceptModel, _subjectURI, "http://purl.org/linked-data/cube#concept", selectorOptions);
        _propertySelector.presentInContainer();
        
    });
    
    $('#csvimport-dimensions tr').live('click', function () {
        var name = $(this).children('td').eq(0).attr("name");

        var URI = $(this).attr("about");
        if( typeof URI === "undefined" ){
            URI = _getURI(name);
        }

        var dimInfo = dimensions[URI];        
        currentDimension = URI;        
        currentColor = dimInfo.color;        
    });

    $('#csvimport-dimensions tr').live('dblclick', function () {
        var name = $(this).children('td').eq(0).attr("name");
        var URI = _getURI(name);
        var newName = prompt('New name:', name);
        if ( typeof newName === 'undefined' || newName.length < 1) {return;}
        var newURI = _getURI(newName);

        var dimInfo = dimensions[URI];
        dimInfo.label = $.trim(newName);
        dimensions[newURI] = dimInfo;
        delete dimensions[URI];
        $(this).children('td').eq(0).html( $(this).children('td').eq(0).html().replace(name,newName) );
        $(this).children('td').eq(0).attr("name",newName);
    });


    /*
     * DATA RANGE 
     */
    $('#btn-datarange').live('click', function () {
        alert('Click on the upper left, then on the lower right data cell.');
        selectionMode = 'start';
    });
    
    /*
     * ATTRIBUTES STUFF 
     */
    $('#btn-attribute').live('click', function () {        
        var name = prompt('Attribute name:');
        if ( typeof name === 'undefined' || name.length < 1) {return;}
        
        var eid = name.replace(" ","_");
        var attributeInfo = {
            color: _getColor(),
            label: $.trim(name),
            attribute: true,
            selected: false,
            row: -1,
            col: -1,
            value: '',
            uri: ''
        };
        var attributeURI = _getURI(name);
        dimensions[attributeURI] = attributeInfo;
        currentDimension = attributeURI;
        currentColor = attributeInfo.color;
        var htmlText = '<tr style="background-color:' + currentColor + '"><td name="'+name+'">' + name; 
        htmlText += '<br/><sub>attribute:</sub><span id="attr_'+eid+'_0"></span>';
        htmlText += '</td></tr>';
        var tr = $(htmlText).data('attribute', name);

        $('#csvimport-attributes').append(tr);
        
        // property selector
        _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
        var input0 = $("#attr_"+eid+"_0");
        selectorOptions = {
            container: input0,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input0).val(uri);
                dimensions[attributeURI].uri = uri;
            }
        };
        // FIXME: title hack        
        _propertySelector = new ObjectSelector(attributeModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
        _propertySelector.presentInContainer();
        
        
    });
    
    $('#csvimport-attributes tr').live('click', function () {
        var name = $(this).children('td').eq(0).attr("name");

        var URI = $(this).attr("about");
        if( typeof URI === "undefined" ){
            URI = _getURI(name);
        }

        var dimInfo = dimensions[URI];        
        currentDimension = URI;        
        currentColor = dimInfo.color;        
    });

    $('#csvimport-attributes tr').live('dblclick', function () {
        var name = $(this).children('td').eq(0).attr("name");
        var URI = _getURI(name);
        var newName = prompt('New name:', name);
        if ( typeof newName === 'undefined' || newName.length < 1) {return;}
        var newURI = _getURI(newName);

        var dimInfo = dimensions[URI];
        dimInfo.label = $.trim(newName);
        dimensions[newURI] = dimInfo;
        delete dimensions[URI];
        $(this).children('td').eq(0).html( $(this).children('td').eq(0).html().replace(name,newName) );
        $(this).children('td').eq(0).attr("name",newName);
    });

    

    /*
     * EXTRACT BTN
     */
    $('#extract').click(function () {
        /*if( typeof(decodedConfig) == 'undefined' || decodedConfig === false ){
            if ($.isEmptyObject(dimensions)) {
                alert('Please select at least one dimension.');
                return false;
            };

            if ($.isEmptyObject(datarange)) {
                alert('Please select data range.');
                return false;
            }

            for (d in dimensions) {
                
                if( typeof dimensions[d].attribute != 'undefined' && dimensions[d].attribute == true ){
                    if(dimensions[d].uri.length < 1){
                        alert('One or several attributes missing URI!');
                        return;
                    }
                }else{
                    for (e in dimensions[d]['elements']) {
                        dimensions[d]['elements'][e]['items'] = datarange;
                    }
                }
            }
            
            dimensions.uribase = [uribase];
        }
*/

/*IMPORTANT
new code for importing younglives summary data.

add these lines 
 <script type="text/javascript" src="<?php echo $this->staticUrlBase;?>extensions/younglives/graphing/js/urlEncode.js"></script>
 <script type="text/javascript" src="<?php echo $this->staticUrlBase;?>extensions/younglives/graphing/js/jquery.sparql.js"></script>
to application/views/templates/layouts/layout.phtml 
and add  a symbolic link from  /ow_extensions/younglives to build/extensions/younglives
TODO
ad this change to the buildout somenow

*/

	//some namespaces:
	var yld =  'http://data.younglives.org.uk/data/';
	var ylcs =  'http://data.younglives.org.uk/data/summary/';
	var yls = 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/';
	var ylcomp =  'http://data.younglives.org.uk/component#';
	var qb = 'http://purl.org/linked-data/cube#';
	var rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
	var rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
	var sdmx_measure = 'http://purl.org/linked-data/sdmx/2009/measures#';
	var sdmx_dimension = 'http://purl.org/linked-data/sdmx/2009/dimension#'; 
	var sdmx_code = 'http://purl.org/linked-data/sdmx/2009/code#';
	var xsd = 'http://www.w3.org/2001/XMLSchema#';
        
	/**
	 * generate a random (type 4) uuid
	 *
	 */
	function  uuid() {
	    return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
	    });
	};
	
	//helpful functionality
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	Array.prototype.getUniquePoints = function () {
		var a = [];
		var l = this.length;
		var i, j;
		for(i=0; i<l; i++) {
			for(j=i+1; j<l; j++) {
				// If this[i] is found later in the array
				if (compare_points(this[i], this[j])) {
					j = ++i;
				}
			}
		a.push(this[i]);
		}
		return a;
	};
	Array.prototype.addArray = function (array) {
		var x;
		for (x in array) {if (array.hasOwnProperty(x)) {this.push(array[x]);}}
	};

	var top_left = {};
	var bottom_right = {};
	var triples = {};


	var make_rdf_object = function (val_str, namespace) {
		//this takes the value as a string, and sees if it can be cast as an integer, if so returns an 
		//object representing the value as a literal integer, if val_str is true or false then returns a literal boolean 
		//if not it returns an object representing the value as a uri
		if (!namespace) {
			namespace = '';
		}
		if (val_str) {
			//val_str's cannot contain spaces ?ontowiki limitation, they are replaced here with underscroes
			val_str = val_str.replace(/ /g, '_');
			if (!isNaN(parseInt(val_str, 10))) { //not this a good test as '1fish' tests true.. but it will have to do
				return {"type": "literal", "value": val_str, "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" };
			} else if (val_str.toLowerCase() === 'false' || val_str.toLowerCase() === 'true'){
				return {"type": "literal", "value": val_str.toLowerCase(), "datatype" : "http://www.w3.org/2001/XMLSchema#boolean" };
			} else 	{
				return {"type": "uri", "value": namespace + val_str };
			}
		}

	};
	
	var make_rdf_label = function (string) {
		//this takes a string and returns an object representing an rdf label literal in english
		if (string) {
			return [{"type": "literal", "value": string, "lang" : "en"}];
		}
	};
	
	var make_rdf_Observation_object = function (val) {
		//this takes  very like make_rdf_object, but will always return a literal, of integer decimal boolean, or lang en
		if (parseFloat(val)) {
		    var type = (parseFloat(val) % 1 == 0)?'integer':'decimal';
		    return {"type": "literal", 
		                  "value": parseFloat(val), 
		                  "datatype" : "http://www.w3.org/2001/XMLSchema#" + type };
		} else if (val.toLowerCase() === 'false' || val.toLowerCase() === 'true'){
			return {"type": "literal", 
				              "value": val.toLowerCase(), 
				              "datatype" : "http://www.w3.org/2001/XMLSchema#boolean" };
		} else {
		    return {"type": "literal", "value": val, "lang" : "en"  };
		}
	};


	// make an overall object to send, we will build it up peice by piece.

	var labels = {};
	var dsd = {};
	//each dsd is unique, some may not be stored, if one already exists see comment below
	var dsd_name = 'SumaryStatistics-' + uuid() ;

	//in the new wold order we will create a new dsd per import. we will not submit it if one with exactly the same components exists, in this case we will just add an additional label, if the label does not exist already. this requires that we do away with optional and ordered components
	
	// define a list of dimensions, these are core and may well not be in the imported sheet itself, 
	//TODO prompt for label elements, or use fixed as below
	
	var components =       [['Cohort', 'label for Cohort dimension'],
				['Country', 'label for Country dimension'],
				['Round', 'label for Round dimension']]; 
	//NOTE sample size is nolonger considered core

	//alwways need this
	dsd[ylcs + dsd_name] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataStructureDefinition" }]};
	//loop to add. we can only add one extra item from the array above, so can't have order and optional. limit of our code
	var dsd_components = [];
	var comp;
	var dimensions = {};
	//ok try this without using blank nodes 
	for (comp in components) {
		if  ( components.hasOwnProperty(comp) ) {
			dsd_components.push(make_rdf_object(components[comp][0], ylcomp));
			if (components[comp][1]){
				labels[ylcomp + components[comp][0]] = {};
				//add a label to this component
				labels[ylcomp + components[comp][0]][rdfs + 'label'] = make_rdf_label(components[comp][1]);
				//add dimension difinitions	#
				dimensions[ylcomp + components[comp][0]] = {};
				dimensions[ylcomp + components[comp][0]]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [make_rdf_object('dimension', qb), make_rdf_object('component', qb)];
				dimensions[ylcomp + components[comp][0]][qb + 'order'] = [make_rdf_object('1')];
				dimensions[ylcomp + components[comp][0]][qb + 'componentRequired'] = [make_rdf_object("true")];
			}
		}
	}
	
	//add the component triple
	dsd[ylcs + dsd_name][qb + "component"] = dsd_components;


	//TODO PROMPT USER FOR THESE VALUES
	var yl_country = ['Ethiopia', 'India', 'Peru', 'Vietnam'][1];
	var yl_round = ['RoundOne', 'RoundTwo', 'RoundThree', 'RoundFour', 'RoundFive'][2];
	
	//now we can make a dataset name
	//var dataset_name = yl_country + '_' + yl_round;
	//new plan
	var dataset_name = 'dataset-' + uuid();


/*
stage 2 
add the measure property needs to make triples as below 
*/
/*yls:measure-ProportionOfSample a rdf:Property, qb:MeasureProperty;
	rdfs:label "The proportion of the total sample that belong in all the categories noted"@en;
	rdfs:subPropertyOf sdmx-measure:obsValue;
	rdfs:range xsd:decimal .

triples[yls + "measure-ProportionOfSample"] = { };
triples[yls + "measure-ProportionOfSample"][rdfs + "label"] = [{ "type": "literal", 
			 "value" : "The proportion of the total sample that belong in all the categories noted", 
			  "lang" : "en"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "subPropertyOf"] = [{"type": "uri", "value" : sdmx_measure + "obsValue"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "range"] =  [{"type": "uri", "value" : xsd + "decimal"}]; 
triples[yls + "measure-ProportionOfSample"][rdf + "Property"] = [{"type": "uri", "value" : qb + "MeasureProperty"}];
*/
/*
TODO update to be based on user input
this code provides a fixed uneditable measure*/
	var input_measure_name = 'ProportionOfSample';
	var measure_name = 'measure-' + input_measure_name;
	var measure_label = 'The proportion of the total sample that belong in all the categories noted';
	var measure_type = xsd + 'decimal';

	var measure = {};
	measure[yls + measure_name] = { };
	labels[yls + measure_name] = {};
	labels[yls + measure_name][rdfs + 'label'] =  make_rdf_label(measure_label);
	measure[yls + measure_name][rdfs + "subPropertyOf"] = [make_rdf_object("obsValue", sdmx_measure)];
	measure[yls + measure_name][rdfs + "range"] =  [make_rdf_object(measure_type)]; 
	measure[yls + measure_name][rdf + "Property"] = [make_rdf_object("MeasureProperty", qb)];
	measure[yls + measure_name]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [make_rdf_object('measure', qb), make_rdf_object('component', qb)];
	//add the measure triple to the dsd 
	dsd[ylcs + dsd_name][qb + "component"].push(make_rdf_object(measure_name, yls));
	
/*
first we will provide a helper function to return a list of coordinates based on a rectangular range or an range and a potential row or column cordinate,
and for making a point
*/
	var make_point = function (col, row) {
		//returns a point object if row and col are numbers
		if (row && col){
			if ((parseInt(col, 10) !== parseInt('number', 10)) && (parseInt(row, 10) !== parseInt('number', 10))) {
				return {'col' : parseInt(col, 10), 'row' : parseInt(row, 10)};
			}
		}
	};
	var is_point = function (point) {
		/*checks that the object can be a point
		*/
		if (typeof point !== 'undefined') {
			if ((parseInt(point.col, 10) !== parseInt('number', 10)) && (parseInt(point.row, 10) !== parseInt('number', 10))) {
				return true;
			} else {
				return false;
			}
		}
	};
	var compare_points = function (pointA, pointB) {
		if (is_point(pointA) && is_point(pointB)) {
			if ((pointA.col === pointB.col) && (pointA.row === pointB.row)) {
				return true;
			} 
			return false;
		}
	};
		
	var get_coords = function (top_left, bottom_right, limit_point) {
		/*
		top_left, bottom_right,limit_point are expected to be like this {'row': row, 'col':col}
		top_left, bottom_right are 
		if limit point is included only points inside the rectangle top_left to bottom right which are on
		the same row or col are returned
		*/
		var points = [];
		var x = 0;
		var y = 0;
		if (! (is_point(top_left) && is_point(bottom_right))) {
			return points; //if we don't have correct input return an empty list/array
		} 
		var limit = is_point(limit_point);
		//make a list of points in the rectangle
		for (x = top_left.col; x <= bottom_right.col; x++) {
			for (y = top_left.row; y <= bottom_right.row; y++) {
				// and include those on the same row or column as the limit_point, or all of them
				if (!limit) {
					points.push(make_point(x,y));
				} else if ( x === limit_point.col || y === limit_point.row) {
					points.push(make_point(x,y));
				}
			}
		} 
		return points;
	}; 

/*
IMPORTANT on a shhet row=0, col=0 is top left

stage 3 the dimensions
IMPORTANT it will work like this:

0. optional prompt for an overall data range from top left to bottom right in a rectangle.
0a. callculate the list of points that this is. save it.(see 1c)

1. if a dimension is specified in the components list, we must prompt of either:
	1a. a text value
	1b. a cell that contains a text value
  and we must prompt for a data range over which this value holds true
	1c. data range
  we must now offer to repeat this process to add a subsequent values and ranges
the data structure for this should be {name from components list : {
				       'values': [{name from text or sheet : [{'row': X , 'col' :Y},{'row': X1 , 'col' :Y1}, {'row': X2 , 'col' :Y3}, ... ]}, ...
						]}}
	where each value is an object contaimning a list of the row:column value to which it is appicable.

2. if a dimension is specified by the user we must prompt for:
	2a. A dimension uri
	2b. the cell that contains the value (eg r2, c3 = Male) or
	2c. a text value
	2d. for each value prompt (an option if 0. has been defined) for a data range, if 0 has been defined then assume data points on the same row if the value is left of the data range, or if value is in a cell above the data range use data points in the column below, else error and request a defined range.

this should now provide us with the minimum data to be able to construct the dimensions and then the observations.	
	
*/

/*ok so given this definition the start of the india test table reuslts in this data structure

so we will start with making a data struct that reflects the user input then we will parse it to make our triples
*/
	var dimensions_raw = {};
	
	//all to be set fron ui
	top_left = make_point('1','3');
	bottom_right = make_point('2','20');
	dimensions_raw['Cohort'] = {'values' : [{'YC' : get_coords(make_point('1','3'), make_point('1','20'))}, 
					{'OC' : get_coords(make_point('2','3'), make_point('2','20'))}]};
	dimensions_raw['Country'] = {'values' : [{'India' : get_coords(make_point('1','3'), make_point('2','20'))}]};
	dimensions_raw['Round'] = {'values' : [{'roundThree' : get_coords(make_point('1','3'), make_point('2','20'))}]};
	//TODO work out how to handle number strings, do we do this with user input or just set them if they parseInt? (this is bad for year dates eg 2011, but easy)
	//TODO current plan uses the make_rdf_object() function which return a uri object for strings, boolean literal for true/false strings or interger for integer strings, it cannot handle dates. 
	//TODO and IMPORTANT
	//all values from the speadsheet that are going to become uri's must have all spaces removed and replaced with something safe
	//my current best suggestion is to replace all spaces with underscores, utf-8 chars like ħħ ß work just fine, and ;' too
	//neil thinks this is a limitaion of ontowiki, he has tried to send spaces and %20 both of which fail
	dimensions_raw['SampleSize'] = {'dimension_uri' : 'SampleSize',
					'dim_label' : 'sample size label',
					'values' : [{'1930' : get_coords(make_point('1','3'), make_point('1','20'))}, 
					{'976' : get_coords(make_point('2','3'), make_point('2','20'))}]}; 
	dimensions_raw['Gender'] = {'dimension_uri' : 'Gender',
				'dim_label' : 'gender label',
				'values' : [{'Male' : get_coords(top_left, bottom_right, make_point('0','3'))}, 
						{'Female' : get_coords(top_left, bottom_right, make_point('0','4'))}]};
	dimensions_raw['UrbanOrRural'] = {'dimension_uri' : 'UrbanOrRural',
				'dim_label' : 'urbanorrural label',
				'values' : [{'Urban' : get_coords(top_left, bottom_right, make_point('0','5'))}, 
						{'Rural' : get_coords(top_left, bottom_right, make_point('0','6'))}]};
	dimensions_raw['MothersEducation'] = {'dimension_uri' : 'MothersEducation',
				'dim_label' : 'mother education label',
				'values' : [{'Mother_has_no_education' : get_coords(top_left, bottom_right, make_point('0','7'))}, 
						{'Mother_has_primary_educ_or_below' : get_coords(top_left, bottom_right, make_point('0','8'))},
						//not !!! {'Mother has primary educ or below' : get_coords(top_left, bottom_right, make_point('0','8'))},
						{'Mother_has_secondary_educ_or_below' : get_coords(top_left, bottom_right, make_point('0','9'))}, 
						{'Mother_has_above_secondary_educ' : get_coords(top_left, bottom_right, make_point('0','10'))}]};
	dimensions_raw['Region'] = {'dimension_uri' : 'Region',
				'dim_label' : 'region label',
				'values' : [{'Coastal_andhra' : get_coords(top_left, bottom_right, make_point('0','11'))}, 
						{'Rayalseema' : get_coords(top_left, bottom_right, make_point('0','12'))},
						{'Telangana' : get_coords(top_left, bottom_right, make_point('0','13'))}]};
//end set from ui
/*
ok now the fun bit, lets parse the dimensions_raw object
*/
	
	
	var dim = '';

	//new way
	for (dim in dimensions_raw) {
		if (dimensions_raw.hasOwnProperty(dim)) {
			//check to see if we have a new dimension or one defined in the dsd, we can tell by looking for the 'dimension_uri' key
			if (dimensions_raw[dim].hasOwnProperty('dimension_uri')) {
				dimensions[ylcomp + dim.capitalize()] = {};
				//add dimension to dsd these will need to be optional!
				var dim_object = make_rdf_object(dimensions_raw[dim]['dimension_uri'], ylcomp);
				dsd[ylcs + dsd_name][qb + "component"].push(dim_object);
				//ok now add the extra key to make this optional
				dimensions[ylcomp + dim.capitalize()][qb + 'componentRequired'] = [make_rdf_object("false")];
				dimensions[ylcomp + dim.capitalize()][qb + 'order'] = [make_rdf_object('2')];
				//add dimension defintion code , like for a measure
				dimensions[ylcomp + dim.capitalize()]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [make_rdf_object('dimension', qb), make_rdf_object('component', qb)];
			} 
			if (dimensions_raw[dim].hasOwnProperty('dim_label')) {
				//add a label for the dimension
				labels[ylcomp + dim.capitalize()] = {};
				labels[ylcomp + dim.capitalize()][rdfs + 'label'] =  make_rdf_label(dimensions_raw[dim]['dim_label']);
			}
		}
	}


	//add the dataset so we can add observations to it later.
	var dataset = {};
	dataset[yls + dataset_name] = {};
	dataset[yls + dataset_name] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [make_rdf_object("DataSet", qb)]};
	dataset[yls + dataset_name][qb + "structure"] = [make_rdf_object(dsd_name , ylcs)];


/*
now we need to add the observations


1. build a list of all the points in the sheet that contain an observation. this is the data range + any extra points from any of the dimensions.
2. for each of these points, loop throug all the dimensions recording those that are relevant.
2a. add the measure to each.

*/
	var observation_points = [];
	var dim_value, key;
	observation_points = get_coords(top_left, bottom_right);
	for (dim in dimensions_raw) { //for each dimension
		if (dimensions_raw.hasOwnProperty(dim)) {
			for (dim_value in dimensions_raw[dim]['values']) { //for each value add all points
				for (key in dimensions_raw[dim]['values'][dim_value]) {
					if (dimensions_raw[dim]['values'][dim_value].hasOwnProperty(key)) {
						observation_points.addArray(dimensions_raw[dim]['values'][dim_value][key]);
					}
				}
			}
		}
	}
//TODO I am here
//TODO add to observation a new namespace to contain the sheet row col id etc.
//TODO test	
	//remove duplicate points
	observation_points = observation_points.getUniquePoints();
	var observations = {};
	var observation = {};
	var obs_value = '';
	var loc_str = '';
	var obs_point, dim_point;
	//loop through all these points looking for which dimensions are usd
	for (obs_point in observation_points) {
		if(observation_points.hasOwnProperty(obs_point)){
		    var obid = yld + uuid() + 'observation';
			//begin constructing the observation
			//TODO set obsvalue from sheet here
			obs_value = Math.round(Math.random()*100)/100;
			observation = {}; //clear this var
			//loc_str = 'c' + observation_points[obs_point].col.toString() + '_r' + observation_points[obs_point].row.toString();
			observation[obid] = {};
			observation[obid]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [make_rdf_object("Observation", qb)];
			// Attatch the observation to the appropriate dataset
			observation[obid][qb + 'dataSet'] = [make_rdf_object(dataset_name, yls)];
			observation[obid][yls + measure_name] = [make_rdf_Observation_object(obs_value)];
			//now we need to find which dimension this point is in.
			for (dim in dimensions_raw) { //for each dimension
				if (dimensions_raw.hasOwnProperty(dim)) {
					for (dim_value in dimensions_raw[dim]['values']) { //for each value add all points
						if (dimensions_raw[dim]['values'].hasOwnProperty(dim_value)) {
							for (key in dimensions_raw[dim]['values'][dim_value]) {
								if (dimensions_raw[dim]['values'][dim_value].hasOwnProperty(key)) {
									for (dim_point in dimensions_raw[dim]['values'][dim_value][key]) {
										if (dimensions_raw[dim]['values'][dim_value][key].hasOwnProperty(dim_point)) {
											if (compare_points(observation_points[obs_point], dimensions_raw[dim]['values'][dim_value][key][dim_point])) {
												//ok our point is in this dimension, easy and very readable uh.
												observation[obid][yls + dim] = [make_rdf_object(key, yls)];
												//stop loop now
												break;
											}
										}
									}
								}
							}
						}
					}
				}
			}
			//ok at this point we should have an observation
			observations[obid] = observation[obid];
		}
	}
	

 
	
	//TODO check on the dsd, add code here
	//var sparql_endpoint = 'http://neil/~neil/IKMLinkedResearch/build/service/sparql';
	var sparql_endpoint = 'service/sparql';
	
	//build sparql to return the dsd's and thier labels that match the dimensions we use
//TODO
//DOING
	var sparql_q = $.sparql(sparql_endpoint)
                .prefix('ylcomp', ylcomp)
                .prefix('qb', qb)
		.prefix('rdfs', rdfs)
		.prefix('yls', yls)
                .select(['?dsd', '?label'])
			.where('?dsd', 'a', 'qb:DataStructureDefinition')
			.where('?dsd', 'rdfs:label', '?label')
                        .where('?dsd', 'qb:component', 'ylcomp:Cohort' )
                        .where('?dsd', 'qb:component', 'ylcomp:Round' )
                        .where('?dsd', 'qb:component', 'ylcomp:Country');
	//now add our measure 
	sparql_q = sparql_q.where('?dsd', 'qb:component', 'yls:' + measure_name )
	//now loop over our dimensions
	for (dim in dimensions_raw) {
		if (dimensions_raw.hasOwnProperty(dim)) {
			if (dimensions_raw[dim].hasOwnProperty('dimension_uri')) {
				sparql_q = sparql_q.where('?dsd', 'qb:component', 'ylcomp:' + dimensions_raw[dim]['dimension_uri'] )
			}
		}	
	}
	sparql_q.execute(dsd_sparql_result);
	//all the rest of the code for importing data happens in here as we _MUST_ have a response or we cannot know what to do with the dsd
	function dsd_sparql_result(data) {
		//
		dsd_label = 'dsd  label';
		labels[ylcs + dsd_name] = {};
		labels[ylcs + dsd_name][rdfs + 'label'] = make_rdf_label(dsd_label);
	
		var have_dsd = false;
		if (have_dsd) {//use jquery to merge objects together.
			jQuery.extend(true, triples, labels, measure, dimensions, dataset, observations)
		} else {
			jQuery.extend(true, triples, labels, dsd, measure, dimensions, dataset, observations);
		}
	
	
		
		//dimensionString = $.toJSON(jQuery.extend(true, labels, dsd, measure, dimensions));
	
		//dimensionString = $.toJSON(observations);
		dimensionString = $.toJSON(triples);
	
	
	
		//IMPORTANT!!!!! we cannot pass a space in a uri value, nor a %20. ie this will not work!!!! ie this will fail, but will work if the first 3 %20 are removed, the last appears to work, I do not know why. 
		//dimensionString = $.toJSON( {"http://data.younglives.org.uk//7829f2eacb60b5f76a60316eae8573d9/74d71e57-8e62-4845-81e2-506b67006c94c1_r79":{"http://www.w3.org/1999/02/22-rdf-syntax-ns#type":[{"type":"uri","value":"http://purl.org/linked-data/cube#Observation"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample":[{"type":"literal","value":"0.51","datatype":"http://www.w3.org/2001/XMLSchema#decimal"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/cohort":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/YC"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/country":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/India"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/round":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/roundThree"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/sampleSize":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/1930"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/MothersEducation":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Mother%20has%20no%20educationßß;'%20f"}]}});
	
	
		
		
		
	
		var url = window.location.href + '/results';
		$.get(url, function(data){
			var div_str = '<div id="import-options" \
			style="width:400px;height:150px;padding:5px;align:center;\
			background:white;position:absolute;left:40%;top:30%;\
			border: 1px solid #900; overflow: auto;">'+
				data + '</div>';
			$('body').append( $(div_str) );
		});
	
		
	}
	});
	theight = $(window).height() - $("#csvimport-dimensions").height() - $("#messagebox").height() - 150;
	$("#table-holder").css("height", theight);
});

function useCSVConfiguration(config) {
    // clear
    clearAll();

    // decode JSON
    decodedConfig = true;
    dimensions = $.evalJSON(config);
    
    uribase = '0';
    if( typeof dimensions["uribase"] === "undefined" || dimensions["uribase"].length < 1 ){ 
        uribase = RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/';
    }else{
        uribase = dimensions["uribase"];
    }
    $("#uribase").val(uribase);
    var dimA;
    for (dimA in dimensions) {
	if (dimensions.hasOwnProperty(dimA)) {
		if(dimA !== 'uribase'){
			if( typeof dimensions[dimA].attribute !== 'undefined' && dimensions[dimA].attribute === true ){
				//console.log(dimensions[dim]);
				appendAttribute(dimA, dimensions[dimA].label, dimensions[dimA].color, dimensions[dimA].uri);
				drawAttribute(dimensions[dimA].row, dimensions[dimA].col, dimensions[dimA].color);
			}else{
				appendDimension(dimA, dimensions[dimA].label, dimensions[dimA].color, dimensions[dimA].subproperty, dimensions[dimA].concept);
				drawElements(dimensions[dimA].elements, dimensions[dimA].color);
			}
		}
	}
    }
}


function appendDimension(dim, label, color, subproperty, concept){
    var eid = $.trim(label);
    var htmlText = '<tr style="background-color:' + color + '" about="'+dim+'"><td name="'+label+'">' + label; 
        htmlText += '<br/><sub>subPropertyOf:</sub><span id="dim_'+eid+'_0"></span>';
        htmlText += '<sub>concept:</sub><span id="dim_'+eid+'_1"></span>';
        htmlText += '</td></tr>';
    
    var tr = $(htmlText).data('dimension', label);
    $('#csvimport-dimensions').append(tr);
    
    var dimensionURI = dim;
    // property selector
    _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
    var input0 = $("#dim_"+eid+"_0");
    selectorOptions = {
        container: input0,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input0).val(uri);
            dimensions[dimensionURI].subproperty = uri;
        }
    };
    // FIXME: title hack        
    _propertySelector = new ObjectSelector(dimensionModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input0).val(subproperty);
    
    // property selector 2
    var input1 = $("#dim_"+eid+"_1");
    selectorOptions = {
        container: input1,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input1).val(uri);
            dimensions[dimensionURI].concept = uri;
        }
    };
    _propertySelector = new ObjectSelector(conceptModel, _subjectURI, "http://purl.org/linked-data/cube#concept", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input1).val(concept);
}

function appendAttribute(dim, label, color, uri){
    var eid = $.trim(label);
    var htmlText = '<tr style="background-color:' + color + '" about="'+dim+'"><td name="'+label+'">' + label;
        htmlText += '<br/><sub>attribute:</sub><span id="attr_'+eid+'_0"></span>';
        htmlText += '</td></tr>';
    
    var tr = $(htmlText).data('dimension', label);
    $('#csvimport-attributes').append(tr);
    
    // property selector
    var attributeURI = dim;
    _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
    var input0 = $("#attr_"+eid+"_0");
    selectorOptions = {
        container: input0,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input0).val(uri);
            dimensions[attributeURI].uri = uri;
        }
    };
    // FIXME: title hack
    _propertySelector = new ObjectSelector(attributeModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input0).val(uri);
}

function drawAttribute(row, col, color){
    var id = "#r"+row+"-c"+col;

    $(id).data('dimension', null);
    $(id).css('background-color', color);
    $(id).addClass('csv-highlighted');
}

function drawElements(elements, color){
    var elem;
    for(elem in elements){
	if (elements.hasOwnProperty(elem)) {
		var id = "#r"+elements[elem].row+"-c"+elements[elem].col;
	
		$(id).data('dimension', null);
		$(id).css('background-color', color);
		$(id).addClass('csv-highlighted');
	
		setDatarange(elements[elem].items);
        }
    }
}

function setDatarange(range){
    datarange = range;
    $('#csvimportDatarange').html(' (' +
                    datarange['start'].row + ',' +
                    datarange['start'].col + ') to (' +
                    datarange['end'].row + ',' +
                    datarange['end'].col + ')');
}

function clearAll(){
    $('#csvimport-dimensions').children().remove();
    $('table.csvimport td').each(function(){
        if ($(this).hasClass('csv-highlighted')) {
            $(this).css('background-color', 'transparent');
            $(this).removeClass('csv-highlighted');
        }
    });
}
