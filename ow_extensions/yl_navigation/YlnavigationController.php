<?php
/**
 * Controller for OntoWiki Young Lives Coutries Navigation
 *
 * @category   OntoWiki
 * @package    extensions_components_yl_navigation
 * @author     Neontribe ltd
 * @copyright  Copyright (c) 2011, 
 * @license    http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */
 

class YlnavigationController extends OntoWiki_Controller_Component
{
   
    /*
     * Initializes Young Lives Coutries Naviagation Controller
     */
    public function init()
    {
        parent::init();
        // create title helper
        $this->titleHelper = new OntoWiki_Model_TitleHelper($this->model);
        
        
    }

