<?php
/**
 * @author Tim Davies (tim@practicalparticipation.co.uk)
 * @version 0.2
 *
 * Call this file to expand out inferences over the code list (only at present topConceptOf and hasTopConcept symetry)
 * 
 */
//error_reporting(E_ERROR | E_WARNING | E_PARSE);

define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../../rap/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");
include_once(RDFAPI_INCLUDE_DIR."infModel/InfModel.php");
include_once(RDFAPI_INCLUDE_DIR."infModel/InfModelF.php");
include_once(RDFAPI_INCLUDE_DIR."infModel/InfRule.php");
include_once(RDFAPI_INCLUDE_DIR."infModel/InfStatement.php");
include("models.php");

$codelists = ModelFactory::getInfModelF();

$codelistfile = !($argv[3] == "default") ? $argv[3] : null;
if(file_exists("../data/rdf/codelists.rdf")) { 
	$codelists->load("../data/rdf/codelists.rdf");
 	echo "Found an existing code-list file to work from";
} else {
	echo "No code-list file found";
}

$codelists->add(new Statement($SKOS_topConceptOf,new Resource(OWL_URI.OWL_INVERSE_OF),$SKOS_hasTopConcept));

$codelists->saveAs("../data/rdf/codelists-inf.rdf");