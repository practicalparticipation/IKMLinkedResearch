<?php

/**
 * This file is made to be part of the {@link http://ontowiki.net OntoWiki} project.
 *
 * @copyright Copyright (c) 2011, {@link http://www.neontribe.co.uk Neontribe ltd.}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */

/**
 * Helper class for the Source component.
 *
 * - register the tab for all navigations 
 *
 * @category OntoWiki
 * @package Extensions
 * @subpackage Source
 * @copyright Copyright (c) 2011, {@link http://www.neontribe.co.uk Neontribe ltd.}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 */
class YounglivesHelper extends OntoWiki_Component_Helper
{
    public function init()
    {
        // get the main application
        $owApp = OntoWiki::getInstance();

        // get current route info
        $front  = Zend_Controller_Front::getInstance();
        $router = $front->getRouter();

	//this  code looks at the string representation of the get request and see if a dsd is specified
	//ifso we show the younfg lives graph button. this is not bomb proof, but it is better than looking at $this->_owApp->selectedResource;
	//as this value can come from a get param or saved config cache object. we are trying to only show the
	//young lives graphs button on class page for a dsd.


	if ($_SERVER["REQUEST_URI"]) {
		if (strpos($_SERVER["REQUEST_URI"], 'SumaryStatistics-')) {
			OntoWiki_Navigation::register('Young_lives_graphs', array(
			'controller' => 'younglives',     // younglives controller
			'action'     => 'display',       // display action
			'name'       => '&#x2605; View on graph',
			'priority'   => -1));
		}
	}


/*
        OntoWiki_Navigation::register('Young lives graphs', array(
            'controller' => 'younglives',     // younglives controller
            'action'     => 'display',       // display action
            'name'       => 'Young lives Graphs',
            'priority'   => 70));*/
    }
}
