data.younglives.org.uk
======================

Requirements
------------------

php5
phing (see below)
mysql or virtuoso
owcli (ontowiki cli tool) 


OWCLI
---------

We use ontowiki's CLI tool to handle a lot of set-up tasks.

Install it as per http://code.google.com/p/ontowiki/wiki/CommandLineInterface
and then drop the file conf/owcli into your home directory as .owcli for your own use.

Phing will use the file directly from the conf directory


Building with Phing
-------------------------

This project uses phing as a build tool

NB: Currently this build defaults to configuring mysql based Ontowiki and it assumes you've already got a database as per the conf/config.ini.younglives-mysql  file. An alternative virtuoso based config is available

Make sure you've got Phing:

    $> pear channel-discover pear.phing.info
    $> pear install phing/phing
    
Run the dev-build target from the build.xml

    $> phing dev-build

then edit build/.htaccess and add a RewriteBase eg `RewriteBase /~neil/IKMLinkedResearch/build/`
then edit conf/owcli so that the baseuri is correct for your install eg `http://neil/~neil/IKMLinkedResearch/build/`
Important, now login to your ontowiki, this creates important entries in the database. 

you can now run 
    $> phing setup

    
