<?php

$xml = simplexml_load_file("http://www.dfid.gov.uk/r4d/Gateway/?verb=ListSets");

foreach($xml->ListSets->set aas $set) {
	echo $set->setSpec;	
}