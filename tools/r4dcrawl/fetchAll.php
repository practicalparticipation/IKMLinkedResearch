<?php

$xml = simplexml_load_file("http://www.dfid.gov.uk/r4d/Gateway/?verb=ListSets");

foreach($xml->ListSets->set as $set) {
	echo "Fetching " .$set->setName. " - ".$set->setSpec . "\n";
	echo "http://www.dfid.gov.uk/r4d/Gateway/?verb=ListRecords&metadataPrefix=rdf&set=".$set->setSpec;
	$file = file_get_contents("http://www.dfid.gov.uk/r4d/Gateway/?verb=ListRecords&metadataPrefix=rdf&set=".$set->setSpec);
	file_put_contents("rdf/".$set->setName.".rdf",$file);
	echo "Saved\n";
}