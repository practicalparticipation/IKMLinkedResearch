## Modelling Notes

At present an RDF rendering of Data Documentation Initiative is not currently available (July 2011), although [workshops in September 2011 are planned](http://www.gesis.org/en/events/gesis-workshops/semantic-statistics/), and [work is taking place](http://ddiandsemanticweb.blogspot.com/) to generated an RDF DDI Ontology.

Given the pilot-nature of this project, we are initially adopting a conversion of variables to our own simplified ontology. Our goal is to be able to:

* Express the code, label, description (where available), and definition or notes relating to a variable;
* Relate variables to their code lists;
* Identify the original file a variable is taken from;
* Identify the country and round in which a variable was present;
* Relate variables together in groups (DDI has varGrp)

Where possible we should draw upon DDI, SDMX and DataCube concepts - and aim for our interfaces to be easy to convert to work with a full DDI RDF specification should one be developed in the near future. 

See http://www.ddialliance.org/sites/default/files/dtd/DDI2-1-tree.html for the simplified DDI tree. 

We would also like to be able to:

* Relate variables in our dataset to variables available in other datasets
* Relate code-list values in our dataset to code-list values in other datasets;
* Cater for where a variable has had an earlier version
** I.e. Our import routine should check if: a variable already exists; and has a different name; and should put the earlier round variable as Round1Title or some other such predicate (?);
*** ToDo: Check if there is a way from DDI to handle this. 