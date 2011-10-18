<?php

/**
 * OntoWiki module – Young Lives Coutries Navigation

 *
 * @category   OntoWiki
 * @package    extensions_modules_yl_navigation
 * @author     Neontribe ltd.
 * @copyright  Copyright (c) 2011
 * @license    http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */
class YlnavigationModule extends OntoWiki_Module
{
    protected $session = null;

    public function init() {
        $this->session = $this->_owApp->session;
    }

    public function getTitle() {
        return "Young Lives Countries";
    }


    /**
     * Returns the menu of the module
     *
     * @return string
     */
    public function getMenu() {
return new OntoWiki_Menu();
/*		// check if menu must be shown
		if(!$this->_privateConfig->defaults->showMenu) return new OntoWiki_Menu();
		
        // build main menu (out of sub menus below)
        $mainMenu = new OntoWiki_Menu();

        // edit sub menu
        if ($this->_owApp->erfurt->getAc()->isModelAllowed('edit', $this->_owApp->selectedModel) ) {
            $editMenu = new OntoWiki_Menu();
            $editMenu->setEntry('Add Resource here', "javascript:navigationAddElement()");
            $mainMenu->setEntry('Edit', $editMenu);
        }

        // count sub menu
        $countMenu = new OntoWiki_Menu();
        $countMenu->setEntry('10', "javascript:navigationEvent('setLimit', 10)")
            ->setEntry('20', "javascript:navigationEvent('setLimit', 20)")
            ->setEntry('30', "javascript:navigationEvent('setLimit', 30)");

        // toggle sub menu
        $toggleMenu = new OntoWiki_Menu();
        // hidden elements
        $toggleMenu->setEntry('Hidden Elements', "javascript:navigationEvent('toggleHidden')");
        // empty elements
        $toggleMenu->setEntry('Empty Elements', "javascript:navigationEvent('toggleEmpty')");
        // implicit
        $toggleMenu->setEntry('Implicit Elements', "javascript:navigationEvent('toggleImplicit')");

        // view sub menu
        $viewMenu = new OntoWiki_Menu();
        $viewMenu->setEntry('Number of Elements', $countMenu);
        $viewMenu->setEntry('Toggle Elements', $toggleMenu);
        $viewMenu->setEntry('Reset Navigation', "javascript:navigationEvent('reset')");
        $mainMenu->setEntry('View', $viewMenu);
*/
        // navigation type submenu
        /*$sortMenu = new OntoWiki_Menu();
        foreach ($this->_privateConfig->sorting as $key => $config) {
            $sortMenu->setEntry($config->name, "javascript:navigationEvent('setSort', '$config->type')");
        }
        $mainMenu->setEntry('Sort', $sortMenu);*/
/*
        // navigation type submenu
        $typeMenu = new OntoWiki_Menu();
        foreach ($this->_privateConfig->config as $key => $config) {
            if($this->_privateConfig->defaults->checkTypes){
                if(isset($config->checkVisibility) && $config->checkVisibility == false){
                    $typeMenu->setEntry($config->name, "javascript:navigationEvent('setType', '$key')");
                }else if( $this->checkConfig($config) > 0 ){
                    $typeMenu->setEntry($config->name, "javascript:navigationEvent('setType', '$key')");
                }
            }else{
                $typeMenu->setEntry($config->name, "javascript:navigationEvent('setType', '$key')");
            }
        }
        $mainMenu->setEntry('Type', $typeMenu);

        return $mainMenu;*/
    }
    
    /**
     * Returns the content
     */
    public function getContents() {

       
	$data = Array(0 => 'hello');
        $content = $this->render('ylnavigation', $data, 'data'); // 
        return $content;
    }
	
    public function shouldShow(){
	return true;
    }
}

