<?php

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
function directory_list($directory = null, $restrict_type = "xml") {
	if(!$directory) { $directory = "../data/ddi/"; }
	if ($handle = opendir($directory)) {
	    while (false !== ($file = readdir($handle))) {
			$file_parts = pathinfo($file);
			if($restrict_type == false || $file_parts["extension"] == $restrict_type) {
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
   return str_replace("%","pc",str_replace("\"","", str_replace("/","",str_replace("'","",str_replace(",","-",str_replace("(","-",str_replace(")","-",str_replace(" ","",ucwords($string)))))))));
}