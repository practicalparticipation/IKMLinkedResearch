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

define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../../rap/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");
include_once("../../shared_functions/functions.php");
ini_set('memory_limit', '512M');

//We need to load our context, config and then fetch our existing store of code-list values. 
$context = load_context((!($argv[1] == "default")) ? $argv[1] : null);
$ns = load_config((!($argv[2] == "default")) ? $argv[2] : null);

//Check for our required namespaces
if(!$ns['*']) { log_message("Please make sure config.csv includes a default namespace (*) to be used in generating provenance information (etc.)",1);}
if(!$ns['studymeta']) { log_message("Please make sure config.csv includes a namespace for 'studymeta' to hold study meta-data",1);}
if(!$ns['var']) { log_message("Please make sure config.csv includes a namespace for 'var' to profile a prefix for variables",1);}

//Get our list of files and now loop through them to process
$files = directory_list();

foreach($files as $file => $name) {
	
	if(!file_exists("../data/rdf/$name.rdf")) {
		log_message("Processing $name");
		$questions = ModelFactory::getDefaultModel();
		add_namespaces(&$questions,$ns);
		
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
		add_namespaces(&$codelists,$ns);
		
		parse_file($file,$name,$context,$ns,&$questions,&$codelists);
		$questions->saveAs("../data/rdf/$name.rdf");
		$codelists->saveAs("../data/rdf/codelists.rdf");
		log_message("Processed");
	} else {
		log_message("$name has already been converted");
	}

}
$questions->writeAsHTML();






/*********************************************************************/



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
		
		//$questions->add(new Statement($model_var,$RDF_type,$QB_MeasureProperty));
		$questions->add(new Statement($model_var,$RDF_type,resource_or_literal($ns['*'].'Variable',$ns)));
		if(strpos("?",$var_label)) { 
			$questions->add(new Statement($model_var,$RDF_type,resource_or_literal($ns['*'].'Question',$ns)));			
		}
		$questions->add(new Statement($model_var,$SKOS_notation,new Literal($var_name)));
		//$questions->add(new Statement($model_var,$RDF_type,$RDF_Property));
		$questions->add(new Statement($model_var,$RDFS_label,new Literal($var_label,"en")));
		//$questions->add(new Statement($model_var,$RDFS_subPropertyOf,$SDMX_obsValue));
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
					$concept_scheme = parse_codelist(&$xpath,$representation_id,$context,$ns,&$questions,&$codelists);
					$questions->add(new Statement($model_var,$QB_codeList,$concept_scheme));
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
	include("models.php");
	log_message("Checking for codelist ". $representation_id,0);
	$codelist_prefix = $ns['*']."codelist-";
	$code_prefix = $ns['*']."code-";
	
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
			$rdql[] = "(<{$code_prefix}".format_var_string($category_title)."> skos:inScheme ?schemeid)";
		}
	}

	//We use RQDL to check if this code-list already exists

	$rdql_query = "SELECT ?schemeid WHERE\n".implode(",\n",$rdql)." USING skos FOR <http://www.w3.org/2004/02/skos/core#>";
	$rdqlIter = $codelists->rdqlQueryasIterator($rdql_query);
	
	if($rdqlIter->countResults()) {

		$result = $rdqlIter->next();
		log_message("Using existing codelist ". (string)$result["?schemeid"],0);
		return $result["?schemeid"];
		
	} else {
		log_message("Creating new codelist - $representation_id with ". count($category_array). " codes.",0);
		
		//Create our concept-scheme
		$concept_scheme = new Resource($codelist_prefix.$representation_id);
		$codelists->addWithoutDuplicates(new Statement($concept_scheme,$RDF_type,$SKOS_ConceptScheme));

		//Look through each code and create an entry
		foreach($category_array as $key => $concept_value) {
			$concept = new Resource($code_prefix.format_var_string($concept_value));
			$codelists->addWithoutDuplicates(new Statement($concept,$RDF_type,$SKOS_Concept));
			$codelists->addWithoutDuplicates(new Statement($concept,$SKOS_prefLabel,new Literal($concept_value,"en")));
			$codelists->addWithoutDuplicates(new Statement($concept,$SKOS_inScheme,$concept_scheme));
			$codelists->addWithoutDuplicates(new Statement($concept,$SKOS_topConceptOf,$concept_scheme));
			$codelists->addWithoutDuplicates(new Statement($concept,$SKOS_notation,new Literal($key)));
		}
		
		return $concept_scheme;
	}
	
}




?>