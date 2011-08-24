<?php

/**
 * This file is part of the {@link http://ontowiki.net OntoWiki} project.
 *
 * @copyright Copyright (c) 2008, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */
require_once("Importer.php");
/**
 * Component controller for the CSV Importer.
 *
 * @category OntoWiki
 * @package Extensions
 * @subpackage Csvimport
 * @copyright Copyright (c) 2010, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */
class ScovoImporter extends Importer
{
    protected $measure;

    public function parseFile() {
        $this->logEvent("Parsing file..");

        require_once 'CsvParser.php';
        $parser = new CsvParser($this->uploadedFile);
        $this->parsedFile = array_filter($parser->getParsedFile());

        $this->logEvent("File parsed!");
    }

    public function importData() {
        $this->logEvent("Import started..");

        $this->_createDimensions();
	//we don't need thia as we create our own in the csvimporter.js
        //$this->_createDataset();
        $this->_saveData();

        $this->logEvent("Done saving data!");
    }

    public function createConfigurationView($urlBase) {
        $ontowiki = OntoWiki::getInstance();
        $model = $ontowiki->selectedModel;

        $this->view->scovo = true;

        $this->view->placeholder('main.window.title')->append('Import Young Lives CSV Data');
        $this->view->actionUrl = $urlBase . 'csvimport/mapping';
        $this->view->salt = hash("md5", serialize($this->parsedFile));
        OntoWiki_Navigation::disableNavigation();

        if ($model->isEditable()) {

            $toolbar = $ontowiki->toolbar;
	    $toolbar->appendButton(OntoWiki_Toolbar::ADD, array('name' => 'Select Measure', 'id' => 'btn-add-measure'))
                //not needed by us
		//->appendButton(OntoWiki_Toolbar::ADD, array('name' => 'Add Attribute', 'id' => 'btn-attribute', 'class'=>''))
                ->appendButton(OntoWiki_Toolbar::EDIT, array('name' => 'Select Data Range', 'id' => 'btn-datarange', 'class'=>''))
		->appendButton(OntoWiki_Toolbar::ADD, array('name' => 'Add Dimension', 'id' => 'btn-add-dimension'))
                ->appendButton(OntoWiki_Toolbar::SEPARATOR)
                ->appendButton(OntoWiki_Toolbar::SUBMIT, array('name' => 'Extract Triples', 'id' => 'extract'));
                //not needed by us
		//->appendButton(OntoWiki_Toolbar::RESET, array('name' => 'Cancel'));
            $this->view->placeholder('main.window.toolbar')->set($toolbar);


            $configurationMenu = OntoWiki_Menu_Registry::getInstance()->getMenu('Configurations');
            $i = 0;
            $pattern = '/\'/i';
            $replacement = "\\'";
            $this->view->configs = array();
$this->logEvent('stored configs are : ');
$this->logEvent(var_export($this->storedConfigurations, true));
            if(isset($this->storedConfigurations)){
                foreach ($this->storedConfigurations as $configNum => $config) {
                    $this->view->configs[$i] = preg_replace($pattern, $replacement, $config['config']);
                    $configurationMenu->prependEntry(
                            'Select ' . $config['label'],
                            'javascript:useCSVConfiguration(csvConfigs['.$i.'])'
                    );
                    $i++;
                }
            }

        $menu = new OntoWiki_Menu();
        $menu->setEntry('Configurations', $configurationMenu);

        $event = new Erfurt_Event('onCreateMenu');
        $event->menu = $configurationMenu;
        $this->view->placeholder('main.window.menu')->set($menu->toArray(false, true));



        } else {
            $ontowiki->appendMessage(
                #new OntoWiki_Message("No write permissions on model '{$this->view->modelTitle}'", OntoWiki_Message::WARNING)
            );
        }

        $this->view->table = $this->view->partial('partials/table.phtml', array(
                    'data' => $this->parsedFile,
                    'tableClass' => 'csvimport'
                ));

#        $this->viewElements = array(
#            'table' => array(
#                'template' => 'partials/table.phtml',
#                'data' => array(
#                    'data' => $this->parsedFile,
#                    'tableClass' => 'csvimport'
#                )
#            )
#        );
    }

    protected function _createDimensions() {
        $this->logEvent("Creating dimensions..");
        
        $ontowiki = OntoWiki::getInstance();
        
        if( !isset($this->configuration) ) die ("config not set!");
	/*
        $elements = array();

	
	//this is not used now as all data come through from the user at the front end. this is managed by javascript in csvimport.js

        // classes vars these are from the ini file, and are all uri's
        $type = $this->componentConfig->class->type;
        $label = $this->componentConfig->class->label;
        $value_predicate = $this->componentConfig->class->value;
        $subPropertyOf = $this->componentConfig->class->subPropertyOf;
        $comment = $this->componentConfig->class->comment;
        
        // qb vars these are from the ini file, and are all uri's
        $qbDimensionProperty = $this->componentConfig->qb->DimensionProperty;
        $qbconcept = $this->componentConfig->qb->concept;
        */
	//what is configuration?? i think it is the incoming json
$this->logEvent(var_export($this->configuration, true));
	//yes it is

	//plan b. keep it simple.
	//just believe in the json we got. it is  decoded so pass in to make triples from.


	$elements = $this->configuration;
	$ontowiki->selectedModel->addMultipleStatements($elements);
/*
//important update
//adding new top level citizens to configuration of 'dimensions' and 'measures' and 'attributes'

	//attributes
	foreach ($this->configuration['attributes'] as $url => $dim) {
	       	// filter blank stuff 
		//blank stuff is defined as a json object without a 'label'
            	if(strlen($dim['label']) < 1) continue;
		// empty array
		$element = array();
		// class attributes as defined here should have a type, label and uri in the json
		$element[$url] = array(
		$type => array(
			array(
			'type' => 'uri',
			'value' => $dim['uri']
			)
			),
		$label => array(
			array(
			'type' => 'literal',
			'value' => $dim['label']
			)
			),
		$comment => array(
			array(
			'type' => 'literal',
			'value' => $dim['value']
			)
		)
		);
	//TODO undestand why this is commented, and what was the oringinators purpose.
$this->logEvent('start attributes/n');
$this->logEvent(var_export($element, true));
$this->logEvent('end attributes/n');
		$ontowiki->selectedModel->addMultipleStatements($element);
		//$elements[] = $element;
		continue;
           
	}

$this->logEvent(var_export($this->configuration['measures'], true));
	//measures  
	foreach ($this->configuration['measures'] as $url => $dim) {
            // filter blank stuff 
	    //blank stuff is defined as a json object without a 'label'
            if(strlen($dim['label']) < 1) continue;

		// save measure
		//measures is used later and may not be set here, 
//TODO fix this to make real datacube measures from the json

                $this->measures[$dim['uri']] = array(
                    'url' => $url,
                    'uri' => $dim['uri'],
                    'label' => array(
				array(
					'type' => 'literal',
					'value' => $dim['label']
					)
				),
                    //'value' => $dim['value'],
		    $subPropertyOf => array(
					array(
						'type' => 'uri',
						'value' => $dim['subproperty']
					)
                        	      ),
		    'range' => $dim['range'],
		    'property' => $dim['property']
                );
$this->logEvent('start measures/n');
$this->logEvent(var_export($element, true));
$this->logEvent('end measures/n');
		$ontowiki->selectedModel->addMultipleStatements($element);
	}

	//dimensions
        foreach ($this->configuration['dimensions'] as $url => $dim) {
            // filter blank stuff 
	    //blank stuff is defined as a json object without a 'label'
            if(strlen($dim['label']) < 1) continue;

            $element = array();

            // class
            $element[$url] = array(
                $type => array(
                    array(
                        'type' => 'uri',
                        'value' => $qbDimensionProperty
                        )
                    ),
                $label => array(
                    array(
                        'type' => 'literal',
                        'value' => $dim['label']
                        )
                    )
            );
//ok if my initial reading is right then we do this if the label has only digits in it?
            if( preg_match('/\D/', $dim['label']) <= 0  ){
                $element[$url] = array_merge($element[$url],
                    array(
                        $value_predicate => array(
                            array(
                                'type' => 'integer',
                                'value' => intval($dim['label'])
                            )
                        )
                    )
                );
            }
            
            // set subPropertyOf
            if( isset($dim['subproperty']) ){
                $element[$url] = array_merge($element[$url], 
                    array(
                        $subPropertyOf => array(
                            array(
                                'type' => 'uri',
                                'value' => $dim['subproperty']
                            )
                        )
                    )
                );
            }
            
            // set concept
            if( isset($dim['concept']) ){
                $element[$url] = array_merge($element[$url], 
                    array(
                        $qbconcept => array(
                            array(
                                'type' => 'uri',
                                'value' => $dim['concept']
                            )
                        )
                    )
                );
            }
            
            $elements[] = $element;

            // types
            foreach ($dim['elements'] as $eurl => $elem) {
                $element = array();

                // type of new dimension
                $element[$eurl] = array(
                    $type => array(
                        array(
                            'type' => 'uri',
                            'value' => $url
                            )
                        ),
                    $label => array(
                        array(
                            'type' => 'literal',
                            'value' => $elem['label']
                            )
                        )
                );
                $elements[] = $element;
            }

        }
        
        // create incidence
        $element = array();
        $element[$this->componentConfig->local->incidence->uri] = array(
            $type => array(
                array(
                    'type' => 'uri',
                    'value' => $this->componentConfig->local->incidence->type
                )
            ),
            $label => array(
                array(
                    'type' => 'literal',
                    'value' => $this->componentConfig->local->incidence->label
                )
            ),
            $subPropertyOf => array(
                array(
                    'type' => 'uri',
                    'value' => $this->componentConfig->local->incidence->subpropertyof
                )
            )
        );
        $elements[] = $element;
        
        foreach ($elements as $elem) {
            //print_r($elem);
            $ontowiki->selectedModel->addMultipleStatements($elem);
        }

        $this->logEvent("All dimensions created!");

        //echo '<pre>';
        //echo print_r( $elements );
        //echo '</pre>';
*/

    }
    
    protected function _createDataset(){
        $dimensions = $this->configuration;
        
        // objects
        $datastructDefinition = $this->componentConfig->qb->DataStructureDefinition;
        
        // predicates
        $type = $this->componentConfig->class->type;
        $component = $this->componentConfig->qb->component;
        
        // set url base
        $url_base = $this->componentConfig->local->setBase . "/".hash("md5", serialize($this->parsedFile))."/DataStructure";
        
        // create datastructure definition
        $element[$url_base] = array(
            $type => array(
                array(
                    'type' => 'uri',
                    'value' => $datastructDefinition
                ) 	

            )
        );
        
        // append 
        $values = array();
        foreach($dimensions as $url => $dim){
            $values[] = array(
                'type' => 'uri',
                'value' => $url
            );
        }
        
        // merge values
        if( sizeof($values) > 0 ){
            $element[$url_base] = array_merge($element[$url_base],
                array(
                    $component => $values
                )
            );
        }
        
        // TODO: Add qb:attribute from sdmx-attribute: data set
        
        // save to store
        $ontowiki = OntoWiki::getInstance();
        $ontowiki->selectedModel->addMultipleStatements($element);
    }


    protected function _saveData() {
        $this->logEvent("Saving data to knowledge base..");

        $ontowiki = OntoWiki::getInstance();
        $dimensions = $this->configuration;
        
        // dimensions array
        $dims = array();
        // predicates
        $type = $this->componentConfig->class->type;
        $dataset = $this->componentConfig->qb->dataset;
        $incidence = $this->componentConfig->local->incidence->uri;
        // objects
        $qbObservation = $this->componentConfig->qb->Observation;
        // item url base
        $url_base = $this->componentConfig->local->base . "/".hash("md5", serialize($this->parsedFile));
        // count
        $count = 0;

        foreach($dimensions as $url => $dim){
            if( isset($dim['elements']) ){
                foreach($dim['elements'] as $eurl => $elem){
                    $dims[] = array(
                        'uri' => $eurl,
                        'pred' => $url,
                        'row' => $elem['row'],
                        'col' => $elem['col'],
                        'items' => $elem['items']
                    );
                }
            }
        }
        
        foreach($this->parsedFile as $rowIndex => $row){
            // check for null data
            if(!isset($row) || $row == null) continue;

            // parse row
            foreach($row as $colIndex => $cell){
                // filter empty
                if(strlen($cell) > 0){
                    // fill item dimensions from all dims
                    $itemDims = array();
                    foreach($dims as $dim){
                        if(
                            $colIndex >= $dim['items']['start']['col'] && $colIndex <= $dim['items']['end']['col'] &&
                            $rowIndex >= $dim['items']['start']['row'] && $rowIndex <= $dim['items']['end']['row']
                        ){
                            if($dim['col'] == $colIndex || $dim['row'] == $rowIndex){
                                $itemDims[$dim['pred']][] = array(
                                            'type' => 'uri',
                                            'value' => $dim['uri']
                                            );
                            }
                        }
                    }

                    // if there is some dimensions
                    if(count($itemDims) > 0){
                        // empty elements
                        $element = array();
                        
                        // create item url
                        $eurl = $url_base."/c".$colIndex."-r".$rowIndex;
                        
                        // get attributes
                        $attributes = array();
                        foreach( $this->measures as $ind => $attr ){
                            $attributes[$attr['uri']] = array(
                                array(
                                    'type' => 'uri',
                                    'value' => $attr['url']
                                )
                            );
                        }
                        
                        // merge with dimensions
                        $element[$eurl] = array_merge(
                            $itemDims,
                            array(
                                $incidence => array(
                                    array(
                                        'type' => 'literal',
                                        'value' => floatval( $cell )
                                    )
                                ),
                                $type => array(
                                    array(
                                        'type' => 'uri',
                                        'value' => $qbObservation
                                    )
                                )
                            )
                        );
                        // merge with attributes
                        $element[$eurl] = array_merge($element[$eurl],$attributes);
                        
                        

                        //print_r($element);
                        //echo "---------------------------------------------------------------";
                        // write element
                        //var_dump($element);
                        //die;

                        $count++;
                        if($count%1000 == 0){
                            $this->logEvent("Total triples saved: ".$count.". Still working..");
                        }
                        $ontowiki->selectedModel->addMultipleStatements($element);
                    }
                }
            }
        }

        $this->logEvent("Done!");
        //echo "<pre>";
        //print_r( $dims );
        //echo "</pre>";
    }


}
