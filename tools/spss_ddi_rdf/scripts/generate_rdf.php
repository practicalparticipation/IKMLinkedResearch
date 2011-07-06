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
//error_reporting(E_ERROR | E_WARNING | E_PARSE);

define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../../../www/admin/include/rdfapi-php/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");

//We need to load our context, config and then fetch our existing store of code-list values. 
$context = load_context((!($argv[1] == "default")) ? $argv[1] : null);
$ns = load_config((!($argv[2] == "default")) ? $argv[2] : null);

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
$questions->addWithoutDuplicates(new Statement(new Resource("http://www.w3.org/Home/Lassila"),
new Resource("http://description.org/schema/Description"),
new Literal("Lassila's personal Homepage", "en")));

//Add namespaces
add_namespaces(&$questions,$ns);
add_namespaces(&$codelists,$ns);

print_r($codelists);

//Get our list of files and now loop through them to process
$files = directory_list();
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
		$model_var = new Resource($ns['var'].$var_name);
		
		$questions->add(new Statement($model_var,$RDF_type,$QB_MeasureProperty));
		$questions->add(new Statement($model_var,$RDF_type,$RDF_Property));
		$questions->add(new Statement($model_var,$RDFS_label,new Literal($var_label,"en")));
		$questions->add(new Statement($model_var,$RDFS_subPropertyOf,$SDMX_obsValue));
		
		//Add our additional triples in from here
		foreach(array_merge((array)$context['*'], (array)$context[$name]) as $additional) {
			
			if(!strpos($additional['s'],"http")) { 
				$additional_predicate_parts = explode(":",$additional['s']); 
				$additional_predicate = new Resource(($ns[$additional_predicate_parts[0]] ? $ns[$additional_predicate_parts[0]] : "http://localhost/ns0/").$additional_predicate_parts[1]);
			} else {
				$additional_predicate = new Resource($additional['s']);
			}
			if(!strpos($additional['o'],"http")) {
				$additional_object = new Resource($additional['o']);
			} else {
				$additional_object = new Literal($additional['o']);
			}
		 	
			$questions->add(new Statement($model_var,$additional_predicate,$additional_object));

		}
	}//End foreach($variables as $variable)
	

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
					$context[$data[0]][] = array("s"=>$data[1], "o" => $data[2]);
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

?>