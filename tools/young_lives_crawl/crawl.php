<?php
/**
 * Custom script designed to fetch key context from the Young Lives Website
 */ 

include_once("../shared_functions/simple_html_dom.php");
include_once("../shared_functions/functions.php");
//error_reporting(E_ERROR | E_WARNING | E_PARSE);
define("RDFAPI_INCLUDE_DIR",dirname(__FILE__)."/../rap/api/");
include_once(RDFAPI_INCLUDE_DIR."RdfAPI.php");
$model = ModelFactory::getDefaultModel();
include_once("../shared_functions/models.php");

$yls = "http://data.younglives.org.uk/data/younglivesStudyStructure/";

$root = file_get_html('http://www.younglives.org.uk/our-themes');

$scheme = new Resource("http://data.younglives.org.uk/data/themes/");
$model->add(New Statement($scheme,$RDF_type,$SKOS_ConceptScheme));
$model->add(New Statement(new Resource("http://data.younglives.org.uk/data/themes/"),$RDFS_comment,new Literal("The Young Lives study analysis and policy engagement work is clustered around 3 themes that are central to the lives of poor children and young people.")));
$model->add(New Statement(new Resource("http://data.younglives.org.uk/data/themes/"),$RDFS_label,new Literal("Young Lives Themes")));


foreach($root->find("div[id=subnav]",0)->find("li a") as $theme_link) {

	$theme = $theme_link->innertext;	
	$theme_page = file_get_html($theme_link->href);
	echo "Fetching theme page:".$theme."\n";

	
	$theme_description = str_replace(array("<br>","<br />"),"\n",$theme_page->find("div[id='content-holder'] p",0)->innertext);
	if($theme_page->find("div[id='content-holder'] ul",0)) {
		$theme_description .= "\n".strip_tags($theme_page->find("div[id='content-holder'] ul",0)->innertext);
	}
	
	$theme_res = New Resource("http://data.younglives.org.uk/data/themes/".format_var_string($theme));
	
	$model->add(New Statement($theme_res,$RDF_type,new Resource($yls."Theme")));
	$model->add(New Statement($theme_res,$RDF_type,$SKOS_Concept));
	$model->add(New Statement($theme_res,$SKOS_inScheme,$scheme));
	$model->add(New Statement($theme_res,$SKOS_topConceptOf,$scheme));
	$model->add(New Statement($scheme,$SKOS_hasTopConcept,$theme_res));
	$model->add(New Statement($theme_res,$SKOS_prefLabel,new Literal($theme)));
	$model->add(New Statement($theme_res,$RDFS_label,new Literal($theme)));
	$model->add(New Statement($theme_res,$RDFS_comment,new Literal($theme_description)));
	

	foreach($theme_page->find("li[class='selected']",1)->find("li a") as $subtheme_link) {
		
		$subtheme = $subtheme_link->innertext;
		$subtheme_res = new Resource("http://data.younglives.org.uk/data/themes/".format_var_string($subtheme));
		
		$model->add(New Statement($subtheme_res,$RDF_type,$SKOS_Concept));
		$model->add(New Statement($subtheme_res,$RDF_type,new Resource($yls."SubTheme")));
		$model->add(New Statement($subtheme_res,$SKOS_inScheme,$scheme));
		$model->add(New Statement($subtheme_res,$SKOS_broader,$theme_res));
		$model->add(New Statement($theme_res,$SKOS_narrower,$subtheme_res));
		$model->add(New Statement($subtheme_res,$SKOS_prefLabel,new Literal($subtheme)));
		$model->add(New Statement($subtheme_res,$RDFS_label,new Literal($subtheme)));	
		
		$subtheme_page = file_get_html($subtheme_link->href);
		echo "  Fetching sub theme page:".$subtheme."\n";
		
		if($subtheme_page->find("div[id='content-holder'] p",0)) {
			$subtheme_description = str_replace(array("<br>","<br />"),"\n",$subtheme_page->find("div[id='content-holder'] p",0)->innertext);
			$model->add(New Statement($subtheme_res,$RDFS_comment,new Literal($subtheme_description)));
		}

	 }
	
}
//echo $model->toStringIncludingTriples();
$model->saveAs("data/themes.rdf");

?>