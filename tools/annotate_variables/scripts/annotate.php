<?php
/*
 * Annotate tool - for adding annotations to variables based on a simple file pattern. 
 */
include_once("../../shared_functions/functions.php");
error_reporting(E_ERROR | E_WARNING | E_PARSE);
define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../../rap/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");


$ns = load_config((!($argv[2] == "default")) ? $argv[2] : null);
if(!$ns['*']) { log_message("Please make sure config.csv includes a default namespace (*) to be used in generating provenance information (etc.)",1);}
if(!$ns['var']) { log_message("Please make sure config.csv includes a namespace for 'var' to profile a prefix for variables",1);}
if(!$ns['studymeta']) { log_message("Please make sure config.csv includes a namespace for 'studymeta' to hold study meta-data",1);}

$varexp = "/Variable = ([a-zA-Z0-9]*)/";
$posexp = "/Pos\. = ([0-9]*)/";
$addmatch = "/^>([A-Z]+)/";

$files = directory_list(dirname(__FILE__)."/../data/input/",false);

foreach($files as $file => $name) {
	$model = ModelFactory::getDefaultModel();
	$file_parts = pathinfo($file);
	$name = str_replace("_UKDA_Data_Dictionary","",$file_parts['filename']);
	
	$contents = file_get_contents($file);
	$lines = explode("\n",$contents);
	foreach($lines as $line) {

		preg_match($addmatch,$line,$addition);
		if(count($addition)) { 
			$add_parts = split(" ",$line);
			if(count($add_parts) > 2) {
				$key = $addition[1]; array_shift($add_parts);
				$predicate = trim(str_replace(array("<",">.",">"),"",array_shift($add_parts)));
				if(count($add_parts) == 1) {
					$object = trim(str_replace(array("<",">.",">"),"",array_shift($add_parts)));
				} else {
					$object = trim(str_replace(array("\".","\""),"",implode(" ",$add_parts)));
				}
				$stack[$key] = array('p' => $predicate, 'o'=>$object);
			} else {
				unset($stack[$addition[1]]);
			}
		}
		

		preg_match($varexp,$line,$match);
		if(count($match)) { 
			$model_var = new Resource($ns['var'].$match[1]);
			foreach($stack as $key => $values) {
				echo $match[1]. "-> $key ".$values['p']." - ".$values['o']. "\n";
				$model->add(new Statement($model_var,resource_or_literal($values['p'],$ns),resource_or_literal($values['o'],$ns)));
			}
		}
		
		preg_match($posexp,$line,$posmatch);
		if(count($posmatch)) {
			$position = new Resource($ns['*']."bnodes/".uniqid('bnode'));
			$model->add(new Statement($model_var,resource_or_literal($ns['studymeta']."variablePosition",$ns),$position));
			$model->add(new Statement($position,resource_or_literal($ns['studymeta']."fromFile",$ns),resource_or_literal($ns['*'].$name,$ns)));
			$model->add(new Statement($position,resource_or_literal($ns['studymeta']."position",$ns),new Literal($posmatch[1])));
		}
		
		
	}

	$model->saveAs("../data/output/".$name.".rdf");
}






?>