/**
 * Grapher
 * Graphing UI for YoungLives
 *
 */

var Grapher = {  // Config object and api
                            'target': $('#grapher'), // Target dom element
                            'sparql_endpoint': 'http://localhost/IKMLinkedResearch/build/service/sparql', // Sparql Endpoint
                           }; 
(function(){ // Self-executing closure
    // Hook up to the dom
    Grapher.target.data('Grapher', Grapher);
    
    /**
     * Request graphable data
     */
   Grapher.getData = function(measure, dimension){
        $.sparql(Grapher.sparql_endpoint)
            .prefix('ylss', 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/')
            .prefix('qb', 'http://purl.org/linked-data/cube#')
            .select(['?cohort', '?country', '?round', '?value', '?dimension'])
                .where('?obs', 'ylss:' + measure, '?value')
                    .where('ylss:' + dimension, '?dimension')
                    .where('ylss:Cohort', '?cohort')
                    .where('ylss:Round', '?round')
                    .where('ylss:Country', '?country')
            .execute(Grapher.showData);
   };
   
   Grapher.showData = function(data) {
        alert(data);
   };

   // Kick Off
   Grapher.getData('measure-ProportionOfSample', 'UrbanOrRural');
}()); // End self-executing closure
