<?php

/**
 * @category   OntoWiki
 * @package    OntoWiki_extensions_components_source
 */
class YounglivesController extends OntoWiki_Controller_Component
{

public function init()
    {

        parent::init();

    }

    public function displayAction()
    {
        $store       = $this->_owApp->erfurt->getStore();
        $resource    = $this->_owApp->selectedResource;
        $translate   = $this->_owApp->translate;
        $allowSaving = false;
        $showList = false;
        
        // window title
        if (!$resource) {
            $this->_owApp->appendMessage(
                new OntoWiki_Message("No resource selected", OntoWiki_Message::WARNING)
            );
            $title = 'Graph';
        } else {
            $title = $resource->getTitle() 
                   ? $resource->getTitle() 
                   : OntoWiki_Utils::contractNamespace($resource->getIri());
        }
        $windowTitle = sprintf($translate->_('Graph of %1$s'), $title);
        $this->view->placeholder('main.window.title')->set($windowTitle);
	
        
        $url = new OntoWiki_Url(array('route' => 'properties'), array());
        $url->setParam('r', (string) $resource, true);
        $this->view->redirectUri = urlencode((string) $url);

	if ($resource) {
		$this->view->resource = $resource;
	}
	$this->view->base = $this->_config->urlBase;
	$this->view->componentBase = $this->_componentUrlBase;
    }
    
    
}







