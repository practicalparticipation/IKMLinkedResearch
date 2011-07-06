<?php
/**
 * @author Tim Davies (tim@practicalparticipation.co.uk)
 * @version 0.1
 */

//Make sure you have run install.packages("spssDDI") in the relevant R install prior to running
$r_function_template = <<<EOF
# install.packages("spssDDI");
data<-readSpssSav("../data/spss/~FILE~");
sink("../data/ddi/~NAME~.xml");
writeDDI(data,"../data/ddi/~NAME~.xml");
sink();
EOF;

$path = dirname(__FILE__);


$instructions = "library(\"spssDDI\");\n";
$instructions .= "setwd(\"$path\")";

if ($handle = opendir($path."/../data/spss/")) {

    while (false !== ($file = readdir($handle))) {
		$file_parts = pathinfo($file);
		if($file_parts['extension'] == "sav") {
			$name = $file_parts['filename'];
			$instructions .= str_replace("~NAME~",$name,str_replace("~FILE~",$file,$r_function_template));
			$n++;
		}
    }
    closedir($handle);

file_put_contents("convert.r",$instructions);
echo "Instructions to convert $n files have been written to the convert.r script. You should be able to run this in R with the current working directory set to 'spss_ddi_rdf' then you should get converted DDI files in the ddi directory.";
}

?>