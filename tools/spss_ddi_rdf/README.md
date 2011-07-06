## SPSS -> DDI -> RDF

This folder contains scripts that support a workflow for moving from SPSS files, to DDI XML files, to an RDF Linked Data model of a study.

Through this process:
* SPSS files are converted into DDI XML using the [R spssddi](http://cran.r-project.org/web/packages/spssDDI/index.html) package. 
* DDI XML files are read through a php script which:
** Uses an RDF model to represent the variables and their related questions
** Constructs code-lists for each possible answer
** Checks against a local and remote triple store to identify whether a relevant code-list already exists;
** Links questions and their code lists
* The resulting RDF is output into RDF XML for integration using other tools. 

These scripts should only output details of the variables. It should not output any microdata. 

When dealing with sensitive micro-data this tool should only be run locally.

## Status

Initial development. Steps 1 - 3 working. RDF Conversion not yet working.

## Requirements

Requires R to be available and the spssDDI package to be installed. (Run install.packages("spssDDI"); to install this package). 

## Usage

1. Copy the files to be converted into the spss directory
2. Run the script 'scripts/generate_conversion.php' from the command line
3. Run the resulting 'run_conversion.r' file within R
4. Modify the config.csv and context.csv files to specify the namespaces to be used and to highlight any additional triples to be added to questions.
5. Once all files have been generated in the ddi directory (this could take some time), run the script 'generate_rdf.php' from the command line

You may need to edit 'generate_rdf.php' to be aware of your particular triple store. 

### Context.csv

Context.csv should consist of three columns:
* A filename (without file extension), or * for all files
* A predicate (either full URI or abbreviated)
* An object

These additional triples will be ascribed:
* To the record of the file itself
* To any questions generated from the file

**Example Usage**
To state that all the files being processed are from 'Round 1' and the the first are from Ethiopia, the file might look something like this:

  File,Predicate,Object
  *,yls:round,yls:RoundTwo
  etchildlevel12yrold,yls:country,yls:Ethiopia
  etchildlevel1yrold,yls:country,yls:Ethiopia

You can specify on the command line if you want to use a different context file by including it as the first argument. 

## Know issues 
In testing against [Young Lives](http://www.younglives.org.uk) data files from the UK Data Archive problems were found using the Command Line 'R' interface. This was resolved by running the convert.r file in [R Studio](http://rstudio.org/)