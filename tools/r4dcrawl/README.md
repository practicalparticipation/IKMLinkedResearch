## R4D Crawl

There is information about our study in the Research for Development research archive.

We should try to pull this information together 


## Working from database dumps

As of July 2011 database dumps of the OAI-PMH XML data from [R4D](http://www.dfid.gov.uk/r4d/) are available by request. 

The RDF can be extracted from these using rapper:

```
rapper -s RDF-XML1.xml -o rdfxml > rdf1.rdf; rapper -s RDF-XML2.xml -o rdfxml > rdf2.rdf; rapper -s RDF-XML3.xml -o rdfxml > rdf3.rdf; rapper -s RDF-XML4.xml -o rdfxml > rdf4.rdf; rapper -s RDF-XML5.xml -o rdfxml > rdf5.rdf; rapper -s RDF-XML6.xml -o rdfxml > rdf6.rdf;
```

We can use [rdfcat](http://jena.sourceforge.net/javadoc/jena/rdfcat.html) to join together the multiple files generated. However, we also have to clean up some illegal URIs first with sed (and for now we remove one or two manually) - noting that this breaks the URIs!

The output from the rapper process generates rdf with ' rdf:parseType="Literal"' properties which roqet (used in the next step) doesn't like. We can clean these up with sed as well.

```
sed -i 's/\[editor\]/(editor)/g' *.rdf;
sed -i 's/\[/ /g' *.rdf;
sed -i 's/\]/ /g' *.rdf;

rdfcat *.rdf > all.rdf

sed -i 's/rdf:parseType="Literal"//g' all.rdf;
```

The [roqet](http://librdf.org/rasqal/roqet.html) utility can then be used to run SPARQL commands to extract the required Young Lives related data.


Project IDs:

*8125 - Phase 1
*3967 - Phase 2
*60420 - Phase 3
*60637 - Phase 4

Project URIs are of the form: http://www.dfid.gov.uk/r4d/SearchResearchDatabase.asp?ProjectID=60420

We create a file call round1.sparql, and then run roqet as below. 

```
echo "
PREFIX dcterms: <http://purl.org/dc/terms/>

CONSTRUCT {
		?s ?p ?o. 
		?s <http://data.younglives.org.uk/data/younglivesStudyStructure/inRound> <http://data.younglives.org.uk/data/younglivesStudyStructure/RoundOne>.
	} WHERE 
	{ 
		?s dcterms:isPartOf <http://www.dfid.gov.uk/r4d/SearchResearchDatabase.asp?projectid=8125> .
        ?s ?p ?o.
	}" > round1.sparql
```

```
roqet -i sparql round1.sparql -D all.rdf > round1.ttl
```

and then repeat for each round

```
echo "
PREFIX dcterms: <http://purl.org/dc/terms/>

CONSTRUCT {
		?s ?p ?o. 
		?s <http://data.younglives.org.uk/data/younglivesStudyStructure/inRound> <http://data.younglives.org.uk/data/younglivesStudyStructure/RoundTwo>.
	} WHERE 
	{ 
		?s dcterms:isPartOf <http://www.dfid.gov.uk/r4d/SearchResearchDatabase.asp?projectid=3967> .
        ?s ?p ?o.
	}" > round2.sparql 
	
roqet -i sparql round2.sparql -D all.rdf > round2.ttl

echo "
PREFIX dcterms: <http://purl.org/dc/terms/>

CONSTRUCT {
		?s ?p ?o. 
		?s <http://data.younglives.org.uk/data/younglivesStudyStructure/inRound> <http://data.younglives.org.uk/data/younglivesStudyStructure/RoundThree>.
	} WHERE 
	{ 
		?s dcterms:isPartOf <http://www.dfid.gov.uk/r4d/SearchResearchDatabase.asp?projectid=60420> .
        ?s ?p ?o.
	}" > round3.sparql 
	
roqet -i sparql round3.sparql -D all.rdf > round3.ttl

echo "
PREFIX dcterms: <http://purl.org/dc/terms/>

CONSTRUCT {
		?s ?p ?o. 
		?s <http://data.younglives.org.uk/data/younglivesStudyStructure/inRound> <http://data.younglives.org.uk/data/younglivesStudyStructure/RoundFour>.
	} WHERE 
	{ 
		?s dcterms:isPartOf <http://www.dfid.gov.uk/r4d/SearchResearchDatabase.asp?projectid=60637> .
        ?s ?p ?o.
	}" > round4.sparql 
	
roqet -i sparql round4.sparql -D all.rdf > round4.ttl
```

At the end of the process we can use rdfcat again to get everything into one file:

```
rdfcat *.ttl > younglives.ttl
```