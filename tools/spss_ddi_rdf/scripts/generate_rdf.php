<?php
/**
 * @author Tim Davies (tim@practicalparticipation.co.uk)
 * @version 0.2
 *
 * Usage, call at the command line: php generate_rdf.php [context file] [config file] [codelist file]
 * Give relative or absolute paths for each argument. Arguments must be passed in order
 * If you want to omit and argument and use the defaults, enter 'default' for that argument.
 * 
 */
error_reporting(E_ERROR | E_WARNING | E_PARSE);

define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../../rap/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");

//We need to load our context, config and then fetch our existing store of code-list values. 
$context = load_context((!($argv[1] == "default")) ? $argv[1] : null);
$ns = load_config((!($argv[2] == "default")) ? $argv[2] : null);

//Check for our required namespaces
if(!$ns['*']) { log_message("Please make sure config.csv includes a default namespace (*) to be used in generating provenance information (etc.)",1);}
if(!$ns['studymeta']) { log_message("Please make sure config.csv includes a namespace for 'studymeta' to hold study meta-data",1);}

//We set up our code-list model. In future we might want to be able to fetch from the server as well and merge into our model
$codelists = ModelFactory::getDefaultModel();
$codelistfile = !($argv[3] == "default") ? $argv[3] : null;
if(file_exists("../data/rdf/codelists.rdf")) { 
	$codelists->load("../data/rdf/codelists.rdf");
	log_message("Found an existing code-list file to work from",0);
} else {
	log_message("No code-list file found");
}

//Set set up our target model for questions
$questions = ModelFactory::getDefaultModel();

//Add namespaces
add_namespaces(&$questions,$ns);
add_namespaces(&$codelists,$ns);

print_r($codelists);


//Get our list of files and now loop through them to process
$files = directory_list();
$n=0;
foreach($files as $file => $name) {
		$n++; if($n > 2) { break 1;} // Limit routine - make sure we only run through a few times
		
	if(!file_exists("../data/rdf/$name.rdf")) {
		log_message("Processing $name");
		parse_file($file,$name,$context,$ns,&$questions,&$codelists);
		log_message("Processed");
	} else {
		log_message("$name has already been converted");
	}

}
$questions->writeAsHTML();
$questions->saveAs("../data/rdf/questions.rdf");




/*********************************************************************/

/**
 * function log_message
 * Outputs log messages
 * type 1 = error
 * type 2 = warning
 */
function log_message($message,$type = 1) {
	echo $message. "\n";
}

/**
 * function directory_list
 * Fetch list of all files in directory
 */ 
function directory_list($directory = null) {
	if(!$directory) { $directory = "../data/ddi/"; }
	if ($handle = opendir($directory)) {
	    while (false !== ($file = readdir($handle))) {
			$file_parts = pathinfo($file);
			if($file_parts["extension"] == "xml") {
				$files[$directory.$file] = $file_parts["filename"];
			}
		}
		return $files;
	} else {
		log_message("Data files directory not found");
	}

}

/**
 * function fetch a resource or literal to include in a triple. 
 * We allow users to specify abbreviated URIs in context.csv files
 * We can use the details of namespaces in config.csv to provide a full URI where requested
 * If neither : or http are present, assume we have a literal. 
 * This function checks if we have a full URI already, and if not tries to created it. 
 */ 
function resource_or_literal($resource,$ns) {
	if(stripos(" ".$resource,"http")) { 
		$output = new Resource($resource);	
	} elseif(strpos($resource,":")) {
		$output_parts = explode(":",$resource); 
		$output = new Resource(($ns[$output_parts[0]] ? $ns[$output_parts[0]] : "http://localhost/ns0/").$output_parts[1]); 
	} else {
		$output = new Literal($resource);
	}	
	return $output;
}

/**
 * function parse_file
 * Takes an individual file and:
 * - Checks for additional triples that should be ascribed to all such files
 * - Searches through all the questions
 * - Creates variables for each (Data Cube Measures)
 * - Hands off the code-list data to be processed in more detail
 * 
 * $filename should be a relative or absolute path to the file to process
 * $context should be an array of additional triples to be added to the file record and to each question. 
 */
function parse_file($filename, $name, $context, $ns, &$questions, &$codelists) {
	//We need our models to be accessible
	include("models.php");
	
	$dom = new DOMDocument();
	$dom->preserveWhiteSpace = false;
	$dom->Load($filename);
	$xpath = new DOMXPath($dom);
	$xpath->registerNamespace("s","ddi:studyunit:3_0");
	$xpath->registerNamespace("l","ddi:logicalproduct:3_0");
	$variables = $dom->getElementsByTagName("Variable");

	foreach($variables as $variable) {
		$var_name = $variable->getElementsByTagName("Name")->item(0)->nodeValue;
			log_message(" - variable: {$var_name}");
		$var_label = $variable->getElementsByTagName("Label")->item(0)->nodeValue;
		$var_definition = $variable->getElementsByTagName("VariableDefinition")->item(0)->nodeValue;
		$model_var = new Resource($ns['var'].$var_name);
		
		$questions->add(new Statement($model_var,$RDF_type,$QB_MeasureProperty));
		$questions->add(new Statement($model_var,$RDF_type,$RDF_Property));
		$questions->add(new Statement($model_var,$RDFS_label,new Literal($var_label,"en")));
		$questions->add(new Statement($model_var,$RDFS_subPropertyOf,$SDMX_obsValue));
		$questions->add(new Statement($model_var,resource_or_literal("studymeta:variableDefinition",$ns),new Literal($var_definition)));

		
		//Add our additional triples in from here
		foreach(array_merge((array)$context['*'], (array)$context[$name]) as $additional) {
			$questions->add(new Statement($model_var,resource_or_literal($additional['p'],$ns),resource_or_literal($additional['o'],$ns)));
		}
		//Add a note on the file this is originally from
		$questions->add(new Statement($model_var,resource_or_literal("studymeta:fromFile",$ns),resource_or_literal($ns['*'].$name,$ns)));


	 
		//Add representation information
		$representation = $variable->getElementsByTagName("Representation")->item(0);
		foreach($representation->childNodes as $representation_type) {
			switch($representation_type->nodeName) {
				case "l:TextRepresentation":
					$questions->add(new Statement($model_var,resource_or_literal("studymeta:variableRepresentation",$ns),resource_or_literal("studymeta:TextRepresentation",$ns)));
				break;
				case "l:NumericRepresentation":
					$questions->add(new Statement($model_var,resource_or_literal("studymeta:variableRepresentation",$ns),resource_or_literal("studymeta:NumericRepresentation",$ns)));
				break;
				case "l:CodeRepresentation":
					$questions->add(new Statement($model_var,resource_or_literal("studymeta:variableRepresentation",$ns),resource_or_literal("studymeta:CodeRepresentation",$ns)));
					$representation_id = $representation_type->getElementsByTagName("ID")->item(0)->nodeValue;
					parse_codelist(&$xpath,$representation_id,$context,$ns,&$questions,&$codelists);
				break;
			}
		}
	}//End foreach($variables as $variable)
	
}


/**
 * parse_code_list
 * 
 */

function parse_codelist(&$xpath,$representation_id,$context,$ns,&$questions,&$codelists) {
	log_message("Checking for codelist ". $representation_id,0);
	$codelist_prefix = $ns['*']."codelist-";
	
	$results = $xpath->query("//s:StudyUnit/l:LogicalProduct/l:CodeScheme[@id='$representation_id']");
	foreach($results as $result) {
		foreach($result->getElementsByTagName("Code") as $code) {
			$category_ref = $code->getElementsByTagName("ID")->item(0)->nodeValue;
			$category_value = $code->getElementsByTagName("Value")->item(0)->nodeValue;
			$category_titles_data = $xpath->query("//s:StudyUnit/l:LogicalProduct/l:CategoryScheme/l:Category[@id='$category_ref']");
			
			foreach($category_titles_data as $category_title_data) {
				$category_title = $category_title_data->getElementsByTagName("Label")->item(0)->nodeValue;
			}
			
		 	$category_array[$category_value] = $category_title;
			$rdql[] = "(<{$codelist_prefix}".format_var_string($category_title)."> skos:inScheme ?schemeid)";
		}
	}

	//We use RQDL to check if this code-list already exists

	$rdql_query = "SELECT ?schemeid WHERE\n".implode(",\n",$rdql);
	$rdqlIter = $codelists->rdqlQueryasIterator($rdql_query);
	if($rdqlIter->countResults()) {
		$result_labels=$rdqlIter->getResultLabels();
		log_message("Existing codelist",0);
		print_r($result_labels);
	} else {
		log_message("New codelist",0)
	}
	print_r($category_array);
	echo $rdql_query;
	

	
//	if($prior_concept) {
	if(true) {
		//We should set a qb:codeList to the concept id...
		$concept_scheme = $concept_scheme_cache[$prior_concept];
	} else {
		//We need to create a skos concept scheme here. 
		$concept_scheme = new Resource($prefix_variable."codeList-{$representation_id}");
		$model->add(new Statement($concept_scheme,$RDF_type,$SKOS_ConceptScheme));
		foreach($category_array as $key => $concept_value) {
			
			if(!is_array($concept_cache)) { $concept_cache = array(); }
			if(array_key_exists($concept_value,$concept_cache)) {
				
				$concept = $concept_cache[$concept_value];
				$model->add(new Statement($concept,$SKOS_inScheme,$concept_scheme));
				
			} else {		

				$concept = new Resource($prefix_variable."codes-".formatVarString($concept_value));
				$model->add(new Statement($concept,$RDF_type,$SKOS_Concept));
				$model->add(new Statement($concept,$SKOS_prefLabel,new Literal($concept_value,"en")));
				$model->add(new Statement($concept,$SKOS_inScheme,$concept_scheme));
				
				$concept_cache[$concept_value] = $concept;
			}
		}
		//Save this concept to the cache so we don't create it again...
		$scheme_cache[$representation_id] = $concept_to_check_for;
		$concept_scheme_cache[$representation_id] = $concept_scheme;
	}
	
	//$model->add(new Statement($model_var,$QB_codeList,$concept_scheme));	
	
}


/**
 * function load_context
 * Loads the context.csv file unless otherwise specified
 */
function load_context($filename=null) {
	if(!$filename) { $filename = "../data/context.csv"; }
	
	$row = 0;
	if (($handle = fopen($filename, "r")) !== FALSE) {
		while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
		        $row++;
				if($row > 1) {
					$context[$data[0]][] = array("p"=>$data[1], "o" => $data[2]);
				}
		    }
		    fclose($handle);
		return $context;
	} else {
		log_message("Context file not found",1);
		return false;
	}
}

/**
 * function load_context
 * Loads the config.csv file unless otherwise specified
 */
function load_config($filename=null) {
	if(!$filename) { $filename = "../data/config.csv"; }

	$row = 0;	
	if (($handle = fopen($filename, "r")) !== FALSE) {
		while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
		        $row++;
				if($row > 1) {
					$config[$data[0]] = $data[1];
				}
		    }
		    fclose($handle);
		//We need to check for the default variable namespace
		if(!$config['var']) {
			$config['var'] = "http://localhost/variablesNS0/";
		}
		return $config;
	} else {
		log_message("Config file not found",1);
		return false;
	}
	
}

/**
 * function add_namespaces($model,$config)
 */
function add_namespaces($model,$ns) {
	foreach($ns as $namespace => $uri) {
		$model->addNamespace($namespace,$uri);
	}
	return true;
}

/**
 * Prepare a variable string to use
 */
function format_var_string($string) {
   return str_replace("/","",str_replace("'","",str_replace(",","-",str_replace("(","-",str_replace(")","-",str_replace(" ","",ucwords($string)))))));
}


?>